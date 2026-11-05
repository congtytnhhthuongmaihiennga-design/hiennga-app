# Ghép khung hình + lời đọc thành video MP4 1920x1080 (mỗi cảnh = thời lượng lời + 0,8 giây nghỉ).
param($out)
$d = Split-Path $MyInvocation.MyCommand.Path
$bin = "C:\Users\hp\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin"
New-Item -ItemType Directory -Force "$d\doan" | Out-Null
$ds = @()
$n = (Get-ChildItem "$d\khung\c*.png").Count
for ($i = 0; $i -lt $n; $i++) {
  $img = "$d\khung\c{0:D2}.png" -f $i; $wav = "$d\loi\a{0:D2}.wav" -f $i; $mp4 = "$d\doan\d{0:D2}.mp4" -f $i
  $dur = [double](& "$bin\ffprobe.exe" -v error -show_entries format=duration -of csv=p=0 $wav)
  $t = [math]::Round($dur + 0.8, 2); $fo = [math]::Round($t - 0.35, 2)
  & "$bin\ffmpeg.exe" -y -v error -loop 1 -framerate 30 -i $img -i $wav `
    -filter_complex "[0:v]scale=1920:1080,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${fo}:d=0.35[v];[1:a]aresample=48000,apad=pad_dur=0.8[a]" `
    -map "[v]" -map "[a]" -t $t -c:v libx264 -preset medium -crf 20 -tune stillimage -c:a aac -b:a 128k -ar 48000 -ac 2 $mp4
  $ds += "file '" + ($mp4 -replace '\\', '/') + "'"
  "cảnh $i : $t giây"
}
[IO.File]::WriteAllLines("$d\doan\ds.txt", $ds)
& "$bin\ffmpeg.exe" -y -v error -f concat -safe 0 -i "$d\doan\ds.txt" -c copy -movflags +faststart $out
$tong = & "$bin\ffprobe.exe" -v error -show_entries format=duration -of csv=p=0 $out
"Video: $out – $([math]::Round([double]$tong)) giây"
