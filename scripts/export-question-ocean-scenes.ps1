$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path -Parent $PSScriptRoot
$assetRoot = Join-Path $taskRoot 'public/images/adult-integrity'
$outputRoot = Join-Path $assetRoot 'question-ocean'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$names = @('turtle','seahorse','jellyfish','sea-star','reef-fish-pair','octopus','hermit-crab','ray','spotted-reef-fish','pufferfish','sea-slug','squid','scallop','shrimp','anemone','sunfish','crab','butterflyfish','cuttlefish','urchin','penguin','lobster','anchovies','nautilus','sea-hare','manta-ray','moon-jellyfish','resting-turtle','blenny','sand-dollar')
$manifest = @()
foreach ($atlasName in @('a', 'b')) {
  $atlas = [System.Drawing.Bitmap]::new((Join-Path $assetRoot "question-ocean-scenes-$atlasName-v2.png"))
  try {
    if ($atlas.Width -ne 2172 -or $atlas.Height -ne 724) { throw 'Unexpected atlas dimensions' }
    for ($cell = 0; $cell -lt 15; $cell++) {
      $index = $cell + $(if ($atlasName -eq 'b') { 15 } else { 0 })
      $column = $cell % 5
      $row = [Math]::Floor($cell / 5)
      $left = [int][Math]::Floor($column * $atlas.Width / 5)
      $right = [int][Math]::Floor(($column + 1) * $atlas.Width / 5)
      $top = [int][Math]::Floor($row * $atlas.Height / 3) + 16
      $region = [System.Drawing.Rectangle]::new($left, $top, $right - $left, 214)
      $crop = $atlas.Clone($region, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $canvas = [System.Drawing.Bitmap]::new(435, 214)
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)
      try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.DrawImageUnscaled($crop, 0, 0)
        $fileName = '{0:D2}-{1}.png' -f ($index + 1), $names[$index]
        $canvas.Save((Join-Path $outputRoot $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
        $manifest += [ordered]@{ id = $index; file = $fileName; width = 435; height = 214; source = "question-ocean-scenes-$atlasName-v2.png" }
      } finally {
        $graphics.Dispose(); $canvas.Dispose(); $crop.Dispose()
      }
    }
  } finally { $atlas.Dispose() }
}
$manifestJson = ($manifest | ConvertTo-Json -Depth 3).Replace("`r`n", "`n") + "`n"
[IO.File]::WriteAllText((Join-Path $outputRoot 'index.json'), $manifestJson, [Text.UTF8Encoding]::new($false))
Write-Output "Exported $($manifest.Count) PNG files at 435 x 214 pixels to $outputRoot"
