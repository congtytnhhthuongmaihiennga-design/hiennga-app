// ============================================================
// QUẢN TRỊ TRÊN SHEET: menu "Hiền Nga App", tạo tab, làm mới đệm.
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
    if (ten === TAB.gia) demXoa('gia');
    else if (ten === TAB.anh) demXoa('anh');
    else if (ten === TAB.tonkho || ten === TAB.kho || ten === TAB.noima) demXoa('tonkho');
    else if (ten === TAB.users) CacheService.getScriptCache().remove('ds_khoa');
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

function xoaDem() {
  demXoa('gia'); demXoa('anh'); demXoa('tonkho');
  CacheService.getScriptCache().remove('ds_khoa');
}
function xoaDemCoBao() {
  xoaDem();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã xóa bộ nhớ đệm. App sẽ lấy dữ liệu mới.', 'App', 5);
}

// Chạy theo lịch: đọc sẵn dữ liệu vào đệm để app mở nhanh.
function warmCache() {
  xoaDem();
  quaDem('gia', docGia);
  quaDem('anh', docAnh);
  try { quaDem('tonkho', docTonKho); } catch (e) { }
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
