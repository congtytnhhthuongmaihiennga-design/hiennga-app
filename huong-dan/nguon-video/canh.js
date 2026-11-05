// Kịch bản video hướng dẫn quản trị app Hiển Nga: mỗi cảnh = 1 khung hình + 1 đoạn lời đọc (cũng là phụ đề).
// hinh: 'pX' = ảnh điện thoại cap/X.png ; 'gia' / 'users' / ... = mô phỏng bảng tính (vẽ trong khung.html)
module.exports = [
  { phan: 'Giới thiệu', tieuDe: 'Hướng dẫn quản trị app Bảng giá Hiển Nga', y: ['3 Google Sheet + 1 web app', 'Quản lý: giá, tài khoản, ảnh, tồn kho', 'Đại lý xem giá & tồn kho trên điện thoại'], hinh: 'tongquan',
    loi: 'Xin chào. Video này hướng dẫn quản trị app bảng giá Hiển Nga. Hệ thống gồm ba Google Sheet và một trang web app trên điện thoại.' },
  { phan: 'Giới thiệu', tieuDe: 'Ai làm việc gì', y: ['Sheet chính: Giá + Users + Thương hiệu → Quản lý', 'Sheet Tồn kho → Người nhập kho', 'Sheet Hình ảnh sản phẩm → Người lo ảnh', 'App tự đọc cả 3 Sheet'], hinh: 'sodo',
    loi: 'Sheet chính chứa bảng giá, tài khoản và thương hiệu, do quản lý sửa. Sheet tồn kho do người nhập kho cập nhật. Sheet hình ảnh do người lo ảnh dán link. App tự đọc cả ba sheet.' },

  { phan: 'Phần 1 · Sheet chính', tieuDe: 'Tab Giá: điền 2 cột vàng', y: ['Mỗi dòng = 1 mã sản phẩm', 'Điền Giá niêm yết + Giá đại lý', 'Ghi số trần: 258000 (không ghi "đ", dấu chấm)', 'Gạch: giá theo m²'], hinh: 'gia',
    loi: 'Phần một: Sheet chính, tab Giá. Mỗi dòng là một mã sản phẩm. Chỉ cần điền hai cột màu vàng là giá niêm yết và giá đại lý, ghi số trần, không ghi chữ đồng. Giá gạch tính theo mét vuông.' },
  { phan: 'Phần 1 · Sheet chính', tieuDe: 'Ẩn mã – cập nhật giá', y: ['Ẩn 1 mã: ghi "Không" ở cột Hiện trên app', 'KHÔNG đổi tên tab, tên cột', 'Sửa xong: app tự nhận sau vài phút', 'Cần ngay: menu 📱 App → Xóa bộ nhớ đệm'], hinh: 'giaan',
    loi: 'Muốn ẩn một mã thì ghi chữ Không ở cột Hiện trên app. Không đổi tên tab và tên cột. Sửa xong, app tự nhận sau vài phút. Cần thấy ngay thì bấm menu App, chọn Xóa bộ nhớ đệm.' },
  { phan: 'Phần 1 · Sheet chính', tieuDe: 'Tab Users: tài khoản', y: ['Vai trò: admin (quản trị) · nv (nhân viên) · khachhang (đại lý)', 'Gõ mật khẩu vào cột "Mật khẩu mới"', 'Lần đăng nhập đầu: tự mã hóa, ô tự trống', 'Khóa tài khoản: ghi "Có" ở cột Khóa'], hinh: 'users',
    loi: 'Tab Users là danh sách tài khoản. Vai trò gồm admin là quản trị, nv là nhân viên, khách hàng là đại lý. Gõ mật khẩu vào cột mật khẩu mới, lần đăng nhập đầu máy chủ tự mã hóa rồi xóa ô này. Muốn khóa ai thì ghi Có ở cột Khóa.' },
  { phan: 'Phần 1 · Sheet chính', tieuDe: 'Hoặc tạo tài khoản ngay trong app', y: ['Đăng nhập bằng tài khoản admin', 'Menu tài khoản → Quản lý tài khoản', '＋ Thêm tài khoản: username, vai trò, mật khẩu', 'Sửa / khóa: bấm vào tên trong danh sách'], hinh: 'p11-quanly-taikhoan|p12-them-taikhoan',
    loi: 'Quản trị cũng có thể thêm và sửa tài khoản ngay trong app: đăng nhập bằng tài khoản admin, mở menu tài khoản, chọn Quản lý tài khoản, rồi bấm Thêm tài khoản.' },
  { phan: 'Phần 1 · Sheet chính', tieuDe: 'Tab Thương hiệu: tên đầy đủ + logo', y: ['Cột A: hãng như trong bảng giá (HT, CMC…)', 'Cột B: tên đầy đủ – app hiện tên này', 'Cột C: link ảnh logo (để trống = logo có sẵn)', '11 hãng đã có logo sẵn'], hinh: 'thuonghieu|p02-thuonghieu',
    loi: 'Tab Thương hiệu: điền tên đầy đủ cho các hãng viết tắt như HT, và dán link logo nếu muốn đổi. Để trống thì app dùng logo có sẵn. Mười một hãng đã có logo.' },

  { phan: 'Phần 2 · Sheet Hình ảnh', tieuDe: 'Tab Ảnh: chỉ dán link', y: ['Mã + Tên tự có sẵn (lấy từ bảng Giá)', 'Dán link ảnh vào cột C', 'Nhiều ảnh: cột D, E', 'Ctrl+F để tìm đúng mã'], hinh: 'anh',
    loi: 'Phần hai: Sheet hình ảnh sản phẩm. Tab Ảnh đã có sẵn mã và tên lấy từ bảng giá, không cần gõ. Chỉ cần dán link ảnh vào cột C. Có thêm ảnh thì dán vào cột D và E.' },
  { phan: 'Phần 2 · Sheet Hình ảnh', tieuDe: 'Lấy link ảnh trên Google Drive', y: ['1. Tải ảnh lên Google Drive', '2. Bấm ⋮ (hoặc chuột phải) → Chia sẻ', '3. "Bất kỳ ai có đường liên kết – Người xem"', '4. Sao chép đường liên kết → dán vào cột C'], hinh: 'drive',
    loi: 'Cách lấy link: tải ảnh lên Google Drive, bấm Chia sẻ, chọn bất kỳ ai có đường liên kết, quyền người xem, rồi sao chép đường liên kết và dán vào cột C.' },
  { phan: 'Phần 2 · Sheet Hình ảnh', tieuDe: 'Kiểm tra & mở quyền xem', y: ['Cột G hiện ảnh nhỏ = link đúng', '"Link sai" = kiểm tra lại link', 'Menu 📷 Ảnh SP → Mở quyền xem cho các link ảnh', '~10 phút sau ảnh hiện trên app'], hinh: 'anhxem',
    loi: 'Dán xong, cột G hiện ảnh nhỏ là link đúng. Cuối cùng bấm menu Ảnh SP, chọn Mở quyền xem cho các link ảnh, để iPhone của đại lý xem được. Khoảng mười phút sau ảnh hiện trên app.' },

  { phan: 'Phần 3 · Sheet Tồn kho', tieuDe: 'Nhập file thẻ kho', y: ['Xuất file thẻ kho từ phần mềm', 'Google Sheet Tồn kho: Tệp → Nhập → Tải lên', 'Chọn "Thay thế trang tính hiện tại"', 'hoặc "Chèn trang tính mới"'], hinh: 'nhap',
    loi: 'Phần ba: Sheet tồn kho. Xuất file thẻ kho từ phần mềm. Trên Google Sheet tồn kho, bấm Tệp, Nhập, Tải lên file, rồi chọn Thay thế trang tính hiện tại, hoặc Chèn trang tính mới.' },
  { phan: 'Phần 3 · Sheet Tồn kho', tieuDe: '⚠️ Lưu ý quan trọng', y: ['KHÔNG chọn "Thay thế bảng tính"', 'KHÔNG nhập tồn kho vào Sheet chính', '→ sẽ mất bảng giá và tài khoản', 'Lỡ tay: Tệp → Lịch sử phiên bản → khôi phục'], hinh: 'canhbao',
    loi: 'Lưu ý quan trọng: không chọn Thay thế bảng tính, và không nhập tồn kho vào Sheet chính, vì sẽ mất bảng giá và tài khoản. Lỡ tay thì vào Tệp, Lịch sử phiên bản để khôi phục bản cũ.' },
  { phan: 'Phần 3 · Sheet Tồn kho', tieuDe: 'Kiểm tra app đã đọc', y: ['Tab Hướng dẫn, dòng 2: "App đã đọc … mã – lúc …"', 'Tồn âm / bằng 0 = hết hàng', 'Gạch: hiện theo thùng + viên lẻ', 'Cột cần có: Kho · Mã vật tư · Tên vật tư · ĐVT · Tồn'], hinh: 'tonkho',
    loi: 'Sau khi nhập, xem tab Hướng dẫn: app ghi lại đã đọc bao nhiêu mã và lúc mấy giờ. Tồn âm hoặc bằng không được tính là hết hàng. Gạch hiện theo thùng và viên lẻ.' },

  { phan: 'Phần 4 · App', tieuDe: 'Mở app trên điện thoại', y: ['congtytnhhthuongmaihiennga-design.github.io/hiennga-app', 'Thêm vào màn hình chính → dùng như ứng dụng', 'Trang chủ: tìm kiếm, ngành hàng, thương hiệu', 'Nút Zalo / Gọi luôn ở trên'], hinh: 'p01-trangchu',
    loi: 'Phần bốn: sử dụng app. Mở đường link app trên điện thoại, rồi chọn Thêm vào màn hình chính để dùng như một ứng dụng. Trang chủ có ô tìm kiếm, ngành hàng, thương hiệu và nút Zalo, Gọi.' },
  { phan: 'Phần 4 · App', tieuDe: 'Khách & đại lý thấy gì', y: ['Chưa đăng nhập: chỉ giá niêm yết', 'Đăng nhập: giá đại lý (in đậm) + tồn kho', 'Chấm xanh: có ngay · cam: mai có · đỏ: chờ hàng', 'Đăng nhập ở nút góc trên'], hinh: 'p03-ds-gach|p06-ds-dangnhap',
    loi: 'Khách chưa đăng nhập chỉ thấy giá niêm yết. Đại lý và nhân viên đăng nhập sẽ thấy giá đại lý in đậm và tình trạng tồn kho: chấm xanh là có ngay, cam là mai có, đỏ là chờ hàng.' },
  { phan: 'Phần 4 · App', tieuDe: 'Tìm, lọc, sắp xếp', y: ['Tìm theo mã, tên, hãng, kích cỡ', 'Lọc: kích cỡ, loại, màu, công năng…', 'Sắp xếp: giá thấp/cao, có hàng nhiều nhất', 'Nút "Còn hàng": ẩn mã đã hết'], hinh: 'p07-loc',
    loi: 'Tìm theo mã, tên hoặc hãng ở ô tìm kiếm. Bấm Lọc để lọc theo kích cỡ, màu, công năng, và sắp xếp theo giá. Nút Còn hàng ẩn các mã đã hết.' },
  { phan: 'Phần 4 · App', tieuDe: 'Chi tiết sản phẩm', y: ['Giá niêm yết + giá đại lý', 'Tồn kho theo từng kho (nhân viên)', 'Tính số thùng: nhập m² → số thùng + kho đủ/thiếu', 'Hỏi Zalo · Gọi đặt · Chép báo giá'], hinh: 'p04-chitiet-khach|p08-chitiet-tonkho',
    loi: 'Màn chi tiết có giá, tồn kho theo từng kho, và máy tính số thùng: nhập số mét vuông khách cần, app tính số thùng và báo kho có đủ hay không.' },
  { phan: 'Phần 4 · App', tieuDe: 'Đại lý: bảo mật tồn kho', y: ['Đại lý chỉ thấy tối đa "50+"', 'Không thấy tên kho, số lô', 'Hỏi Zalo: tự chép thông tin mã → dán vào chat', 'Báo giá chép ra chỉ có giá niêm yết'], hinh: 'p09-chitiet-daily',
    loi: 'Đại lý chỉ thấy tồn kho tối đa năm mươi cộng và không thấy tên kho. Nút Hỏi Zalo tự chép thông tin mã để dán vào khung chat. Báo giá chép ra chỉ có giá niêm yết.' },
  { phan: 'Phần 4 · App', tieuDe: 'Menu quản trị', y: ['Quản lý tài khoản', 'Lấy dữ liệu mới từ Sheet (sau khi sửa giá)', 'Tải lại dữ liệu', 'Đăng xuất'], hinh: 'p10-menu-admin',
    loi: 'Tài khoản quản trị có thêm Quản lý tài khoản, và Lấy dữ liệu mới từ Sheet, để app cập nhật ngay sau khi sửa giá.' },
  { phan: 'Tóm tắt', tieuDe: 'Ghi nhớ', y: ['Giá, tài khoản, thương hiệu → Sheet chính', 'Tồn kho → Sheet Tồn kho (Tệp → Nhập)', 'Ảnh → Sheet Hình ảnh (dán link cột C)', 'Không đổi tên tab / cột · Cần hỗ trợ: anh Linh'], hinh: 'sodo',
    loi: 'Tóm lại: giá, tài khoản và thương hiệu sửa ở Sheet chính. Tồn kho nhập vào Sheet tồn kho. Ảnh dán link ở Sheet hình ảnh. Không đổi tên tab và tên cột. Cần hỗ trợ, liên hệ anh Linh. Cảm ơn đã theo dõi.' }
];
