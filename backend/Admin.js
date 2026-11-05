// ============================================================
// QUẢN TRỊ TRÊN SHEET: menu "📱 App", tạo tab, làm mới đệm.
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📱 App')
    .addItem('1. Khởi tạo các tab (chỉ tạo tab còn thiếu)', 'khoiTaoSheet')
    .addItem('2. Bật tự làm mới mỗi 15 phút', 'caiLamMoiTuDong')
    .addSeparator()
    .addItem('Xóa bộ nhớ đệm (app lấy dữ liệu mới ngay)', 'xoaDemCoBao')
    .addItem('Kiểm tra dữ liệu', 'kiemTraDuLieu')
    .addToUi();
}

// Sửa tab nào thì xóa đệm của tab đó – app thấy dữ liệu mới ở lần tải sau.
function onEdit(e) {
  try {
    var ten = e && e.range && e.range.getSheet().getName();
    if (ten === TAB.gia) {
      demXoa('gia');
      // Ngày cập nhật bảng giá – app hiện "Cập nhật dd/mm/yyyy" trên trang chủ.
      PropertiesService.getScriptProperties().setProperty('CAP_NHAT_GIA', new Date().toISOString());
    }
    else if (ten === TAB.anh) demXoa('anh');
    else if (ten === TAB.tonkho || ten === TAB.kho || ten === TAB.noima) demXoa('tonkho');
    else if (ten === TAB.users) CacheService.getScriptCache().remove('ds_khoa');
    else if (ten === TAB.thuongHieu) demXoa('th');
  } catch (err) { }
}

function khoiTaoTab(ten, tieuDe) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(ten)) return false;
  var sh = ss.insertSheet(ten);
  sh.getRange(1, 1, 1, tieuDe.length).setValues([tieuDe]).setFontWeight('bold').setBackground('#E3F2FD');
  sh.setFrozenRows(1);
  return true;
}

function khoiTaoSheet() {
  var moi = [];
  Object.keys(TIEU_DE).forEach(function (k) { if (khoiTaoTab(TAB[k], TIEU_DE[k])) moi.push(TAB[k]); });
  muoi();
  var msg = moi.length ? 'Đã tạo tab: ' + moi.join(', ') : 'Đủ tab rồi, không tạo thêm.';
  msg += '\n\nTạo tài khoản quản trị đầu tiên: ở tab "' + TAB.users + '" gõ Username, Họ tên, Vai trò = admin, ' +
    'và mật khẩu vào cột "Mật khẩu mới". Lần đăng nhập đầu máy chủ tự mã hóa rồi xóa ô đó.';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

// Sheet mới tinh thì tự tạo đủ tab, khỏi phải bấm menu. Chỉ khi Sheet TRỐNG HOÀN TOÀN (mọi tab đều rỗng):
// tab bị đổi tên, hay lỡ nhập nhầm file khác vào, vẫn báo lỗi rõ chứ không chèn tab trống lẫn vào dữ liệu.
function sheetTrong(ss) { return ss.getSheets().every(function (s) { return s.getLastRow() === 0; }); }
function khoiTaoLanDau() {
  var c = CacheService.getScriptCache();
  if (c.get('da_khoi_tao_2')) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (sheetTrong(ss)) {
    Object.keys(TIEU_DE).forEach(function (k) { if (k !== 'tonkho' || !SHEET_TON_RIENG()) khoiTaoTab(TAB[k], TIEU_DE[k]); });
    muoi();
  }
  try { khoiTaoSheetTon(); } catch (e) { }
  c.put('da_khoi_tao_2', '1', 3600);
}
function SHEET_TON_RIENG() { return typeof SHEET_TON_KHO_ID === 'string' && !!SHEET_TON_KHO_ID; }

// Sheet Tồn kho riêng: tạo tab "Tồn kho" (nếu Sheet đang trống) và tab "Hướng dẫn" cho người nhập kho.
function khoiTaoSheetTon() {
  if (!SHEET_TON_RIENG()) return;
  var ss = ssTon();
  if (sheetTrong(ss) && !ss.getSheetByName(TAB.tonkho)) {
    var sh = ss.getSheets()[0];
    sh.setName(TAB.tonkho);
    sh.getRange(1, 1, 1, 5).setValues([TIEU_DE_TON]).setFontWeight('bold').setBackground('#E3F2FD');
    sh.setFrozenRows(1);
    sh.setColumnWidth(3, 380);
  }
  if (!ss.getSheetByName(TAB_HUONG_DAN_TON)) {
    var hd = ss.insertSheet(TAB_HUONG_DAN_TON);
    hd.getRange(1, 1, HUONG_DAN_TON.length, 2).setValues(HUONG_DAN_TON.map(function (d) { return [d, '']; }));
    hd.getRange(1, 1).setFontWeight('bold').setFontSize(13);
    hd.getRange(2, 2).setValue('(chưa đọc lần nào)').setFontColor('#1F8A3B').setFontWeight('bold');
    hd.setColumnWidth(1, 560); hd.setColumnWidth(2, 520);
  }
}

function xoaDem() {
  demXoa('gia'); demXoa('anh'); demXoa('tonkho'); demXoa('th');
  CacheService.getScriptCache().remove('ds_khoa');
}
function xoaDemCoBao() {
  xoaDem();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã xóa bộ nhớ đệm. App sẽ lấy dữ liệu mới.', 'App', 5);
}

// Chạy theo lịch: đọc sẵn dữ liệu vào đệm để app mở nhanh.
function warmCache() {
  xoaDem();
  quaDem('gia', docGia, TAB.gia);
  try { var g = quaDem('gia', docGia, TAB.gia); quaDem('anh', function () { return docAnh(g.data); }, layTabAnh, CACHE_GIAY_TON); } catch (e) { }
  try { quaDem('tonkho', docTonKho, function () { return layTabTon(false); }, CACHE_GIAY_TON); } catch (e) { }
}

function caiLamMoiTuDong() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'warmCache') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('warmCache').timeBased().everyMinutes(15).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã bật tự làm mới mỗi 15 phút.', 'App', 5);
}

// Báo nhanh: số mã, mã thiếu giá, mã tồn kho không khớp bảng giá.
function kiemTraDuLieu() {
  var dong = [];
  var g = docGia();
  if (g.status !== 'ok') dong.push('❌ Giá: ' + g.msg);
  else {
    var thieuGia = g.data.filter(function (p) { return !p.ny; }).length;
    var nhom = {};
    g.data.forEach(function (p) { nhom[p.nhom || '(trống)'] = (nhom[p.nhom || '(trống)'] || 0) + 1; });
    dong.push('✅ Giá: ' + g.count + ' mã' + (thieuGia ? ' (' + thieuGia + ' mã chưa có giá niêm yết)' : ''));
    dong.push('   Nhóm hàng: ' + Object.keys(nhom).map(function (k) { return k + ' ' + nhom[k]; }).join(' · '));
    if (!g.coGiaDL) dong.push('⚠️ Không thấy cột "Giá đại lý".');
  }
  try {
    var t = docTonKho();
    if (t.status !== 'ok') dong.push('❌ Tồn kho: ' + t.msg);
    else {
      var maGia = {};
      (g.data || []).forEach(function (p) { maGia[p.ma] = 1; });
      var lech = Object.keys(t.data).filter(function (m) { return !maGia[m]; });
      dong.push('✅ Tồn kho: ' + Object.keys(t.data).length + ' mã còn hàng');
      if (lech.length) dong.push('⚠️ ' + lech.length + ' mã tồn kho không có trong bảng giá, ví dụ: ' + lech.slice(0, 5).join(', '));
    }
  } catch (e) { dong.push('❌ Tồn kho: ' + e.message); }
  SpreadsheetApp.getUi().alert(dong.join('\n'));
}
