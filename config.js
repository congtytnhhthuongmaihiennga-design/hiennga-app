// ============================================================
// CẤU HÌNH APP – mọi thông số riêng của khách nằm ở file này.
// Repo public: KHÔNG để giá, tồn kho, mật khẩu ở đây. Dữ liệu nằm trong
// Google Sheet, Apps Script chỉ trả giá đại lý / tồn kho khi đã đăng nhập.
// ============================================================
window.APP_CONFIG = {
  TEN_APP: 'Hiển Nga',
  TEN_DAY_DU: 'Công ty TNHH Thương mại Hiển Nga',
  KHAU_HIEU: 'Vật liệu xây dựng · Long Xuyên, An Giang',
  LOGO: 'img/logo-mark.png',      // biểu tượng (ô nhỏ trên thanh đầu) – để trống thì hiện chữ viết tắt
  LOGO_DAY_DU: 'img/logo.png',    // logo có chữ (màn đăng nhập)
  VIET_TAT: 'HN',
  // Màu logo gốc là xanh #0140FF và đỏ #FE0000; đỏ đậm hơn một chút để chữ trắng trên nền đỏ dễ đọc.
  MAU_CHINH: '#0140FF',
  MAU_DAM: '#0030C2',
  MAU_NHAN: '#E00000',

  // Địa chỉ Web App Apps Script. Để trống (hoặc thêm ?demo=1) = chạy dữ liệu dùng thử.
  APPS_URL: 'https://script.google.com/macros/s/AKfycby2E2AXuXTAKxf2VfPi9LmEcJYyOkaUDFB0aY6vjQXn-qtP4qjgG_yD6_w00q7NVteI/exec',
  // Khóa gắn theo mọi yêu cầu, khớp APP_KEY trong backend/Config.js.
  APP_KEY: 'aMaqlb4vNcw0G6oqMEgK5ULv2z8S',

  // Nút "Hỏi Zalo" / "Gọi đặt hàng" và dòng "Quên mật khẩu".
  LIEN_HE_TEN: 'Hiển Nga',
  LIEN_HE_SDT: '0939182288',
  // Thông tin công ty (lấy từ trang Facebook + bảng hiệu cửa hàng). Để trống mục nào thì app ẩn mục đó.
  DIA_CHI: '18/2E Trần Hưng Đạo, TP. Long Xuyên, An Giang',
  EMAIL: 'giakhang.ag@gmail.com',
  FACEBOOK: 'https://www.facebook.com/profile.php?id=100063506084558',
  WEBSITE: '',              // noithathiennga.vn – tạm để trống vì trang đang không truy cập được
  NGANH_HANG: 'Gạch ốp lát · Thiết bị vệ sinh · Thiết bị nhà bếp · Sơn nước · Trang trí nội thất',

  // Logo thương hiệu (tên khớp cột "Hãng", không phân biệt dấu/hoa thường). Chỉ để logo đã kiểm tra đúng
  // từ trang chính thức của hãng; hãng không có ở đây thì app hiện chữ.
  LOGO_HANG: {
    'Đồng Tâm': 'img/hang/dongtam.png',
    'Inax': 'img/hang/inax.png',
    'TOTO': 'img/hang/toto.png',
    'American Standard': 'img/hang/american-standard.webp',
    'Viglacera': 'img/hang/viglacera.png',
    'Yale': 'img/hang/yale.png',
    'CMC': 'img/hang/cmc.png',
    'Caesar': 'img/hang/caesar.png',
    'Cotto': 'img/hang/cotto.png',
    'Malloca': 'img/hang/malloca.png',
    'Esslinger': 'img/hang/esslinger.png'
  },
  // Logo / tên đầy đủ trong tab "Thương hiệu" của Google Sheet được ưu tiên hơn danh sách trên.

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
