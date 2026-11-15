Add-Type -AssemblyName System.Drawing

function Optimize-ImageFile([string]$path, [int]$maxWidth, [long]$quality) {
    if (-not (Test-Path $path)) { return }
    $fileInfo = Get-Item $path
    $originalSize = $fileInfo.Length
    
    # Load original image bytes so file lock is released
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $ms = New-Object System.IO.MemoryStream(,$bytes)
    $img = [System.Drawing.Image]::FromStream($ms)
    
    $width = $img.Width
    $height = $img.Height
    
    # Calculate scaled dimensions if larger than maxWidth
    if ($width -gt $maxWidth) {
        $ratio = [double]$maxWidth / [double]$width
        $newWidth = $maxWidth
        $newHeight = [int]([Math]::Round($height * $ratio))
    } else {
        $newWidth = $width
        $newHeight = $height
    }
    
    $resized = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $newWidth, $newHeight)
    $g.DrawImage($img, $rect)
    
    # Setup JPEG codec and quality encoder
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)
    $encoderParams.Param[0] = $qualityParam
    
    $tempOut = "$path.tmp.jpg"
    $resized.Save($tempOut, $jpegCodec, $encoderParams)
    
    $g.Dispose()
    $resized.Dispose()
    $img.Dispose()
    $ms.Dispose()
    
    $newSize = (Get-Item $tempOut).Length
    if ($newSize -lt $originalSize) {
        Move-Item -Path $tempOut -Destination $path -Force
        $ratioPct = [int](($newSize / $originalSize) * 100)
        Write-Output "Optimized $path : $originalSize bytes -> $newSize bytes ($ratioPct%)"
    } else {
        Remove-Item -Path $tempOut -Force
        Write-Output "Kept original $path (already compact: $originalSize bytes)"
    }
}

$images = @(
    'frontend/public/images/1de238af-eaa2-4244-8959-4b4deacab81d.jpg',
    'frontend/public/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg',
    'frontend/public/images/07422837-4d84-4eb6-b449-9af4b1322db0.jpg',
    'frontend/public/images/6b052069-99eb-4336-91e2-df185a0c344c.jpg'
)

foreach ($img in $images) {
    Optimize-ImageFile -path $img -maxWidth 1600 -quality 85
}
