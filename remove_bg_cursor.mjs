/**
 * JPEG → PNG with white-background removal
 * Zero external dependencies — uses only Node.js built-ins.
 *
 * Strategy:
 *   1. Decode JPEG by spawning the browser's built-in fetch/canvas via
 *      a tiny Vite-compatible approach — but since we have no browser,
 *      we write the JPEG pixel-reader manually using the JFIF/Huffman spec.
 *
 * Actually easiest zero-dep approach: use the `child_process` to call
 * PowerShell's System.Drawing to do the job on Windows.
 */

import { execSync } from 'child_process';

const SRC = 'D:/Web project/kidsuper-clone/public/paintbrush_cursor.png'; // actually a jpg
const DST = 'D:/Web project/kidsuper-clone/public/paintbrush_cursor.png';

// Use PowerShell + System.Drawing (built into .NET on all Windows)
const ps = `
Add-Type -AssemblyName System.Drawing

$src = "${SRC.replace(/\//g, '\\')}"
$dst = "${DST.replace(/\//g, '\\')}"

$orig = [System.Drawing.Image]::FromFile($src)
$bmp  = New-Object System.Drawing.Bitmap(128, 128, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g    = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($orig, 0, 0, 128, 128)
$g.Dispose()
$orig.Dispose()

# Remove white background
for ($y = 0; $y -lt 128; $y++) {
  for ($x = 0; $x -lt 128; $x++) {
    $p = $bmp.GetPixel($x, $y)
    $bright = ($p.R + $p.G + $p.B) / 3
    $sat = ([Math]::Max([Math]::Max($p.R, $p.G), $p.B) - [Math]::Min([Math]::Min($p.R, $p.G), $p.B))
    if ($bright -gt 230 -and $sat -lt 30) {
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $p.R, $p.G, $p.B))
    } elseif ($bright -gt 200 -and $sat -lt 50) {
      $newA = [int]($p.A * (1 - ($bright - 200) / 60))
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($newA, $p.R, $p.G, $p.B))
    }
  }
}

$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Done: $dst"
`;

try {
  const result = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { 
    encoding: 'utf8',
    timeout: 30000
  });
  console.log(result);
} catch(e) {
  console.error('Error:', e.message);
}
