// ============================================================
// ĐƠN HÀNG (GĐ1): đại lý gửi đơn từ app -> lưu Sheet -> báo Email + Telegram -> quản trị duyệt.
// Tab "Đơn hàng": mỗi đơn 1 dòng. Tab "Chi tiết đơn": mỗi mặt hàng 1 dòng (để lọc / báo cáo).
// Giá trong đơn do MÁY CHỦ tính lại từ bảng Giá (giá đại lý), không tin giá trình duyệt gửi lên.
// ============================================================
var TAB_DON = 'Đơn hàng', TAB_CT = 'Chi tiết đơn';
var TD_DON = ['Mã đơn', 'Ngày đặt', 'Trạng thái', 'Tài khoản', 'Đại lý / cửa hàng', 'SĐT', 'Hình thức', 'Địa chỉ giao', 'Ngày cần hàng',
  'Ghi chú khách', 'Số mặt hàng', 'Tổng tiền', 'Người xử lý', 'Cập nhật lúc', 'Ghi chú nội bộ', 'Chi tiết (máy)'];
var TD_CT = ['Mã đơn', 'Ngày đặt', 'Tài khoản', 'Mã hàng', 'Tên hàng', 'Số lượng', 'Đơn vị', 'Quy đổi', 'Đơn giá', 'Thành tiền'];
var TRANG_THAI = { moi: 'Mới – chờ duyệt', xacnhan: 'Đã xác nhận', danggiao: 'Đang giao', dagiao: 'Đã giao', huy: 'Đã hủy', tuchoi: 'Từ chối' };

function tabDon(ten, td) {
  var sh = layTab(ten, false);
  if (!sh) {
    sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet(ten);
    sh.getRange(1, 1, 1, td.length).setValues([td]).setFontWeight('bold').setBackground('#E3F2FD');
    sh.setFrozenRows(1);
  }
  return sh;
}

// Đơn vị mét vuông: "m²" (ký tự ²), "m2", "M2"…
function laM2(dvt) { return /^m\s*(2|²)$/i.test(String(dvt || '').trim()); }
// "4 viên/thùng · 1,44 m²/thùng" -> 1.44
function m2MoiThung(dg) {
  var m = String(dg || '').toLowerCase().match(/([\d.,]+)\s*m(?:²|2)\s*\/\s*th(?:ù|u)ng/);
  var v = m ? parseFloat(m[1].replace(',', '.')) : 0;
  return v > 0 ? v : 0;
}

function maDonMoi() {
  var ngay = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMdd'), p = PropertiesService.getScriptProperties();
  var k = 'SO_DON_' + ngay, n = Number(p.getProperty(k) || 0) + 1;
  p.setProperty(k, String(n));
  return 'HN' + ngay + '-' + ('00' + n).slice(-3);
}

// p.items = [{ma, sl}] ; sl = số thùng (hàng tính m² có quy cách thùng) hoặc số đơn vị.
function taoDon(p, ti) {
  var items = [];
  try { items = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []); } catch (e) { }
  items = items.filter(function (x) { return x && x.ma && Number(x.sl) > 0; });
  if (!items.length) return { status: 'error', msg: 'Đơn chưa có mặt hàng nào.' };
  if (items.length > 200) return { status: 'error', msg: 'Đơn tối đa 200 mặt hàng.' };
  var gia = quaDem('gia', docGia, TAB.gia);
  if (gia.status !== 'ok') return gia;
  var theoMa = {}; gia.data.forEach(function (g) { theoMa[g.ma] = g; });

  var dong = [], tong = 0;
  for (var i = 0; i < items.length; i++) {
    var g = theoMa[items[i].ma];
    if (!g) return { status: 'error', msg: 'Mã ' + items[i].ma + ' không còn trong bảng giá.' };
    var sl = Math.round(Number(items[i].sl) * 100) / 100, m2 = laM2(g.dvt) ? m2MoiThung(g.dg) : 0;
    var dongia = g.dl > 0 ? g.dl : g.ny; // giá đại lý, chưa có thì giá niêm yết
    var luong = m2 ? Math.round(sl * m2 * 100) / 100 : sl;
    var tien = Math.round(luong * dongia);
    tong += tien;
    dong.push({ ma: g.ma, ten: g.tenGoc || g.ten, sl: sl, dv: m2 ? 'thùng' : (g.dvt || ''), qd: m2 ? luong + ' m²' : '', dongia: dongia, tien: tien, dvGia: g.dvt || '' });
  }
  var u = thongTinUser(ti.user);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ma = maDonMoi(), luc = new Date();
    var don = {
      ma: ma, ngay: luc.toISOString(), tt: 'moi', user: ti.user, ten: chu(p.tenKH) || u.cty || u.ten || ti.user, sdt: chu(p.sdt) || u.sdt,
      hinhThuc: p.hinhThuc === 'nhan' ? 'Nhận tại kho' : 'Giao tận nơi', diaChi: chu(p.diaChi) || u.diaChi, ngayCan: chu(p.ngayCan), ghiChu: chu(p.ghiChu).slice(0, 500),
      tong: tong, items: dong
    };
    tabDon(TAB_DON, TD_DON).appendRow([ma, luc, TRANG_THAI.moi, ti.user, don.ten, "'" + don.sdt, don.hinhThuc, don.diaChi, don.ngayCan, don.ghiChu,
      dong.length, tong, '', luc, '', JSON.stringify(dong)]);
    var ct = tabDon(TAB_CT, TD_CT), rows = dong.map(function (d) { return [ma, luc, ti.user, d.ma, d.ten, d.sl, d.dv, d.qd, d.dongia, d.tien]; });
    ct.getRange(ct.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally { lock.releaseLock(); }
  try { baoDonMoi(don); } catch (e) { Logger.log('Báo đơn lỗi: ' + e); }
  return { status: 'ok', ma: don.ma, tong: tong, msg: 'Đã gửi đơn ' + don.ma };
}

function thongTinUser(user) {
  try {
    var u = tabUsers(), c = u.c;
    for (var i = 1; i < u.rows.length; i++) {
      var r = u.rows[i];
      if (chu(r[c.user]).toLowerCase() !== user) continue;
      var o = function (k) { return c[k] === undefined ? '' : chu(r[c[k]]); };
      return { ten: o('ten'), cty: o('cty'), sdt: o('sdt'), diaChi: o('dc') };
    }
  } catch (e) { }
  return { ten: '', cty: '', sdt: '', diaChi: '' };
}

// Đọc đơn. loc: {user, tt}. Mới nhất trước.
function docDon(loc, gioiHan) {
  var sh = layTab(TAB_DON, false);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getValues(), c = timCot(rows[0], {
    ma: ['Mã đơn'], ngay: ['Ngày đặt'], tt: ['Trạng thái'], user: ['Tài khoản'], ten: ['Đại lý / cửa hàng'], sdt: ['SĐT'], ht: ['Hình thức'],
    dc: ['Địa chỉ giao'], can: ['Ngày cần hàng'], gc: ['Ghi chú khách'], so: ['Số mặt hàng'], tong: ['Tổng tiền'], xl: ['Người xử lý'],
    cn: ['Cập nhật lúc'], nb: ['Ghi chú nội bộ'], ct: ['Chi tiết (máy)']
  });
  var maTT = {}; Object.keys(TRANG_THAI).forEach(function (k) { maTT[TRANG_THAI[k]] = k; });
  var ds = [];
  for (var i = rows.length - 1; i >= 1 && ds.length < (gioiHan || 500); i--) {
    var r = rows[i], o = function (k) { return c[k] === undefined ? '' : r[c[k]]; };
    if (!chu(o('ma'))) continue;
    var tt = maTT[chu(o('tt'))] || 'moi';
    if (loc.user && chu(o('user')).toLowerCase() !== loc.user) continue;
    if (loc.tt && loc.tt !== tt) continue;
    var items = []; try { items = JSON.parse(o('ct') || '[]'); } catch (e) { }
    var d = o('ngay'), cn = o('cn');
    ds.push({ ma: chu(o('ma')), ngay: d instanceof Date ? d.toISOString() : chu(d), tt: tt, user: chu(o('user')), ten: chu(o('ten')), sdt: chu(o('sdt')),
      hinhThuc: chu(o('ht')), diaChi: chu(o('dc')), ngayCan: o('can') instanceof Date ? Utilities.formatDate(o('can'), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd') : chu(o('can')),
      ghiChu: chu(o('gc')), tong: Number(o('tong')) || 0, xuLy: chu(o('xl')), capNhat: cn instanceof Date ? cn.toISOString() : chu(cn),
      ghiChuNB: loc.noiBo ? chu(o('nb')) : '', items: items, _dong: i + 1 });
  }
  return ds;
}

function donCuaToi(ti) {
  return { status: 'ok', data: docDon({ user: ti.user }, 100).map(function (d) { delete d._dong; return d; }) };
}

// Quản trị / nhân viên xem tất cả.
function dsDon(p) {
  var ds = docDon({ tt: p.tt || '', noiBo: true }, Number(p.gioiHan) || 500);
  var dem = { moi: 0, xacnhan: 0, danggiao: 0, dagiao: 0, huy: 0, tuchoi: 0 };
  docDon({}, 5000).forEach(function (d) { dem[d.tt] = (dem[d.tt] || 0) + 1; });
  return { status: 'ok', data: ds.map(function (d) { delete d._dong; return d; }), dem: dem };
}

// Đổi trạng thái. Đại lý chỉ được tự hủy đơn của mình khi còn "Mới". Quản trị đổi tùy ý.
function capNhatDon(p, ti) {
  var tt = String(p.tt || '');
  if (!TRANG_THAI[tt]) return { status: 'error', msg: 'Trạng thái không hợp lệ.' };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var d = docDon({ noiBo: true }, 5000).filter(function (x) { return x.ma === chu(p.ma); })[0];
    if (!d) return { status: 'error', msg: 'Không thấy đơn ' + p.ma };
    var laAdmin = ti.role === 'admin';
    if (!laAdmin) {
      if (d.user !== ti.user || tt !== 'huy' || d.tt !== 'moi') return { status: 'error', msg: 'forbidden' };
    }
    var sh = layTab(TAB_DON, true), head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var col = function (ten) { return head.indexOf(ten) + 1; };
    sh.getRange(d._dong, col('Trạng thái')).setValue(TRANG_THAI[tt]);
    sh.getRange(d._dong, col('Người xử lý')).setValue(ti.user);
    sh.getRange(d._dong, col('Cập nhật lúc')).setValue(new Date());
    if (laAdmin && p.ghiChuNB !== undefined) sh.getRange(d._dong, col('Ghi chú nội bộ')).setValue(chu(p.ghiChuNB).slice(0, 500));
  } finally { lock.releaseLock(); }
  return { status: 'ok', msg: 'Đơn ' + p.ma + ': ' + TRANG_THAI[tt] };
}

// ---------- Báo đơn: Email + Telegram ----------
function tienVN(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }
function baoDonMoi(don) {
  var link = WEB_APP_PAGE + 'quan-tri.html#don=' + encodeURIComponent(don.ma);
  var dongCT = don.items.map(function (d) { return d.ma + ' – ' + d.sl + ' ' + d.dv + (d.qd ? ' (' + d.qd + ')' : '') + ' × ' + tienVN(d.dongia) + ' = ' + tienVN(d.tien); });
  var tieuDe = '🛒 Đơn mới ' + don.ma + ' – ' + don.ten + ' – ' + tienVN(don.tong);
  var dau = [tieuDe, 'Hình thức: ' + don.hinhThuc + (don.ngayCan ? ' · cần ngày ' + don.ngayCan : '')];
  if (don.diaChi) dau.push('Địa chỉ: ' + don.diaChi);
  if (don.sdt) dau.push('SĐT: ' + don.sdt);
  if (don.ghiChu) dau.push('Ghi chú: ' + don.ghiChu);
  var noiDung = dau.join('\n') + '\n\n' + dongCT.join('\n') + '\n\nDuyệt đơn: ' + link;
  var email = typeof EMAIL_BAO_DON === 'string' ? EMAIL_BAO_DON : '';
  if (email) {
    var html = '<div style="font:14px Arial"><h2 style="color:#0140FF">' + tieuDe.replace(/</g, '&lt;') + '</h2><p>' +
      [don.hinhThuc + (don.ngayCan ? ' · cần ngày ' + don.ngayCan : ''), don.diaChi, don.sdt, don.ghiChu].filter(String).map(function (x) { return String(x).replace(/</g, '&lt;'); }).join('<br>') +
      '</p><table border="1" cellpadding="6" style="border-collapse:collapse"><tr style="background:#E3F2FD"><th>Mã</th><th>Tên</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>' +
      don.items.map(function (d) { return '<tr><td>' + d.ma + '</td><td>' + String(d.ten).replace(/</g, '&lt;') + '</td><td>' + d.sl + ' ' + d.dv + (d.qd ? '<br><small>' + d.qd + '</small>' : '') + '</td><td align="right">' + tienVN(d.dongia) + '</td><td align="right">' + tienVN(d.tien) + '</td></tr>'; }).join('') +
      '<tr><td colspan="4" align="right"><b>Tổng</b></td><td align="right"><b>' + tienVN(don.tong) + '</b></td></tr></table>' +
      '<p><a href="' + link + '" style="background:#0140FF;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Mở trang quản trị để duyệt</a></p></div>';
    MailApp.sendEmail({ to: email, subject: tieuDe, body: noiDung, htmlBody: html, name: 'App Hiển Nga' });
  }
  guiTelegram(noiDung);
}
function guiTelegram(text) {
  var pr = PropertiesService.getScriptProperties(), tk = pr.getProperty('TELEGRAM_TOKEN'), chat = pr.getProperty('TELEGRAM_CHAT');
  if (!tk || !chat) return false;
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + tk + '/sendMessage', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 3900), disable_web_page_preview: true })
  });
  return r.getResponseCode() === 200;
}

// ---------- Cài đặt báo đơn (menu trên Sheet) ----------
function caiTelegram() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Telegram – bước 1/2', 'Dán mã bot (token) do @BotFather cấp, dạng 123456:ABC…', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var tk = a.getResponseText().trim();
  var b = ui.prompt('Telegram – bước 2/2', 'Nhắn 1 tin bất kỳ cho bot trên Telegram trước, rồi bấm OK (để trống ô này).\nHoặc dán sẵn Chat ID nếu đã biết.', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK) return;
  var chat = b.getResponseText().trim();
  if (!chat) {
    var res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + tk + '/getUpdates', { muteHttpExceptions: true }).getContentText() || '{}');
    var u = (res.result || []).slice(-1)[0];
    chat = u && (u.message || u.channel_post || {}).chat ? String((u.message || u.channel_post).chat.id) : '';
  }
  if (!chat) { ui.alert('Chưa lấy được Chat ID – hãy nhắn 1 tin cho bot rồi chạy lại.'); return; }
  var pr = PropertiesService.getScriptProperties();
  pr.setProperty('TELEGRAM_TOKEN', tk); pr.setProperty('TELEGRAM_CHAT', chat);
  ui.alert(guiTelegram('✅ App Hiển Nga đã nối Telegram – đơn mới sẽ báo vào đây.') ? 'Đã nối Telegram, kiểm tra tin nhắn thử.' : 'Không gửi được – kiểm tra lại mã bot.');
}
function thuBaoDon() {
  baoDonMoi({ ma: 'THU-000', ten: 'Đơn thử', sdt: '0900000000', hinhThuc: 'Giao tận nơi', diaChi: 'Địa chỉ thử', ngayCan: '', ghiChu: 'Đây là tin thử', tong: 1000000,
    items: [{ ma: 'GHT.BC6600T', ten: 'Gạch thử', sl: 2, dv: 'thùng', qd: '2.88 m²', dongia: 347222, tien: 1000000 }] });
  SpreadsheetApp.getUi().alert('Đã gửi báo đơn thử tới ' + (typeof EMAIL_BAO_DON === 'string' ? EMAIL_BAO_DON : '(chưa cài email)') + ' và Telegram (nếu đã nối).');
}
