// ============================================================
// GĐ3: PHÂN QUYỀN NHÂN VIÊN + NHẬT KÝ THAO TÁC + BÁO CÁO
// Quản trị (admin) có mọi quyền. Nhân viên (nv) chỉ có các quyền ghi ở cột "Quyền" tab Users
// (quản trị bật/tắt trên trang quản trị → "Nhân viên & quyền"). Không có quyền nào = chỉ xem đơn.
// ============================================================
var QUYEN = {
  don: 'Duyệt đơn (xác nhận / từ chối / hủy)',
  giao: 'Kho & giao hàng (xuất kho, đang giao, đã giao)',
  chua: 'Duyệt chừa hàng / gia hạn / nhả hàng',
  coc: 'Ghi tiền cọc',
  ghichu: 'Ghi chú nội bộ',
  nhapgia: 'Nhập / sửa giá',
  sanpham: 'Thêm / sửa sản phẩm (mã mới, thông tin, ảnh)',
  nhapton: 'Nhập tồn kho (mở quyền sửa Sheet Tồn kho)',
  baocao: 'Xem báo cáo doanh số',
  nhatky: 'Xem nhật ký thao tác'
};
var TAB_NHAT_KY = 'Nhật ký';
var TD_NHAT_KY = ['Thời gian', 'Tài khoản', 'Vai trò', 'Hành động', 'Mã đơn', 'Chi tiết'];

function tachQuyen(v) {
  return String(v || '').toLowerCase().split(/[\s,;]+/).filter(function (q) { return QUYEN.hasOwnProperty(q); });
}
// { user: { role, quyen: [...] } } – đọc từ tab Users, đệm 1 giờ (xóa khi sửa tab Users / lưu tài khoản).
function dsTaiKhoan() {
  var c = CacheService.getScriptCache(), s = c.get('ds_tk');
  if (s != null) return JSON.parse(s);
  var ds = {};
  var u = tabUsers();
  for (var i = 1; i < u.rows.length; i++) {
    var r = u.rows[i], user = chu(r[u.c.user]).toLowerCase();
    if (!user) continue;
    ds[user] = { role: vaiTro(r[u.c.role]), quyen: u.c.quyen === undefined ? [] : tachQuyen(r[u.c.quyen]), gmail: u.c.gmail === undefined ? '' : chu(r[u.c.gmail]).toLowerCase() };
  }
  c.put('ds_tk', JSON.stringify(ds), 3600);
  return ds;
}
function xoaDemTaiKhoan() { var c = CacheService.getScriptCache(); c.remove('ds_khoa'); c.remove('ds_tk'); }
function quyenCua(role, user) {
  if (role === 'admin') return Object.keys(QUYEN);
  if (role !== 'nv') return [];
  try { var tk = dsTaiKhoan()[user]; return tk ? tk.quyen : []; } catch (e) { return []; }
}
function coQuyen(ti, q) { return !!ti && (ti.role === 'admin' || (ti.role === 'nv' && quyenCua('nv', ti.user).indexOf(q) >= 0)); }

// Quản trị bật/tắt quyền cho 1 nhân viên.
// p.gmail: tài khoản Google của nhân viên – có quyền "nhapton" thì được mở quyền SỬA Sheet Tồn kho.
function luuQuyen(p, ti) {
  var user = chu(p.username).toLowerCase(), q = tachQuyen(Array.isArray(p.quyen) ? p.quyen.join(',') : p.quyen);
  var gmail = chu(p.gmail).toLowerCase();
  if (gmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gmail)) return { status: 'error', msg: 'Gmail không hợp lệ.' };
  var u = tabUsers();
  if (u.c.quyen === undefined) return { status: 'error', msg: 'Tab Users chưa có cột "Quyền".' };
  for (var i = 1; i < u.rows.length; i++) {
    if (chu(u.rows[i][u.c.user]).toLowerCase() !== user) continue;
    if (vaiTro(u.rows[i][u.c.role]) !== 'nv') return { status: 'error', msg: 'Chỉ đặt quyền cho tài khoản nhân viên (nv).' };
    var cuQ = tachQuyen(u.rows[i][u.c.quyen]), cuMail = u.c.gmail === undefined ? '' : chu(u.rows[i][u.c.gmail]).toLowerCase();
    u.sh.getRange(i + 1, u.c.quyen + 1).setValue(q.join(', '));
    if (u.c.gmail !== undefined) u.sh.getRange(i + 1, u.c.gmail + 1).setValue(gmail);
    xoaDemTaiKhoan();
    var them = [];
    // Đồng bộ quyền sửa Sheet Tồn kho theo quyền "nhapton".
    if (SHEET_TON_RIENG()) {
      try {
        var ss = ssTon(), coCu = cuQ.indexOf('nhapton') >= 0 && cuMail, coMoi = q.indexOf('nhapton') >= 0 && gmail;
        if (coCu && (!coMoi || cuMail !== gmail)) { ss.removeEditor(cuMail); them.push('đã gỡ quyền sửa Sheet Tồn kho của ' + cuMail); }
        if (coMoi && (!coCu || cuMail !== gmail)) { ss.addEditor(gmail); them.push('đã mở quyền sửa Sheet Tồn kho cho ' + gmail); }
        if (q.indexOf('nhapton') >= 0 && !gmail) them.push('chưa nhập Gmail nên chưa mở được Sheet Tồn kho');
      } catch (e) { them.push('lỗi chia sẻ Sheet Tồn kho: ' + e.message); }
    }
    ghiNhatKy(ti, 'Đổi quyền nhân viên', '', user + ': ' + (q.length ? q.map(function (k) { return QUYEN[k]; }).join('; ') : 'chỉ xem') + (them.length ? ' · ' + them.join(' · ') : ''));
    return { status: 'ok', msg: 'Đã lưu quyền cho ' + user + (them.length ? ' – ' + them.join(', ') : '') };
  }
  return { status: 'error', msg: 'Không thấy tài khoản ' + user };
}
function dsNhanVien() {
  var ds = listUsers().data.filter(function (x) { return x.role === 'nv' || x.role === 'admin'; });
  var tk = dsTaiKhoan();
  ds.forEach(function (x) { var t = tk[x.username.toLowerCase()] || {}; x.quyen = x.role === 'admin' ? Object.keys(QUYEN) : (t.quyen || []); x.gmail = t.gmail || ''; });
  return { status: 'ok', data: ds, tenQuyen: QUYEN };
}

// ---------- Nhật ký ----------
function ghiNhatKy(ti, hanhDong, maDon, chiTiet) {
  try {
    var sh = layTab(TAB_NHAT_KY, false);
    if (!sh) {
      sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet(TAB_NHAT_KY);
      sh.getRange(1, 1, 1, TD_NHAT_KY.length).setValues([TD_NHAT_KY]).setFontWeight('bold').setBackground('#E3F2FD');
      sh.setFrozenRows(1); sh.setColumnWidth(6, 480);
    }
    sh.appendRow([new Date(), ti ? ti.user : '', ti ? ti.role : '', hanhDong, maDon || '', String(chiTiet || '').slice(0, 1000)]);
  } catch (e) { Logger.log('Nhật ký lỗi: ' + e); }
}
// p.maDon: lịch sử 1 đơn (ai vào trang quản trị cũng xem được); còn lại cần quyền "nhatky".
function nhatKy(p) {
  var sh = layTab(TAB_NHAT_KY, false);
  if (!sh || sh.getLastRow() < 2) return { status: 'ok', data: [] };
  var n = sh.getLastRow() - 1, doc = Math.min(n, 5000);
  var rows = sh.getRange(n - doc + 2, 1, doc, TD_NHAT_KY.length).getValues();
  var ma = chu(p.maDon), user = chu(p.user).toLowerCase(), q = norm(p.q || ''), ds = [], gh = Math.min(Number(p.gioiHan) || 300, 1000);
  for (var i = rows.length - 1; i >= 0 && ds.length < gh; i--) {
    var r = rows[i];
    if (ma && chu(r[4]) !== ma) continue;
    if (user && chu(r[1]).toLowerCase() !== user) continue;
    if (q && norm(r.slice(1).join(' ')).indexOf(q) < 0) continue;
    ds.push({ luc: r[0] instanceof Date ? r[0].toISOString() : chu(r[0]), user: chu(r[1]), role: chu(r[2]), hd: chu(r[3]), ma: chu(r[4]), ct: chu(r[5]) });
  }
  return { status: 'ok', data: ds };
}

// ---------- Báo cáo ----------
// p.tu, p.den: 'yyyy-MM-dd' (theo ngày đặt, giờ VN). Doanh số = đơn Đã xác nhận / Đang giao / Đã giao.
function baoCao(p) {
  var tu = chu(p.tu), den = chu(p.den);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den)) return { status: 'error', msg: 'Chọn khoảng ngày.' };
  var nhom = {};
  try { var g = quaDem('gia', docGia, TAB.gia); if (g.status === 'ok') g.data.forEach(function (x) { nhom[x.ma] = x.nhom || 'Khác'; }); } catch (e) { }
  var BAN = ['xacnhan', 'danggiao', 'dagiao'];
  var kq = { soDon: 0, doanhSo: 0, daGiao: 0, choDuyet: 0, huy: 0, tuChoi: 0, soChua: 0, cocDaNhan: 0, theoTT: {}, theoNgay: {}, daiLy: {}, hang: {}, nhom: {} };
  docDon({}, 100000).forEach(function (d) {
    var ngay = Utilities.formatDate(new Date(d.ngay), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
    if (ngay < tu || ngay > den) return;
    kq.soDon++;
    kq.theoTT[d.tt] = (kq.theoTT[d.tt] || 0) + 1;
    if (d.tt === 'moi') kq.choDuyet++;
    if (d.tt === 'huy') kq.huy++;
    if (d.tt === 'tuchoi') kq.tuChoi++;
    if (d.loai === 'chua') kq.soChua++;
    kq.cocDaNhan += d.daCoc || 0;
    var n = kq.theoNgay[ngay] || (kq.theoNgay[ngay] = { ngay: ngay, soDon: 0, doanhSo: 0 });
    n.soDon++;
    if (BAN.indexOf(d.tt) < 0) return;
    kq.doanhSo += d.tong; n.doanhSo += d.tong;
    if (d.tt === 'dagiao') kq.daGiao += d.tong;
    var dl = kq.daiLy[d.user] || (kq.daiLy[d.user] = { user: d.user, ten: d.ten, soDon: 0, doanhSo: 0 });
    dl.soDon++; dl.doanhSo += d.tong;
    d.items.forEach(function (x) {
      var h = kq.hang[x.ma] || (kq.hang[x.ma] = { ma: x.ma, ten: x.ten, dv: x.dv, sl: 0, tien: 0 });
      h.sl = lam3(h.sl + (Number(x.sl) || 0)); h.tien += x.tien || 0;
      var tn = nhom[x.ma] || 'Khác', nn = kq.nhom[tn] || (kq.nhom[tn] = { nhom: tn, tien: 0 });
      nn.tien += x.tien || 0;
    });
  });
  var sx = function (o, k) { return Object.keys(o).map(function (x) { return o[x]; }).sort(function (a, b) { return b[k] - a[k]; }); };
  kq.theoNgay = Object.keys(kq.theoNgay).sort().map(function (x) { return kq.theoNgay[x]; });
  kq.daiLy = sx(kq.daiLy, 'doanhSo').slice(0, 30);
  kq.hang = sx(kq.hang, 'tien').slice(0, 30);
  kq.nhom = sx(kq.nhom, 'tien');
  return { status: 'ok', tu: tu, den: den, data: kq };
}

// ---------- Nhập / sửa giá (quyền "nhapgia") – ghi thẳng vào tab Giá, nhân viên không cần mở Sheet chính ----------
function suaGia(p, ti) {
  var ma = chu(p.ma);
  if (!ma) return { status: 'error', msg: 'Thiếu mã hàng.' };
  var sh = layTab(TAB.gia, true), rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) return { status: 'error', msg: 'Tab Giá không có cột Mã hàng.' };
  var c = timCot(rows[hi], COT_GIA), doi = [];
  for (var i = hi + 1; i < rows.length; i++) {
    if (chu(rows[i][c.ma]) !== ma) continue;
    [['ny', 'Giá niêm yết'], ['dl', 'Giá đại lý']].forEach(function (k) {
      var v = p[k[0]];
      if (v === undefined || v === '' || v === null || c[k[0]] === undefined) return;
      var moi = Math.max(0, Math.round(Number(String(v).replace(/[^\d]/g, '')) || 0)), cu = soTien(rows[i][c[k[0]]]);
      if (moi === cu) return;
      sh.getRange(i + 1, c[k[0]] + 1).setValue(moi);
      doi.push(k[1] + ' ' + tienVN(cu) + ' → ' + tienVN(moi));
    });
    if (!doi.length) return { status: 'ok', msg: 'Không có gì thay đổi' };
    demXoa('gia');
    PropertiesService.getScriptProperties().setProperty('CAP_NHAT_GIA', new Date().toISOString());
    ghiNhatKy(ti, 'Sửa giá', '', ma + ': ' + doi.join(' · '));
    return { status: 'ok', msg: 'Đã lưu giá ' + ma };
  }
  return { status: 'error', msg: 'Không thấy mã ' + ma + ' trong tab Giá.' };
}
// ---------- Tồn kho (quyền "nhapton") ----------
function thongTinTon() {
  var kq = { status: 'ok', link: '', tab: '', luc: '' };
  try { var ss = ssTon(); kq.link = ss.getUrl(); var sh = layTabTon(false); kq.tab = sh ? sh.getName() + ' (' + Math.max(0, sh.getLastRow() - 1) + ' dòng)' : ''; } catch (e) { kq.loi = e.message; }
  try { var hd = ssTon().getSheetByName(TAB_HUONG_DAN_TON); if (hd) kq.luc = chu(hd.getRange(2, 2).getValue()); } catch (e) { }
  return kq;
}
function lamMoiTon(ti) { demXoa('tonkho'); demXoa('giu'); ghiNhatKy(ti, 'Làm mới tồn kho', '', ''); return { status: 'ok', msg: 'App sẽ đọc tồn kho mới ở lần tải tới' }; }
