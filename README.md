# hiennga-app

App bảng giá + tồn kho cho **Công ty TNHH Thương mại Hiển Nga** – Long Xuyên, An Giang (nhiều hãng: gạch ốp lát, thiết bị vệ sinh, thiết bị nhà bếp, sơn, ngói, keo).

- Giao diện: `index.html`, `style.css`, `app.js` – chạy trên GitHub Pages.
- Thông số riêng (tên, màu, logo, địa chỉ máy chủ, liên hệ): **`config.js`**.
- Máy chủ: thư mục `backend/` – Google Apps Script gắn với Google Sheet "Bảng giá & tồn kho Hiển Nga".
- Dữ liệu giá, tồn kho, tài khoản **chỉ nằm trong Google Sheet**, không nằm trong repo.

## Ai thấy gì
| Người dùng | Giá niêm yết | Giá đại lý | Tồn kho |
|---|---|---|---|
| Chưa đăng nhập | ✅ | ❌ (máy chủ không gửi) | ❌ |
| Đại lý (`khachhang`) | ✅ | ✅ | tối đa "50+", không có tên kho/lô |
| Nhân viên (`nv`) | ✅ | ✅ | đầy đủ theo kho, lô |
| Quản trị (`admin`) | ✅ | ✅ | đầy đủ + quản lý tài khoản |

## Tab trong Google Sheet (không đổi tên tab)
`Giá`, `Tồn kho`, `Kho`, `Nối mã`, `Ảnh`, `Users`. Cột đọc **theo tên tiêu đề** (danh sách tên chấp nhận ở `backend/Config.js`), chèn/đổi thứ tự cột vẫn chạy.
Menu **📱 App** trên Sheet: khởi tạo tab, bật tự làm mới 15 phút, xóa bộ nhớ đệm, kiểm tra dữ liệu.

## Xem thử trên máy
`config.js` để trống `APPS_URL` (hoặc thêm `?demo=1` vào địa chỉ) → chạy **dữ liệu giả** (`demo-data.js`).
Đăng nhập thử: `admin`, `nv` hoặc `daily`, mật khẩu bất kỳ.

```
powershell -ExecutionPolicy Bypass -File serve.ps1   # http://localhost:3460
```

## Cập nhật máy chủ
```
cd backend
clasp push            # đưa code lên Apps Script
clasp deploy -i <deploymentId>   # cập nhật bản đang chạy, giữ nguyên địa chỉ web app
```
`backend/.clasp.json` (chứa Script ID) không đưa lên repo.
