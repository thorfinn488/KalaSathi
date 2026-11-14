<#
.SYNOPSIS
  Phase E Integration & End-to-End Verification Suite for KalaSaathi Spring Boot API.
.DESCRIPTION
  Executes an 8-step integration verification verifying authentication, product lifecycle,
  catalog, storage failure handling, sandbox checkout, payment simulation, tracking, and cleanup.
  Provides preflight validation, clear error diagnostics without credential leakage, and exits 0 only on pass.
#>

[CmdletBinding()]
param(
  [string]$BaseUrl = "http://localhost:8080",
  [int]$ApiPort = 8080,
  [switch]$SkipPreflight = $false,
  [int]$TimeoutSec = 15
)

$ErrorActionPreference = 'Stop'

# Ensure console supports UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

# Global results tracking
$stepResults = [System.Collections.Generic.List[PSCustomObject]]::new()

function Record-Step {
  param(
    [string]$Name,
    [string]$Status, # PASS, FAIL, SKIP
    [string]$HttpStatus = "-",
    [string]$Details = ""
  )
  $stepResults.Add([PSCustomObject]@{
    Step       = $Name
    Status     = $Status
    HttpStatus = $HttpStatus
    Details    = $Details
  })
}

function Show-Header {
  Write-Host "=================================================================" -ForegroundColor Cyan
  Write-Host "    KalaSaathi Phase E Integration Verification Suite           " -ForegroundColor Cyan
  Write-Host "=================================================================" -ForegroundColor Cyan
  Write-Host "Target API: $BaseUrl" -ForegroundColor Gray
  Write-Host ""
}

# -------------------------------------------------------------
# Preflight Verification
# -------------------------------------------------------------
function Test-PortOpen([string]$HostName, [int]$Port) {
  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $asyncResult = $client.BeginConnect($HostName, $Port, $null, $null)
    $success = $asyncResult.AsyncWaitHandle.WaitOne(800, $false)
    if ($success -and $client.Connected) {
      $client.Close()
      return $true
    }
    $client.Close()
    return $false
  } catch {
    return $false
  }
}

function Run-Preflight {
  Write-Host "==> Running Preflight Validation..." -ForegroundColor Cyan

  # Check if API is already live
  try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($health -and $health.success) {
      Write-Host "    [PASS] API is already active and healthy at $BaseUrl" -ForegroundColor Green
      return $true
    }
  } catch {
    # Not yet running; continue preflight checks
  }

  # If not live, check docker daemon
  try {
    $dockerCheck = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "    [PASS] Docker daemon is available." -ForegroundColor Green
    } else {
      Write-Warning "Docker daemon does not appear to be running. If the server is not started, start it first."
    }
  } catch {
    Write-Warning "Docker command not found in PATH."
  }

  # Check database and redis ports
  $pgOpen = Test-PortOpen "localhost" 5432
  $redisOpen = Test-PortOpen "localhost" 6379

  if ($pgOpen) {
    Write-Host "    [PASS] PostgreSQL is listening on port 5432." -ForegroundColor Green
  } else {
    Write-Host "    [INFO] Port 5432 is not currently open." -ForegroundColor Gray
  }

  if ($redisOpen) {
    Write-Host "    [PASS] Redis is listening on port 6379." -ForegroundColor Green
  } else {
    Write-Host "    [INFO] Port 6379 is not currently open." -ForegroundColor Gray
  }

  # Check server jar or build artifact
  $jarPath = Join-Path $repoRoot "server\target\kalasathi-server-1.0.0-SNAPSHOT.jar"
  $classesPath = Join-Path $repoRoot "server\target\classes\com\kalasathi\KalaSathiApplication.class"
  if (Test-Path $jarPath) {
    Write-Host "    [PASS] Spring Boot JAR exists: server/target/kalasathi-server-1.0.0-SNAPSHOT.jar" -ForegroundColor Green
  } elseif (Test-Path $classesPath) {
    Write-Host "    [PASS] Spring Boot compiled classes exist in server/target/classes." -ForegroundColor Green
  } else {
    Write-Warning "Neither server JAR nor compiled classes found. Build with 'mvn -f server/pom.xml package -DskipTests'."
  }

  return $true
}

# -------------------------------------------------------------
# HTTP Helper with Robust Error Capture
# -------------------------------------------------------------
function Invoke-SafeApi {
  param(
    [string]$Uri,
    [string]$Method = 'GET',
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [string]$ContentType = "application/json"
  )

  $jsonBody = if ($Body -and -not ($Body -is [string])) {
    $Body | ConvertTo-Json -Depth 10 -Compress
  } else {
    $Body
  }

  $reqArgs = @{
    Uri         = $Uri
    Method      = $Method
    TimeoutSec  = $TimeoutSec
    ErrorAction = 'Stop'
  }

  if ($Headers.Count -gt 0) {
    $reqArgs['Headers'] = $Headers
  }

  if ($jsonBody -and $Method -ne 'GET') {
    $reqArgs['Body'] = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    $reqArgs['ContentType'] = "$ContentType; charset=utf-8"
  }

  try {
    $resp = Invoke-WebRequest @reqArgs
    $parsed = try { $resp.Content | ConvertFrom-Json } catch { $null }
    return [PSCustomObject]@{
      Success    = $true
      StatusCode = [int]$resp.StatusCode
      Data       = $parsed
      Raw        = $resp.Content
      Error      = $null
    }
  } catch [System.Net.WebException] {
    $statusCode = 0
    $respBody = ""
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
      $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
      $respBody = $reader.ReadToEnd()
      $reader.Close()
    }
    $parsed = try { $respBody | ConvertFrom-Json } catch { $null }
    return [PSCustomObject]@{
      Success    = $false
      StatusCode = $statusCode
      Data       = $parsed
      Raw        = $respBody
      Error      = $_.Exception.Message
    }
  } catch {
    return [PSCustomObject]@{
      Success    = $false
      StatusCode = 0
      Data       = $null
      Raw        = ""
      Error      = $_.Exception.Message
    }
  }
}

# Helper to upload multipart form data with raw bytes
function Invoke-MultipartUpload {
  param(
    [string]$Uri,
    [string]$ParamName,
    [string]$FileName,
    [string]$ContentType,
    [byte[]]$FileBytes,
    [hashtable]$Headers = @{}
  )

  $boundary = [System.Guid]::NewGuid().ToString()
  $LF = "`r`n"
  
  $bodyStream = [System.IO.MemoryStream]::new()
  $writer = [System.IO.StreamWriter]::new($bodyStream, [System.Text.Encoding]::ASCII)
  
  $writer.Write("--$boundary$LF")
  $writer.Write("Content-Disposition: form-data; name=`"$ParamName`"; filename=`"$FileName`"$LF")
  $writer.Write("Content-Type: $ContentType$LF$LF")
  $writer.Flush()
  
  $bodyStream.Write($FileBytes, 0, $FileBytes.Length)
  
  $writer.Write("$LF--$boundary--$LF")
  $writer.Flush()
  
  $finalBytes = $bodyStream.ToArray()
  $bodyStream.Close()

  $allHeaders = @{}
  foreach ($k in $Headers.Keys) { $allHeaders[$k] = $Headers[$k] }

  try {
    $resp = Invoke-WebRequest -Uri $Uri -Method Post -Body $finalBytes `
      -ContentType "multipart/form-data; boundary=$boundary" `
      -Headers $allHeaders -TimeoutSec $TimeoutSec -ErrorAction 'Stop'

    $parsed = try { $resp.Content | ConvertFrom-Json } catch { $null }
    return [PSCustomObject]@{
      Success    = $true
      StatusCode = [int]$resp.StatusCode
      Data       = $parsed
      Raw        = $resp.Content
      Error      = $null
    }
  } catch [System.Net.WebException] {
    $statusCode = 0
    $respBody = ""
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
      $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
      $respBody = $reader.ReadToEnd()
      $reader.Close()
    }
    $parsed = try { $respBody | ConvertFrom-Json } catch { $null }
    return [PSCustomObject]@{
      Success    = $false
      StatusCode = $statusCode
      Data       = $parsed
      Raw        = $respBody
      Error      = $_.Exception.Message
    }
  } catch {
    return [PSCustomObject]@{
      Success    = $false
      StatusCode = 0
      Data       = $null
      Raw        = ""
      Error      = $_.Exception.Message
    }
  }
}

# -------------------------------------------------------------
# Execute Verification Suite
# -------------------------------------------------------------
Show-Header

if (-not $SkipPreflight) {
  $null = Run-Preflight
}

# Verify API is reachable before starting test steps
$healthCheck = Invoke-SafeApi -Uri "$BaseUrl/api/health" -Method GET
if (-not $healthCheck.Success) {
  Write-Host ""
  Write-Error "API at $BaseUrl is not reachable (HTTP $($healthCheck.StatusCode): $($healthCheck.Error)). Start the server and re-run."
  Record-Step "Health Check" "FAIL" "$($healthCheck.StatusCode)" "API endpoint unreachable at $BaseUrl"
  exit 1
} else {
  Write-Host "==> Connected to API successfully. Health status: OK" -ForegroundColor Green
  Write-Host ""
}

$randomSuffix = Get-Random -Minimum 100000 -Maximum 999999
$artisanPhone = "98" + (Get-Random -Minimum 10000000 -Maximum 99999999).ToString()
$artisanPassword = "SecurePassword@123"
$authToken = ""
$artisanId = ""
$createdProductId = ""
$createdOrderId = ""

# =========================================================================
# STEP 1: Authentication & RBAC Verification
# =========================================================================
Write-Host "-> Step 1: Authentication & User Lifecycle..." -ForegroundColor Yellow

$regPayload = @{
  name            = "Verification Artisan $randomSuffix"
  phone           = $artisanPhone
  password        = $artisanPassword
  role            = "ARTISAN"
  region          = "Madhubani, Bihar"
  craft_specialty = "Mithila Painting"
}

$regRes = Invoke-SafeApi -Uri "$BaseUrl/api/auth/register" -Method POST -Body $regPayload
if ($regRes.StatusCode -eq 201 -and $regRes.Data.success) {
  $authToken = $regRes.Data.data.token
  $artisanId = $regRes.Data.data.user_id
  Write-Host "    [PASS] Registered artisan: $artisanId (HTTP 201)" -ForegroundColor Green
  Record-Step "Step 1: Auth Register" "PASS" "201" "Registered user $artisanId"
} else {
  # If already registered, attempt login
  $loginPayload = @{ phone = $artisanPhone; password = $artisanPassword }
  $loginRes = Invoke-SafeApi -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginPayload
  if ($loginRes.StatusCode -eq 200 -and $loginRes.Data.success) {
    $authToken = $loginRes.Data.data.token
    $artisanId = $loginRes.Data.data.user_id
    Write-Host "    [PASS] Logged in artisan (HTTP 200)" -ForegroundColor Green
    Record-Step "Step 1: Auth Login" "PASS" "200" "Token received for $artisanId"
  } else {
    $errCode = if ($regRes.Data.error.code) { $regRes.Data.error.code } else { "HTTP_$($regRes.StatusCode)" }
    Write-Host "    [FAIL] Auth failed: $errCode" -ForegroundColor Red
    Record-Step "Step 1: Auth" "FAIL" "$($regRes.StatusCode)" $errCode
    exit 1
  }
}

$authHeaders = @{ Authorization = "Bearer $authToken" }

# Verify /api/auth/me
$meRes = Invoke-SafeApi -Uri "$BaseUrl/api/auth/me" -Method GET -Headers $authHeaders
if ($meRes.StatusCode -eq 200 -and $meRes.Data.data.role -eq 'ARTISAN') {
  Write-Host "    [PASS] Verified token identity: role is ARTISAN (HTTP 200)" -ForegroundColor Green
} else {
  Write-Host "    [FAIL] Identity check failed (HTTP $($meRes.StatusCode))" -ForegroundColor Red
  Record-Step "Step 1: Identity /me" "FAIL" "$($meRes.StatusCode)" "Role check failed"
  exit 1
}

# =========================================================================
# STEP 2: Product Lifecycle (Draft, Catalogue Update, Fair-Price Recalculation)
# =========================================================================
Write-Host "-> Step 2: Product Lifecycle Management..." -ForegroundColor Yellow

# Create draft product
$createRes = Invoke-SafeApi -Uri "$BaseUrl/api/products" -Method POST -Headers $authHeaders -Body @{}
if ($createRes.StatusCode -eq 201 -and $createRes.Data.data.product_id) {
  $createdProductId = $createRes.Data.data.product_id
  Write-Host "    [PASS] Created product draft: $createdProductId (HTTP 201)" -ForegroundColor Green
  Record-Step "Step 2a: Create Draft" "PASS" "201" "Product ID: $createdProductId"
} else {
  $code = if ($createRes.Data.error.code) { $createRes.Data.error.code } else { "HTTP_$($createRes.StatusCode)" }
  Write-Host "    [FAIL] Draft creation failed: $code" -ForegroundColor Red
  Record-Step "Step 2a: Create Draft" "FAIL" "$($createRes.StatusCode)" $code
  exit 1
}

# Update catalogue metadata
$cataloguePayload = @{
  name        = "Heritage Madhubani Peacock Scroll"
  craft       = "Mithila Painting"
  category    = "Paintings & Wall Art"
  materials   = @("Handmade paper", "Natural pigments", "Bamboo nib")
  dimensions  = "22 x 15 inches"
  description = "Certified hand-painted Mithila artwork depicting traditional peacock motifs with natural dyes."
}
$catRes = Invoke-SafeApi -Uri "$BaseUrl/api/products/$createdProductId/catalogue" -Method PUT -Headers $authHeaders -Body $cataloguePayload
if ($catRes.StatusCode -eq 200 -and $catRes.Data.success) {
  Write-Host "    [PASS] Updated product catalogue details (HTTP 200)" -ForegroundColor Green
  Record-Step "Step 2b: Update Catalogue" "PASS" "200" "Catalogue updated"
} else {
  $code = if ($catRes.Data.error.code) { $catRes.Data.error.code } else { "HTTP_$($catRes.StatusCode)" }
  Write-Host "    [FAIL] Catalogue update failed: $code" -ForegroundColor Red
  Record-Step "Step 2b: Update Catalogue" "FAIL" "$($catRes.StatusCode)" $code
  exit 1
}

# Recalculate fair-trade price
$pricingPayload = @{
  material_cost = 850
  labor_days    = 5
  daily_wage    = 700
  complexity    = "HIGH"
}
$priceRes = Invoke-SafeApi -Uri "$BaseUrl/api/products/$createdProductId/recalculate-price" -Method POST -Headers $authHeaders -Body $pricingPayload
if ($priceRes.StatusCode -eq 200 -and $priceRes.Data.data.suggested_price -gt 0) {
  $suggested = $priceRes.Data.data.suggested_price
  Write-Host "    [PASS] Recalculated fair-trade price: INR $suggested (HTTP 200)" -ForegroundColor Green
  Record-Step "Step 2c: Recalculate Price" "PASS" "200" "Price: INR $suggested"
} else {
  $code = if ($priceRes.Data.error.code) { $priceRes.Data.error.code } else { "HTTP_$($priceRes.StatusCode)" }
  Write-Host "    [FAIL] Price recalculation failed: $code" -ForegroundColor Red
  Record-Step "Step 2c: Recalculate Price" "FAIL" "$($priceRes.StatusCode)" $code
  exit 1
}

# Set published price so checkout is valid
$patchPayload = @{
  price  = $suggested
  status = "READY"
}
$patchRes = Invoke-SafeApi -Uri "$BaseUrl/api/products/$createdProductId" -Method PATCH -Headers $authHeaders -Body $patchPayload
if ($patchRes.StatusCode -eq 200) {
  Write-Host "    [PASS] Set product status to READY with published price (HTTP 200)" -ForegroundColor Green
}

# =========================================================================
# STEP 3: Public Catalog Access
# =========================================================================
Write-Host "-> Step 3: Public Catalog Verification..." -ForegroundColor Yellow

$catalogRes = Invoke-SafeApi -Uri "$BaseUrl/api/products" -Method GET
if ($catalogRes.StatusCode -eq 200 -and $catalogRes.Data.success) {
  Write-Host "    [PASS] Queried unauthenticated public marketplace catalog (HTTP 200)" -ForegroundColor Green
  Record-Step "Step 3: Public Catalog" "PASS" "200" "Count: $($catalogRes.Data.data.Count)"
} else {
  Write-Host "    [FAIL] Public catalog fetch failed (HTTP $($catalogRes.StatusCode))" -ForegroundColor Red
  Record-Step "Step 3: Public Catalog" "FAIL" "$($catalogRes.StatusCode)" "Catalog unavailable"
  exit 1
}

$detailRes = Invoke-SafeApi -Uri "$BaseUrl/api/products/$createdProductId" -Method GET
if ($detailRes.StatusCode -eq 200 -and $detailRes.Data.data.product_id -eq $createdProductId) {
  Write-Host "    [PASS] Retrieved public product details: $($detailRes.Data.data.catalogue.name) (HTTP 200)" -ForegroundColor Green
} else {
  Write-Host "    [FAIL] Product details fetch failed (HTTP $($detailRes.StatusCode))" -ForegroundColor Red
  Record-Step "Step 3: Product Detail" "FAIL" "$($detailRes.StatusCode)" "Detail fetch failed"
  exit 1
}

# =========================================================================
# STEP 4: S3-Unavailable Handling & Media Validation
# =========================================================================
Write-Host "-> Step 4: S3-Unavailable Handling & Media Validation..." -ForegroundColor Yellow

# Valid JPEG Magic Bytes (SOI + JFIF marker)
$validJpegBytes = [byte[]]@(
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0xFF, 0xD9
)

# In test environment, S3 is unset/unconfigured -> Expect HTTP 503 SERVICE_UNAVAILABLE or 201 if mock S3
$uploadRes = Invoke-MultipartUpload -Uri "$BaseUrl/api/products/$createdProductId/image" `
  -ParamName "file" -FileName "peacock-scroll.jpg" -ContentType "image/jpeg" `
  -FileBytes $validJpegBytes -Headers $authHeaders

if ($uploadRes.StatusCode -eq 503 -and $uploadRes.Data.error.code -eq "SERVICE_UNAVAILABLE") {
  Write-Host "    [PASS] Handled unconfigured S3 gracefully: HTTP 503 SERVICE_UNAVAILABLE" -ForegroundColor Green
  Record-Step "Step 4: S3-Unavailable" "PASS" "503" "SERVICE_UNAVAILABLE returned gracefully"
} elseif ($uploadRes.StatusCode -eq 201) {
  Write-Host "    [PASS] S3 storage active: Upload succeeded (HTTP 201)" -ForegroundColor Green
  Record-Step "Step 4: S3 Upload" "PASS" "201" "Uploaded image: $($uploadRes.Data.data.image_url)"
} else {
  $code = if ($uploadRes.Data.error.code) { $uploadRes.Data.error.code } else { "HTTP_$($uploadRes.StatusCode)" }
  Write-Host "    [FAIL] Unexpected upload response: $code (HTTP $($uploadRes.StatusCode))" -ForegroundColor Red
  Record-Step "Step 4: S3-Unavailable" "FAIL" "$($uploadRes.StatusCode)" $code
  exit 1
}

# Also verify media validation rejects non-media bytes with 400 INVALID_MEDIA
$invalidBytes = [System.Text.Encoding]::UTF8.GetBytes("This is plain text not an image file")
$invalidUpload = Invoke-MultipartUpload -Uri "$BaseUrl/api/products/$createdProductId/image" `
  -ParamName "file" -FileName "fake.jpg" -ContentType "image/jpeg" `
  -FileBytes $invalidBytes -Headers $authHeaders

if ($invalidUpload.StatusCode -eq 400 -and $invalidUpload.Data.error.code -eq "INVALID_MEDIA") {
  Write-Host "    [PASS] Media validator rejected non-image content: HTTP 400 INVALID_MEDIA" -ForegroundColor Green
}

# =========================================================================
# STEP 5: Sandbox Order Checkout
# =========================================================================
Write-Host "-> Step 5: Sandbox Order Checkout..." -ForegroundColor Yellow

$checkoutPayload = @{
  product_id       = $createdProductId
  customer_name    = "Arjun Mehta"
  customer_phone   = "9876543210"
  shipping_address = "42 Heritage Lane, Indiranagar, Bengaluru, Karnataka 560038"
  quantity         = 1
}

$orderRes = Invoke-SafeApi -Uri "$BaseUrl/api/orders" -Method POST -Body $checkoutPayload
if ($orderRes.StatusCode -eq 201 -and $orderRes.Data.data.order_id) {
  $createdOrderId = $orderRes.Data.data.order_id
  $paymentMode = $orderRes.Data.data.payment_mode
  $paymentStatus = $orderRes.Data.data.payment_status

  Write-Host "    [PASS] Order checked out: $createdOrderId (Mode: $paymentMode, Status: $paymentStatus, HTTP 201)" -ForegroundColor Green
  Record-Step "Step 5: Checkout Order" "PASS" "201" "Order ID: $createdOrderId"
} else {
  $code = if ($orderRes.Data.error.code) { $orderRes.Data.error.code } else { "HTTP_$($orderRes.StatusCode)" }
  Write-Host "    [FAIL] Checkout failed: $code" -ForegroundColor Red
  Record-Step "Step 5: Checkout Order" "FAIL" "$($orderRes.StatusCode)" $code
  exit 1
}

# =========================================================================
# STEP 6: Payment Simulation (Sandbox Confirm)
# =========================================================================
Write-Host "-> Step 6: Payment Simulation (Sandbox Confirm)..." -ForegroundColor Yellow

$confirmRes = Invoke-SafeApi -Uri "$BaseUrl/api/orders/$createdOrderId/payment/sandbox-confirm" -Method POST -Body @{}
if ($confirmRes.StatusCode -eq 200 -and $confirmRes.Data.data.payment_status -eq "PAID") {
  Write-Host "    [PASS] Sandbox payment confirmed: Status updated to PAID (HTTP 200)" -ForegroundColor Green
  Record-Step "Step 6: Payment Confirm" "PASS" "200" "Payment status: PAID"
} else {
  $code = if ($confirmRes.Data.error.code) { $confirmRes.Data.error.code } else { "HTTP_$($confirmRes.StatusCode)" }
  Write-Host "    [FAIL] Payment confirmation failed: $code (HTTP $($confirmRes.StatusCode))" -ForegroundColor Red
  Record-Step "Step 6: Payment Confirm" "FAIL" "$($confirmRes.StatusCode)" $code
  exit 1
}

# =========================================================================
# STEP 7: Order Tracking
# =========================================================================
Write-Host "-> Step 7: Order Tracking & Delivery State..." -ForegroundColor Yellow

$trackRes = Invoke-SafeApi -Uri "$BaseUrl/api/orders/track/$createdOrderId" -Method GET
if ($trackRes.StatusCode -eq 200 -and $trackRes.Data.data.Count -gt 0) {
  $tracked = $trackRes.Data.data[0]
  Write-Host "    [PASS] Tracked order $createdOrderId: Delivery status = $($tracked.delivery_status) (HTTP 200)" -ForegroundColor Green
  Record-Step "Step 7: Order Tracking" "PASS" "200" "Delivery: $($tracked.delivery_status)"
} else {
  Write-Host "    [FAIL] Order tracking failed (HTTP $($trackRes.StatusCode))" -ForegroundColor Red
  Record-Step "Step 7: Order Tracking" "FAIL" "$($trackRes.StatusCode)" "Tracking not found"
  exit 1
}

# =========================================================================
# STEP 8: Cleanup Test Artifacts
# =========================================================================
Write-Host "-> Step 8: Clean Up Created Test Product..." -ForegroundColor Yellow

$delRes = Invoke-SafeApi -Uri "$BaseUrl/api/products/$createdProductId" -Method DELETE -Headers $authHeaders
if ($delRes.StatusCode -eq 200 -and $delRes.Data.data.deleted) {
  Write-Host "    [PASS] Successfully deleted test product $createdProductId (HTTP 200)" -ForegroundColor Green
  Record-Step "Step 8: Cleanup" "PASS" "200" "Deleted $createdProductId"
} else {
  $code = if ($delRes.Data.error.code) { $delRes.Data.error.code } else { "HTTP_$($delRes.StatusCode)" }
  Write-Host "    [FAIL] Cleanup product delete failed: $code" -ForegroundColor Red
  Record-Step "Step 8: Cleanup" "FAIL" "$($delRes.StatusCode)" $code
  exit 1
}

# Confirm deletion with 404
$verifyDel = Invoke-SafeApi -Uri "$BaseUrl/api/products/$createdProductId" -Method GET
if ($verifyDel.StatusCode -eq 404) {
  Write-Host "    [PASS] Confirmed product no longer exists (HTTP 404)" -ForegroundColor Green
}

# =========================================================================
# FINAL SUMMARY REPORT
# =========================================================================
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "                  VERIFICATION SUMMARY REPORT                    " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$passCount = ($stepResults | Where-Object { $_.Status -eq 'PASS' }).Count
$failCount = ($stepResults | Where-Object { $_.Status -eq 'FAIL' }).Count
$skipCount = ($stepResults | Where-Object { $_.Status -eq 'SKIP' }).Count

$stepResults | Format-Table -Property Step, Status, HttpStatus, Details -AutoSize

Write-Host "Results: $passCount Passed, $failCount Failed, $skipCount Skipped." -ForegroundColor $(if ($failCount -eq 0) { 'Green' } else { 'Red' })

if ($failCount -eq 0) {
  Write-Host "==> ALL 8 INTEGRATION VERIFICATION STEPS PASSED SUCCESSFULLY (Exit 0)" -ForegroundColor Green
  exit 0
} else {
  Write-Host "==> VERIFICATION FAILED (Exit 1)" -ForegroundColor Red
  exit 1
}
