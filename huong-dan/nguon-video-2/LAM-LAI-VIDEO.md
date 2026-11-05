# Làm lại video 2 (Đơn hàng – Chừa hàng – Trang quản trị – Phân quyền)
Cần: Node + puppeteer-core (thư mục video cũ ở nguon-video), Chrome, ffmpeg, giọng "Microsoft An" (chạy bằng PowerShell 7 – pwsh).
1. Mở app chế độ thử (serve.ps1, cổng 3460) → `node chup2.js` (chụp lại ảnh vào cap2/).
2. Sửa lời / nội dung trong canh2.js → `node dung-khung2.js` (khung hình vào khung2/, lời vào loi2.json).
3. `pwsh -File doc-loi2.ps1` (đọc lời → loi2/) → `pwsh -File ghep2.ps1 "<đường dẫn video>.mp4"`.
