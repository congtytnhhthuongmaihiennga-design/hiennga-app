// ============================================================
// CẤU HÌNH – mọi thông số riêng của khách nằm ở file này.
// Đổi cho khách khác: sửa APP_KEY (khớp config.js phía giao diện),
// tên tab và danh sách tên cột nếu file Excel của họ đặt tên khác.
// KHÔNG để mật khẩu/muối mã hóa ở đây: muối nằm trong Script Properties
// (tự sinh lần đầu), nên file này đưa lên GitHub public vẫn an toàn.
// ============================================================
var APP_KEY = 'aMaqlb4vNcw0G6oqMEgK5ULv2z8S';

// Tên tab trong Google Sheet. KHÔNG đổi tên tab trên Sheet.
var TAB = {
  gia:    'Giá',
  tonkho: 'Tồn kho',
  kho:    'Kho',
  noima:  'Nối mã',
  anh:    'Ảnh',
  users:  'Users'
};

// Khách hàng (đại lý) chỉ thấy tối đa số này; app hiện "50+".
var TRAN_TON_KHACH = 51;
// Đăng nhập giữ được bao nhiêu ngày.
var TOKEN_NGAY = 30;
// Bộ nhớ đệm (giây). Sửa Sheet là tự xóa đệm (onEdit), nên để dài cũng không sao.
var CACHE_GIAY = 6 * 3600;

// Tên cột chấp nhận được (so khớp không dấu, không phân biệt hoa thường).
// Cột nào đặt tên khác thì thêm tên đó vào danh sách tương ứng.
var COT_GIA = {
  hang:     ['Hãng', 'Thương hiệu', 'Nhãn hiệu', 'Brand'],
  nhom:     ['Nhóm hàng', 'Nhóm', 'Ngành hàng', 'Loại hàng'],
  ma:       ['Mã hàng', 'Mã SP', 'Mã sản phẩm', 'Mã', 'Mã vật tư', 'Code'],
  ten:      ['Tên hàng', 'Tên sản phẩm', 'Tên SP', 'Tên', 'Diễn giải'],
  kc:       ['Kích cỡ / Quy cách', 'Kích cỡ', 'Kích thước', 'Quy cách', 'Size'],
  loai:     ['Loại', 'Dòng', 'Chất liệu'],
  dvt:      ['Đơn vị', 'ĐVT', 'Đơn vị tính'],
  dg:       ['Đóng gói', 'Quy cách đóng gói'],
  ny:       ['Giá niêm yết', 'Giá lẻ', 'Giá bán lẻ'],
  dl:       ['Giá đại lý', 'Giá ĐL', 'Giá sỉ'],
  gc:       ['Ghi chú'],
  hien:     ['Hiện trên app', 'Hiện', 'Hiển thị'],
  mau:      ['Màu', 'Màu sắc'],
  congNang: ['Công năng'],
  tinhNang: ['Tính năng'],
  hoaVan:   ['Hoa văn', 'Vân'],
  men:      ['Men', 'Bề mặt'],
  dungTich: ['Dung tích', 'Thể tích']
};
var COT_TON = {
  ma:  ['Mã hàng', 'Mã SP', 'Mã', 'Mã vật tư', 'Material Number'],
  kho: ['Kho', 'Tên kho', 'Kho hàng', 'Name 1'],
  sl:  ['Số lượng', 'Khả dụng', 'SL', 'Tồn', 'Tồn kho', 'Số lượng tồn'],
  lo:  ['Số lô', 'Lô', 'Batch'],
  dvt: ['Đơn vị', 'ĐVT']
};

// Tiêu đề tạo sẵn khi bấm "Khởi tạo các tab".
var TIEU_DE = {
  gia:    ['Hãng', 'Nhóm hàng', 'Mã hàng', 'Tên hàng', 'Kích cỡ / Quy cách', 'Loại', 'Đơn vị', 'Đóng gói',
           'Giá niêm yết', 'Giá đại lý', 'Ghi chú', 'Hiện trên app',
           'Màu', 'Công năng', 'Tính năng', 'Hoa văn', 'Men', 'Dung tích'],
  tonkho: ['Mã hàng', 'Kho', 'Số lượng', 'Số lô', 'Đơn vị'],
  kho:    ['Kho', 'Nhóm giao'],
  noima:  ['Mã tồn kho', 'Mã hàng'],
  anh:    ['Mã hàng', 'Ảnh 1', 'Ảnh 2', 'Ảnh 3'],
  users:  ['Username', 'Họ tên', 'Vai trò', 'Mật khẩu mới', 'PasswordHash',
           'Tên công ty', 'SĐT', 'Địa chỉ', 'Khóa']
};
var VAI_TRO = ['admin', 'nv', 'khachhang'];
