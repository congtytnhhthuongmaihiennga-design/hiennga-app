# Đọc lời từng cảnh (loi2.json) bằng giọng tiếng Việt "Microsoft An" -> loi\aNN.wav
$d = Split-Path $MyInvocation.MyCommand.Path
$loi = Get-Content "$d\loi2.json" -Raw -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Force "$d\loi2" | Out-Null
Add-Type -AssemblyName System.Speech
for ($i = 0; $i -lt $loi.Count; $i++) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice('Microsoft An'); $s.Rate = 0; $s.Volume = 100
  $f = "$d\loi2\a{0:D2}.wav" -f $i
  $s.SetOutputToWaveFile($f)
  $s.Speak($loi[$i])
  $s.Dispose()
}
"Đã đọc $($loi.Count) đoạn"

