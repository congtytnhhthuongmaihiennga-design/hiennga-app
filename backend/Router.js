// ============================================================
// ROUTER – điểm vào duy nhất của Web App. Phân quyền theo TOKEN.
// GET  ?action=...&k=APP_KEY&t=token[&callback=fn]
// POST body JSON {action, k, t, ...}  (đăng nhập, lưu tài khoản)
// ============================================================

function doGet(e) { return traVe(xuLy(e && e.parameter || {}), e && e.parameter && e.parameter.callback); }
function doPost(e) {
  var p = {};
  try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) { }
  return traVe(xuLy(p), '');
}

function traVe(obj, cb) {
  var json = JSON.stringify(obj);
  if (cb && /^[\w$.]{1,60}$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function xuLy(p) {
  try {
    if (p.k !== APP_KEY) return { status: 'error', msg: 'unauthorized' };
    khoiTaoLanDau();
    var a = p.action || '', ti = tokInfo(p.t);
    var laAdmin = !!(ti && ti.role === 'admin');
    var cam = { status: 'error', msg: 'forbidden' };
    switch (a) {
      // Chẩn đoán: tên tab + số dòng/cột (không có dữ liệu giá nào).
      case 'ping':
        var tenTab = function (ss) { return ss.getSheets().map(function (s) { return s.getName() + ' (' + s.getLastRow() + 'x' + s.getLastColumn() + ')'; }); };
        var ton;
        try { ton = SHEET_TON_RIENG() ? tenTab(ssTon()) : 'dùng tab trong Sheet chính'; } catch (e) { ton = 'LỖI: ' + e.message; }
        var anh;
        try { anh = typeof SHEET_ANH_ID === 'string' && SHEET_ANH_ID ? tenTab(SpreadsheetApp.openById(SHEET_ANH_ID)) : 'dùng tab trong Sheet chính'; } catch (e) { anh = 'LỖI: ' + e.message; }
        return { status: 'ok', role: ti ? ti.role : '', tabs: tenTab(SpreadsheetApp.getActiveSpreadsheet()), tonKho: ton, anh: anh };
      case 'getAll':    return getAll(ti);
      case 'getTonKho': return ti ? getTonKho(ti) : { status: 'error', msg: 'need_login' };
      case 'login':     return login(p);
      case 'logout':    xoaToken(p.t); return { status: 'ok' };
      case 'listUsers': return laAdmin ? listUsers() : cam;
      case 'luuUser':   return laAdmin ? luuUser(p) : cam;
      case 'clearCache': if (!laAdmin) return cam; xoaDem(); return { status: 'ok' };
      // Đơn hàng (GĐ1)
      case 'taoDon':     return ti ? taoDon(p, ti) : { status: 'error', msg: 'need_login' };
      case 'donCuaToi':  return ti ? donCuaToi(ti) : { status: 'error', msg: 'need_login' };
      case 'dsDon':      return ti && (ti.role === 'admin' || ti.role === 'nv') ? dsDon(p) : cam;
      case 'capNhatDon': return ti ? capNhatDon(p, ti) : { status: 'error', msg: 'need_login' };
      // Chừa hàng (GĐ2)
      case 'xinGiaHan':  return ti ? xinGiaHan(p, ti) : { status: 'error', msg: 'need_login' };
    }
    return { status: 'error', msg: 'Unknown action: ' + a };
  } catch (err) {
    return { status: 'error', msg: String(err && err.message || err) };
  }
}
