// ============================================================
// SỬA TỒN / KIỂM KHO – khi số trong phần mềm kho lệch với hàng thực tế.
// Không ai gõ vào Sheet Tồn kho (bị dán đè). Người có quyền "Nhập tồn kho" nhập SỐ ĐẾM THỰC TẾ trên trang quản trị:
// app ghi phần CHÊNH LỆCH (thực tế − phần mềm lúc sửa) vào tab "Điều chỉnh tồn" (Sheet chính) và cộng phần đó vào
// số của phần mềm mỗi lần đọc tồn -> bán thêm hàng thì vẫn đúng. Kế toán chỉnh xong trong phần mềm kho thì bấm
// "Đã chỉnh trên phần mềm" để kết thúc (không trừ 2 lần).
// ============================================================
var TAB_DC = 'Điều chỉnh tồn';
var TD_DC = ['Mã', 'Mã hàng', 'Tên hàng', 'Số phần mềm lúc sửa', 'Số thực tế', 'Chênh lệch', 'Đơn vị', 'Lý do', 'Ghi chú',
  'Người sửa', 'Lúc sửa', 'Trạng thái', 'Người xử lý', 'Lúc xử lý'];
var TT_DC = { dang: 'Đang áp dụng', pm: 'Đã chỉnh trên phần mềm', huy: 'Đã hủy', thay: 'Thay bằng lần sửa mới' };

function docDieuChinh() {
  var sh = layTab(TAB_DC, false);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getValues(), h = rows[0].map(chu), c = {};
  TD_DC.forEach(function (t) { c[t] = h.indexOf(t); });
  var maTT = {}; Object.keys(TT_DC).forEach(function (k) { maTT[TT_DC[k]] = k; });
  var iso = function (v) { return v instanceof Date ? v.toISOString() : chu(v); };
  var ds = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i], o = function (t) { return c[t] < 0 ? '' : r[c[t]]; };
    if (!chu(o('Mã'))) continue;
    ds.push({ id: chu(o('Mã')), ma: chu(o('Mã hàng')), ten: chu(o('Tên hàng')), pm: Number(o('Số phần mềm lúc sửa')) || 0, thuc: Number(o('Số thực tế')) || 0,
      lech: Number(o('Chênh lệch')) || 0, dv: chu(o('Đơn vị')), lyDo: chu(o('Lý do')), ghiChu: chu(o('Ghi chú')), nguoi: chu(o('Người sửa')), luc: iso(o('Lúc sửa')),
      tt: maTT[chu(o('Trạng thái'))] || 'dang', nguoiXL: chu(o('Người xử lý')), lucXL: iso(o('Lúc xử lý')), _dong: i + 1 });
  }
  return ds;
}
// Các điều chỉnh đang áp dụng (đệm 10 phút, xóa khi sửa).
function dieuChinhDangApDung() {
  var c = demLay('dctk'); if (c) return c;
  var ds = docDieuChinh().filter(function (x) { return x.tt === 'dang'; }).map(function (x) { delete x._dong; return x; });
  demLuu('dctk', ds, 600);
  return ds;
}
// Cộng phần chênh lệch vào tồn (gọi trong getTonKho, TRƯỚC khi trừ hàng đang giữ).
function apDungDieuChinh(data) {
  dieuChinhDangApDung().forEach(function (x) {
    var d = data[x.ma];
    if (!d) { if (x.lech <= 0) return; d = data[x.ma] = { tong: 0, dvt: x.dv, tier: { nhanh: 0, mai: 0, cho: 0 }, kho: [], ten: x.ten }; }
    var truoc = Number(d.tong) || 0; d.tong = lam3(Math.max(0, truoc + x.lech));
    var delta = d.tong - truoc;
    if (delta >= 0) d.tier.nhanh = lam3((d.tier.nhanh || 0) + delta);
    else { var con = -delta; ['nhanh', 'mai', 'cho'].forEach(function (t) { var b = Math.min(d.tier[t] || 0, con); d.tier[t] = lam3((d.tier[t] || 0) - b); con -= b; }); }
    d.dc = { id: x.id, pm: lam3(truoc), lech: x.lech, lyDo: x.lyDo, ghiChu: x.ghiChu, nguoi: x.nguoi, luc: x.luc };
  });
}
// Tồn theo phần mềm (Sheet Tồn kho) của 1 mã, chưa cộng điều chỉnh / chưa trừ hàng giữ.
function tonPhanMem(ma) {
  var t = quaDem('tonkho', docTonKho, function () { return layTabTon(false); }, CACHE_GIAY_TON);
  if (t.status !== 'ok') throw new Error(t.msg || 'Không đọc được tồn kho');
  var d = t.data[ma];
  return { sl: d ? lam3(d.tong) : 0, dv: d ? d.dvt : '', ten: d ? d.ten : '' };
}

function dsDieuChinh() {
  var ds = docDieuChinh().reverse().map(function (x) { delete x._dong; return x; });
  var dang = ds.filter(function (x) { return x.tt === 'dang'; });
  dang.forEach(function (x) { try { x.pmNay = tonPhanMem(x.ma).sl; } catch (e) { } });
  return { status: 'ok', dang: dang, lichSu: ds.filter(function (x) { return x.tt !== 'dang'; }).slice(0, 200) };
}

// p: { ma, thuc (số đếm thực tế), lyDo, ghiChu }
function luuDieuChinh(p, ti) {
  var ma = chu(p.ma), thuc = Number(String(p.thuc == null ? '' : p.thuc).replace(',', '.'));
  if (!ma) return { status: 'error', msg: 'Chọn mã hàng.' };
  if (!(thuc >= 0) || String(p.thuc).trim() === '') return { status: 'error', msg: 'Nhập số đếm thực tế (0 trở lên).' };
  if (!chu(p.lyDo)) return { status: 'error', msg: 'Chọn lý do lệch.' };
  var hang = hangChoNhap(); // mã có trong bảng giá / tồn kho (NhapKho.js)
  if (!hang[ma]) return { status: 'error', msg: 'Mã ' + ma + ' không có trong bảng giá / tồn kho.' };
  var pm = tonPhanMem(ma), lech = Math.round((thuc - pm.sl) * 1000) / 1000;
  if (Math.abs(lech) < 1e-9) return { status: 'error', msg: 'Số thực tế bằng số trên phần mềm (' + pm.sl + ') – không lệch.' };
  var sh = tabDon(TAB_DC, TD_DC), luc = new Date(), so;
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ds = docDieuChinh(), head = dauCot(sh), cTT = head.indexOf('Trạng thái') + 1, cNg = head.indexOf('Người xử lý') + 1, cLuc = head.indexOf('Lúc xử lý') + 1;
    ds.filter(function (x) { return x.ma === ma && x.tt === 'dang'; }).forEach(function (x) { // lần sửa mới thay lần cũ (không cộng dồn)
      sh.getRange(x._dong, cTT).setValue(TT_DC.thay); if (cNg) sh.getRange(x._dong, cNg).setValue("'" + ti.user); if (cLuc) sh.getRange(x._dong, cLuc).setValue(luc);
    });
    var dau = 'DC' + Utilities.formatDate(luc, 'Asia/Ho_Chi_Minh', 'yyMMdd') + '-', n = 0;
    ds.forEach(function (x) { if (x.id.indexOf(dau) === 0) n = Math.max(n, Number(x.id.slice(dau.length)) || 0); });
    so = dau + ('00' + (n + 1)).slice(-3);
    themDongTheoTen(sh, { 'Mã': so, 'Mã hàng': "'" + ma, 'Tên hàng': hang[ma].ten || pm.ten, 'Số phần mềm lúc sửa': pm.sl, 'Số thực tế': thuc, 'Chênh lệch': lech,
      'Đơn vị': pm.dv || hang[ma].dv, 'Lý do': chu(p.lyDo).slice(0, 100), 'Ghi chú': chu(p.ghiChu).slice(0, 300), 'Người sửa': "'" + ti.user, 'Lúc sửa': luc, 'Trạng thái': TT_DC.dang });
  } finally { lock.releaseLock(); }
  demXoa('dctk'); demXoa('giu');
  ghiNhatKy(ti, 'Sửa tồn (kiểm kho)', so, ma + ': phần mềm ' + pm.sl + ' → thực tế ' + thuc + ' (' + (lech > 0 ? '+' : '') + lech + ' ' + (pm.dv || '') + ') · ' + chu(p.lyDo) + (chu(p.ghiChu) ? ' · ' + chu(p.ghiChu) : ''));
  return { status: 'ok', ma: so, lech: lech, msg: 'Đã sửa tồn ' + ma + ': ' + pm.sl + ' → ' + thuc + ' (' + (lech > 0 ? '+' : '') + lech + ')' };
}

// p: { id, kieu: 'pm' (kế toán đã chỉnh phần mềm) | 'huy' (sửa nhầm) }
function xongDieuChinh(p, ti) {
  var id = chu(p.id), kieu = p.kieu === 'huy' ? 'huy' : 'pm';
  var lock = LockService.getScriptLock(), x; lock.waitLock(20000);
  try {
    x = docDieuChinh().filter(function (y) { return y.id === id; })[0];
    if (!x) return { status: 'error', msg: 'Không thấy lần sửa ' + id };
    if (x.tt !== 'dang') return { status: 'error', msg: 'Lần sửa này đã kết thúc (' + TT_DC[x.tt] + ').' };
    var sh = layTab(TAB_DC, true), head = dauCot(sh);
    sh.getRange(x._dong, head.indexOf('Trạng thái') + 1).setValue(TT_DC[kieu]);
    if (head.indexOf('Người xử lý') >= 0) sh.getRange(x._dong, head.indexOf('Người xử lý') + 1).setValue("'" + ti.user);
    if (head.indexOf('Lúc xử lý') >= 0) sh.getRange(x._dong, head.indexOf('Lúc xử lý') + 1).setValue(new Date());
  } finally { lock.releaseLock(); }
  demXoa('dctk'); demXoa('giu');
  ghiNhatKy(ti, kieu === 'pm' ? 'Lệch kho: đã chỉnh trên phần mềm' : 'Hủy sửa tồn', id, x.ma + ' (' + (x.lech > 0 ? '+' : '') + x.lech + ' ' + x.dv + ')');
  return { status: 'ok', msg: kieu === 'pm' ? 'Đã kết thúc – app theo số phần mềm cho ' + x.ma : 'Đã hủy lần sửa tồn ' + x.ma };
}
