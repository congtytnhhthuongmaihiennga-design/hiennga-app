// ============================================================
// CẤU HÌNH APP – mọi thông số riêng của khách nằm ở file này.
// Repo public: KHÔNG để giá, tồn kho, mật khẩu ở đây. Dữ liệu nằm trong
// Google Sheet, Apps Script chỉ trả giá đại lý / tồn kho khi đã đăng nhập.
// ============================================================
window.APP_CONFIG = {
  TEN_APP: 'Hiền Nga',
  TEN_DAY_DU: 'Công ty TNHH Thương mại Hiền Nga',
  KHAU_HIEU: 'Bảng giá & tồn kho',
  LOGO: '',                 // vd 'logo.png' – để trống thì hiện chữ viết tắt
  VIET_TAT: 'HN',
  MAU_CHINH: '#1F5FA8',     // màu tạm – đổi theo màu thương hiệu Hiền Nga
  MAU_DAM: '#123F75',

  // Địa chỉ Web App Apps Script (có sau khi Deploy). Để trống = chạy dữ liệu dùng thử.
  APPS_URL: 'https://script.google.com/macros/s/AKfycby2E2AXuXTAKxf2VfPi9LmEcJYyOkaUDFB0aY6vjQXn-qtP4qjgG_yD6_w00q7NVteI/exec',
  // Khóa gắn theo mọi yêu cầu, khớp APP_KEY trong backend/Config.js.
  APP_KEY: 'aMaqlb4vNcw0G6oqMEgK5ULv2z8S',

  LIEN_HE_TEN: '',          // vd 'Chị Nga'
  LIEN_HE_SDT: '',          // vd '0900000000' – dùng cho "Quên mật khẩu? Liên hệ"

  NGUONG_TON_KHACH: 50,     // đại lý thấy "50+" khi tồn > 50 (máy chủ đã chặn trần 51)

  // Nhóm hàng: "ten" khớp cột "Nhóm hàng" trong Sheet (không phân biệt dấu/hoa thường).
  // Thứ tự ở đây = thứ tự trên thanh dưới và trang chủ.
  NHOM_HANG: [
    { key: 'gach', ten: 'Gạch',             ngan: 'Gạch', icon: '🔲', alias: ['gạch ốp lát', 'gạch men'] },
    { key: 'ngoi', ten: 'Ngói',             ngan: 'Ngói', icon: '🏠', alias: [] },
    { key: 'keo',  ten: 'Keo',              ngan: 'Keo',  icon: '🧱', alias: ['keo dán gạch', 'keo chà ron', 'bột chà ron'] },
    { key: 'tbvs', ten: 'Thiết bị vệ sinh', ngan: 'TBVS', icon: '🚽', alias: ['tbvs', 'vệ sinh'] },
    { key: 'son',  ten: 'Sơn',              ngan: 'Sơn',  icon: '🪣', alias: ['sơn nước'] }
  ]
};
