// ============================================================
// CẤU HÌNH APP – mọi thông số riêng của khách nằm ở file này.
// Repo public: KHÔNG để giá, tồn kho, mật khẩu ở đây. Dữ liệu nằm trong
// Google Sheet, Apps Script chỉ trả giá đại lý / tồn kho khi đã đăng nhập.
// ============================================================
window.APP_CONFIG = {
  TEN_APP: 'Hiển Nga',
  TEN_DAY_DU: 'Công ty TNHH Thương mại Hiển Nga',
  KHAU_HIEU: 'Vật liệu xây dựng · Long Xuyên, An Giang',
  LOGO: '',                 // vd 'logo.png' – để trống thì hiện chữ viết tắt
  VIET_TAT: 'HN',
  MAU_CHINH: '#1E3FA8',     // xanh dương logo
  MAU_DAM: '#152E7E',
  MAU_NHAN: '#D7261E',      // đỏ logo / bảng hiệu

  // Địa chỉ Web App Apps Script. Để trống (hoặc thêm ?demo=1) = chạy dữ liệu dùng thử.
  APPS_URL: 'https://script.google.com/macros/s/AKfycby2E2AXuXTAKxf2VfPi9LmEcJYyOkaUDFB0aY6vjQXn-qtP4qjgG_yD6_w00q7NVteI/exec',
  // Khóa gắn theo mọi yêu cầu, khớp APP_KEY trong backend/Config.js.
  APP_KEY: 'aMaqlb4vNcw0G6oqMEgK5ULv2z8S',

  // Nút "Hỏi Zalo" / "Gọi đặt hàng" và dòng "Quên mật khẩu".
  LIEN_HE_TEN: 'Hiển Nga',
  LIEN_HE_SDT: '0939182288',

  NGUONG_TON_KHACH: 50,     // đại lý thấy "50+" khi tồn > 50 (máy chủ đã chặn trần 51)

  // Nhóm hàng: "ten" khớp cột "Nhóm hàng" trong Sheet (không phân biệt dấu/hoa thường).
  // icon: gach | ngoi | keo | tbvs | son | bep | khac.  Thứ tự ở đây = thứ tự trên trang chủ.
  NHOM_HANG: [
    { key: 'gach', ten: 'Gạch ốp lát',       ngan: 'Gạch', icon: 'gach', alias: ['gạch', 'gạch men'] },
    { key: 'tbvs', ten: 'Thiết bị vệ sinh',  ngan: 'TBVS', icon: 'tbvs', alias: ['tbvs', 'vệ sinh'] },
    { key: 'bep',  ten: 'Thiết bị nhà bếp',  ngan: 'Bếp',  icon: 'bep',  alias: ['bếp', 'thiết bị bếp', 'nhà bếp'] },
    { key: 'son',  ten: 'Sơn nước',          ngan: 'Sơn',  icon: 'son',  alias: ['sơn'] },
    { key: 'ngoi', ten: 'Ngói',              ngan: 'Ngói', icon: 'ngoi', alias: ['ngói lợp'] },
    { key: 'keo',  ten: 'Keo & vữa',         ngan: 'Keo',  icon: 'keo',  alias: ['keo', 'keo dán gạch', 'keo chà ron', 'bột chà ron', 'vữa'] }
  ]
};
