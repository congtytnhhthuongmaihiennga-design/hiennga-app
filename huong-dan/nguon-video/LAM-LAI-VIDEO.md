# Làm lại video hướng dẫn

Cần: Node.js, Google Chrome, ffmpeg, giọng đọc Windows "Microsoft An" (vi-VN).

```
npm install                      # cài puppeteer-core
node chup-app.js                 # chụp lại màn hình app (cần chạy serve.ps1 cho phần dữ liệu dùng thử)
node dung-khung.js               # dựng 20 khung hình từ canh.js
powershell -File doc-loi.ps1     # đọc lời từng cảnh
powershell -File ghep.ps1 "..\Video huong dan quan tri app Hien Nga.mp4"
```

Sửa nội dung: chỉnh `canh.js` (tiêu đề, gạch đầu dòng, lời đọc) rồi chạy lại 3 lệnh cuối.
