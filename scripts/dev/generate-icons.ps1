Add-Type -AssemblyName System.Drawing

function Draw-KalaSathiIcon([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Outer dark heritage badge
    $rect = New-Object System.Drawing.Rectangle(1, 1, ($size - 2), ($size - 2))
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 16, 30))
    $g.FillEllipse($bgBrush, $rect)
    
    # Golden border ring
    $borderW = [Math]::Max(1.0, [float]($size * 0.06))
    $goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 220, 150, 20), $borderW)
    $g.DrawEllipse($goldPen, $rect)
    
    # Inner terracotta ring
    $innerPad = [int]($size * 0.12)
    $innerSize = [int]($size * 0.76)
    $innerRect = New-Object System.Drawing.Rectangle($innerPad, $innerPad, $innerSize, $innerSize)
    $crimsonPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 185, 28, 28), [Math]::Max(1.0, [float]($size * 0.03)))
    $g.DrawEllipse($crimsonPen, $innerRect)
    
    # Center Devanagari 'क' calligraphy
    $fontSize = [float]($size * 0.50)
    $font = New-Object System.Drawing.Font('Nirmala UI', $fontSize, [System.Drawing.FontStyle]::Bold)
    if ($font.Name -ne 'Nirmala UI') {
        $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold)
    }
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 185, 30))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $offsetY = -[float]($size * 0.04)
    $textRect = New-Object System.Drawing.RectangleF(0.0, $offsetY, [float]$size, [float]$size)
    $g.DrawString('क', $font, $textBrush, $textRect, $sf)
    
    $g.Dispose()
    return $bmp
}

$targetDir = 'frontend/public'
$imagesDir = 'frontend/public/images'

# 1. 180x180 Apple Touch Icon
$b180 = Draw-KalaSathiIcon 180
$b180.Save("$targetDir/apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$b180.Dispose()

# 2. 32x32 Favicon ICO
$b32 = Draw-KalaSathiIcon 32
$hIcon = $b32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$icoStream = [System.IO.File]::OpenWrite("$targetDir/favicon.ico")
$icon.Save($icoStream)
$icoStream.Close()
$icon.Dispose()

Copy-Item -Path "$targetDir/favicon.ico" -Destination "$imagesDir/favicon.ico" -Force
$b32.Dispose()

Write-Output "Successfully generated apple-touch-icon.png and favicon.ico"
