// Kịch bản video 2: Đơn hàng – Chừa hàng – Trang quản trị – Phân quyền.
// hinh: 'aN' = ảnh điện thoại cap2/aN.png ; 'bN' = màn hình máy tính cap2/bN.png ; 'kN' = ngăn chi tiết cap2/kN.png ; chữ khác = khung vẽ sẵn.
module.exports = [
  { phan: 'Giới thiệu', tieuDe: 'Đơn hàng, chừa hàng & trang quản trị', y: ['Đại lý lên đơn, chừa hàng trên điện thoại', 'Công ty nhận báo qua Email + Telegram', 'Duyệt đơn, giao hàng ở trang quản trị', 'Phân quyền nhân viên · nhật ký · báo cáo'], hinh: 'tongquan',
    loi: 'Xin chào. Video này hướng dẫn phần mới của app Hiển Nga: đại lý lên đơn và chừa hàng ngay trên điện thoại, công ty nhận báo qua email và Telegram, rồi duyệt đơn, giao hàng ở trang quản trị. Cuối video là phân quyền nhân viên, nhật ký và báo cáo.' },

  { phan: 'Phần 1 · Đại lý đặt hàng', tieuDe: 'Đặt hàng từ trang sản phẩm', y: ['Đại lý đăng nhập tài khoản', 'Mở sản phẩm → mục "Đặt hàng"', 'Nhập số lượng (gạch: theo thùng)', 'Bấm "Thêm vào giỏ"'], hinh: 'a1',
    loi: 'Phần một, đại lý đặt hàng. Đại lý đăng nhập, mở sản phẩm, kéo xuống mục Đặt hàng, nhập số lượng rồi bấm Thêm vào giỏ. Gạch đặt theo thùng, app tự đổi ra mét vuông và tính thành tiền theo giá đại lý.' },
  { phan: 'Phần 1 · Đại lý đặt hàng', tieuDe: 'Giỏ hàng & gửi đơn', y: ['Biểu tượng giỏ ở góc trên (có số mã)', 'Sửa số lượng bằng nút − / ＋', 'Giao tận nơi hoặc Nhận tại kho', 'Ghi SĐT, ngày cần, ghi chú → "Gửi đơn"'], hinh: 'a2',
    loi: 'Bấm biểu tượng giỏ hàng ở góc trên. Trong giỏ có thể sửa số lượng, chọn giao tận nơi hoặc nhận tại kho, ghi số điện thoại, ngày cần hàng và ghi chú, rồi bấm Gửi đơn. Giá trên đơn do máy chủ tính lại theo bảng giá, không ai sửa được.' },
  { phan: 'Phần 1 · Đại lý đặt hàng', tieuDe: 'Đơn của tôi', y: ['Menu tài khoản → "Đơn của tôi"', 'Chờ duyệt → Đã xác nhận → Đang giao → Đã giao', 'Đơn còn "Chờ duyệt": đại lý tự hủy được', 'Gửi đơn xong: hàng được giữ ngay'], hinh: 'a4',
    loi: 'Mục Đơn của tôi cho đại lý xem trạng thái từng đơn: chờ duyệt, đã xác nhận, đang giao, đã giao. Đơn còn chờ duyệt thì đại lý tự hủy được. Ngay khi gửi đơn, số hàng đó được giữ lại nên khách khác không đặt trùng. Hủy hoặc từ chối thì hàng được trả lại.' },

  { phan: 'Phần 2 · Chừa hàng', tieuDe: 'Chừa hàng (giữ hàng)', y: ['Trong giỏ: Loại đơn → "Chừa hàng"', 'Chọn số ngày giữ: 3 – 30 ngày', 'App báo tiền cọc theo số ngày', 'Bấm "Gửi yêu cầu chừa"'], hinh: 'a3',
    loi: 'Phần hai, chừa hàng. Trong giỏ, chọn loại đơn là Chừa hàng, rồi chọn số ngày cần giữ, từ ba đến ba mươi ngày. App báo luôn số tiền cọc tương ứng. Sau đó bấm Gửi yêu cầu chừa.' },
  { phan: 'Phần 2 · Chừa hàng', tieuDe: 'Hạn giữ & xin gia hạn', y: ['Hạn tính từ ngày Hiển Nga duyệt', '"Giữ tới ngày … (còn mấy ngày)", đã cọc / chưa cọc', 'Gần hết hạn: "Xin gia hạn" → chọn số ngày', 'Hết hạn: hàng VẪN giữ, công ty liên hệ'], hinh: 'a5',
    loi: 'Hạn giữ tính từ ngày Hiển Nga duyệt. Trong Đơn của tôi, đại lý thấy giữ tới ngày nào, còn mấy ngày, đã cọc hay chưa. Gần hết hạn thì bấm Xin gia hạn và chọn số ngày. Hết hạn, hàng vẫn được giữ cho tới khi công ty quyết định.' },
  { phan: 'Phần 2 · Chừa hàng', tieuDe: 'Cài số ngày & % cọc', y: ['Sheet chính → tab "Cài đặt chừa hàng"', 'Mỗi dòng: Số ngày | % đặt cọc', 'Mỗi dòng = 1 lựa chọn đại lý thấy', 'Sửa xong, app đổi theo'], hinh: 'caichua',
    loi: 'Số ngày và phần trăm cọc do công ty tự cài trong tab Cài đặt chừa hàng của Sheet chính. Mỗi dòng là một lựa chọn đại lý thấy trong app. Ví dụ giữ bảy ngày thì cọc mười phần trăm. Sửa xong, app đổi theo.' },

  { phan: 'Phần 3 · Báo đơn', tieuDe: 'Báo đơn qua Email + Telegram', y: ['Đơn mới / chừa hàng → nhóm chính', 'Đơn vừa duyệt → nhóm kho (cần xuất giao)', '7h sáng: nhắc đơn chừa hết hạn', 'Bấm link trong tin → mở thẳng đơn'], hinh: 'tele',
    loi: 'Phần ba, báo đơn. Mỗi đơn mới hay yêu cầu chừa hàng được báo ngay qua email và nhóm Telegram chính. Đơn vừa duyệt được báo sang nhóm kho để xuất hàng. Bảy giờ sáng mỗi ngày, app nhắc các đơn chừa đã hết hạn. Bấm đường link trong tin là mở thẳng đơn đó.' },
  { phan: 'Phần 3 · Báo đơn', tieuDe: 'Cài email & Telegram', y: ['Sheet chính → menu 📱 App', '"Cài email nhận báo đơn" (chính + kho)', '"Cài Telegram": dán mã bot, gõ 1 hoặc 2', '"Gửi thử báo đơn" để kiểm tra'], hinh: 'menuapp',
    loi: 'Cài đặt nằm ở menu App trên Sheet chính. Chọn Cài email nhận báo đơn để đổi email. Chọn Cài Telegram, dán mã bot, gõ một cho nhóm chính hoặc hai cho nhóm kho. Cuối cùng bấm Gửi thử báo đơn để kiểm tra. Nếu báo thiếu quyền, chạy mục số không, Cấp quyền cho app.' },

  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Mở trang quản trị', y: ['App → menu tài khoản → "Trang quản trị đơn hàng"', 'Hoặc: …/hiennga-app/quan-tri.html', 'Đăng nhập tài khoản Quản trị / Nhân viên', 'Dùng tốt nhất trên máy tính'], hinh: 'b1',
    loi: 'Phần bốn, trang quản trị. Trong app, bấm menu tài khoản, chọn Trang quản trị đơn hàng, hoặc mở đường link ghi trên màn hình. Đăng nhập bằng tài khoản quản trị hoặc nhân viên. Trang này dùng tốt nhất trên máy tính.' },
  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Bảng điều khiển', y: ['Đơn chờ duyệt', 'Chừa hàng cần quyết (hết hạn / xin gia hạn)', 'Đã xác nhận – chờ giao · doanh số tháng', 'Tự làm mới mỗi phút, báo khi có đơn mới'], hinh: 'b2',
    loi: 'Bảng điều khiển cho thấy ngay số đơn chờ duyệt, số đơn chừa hàng cần quyết, số đơn chờ giao và doanh số tháng này. Trang tự làm mới mỗi phút và báo khi có đơn mới.' },
  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Danh sách đơn', y: ['Lọc theo trạng thái', 'Tìm: mã đơn, đại lý, SĐT, mã hàng', 'Bấm 1 dòng → mở chi tiết đơn', 'Nút "Làm mới" để tải ngay'], hinh: 'b3',
    loi: 'Mục Đơn hàng liệt kê tất cả đơn. Bấm các nút phía trên để lọc theo trạng thái, hoặc gõ tìm theo mã đơn, tên đại lý, số điện thoại, mã hàng. Bấm vào một dòng để mở chi tiết.' },
  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Duyệt đơn', y: ['Xem mặt hàng + cột "Được bán"', '"Xác nhận đơn" hoặc "Từ chối"', 'Ghi chú nội bộ: đại lý không thấy', 'Lịch sử xử lý · In phiếu'], hinh: 'k4',
    loi: 'Trong chi tiết đơn, xem các mặt hàng và cột Được bán. Bấm Xác nhận đơn hoặc Từ chối. Ô ghi chú nội bộ chỉ người trong công ty thấy. Phía dưới là lịch sử: ai làm gì, lúc nào. Nút In phiếu để in đơn ra giấy.' },
  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Duyệt chừa hàng', y: ['Nút "Duyệt chừa N ngày"', 'Hạn giữ tính từ lúc duyệt', 'Ghi "Cọc yêu cầu" / "Đã nhận cọc"', 'Hoặc "Duyệt giao luôn" / "Từ chối"'], hinh: 'k5',
    loi: 'Với yêu cầu chừa hàng, bấm Duyệt chừa. Hạn giữ bắt đầu tính từ lúc này. Ghi số tiền cọc yêu cầu và số đã nhận, app báo đủ cọc hay còn thiếu. Khách muốn lấy luôn thì bấm Duyệt giao luôn.' },
  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Chừa hết hạn – quản trị quyết', y: ['Báo đỏ: "Đã hết hạn chừa"', 'Gia hạn thêm: +3 … +30 ngày', '"Chuyển thành đơn giao"', '"Nhả hàng" → trả tồn cho khách khác'], hinh: 'k6',
    loi: 'Khi đơn chừa hết hạn, app không tự nhả hàng mà báo đỏ để quản trị quyết: gia hạn thêm ngày, chuyển thành đơn giao, hoặc nhả hàng để trả số tồn cho khách khác. Đại lý xin gia hạn thì có nút Đồng ý hoặc Không.' },
  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Kho & giao hàng', y: ['Đơn đã duyệt cần xuất kho', 'Xếp theo ngày khách cần', 'Đang giao: tách riêng', 'Đã giao hôm nay'], hinh: 'b7',
    loi: 'Mục Kho và giao hàng dành cho thủ kho: danh sách đơn đã duyệt cần xuất kho, xếp theo ngày khách cần, và các đơn đang giao.' },
  { phan: 'Phần 4 · Trang quản trị', tieuDe: 'Báo đang giao / đã giao', y: ['"Đang giao" → ghi người giao, biển số xe', '"Đã giao" khi khách nhận hàng', 'App tự ghi giờ giao', 'Đã giao: thôi giữ hàng, kho trừ tồn trong file'], hinh: 'k8',
    loi: 'Mở đơn, bấm Đang giao và ghi tên người giao hoặc biển số xe. Giao xong bấm Đã giao, app tự ghi giờ giao. Lúc này app thôi giữ số hàng đó, vì kho đã trừ tồn trong file tồn kho.' },

  { phan: 'Phần 5 · Quản lý', tieuDe: 'Báo cáo doanh số', y: ['Hôm nay · 7 ngày · tháng · năm · tùy chọn', 'Doanh số, số đơn, tỷ lệ hủy, cọc', 'Theo ngày, ngành hàng, đại lý, mặt hàng', 'Tải Excel (CSV)'], hinh: 'b9',
    loi: 'Phần năm, quản lý. Mục Báo cáo cho xem doanh số theo khoảng thời gian: hôm nay, bảy ngày, tháng, năm hoặc tự chọn. Có biểu đồ theo ngày, theo ngành hàng, đại lý mua nhiều nhất và mặt hàng bán chạy. Bấm Tải Excel để lưu về máy.' },
  { phan: 'Phần 5 · Quản lý', tieuDe: 'Nhật ký thao tác', y: ['Ai làm gì, lúc nào', 'Đăng nhập, đăng nhập sai, duyệt, sửa giá, đổi quyền', 'Tìm theo tài khoản / mã đơn', 'Bấm 1 dòng → mở đơn'], hinh: 'b10',
    loi: 'Mục Nhật ký ghi lại ai làm gì, lúc nào: đăng nhập, đăng nhập sai mật khẩu, gửi đơn, duyệt đơn, sửa giá, đổi quyền. Gõ để tìm theo tài khoản hoặc mã đơn.' },
  { phan: 'Phần 5 · Quản lý', tieuDe: 'Nhập giá', y: ['Tìm mã → sửa Giá niêm yết / Giá đại lý', 'Bấm "Lưu" – app thấy giá mới ngay', 'Lọc "Chỉ mã chưa có giá"', 'Sửa hàng loạt: vẫn dùng tab Giá'], hinh: 'b12',
    loi: 'Mục Nhập giá: tìm mã, sửa giá niêm yết hoặc giá đại lý rồi bấm Lưu, app đại lý thấy giá mới ngay, và nhật ký ghi lại giá cũ, giá mới. Sửa hàng loạt nhiều mã thì vẫn nên nhập trong tab Giá của Sheet chính.' },
  { phan: 'Phần 5 · Quản lý', tieuDe: 'Tồn kho', y: ['"Mở Sheet Tồn kho" (đúng Gmail được cấp)', 'Dán file xuất từ phần mềm kho', '"App đọc lại tồn ngay"', 'Được bán = Tồn − hàng đang giữ'], hinh: 'b13',
    loi: 'Mục Tồn kho có nút mở Sheet tồn kho để dán file xuất từ phần mềm kho, và nút App đọc lại tồn ngay. Số được bán trên app bằng tồn trong file trừ đi hàng đang giữ cho các đơn.' },

  { phan: 'Phần 6 · Phân quyền', tieuDe: 'Nhân viên & quyền', y: ['Chỉ Quản trị thấy mục này', 'Tick quyền → "Lưu", có hiệu lực ngay', 'Nhập tồn kho: ghi Gmail nhân viên', 'Không tick gì = chỉ xem đơn'], hinh: 'b11',
    loi: 'Phần sáu, phân quyền. Mục Nhân viên và quyền chỉ quản trị thấy. Tick các quyền rồi bấm Lưu, có hiệu lực ngay. Quyền nhập tồn kho cần ghi Gmail của nhân viên, hệ thống tự mở quyền sửa Sheet tồn kho cho Gmail đó. Không tick quyền nào thì nhân viên chỉ xem được đơn.' },
  { phan: 'Phần 6 · Phân quyền', tieuDe: 'Gợi ý chia quyền', y: ['Tạo tài khoản: app → Quản lý tài khoản (vai trò Nhân viên)', 'Mỗi người 1 tài khoản riêng', 'Nghỉ việc: khóa tài khoản', 'Nhật ký ghi đúng tên từng người'], hinh: 'quyen',
    loi: 'Gợi ý chia quyền: thủ kho được kho và giao hàng cộng nhập tồn. Kế toán được nhập giá, ghi tiền cọc và xem báo cáo. Nhân viên bán hàng được duyệt đơn, duyệt chừa hàng và ghi chú. Mỗi người một tài khoản riêng để nhật ký ghi đúng tên. Ai nghỉ việc thì khóa tài khoản.' },
  { phan: 'Tóm tắt', tieuDe: 'Tóm tắt quy trình', y: ['Đại lý: giỏ hàng → Gửi đơn / Chừa hàng', 'Công ty: nhận Telegram → duyệt đơn', 'Kho: Kho & giao hàng → Đã giao', 'Quản trị: báo cáo, nhật ký, phân quyền'], hinh: 'quytrinh',
    loi: 'Tóm lại: đại lý bỏ hàng vào giỏ, gửi đơn hoặc chừa hàng. Công ty nhận tin Telegram rồi duyệt đơn. Kho xuất hàng và bấm đã giao. Quản trị theo dõi báo cáo, nhật ký và phân quyền. Cảm ơn anh chị đã theo dõi.' }
];
