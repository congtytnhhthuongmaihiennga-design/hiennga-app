// Kịch bản video 3: Nhập kho & tuổi tồn kho.
// hinh: 'aN' ảnh điện thoại · 'bN' màn hình máy tính · 'kN' ngăn bên phải (cap3/) · chữ khác = khung vẽ sẵn. Nhiều hình: 'a1|a2'.
module.exports = [
  { phan: 'Giới thiệu', tieuDe: 'Nhập kho & tuổi tồn kho', y: ['Lập phiếu nhập ngay trên trang quản trị', 'Ghi nhanh ngày nhập cho hàng tồn cũ', 'App tự tính tuổi tồn, tô màu', 'Bán hàng thấy hàng tồn lâu để đẩy sale'], hinh: 'tongquan',
    loi: 'Xin chào. Video này hướng dẫn phần nhập kho mới của app Hiển Nga. Hàng về thì lập phiếu nhập ngay trên trang quản trị, không cần mở Google Sheet. App tự tính mỗi mã đã tồn bao nhiêu ngày, tô màu hàng tồn lâu để bộ phận bán hàng ưu tiên đẩy sale.' },

  { phan: 'Phần 1 · Phiếu nhập', tieuDe: 'Mở mục Tồn kho', y: ['Trang quản trị → "Tồn kho"', 'Cần quyền "Nhập tồn kho"', 'Khung "Phiếu nhập kho" ở trên cùng', 'Bấm "+ Lập phiếu nhập"'], hinh: 'b1',
    loi: 'Phần một, lập phiếu nhập. Vào trang quản trị, chọn mục Tồn kho. Tài khoản cần được bật quyền Nhập tồn kho trong mục Nhân viên và quyền. Khung Phiếu nhập kho nằm trên cùng, bấm nút Lập phiếu nhập.' },
  { phan: 'Phần 1 · Phiếu nhập', tieuDe: 'Điền phiếu, tìm mã hàng', y: ['Ngày nhập: tự điền hôm nay, sửa được', 'Kho: gợi ý sẵn, tự nhớ lần trước', 'Nhà cung cấp / số chứng từ', 'Gõ vài chữ của mã hoặc tên → chọn'], hinh: 'k1',
    loi: 'Ngày nhập tự điền là hôm nay, hàng về hôm trước thì sửa lại. Chọn kho, ghi nhà cung cấp hoặc số chứng từ. Sau đó gõ vài chữ của mã hoặc tên hàng, app gợi ý ngay để chọn. Chỉ chọn được mã có trong bảng giá hoặc tồn kho, nên không lo gõ sai mã.' },
  { phan: 'Phần 1 · Phiếu nhập', tieuDe: 'Nhập số lượng & lưu', y: ['Đơn vị tự đúng theo tồn kho (gạch: thùng)', 'Enter → quay lại ô tìm, thêm mã tiếp', '📷 Quét QR trên tem giá (Chrome Android)', 'Bấm "Lưu phiếu nhập"'], hinh: 'k2',
    loi: 'Chọn xong, ô số lượng hiện ra. Đơn vị tự đúng theo tồn kho, ví dụ gạch tính theo thùng, bên cạnh có số đang tồn để đối chiếu. Nhấn Enter là quay lại ô tìm để thêm mã tiếp. Trên điện thoại Android có nút quét mã QR trên tem giá. Xong bấm Lưu phiếu nhập.' },
  { phan: 'Phần 1 · Phiếu nhập', tieuDe: 'Danh sách phiếu nhập', y: ['Phiếu mới nhất ở trên', 'Bấm 1 phiếu → sửa hoặc xóa', 'Mọi thao tác ghi vào Nhật ký', 'Số lượng tồn vẫn theo Sheet Tồn kho'], hinh: 'b2',
    loi: 'Phiếu vừa lưu hiện ngay trong danh sách. Bấm vào một phiếu để sửa hoặc xóa, mọi thao tác đều ghi vào nhật ký. Lưu ý: phiếu nhập không cộng thêm vào số tồn. Số lượng tồn vẫn lấy theo Sheet Tồn kho từ phần mềm kho. Phiếu nhập chỉ cho app biết hàng nhập ngày nào.' },

  { phan: 'Phần 2 · Tuổi tồn', tieuDe: 'Nhập trước – bán trước', y: ['Lấy các phiếu mới nhất cộng dồn tới đủ số tồn', 'Lô cũ nhất còn lại = ngày tính tuổi tồn', 'Thiếu phiếu: phần còn lại là hàng cũ', 'Hàng cũ: dùng ngày ghi tay (✎)'], hinh: 'fifo',
    loi: 'Phần hai, cách app tính tuổi tồn: nhập trước, bán trước. Ví dụ trong kho còn hai trăm mười hai thùng. App lấy các phiếu nhập mới nhất cộng dồn: sáu mươi thùng ngày năm tháng mười một, năm mươi thùng ngày hai lăm tháng mười. Phần còn lại là hàng cũ. Lô cũ nhất còn trong kho quyết định số ngày tồn.' },
  { phan: 'Phần 2 · Tuổi tồn', tieuDe: 'Bảng tuổi tồn kho', y: ['≤ 30 ngày xanh · 31–180 xám', '181–365 cam · trên 1 năm đỏ – nên sale', 'Lọc theo mức · tìm mã', 'Tồn lâu nhất xếp lên đầu'], hinh: 'b3',
    loi: 'Bảng tuổi tồn kho nằm ngay bên dưới. Mỗi mã có ngày nhập, số ngày đã tồn và màu: dưới ba mươi ngày màu xanh, tới một trăm tám mươi ngày màu xám, tới một năm màu cam, tồn trên một năm màu đỏ, nên bán sale. Bấm các nút phía trên để lọc theo mức, hoặc gõ tìm mã.' },
  { phan: 'Phần 2 · Tuổi tồn', tieuDe: 'Ghi nhanh ngày cho hàng cũ', y: ['Bấm "Chưa có ngày nhập"', 'Chọn ngày → "Lưu"', 'Mã đã có ngày: bấm ✎ để sửa', 'Mỗi mã chỉ cần ghi 1 lần'], hinh: 'b4',
    loi: 'Hàng tồn từ trước, chưa có phiếu nhập, thì bấm nút Chưa có ngày nhập. Mỗi mã có ô chọn ngày, chọn rồi bấm Lưu. Mã đã có ngày thì bấm biểu tượng cây bút để sửa. Mỗi mã chỉ cần ghi một lần, từ nay hàng về thì lập phiếu nhập.' },

  { phan: 'Phần 3 · Bán hàng', tieuDe: 'Nhân viên bán hàng thấy gì', y: ['Nhãn "Tồn … ngày" cho hàng trên 180 ngày', 'Lọc → sắp xếp "Tồn lâu nhất"', 'Mở sản phẩm: ngày nhập từng lô', 'Đại lý, khách lẻ KHÔNG thấy'], hinh: 'a1|a2',
    loi: 'Phần ba, bên app bán hàng. Nhân viên thấy nhãn tồn bao nhiêu ngày ở những mã tồn trên một trăm tám mươi ngày, và có cách sắp xếp Tồn lâu nhất trong mục Lọc. Mở sản phẩm sẽ thấy ngày nhập và các lô còn trong kho. Đại lý và khách lẻ không thấy các thông tin này.' },
  { phan: 'Tóm tắt', tieuDe: 'Cách dùng hằng ngày', y: ['Hàng về → lập phiếu nhập', 'Hàng tồn cũ → ghi ngày 1 lần', 'Kế toán vẫn cập nhật số tồn từ phần mềm kho', 'Bán hàng ưu tiên đẩy hàng màu đỏ, cam'], hinh: 'quytrinh',
    loi: 'Tóm lại: hàng về thì lập phiếu nhập. Hàng tồn cũ thì ghi ngày nhập một lần. Kế toán vẫn cập nhật số lượng tồn từ phần mềm kho như trước. Bộ phận bán hàng xem bảng tuổi tồn để ưu tiên đẩy hàng màu đỏ và màu cam. Cảm ơn anh chị đã theo dõi.' }
];
