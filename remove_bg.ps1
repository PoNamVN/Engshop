Add-Type -AssemblyName System.Drawing

$src = 'D:\Web project\kidsuper-clone\public\pointer_hand_cursor.png'
$dst = 'D:\Web project\kidsuper-clone\public\pointer_hand_cursor.png'

# ── 1. Load & resize to 128x128 ──────────────────────────────────────────────
$orig = [System.Drawing.Image]::FromFile($src)
$size = 128
$bmp  = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g    = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($orig, 0, 0, $size, $size)
$g.Dispose(); $orig.Dispose()

# ── 2. Read all pixels into a 2D array for fast access ───────────────────────
$pixels = New-Object 'System.Drawing.Color[,]' $size, $size
for ($y = 0; $y -lt $size; $y++) {
    for ($x = 0; $x -lt $size; $x++) {
        $pixels[$x, $y] = $bmp.GetPixel($x, $y)
    }
}

# ── 3. BFS flood-fill from all 4 edges ───────────────────────────────────────
# A pixel is "background-candidate" if it is near-white
function IsNearWhite($c) {
    return ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200)
}

$visited  = New-Object 'bool[,]' $size, $size
$isBg     = New-Object 'bool[,]' $size, $size
$queue    = New-Object System.Collections.Generic.Queue[System.Drawing.Point]

# Seed from all border pixels that are near-white
for ($i = 0; $i -lt $size; $i++) {
    foreach ($pt in @(
        [System.Drawing.Point]::new($i, 0),
        [System.Drawing.Point]::new($i, $size-1),
        [System.Drawing.Point]::new(0, $i),
        [System.Drawing.Point]::new($size-1, $i)
    )) {
        if (-not $visited[$pt.X, $pt.Y] -and (IsNearWhite $pixels[$pt.X, $pt.Y])) {
            $visited[$pt.X, $pt.Y] = $true
            $isBg[$pt.X, $pt.Y]    = $true
            $queue.Enqueue($pt)
        }
    }
}

# BFS expand
$dx = @(1,-1,0,0)
$dy = @(0,0,1,-1)
while ($queue.Count -gt 0) {
    $cur = $queue.Dequeue()
    for ($d = 0; $d -lt 4; $d++) {
        $nx = $cur.X + $dx[$d]
        $ny = $cur.Y + $dy[$d]
        if ($nx -lt 0 -or $nx -ge $size -or $ny -lt 0 -or $ny -ge $size) { continue }
        if ($visited[$nx, $ny]) { continue }
        if (IsNearWhite $pixels[$nx, $ny]) {
            $visited[$nx, $ny] = $true
            $isBg[$nx, $ny]    = $true
            $queue.Enqueue([System.Drawing.Point]::new($nx, $ny))
        }
    }
}

# ── 4. Apply transparency + soft anti-fringe ─────────────────────────────────
for ($y = 0; $y -lt $size; $y++) {
    for ($x = 0; $x -lt $size; $x++) {
        $p = $pixels[$x, $y]

        if ($isBg[$x, $y]) {
            # Confirmed background → fully transparent
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $p.R, $p.G, $p.B))
        } else {
            # Check if this non-bg pixel is near-white (fringe at edges)
            $bright = ($p.R + $p.G + $p.B) / 3.0
            $maxC   = [Math]::Max([Math]::Max($p.R, $p.G), $p.B)
            $minC   = [Math]::Min([Math]::Min($p.R, $p.G), $p.B)
            $sat    = $maxC - $minC

            if ($bright -gt 220 -and $sat -lt 20) {
                # Near-white fringe not reached by flood fill → also transparent
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $p.R, $p.G, $p.B))
            } elseif ($bright -gt 190 -and $sat -lt 35) {
                # Light fringe → semi-transparent
                $alpha = [int](255 * ($maxC - $bright) / 65.0)
                $alpha = [Math]::Max(0, [Math]::Min(255, $alpha))
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            }
        }
    }
}

# ── 5. Save as PNG ────────────────────────────────────────────────────────────
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Done: $dst"
