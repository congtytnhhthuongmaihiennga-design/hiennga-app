// ============================================================
// SẢN PHẨM: thêm mã mới / sửa thông tin mã ngay trên trang quản trị (quyền "sanpham").
// Ghi thẳng vào tab Giá theo TÊN cột (cột chưa có thì tự thêm vào cuối, vd "Tên hiển thị").
// Kèm: link ảnh (ghi vào Sheet Hình ảnh) và "Mã bên kho" khi phần mềm kho dùng mã khác (tab "Nối mã").
// Không xóa dòng: muốn bỏ mã thì đánh dấu "Ẩn trên app" (cột Hiện trên app = Không).
// ============================================================
var TRUONG_SP = ['hang', 'nhom', 'ten', 'tenHien', 'kc', 'loai', 'dvt', 'dg', 'ny', 'dl', 'gc', 'mau', 'congNang', 'tinhNang', 'hoaVan', 'men', 'dungTich'];
var TEN_TRUONG = { hang: 'Hãng', nhom: 'Nhóm hàng', ten: 'Tên hàng', tenHien: 'Tên hiển thị', kc: 'Kích cỡ / Quy cách', loai: 'Loại', dvt: 'Đơn vị',
  dg: 'Đóng gói', ny: 'Giá niêm yết', dl: 'Giá đại lý', gc: 'Ghi chú', hien: 'Hiện trên app', mau: 'Màu', congNang: 'Công năng', tinhNang: 'Tính năng',
  hoaVan: 'Hoa văn', men: 'Men', dungTich: 'Dung tích' };
var LA_GIA = { ny: 1, dl: 1 };

function bangGiaTho() {
  var sh = layTab(TAB.gia, true), rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) throw new Error('Tab Giá không có cột Mã hàng.');
  return { sh: sh, rows: rows, hi: hi, c: timCot(rows[hi], COT_GIA) };
}
function timDongMa(b, ma) {
  var k = ma.toUpperCase();
  for (var i = b.hi + 1; i < b.rows.length; i++) if (chu(b.rows[i][b.c.ma]).toUpperCase() === k) return i;
  return -1;
}
function anGiaTri(k, v) { return LA_GIA[k] ? (soTien(v) || 0) : chu(v); }

// Đọc đủ trường 1 mã (kể cả mã đang ẩn) để mở form sửa.
function docSanPham(p) {
  var ma = chu(p.ma), b = bangGiaTho(), i = timDongMa(b, ma);
  if (i < 0) return { status: 'error', msg: 'Không thấy mã ' + ma };
  var r = b.rows[i], sp = { ma: chu(r[b.c.ma]) };
  TRUONG_SP.forEach(function (k) { sp[k] = b.c[k] === undefined ? (LA_GIA[k] ? 0 : '') : anGiaTri(k, r[b.c[k]]); });
  sp.an = b.c.hien !== undefined && ['khong', 'no', '0', 'an', 'false'].indexOf(norm(r[b.c.hien])) >= 0;
  sp.anh = linkAnhCua(sp.ma);
  sp.maKho = maKhoCua(sp.ma);
  return { status: 'ok', data: sp };
}

// p.moi = true: thêm mã mới. p.f = { trường: giá trị } (chỉ trường gửi lên mới được ghi). p.an, p.anh, p.maKho tùy chọn.
function luuSanPham(p, ti) {
  var ma = chu(p.ma), f = p.f || {};
  if (typeof f === 'string') { try { f = JSON.parse(f); } catch (e) { f = {}; } }
  if (!/^[^\s]{1,40}$/.test(ma)) return { status: 'error', msg: 'Mã hàng 1–40 ký tự, không có dấu cách.' };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  var nk = [];
  try {
    var b = bangGiaTho(), i = timDongMa(b, ma), moi = p.moi === true || p.moi === 'true';
    if (moi && i >= 0) return { status: 'error', msg: 'Mã ' + ma + ' đã có trong bảng giá – dùng "Sửa".' };
    if (!moi && i < 0) return { status: 'error', msg: 'Không thấy mã ' + ma };
    if (moi) {
      var thieu = ['ten', 'nhom', 'dvt'].filter(function (k) { return !chu(f[k]); });
      if (thieu.length) return { status: 'error', msg: 'Thiếu: ' + thieu.map(function (k) { return TEN_TRUONG[k]; }).join(', ') };
    }
    // Cột còn thiếu mà có dữ liệu -> thêm tiêu đề vào cuối hàng tiêu đề.
    var can = TRUONG_SP.filter(function (k) { return f[k] !== undefined && chu(f[k]) !== '' && b.c[k] === undefined; });
    if (p.an !== undefined && b.c.hien === undefined) can.push('hien');
    if (can.length) {
      var cot = b.rows[b.hi].filter(function (x) { return chu(x); }).length;
      can.forEach(function (k) { b.sh.getRange(b.hi + 1, cot + 1).setValue(TEN_TRUONG[k]).setFontWeight('bold'); b.c[k] = cot; cot++; });
    }
    var rong = Math.max(b.sh.getLastColumn(), b.rows[b.hi].length);
    var giaTri = function (k, v) { return LA_GIA[k] ? Math.max(0, Math.round(Number(String(v).replace(/[^\d]/g, '')) || 0)) : chu(v).slice(0, 500); };
    if (moi) {
      var dong = []; for (var j = 0; j < rong; j++) dong.push('');
      dong[b.c.ma] = ma;
      TRUONG_SP.forEach(function (k) { if (f[k] !== undefined && b.c[k] !== undefined) dong[b.c[k]] = giaTri(k, f[k]); });
      if (b.c.hien !== undefined) dong[b.c.hien] = p.an === true || p.an === 'true' ? 'Không' : '';
      // Ghi ngay sau dòng cuối có mã (giữ mã dạng chữ, vd "0123" không mất số 0).
      var cuoi = b.hi;
      for (var k2 = b.hi + 1; k2 < b.rows.length; k2++) if (chu(b.rows[k2][b.c.ma])) cuoi = k2;
      b.sh.getRange(cuoi + 2, b.c.ma + 1).setNumberFormat('@');
      b.sh.getRange(cuoi + 2, 1, 1, dong.length).setValues([dong]);
      nk.push(chu(f.ten) + ' · ' + chu(f.nhom) + ' · ' + chu(f.dvt) + (f.ny ? ' · NY ' + tienVN(giaTri('ny', f.ny)) : '') + (f.dl ? ' · ĐL ' + tienVN(giaTri('dl', f.dl)) : ''));
    } else {
      var r = b.rows[i];
      TRUONG_SP.forEach(function (k) {
        if (f[k] === undefined || b.c[k] === undefined) return;
        var moiV = giaTri(k, f[k]), cuV = anGiaTri(k, r[b.c[k]]);
        if (String(moiV) === String(cuV)) return;
        b.sh.getRange(i + 1, b.c[k] + 1).setValue(moiV);
        nk.push(TEN_TRUONG[k] + ': ' + (LA_GIA[k] ? tienVN(cuV) + ' → ' + tienVN(moiV) : '"' + cuV + '" → "' + moiV + '"'));
      });
      if (p.an !== undefined && b.c.hien !== undefined) {
        var an = p.an === true || p.an === 'true', dangAn = ['khong', 'no', '0', 'an', 'false'].indexOf(norm(r[b.c.hien])) >= 0;
        if (an !== dangAn) { b.sh.getRange(i + 1, b.c.hien + 1).setValue(an ? 'Không' : ''); nk.push(an ? 'ẩn khỏi app' : 'hiện lại trên app'); }
      }
    }
  } finally { lock.releaseLock(); }
  if (p.anh !== undefined) try { if (ghiLinkAnh(ma, chu(f.ten), chu(p.anh))) nk.push('link ảnh'); } catch (e) { nk.push('LỖI ghi ảnh: ' + e.message); }
  if (p.maKho !== undefined) try { if (ghiMaKho(ma, chu(p.maKho))) nk.push('mã bên kho: ' + (chu(p.maKho) || '(bỏ)')); } catch (e) { nk.push('LỖI ghi mã kho: ' + e.message); }
  if (!moi && !nk.length) return { status: 'ok', msg: 'Không có gì thay đổi' };
  demXoa('gia');
  PropertiesService.getScriptProperties().setProperty('CAP_NHAT_GIA', new Date().toISOString());
  ghiNhatKy(ti, moi ? 'Thêm sản phẩm' : 'Sửa sản phẩm', '', ma + ': ' + nk.join(' · '));
  return { status: 'ok', msg: (moi ? 'Đã thêm mã ' : 'Đã lưu mã ') + ma };
}

// ---------- Link ảnh (Sheet Hình ảnh) ----------
function bangAnh() {
  var sh = layTabAnh(); if (!sh || !sh.getLastRow()) return null;
  var rows = sh.getDataRange().getValues(), hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) return null;
  var iLink = -1; rows[hi].forEach(function (h, j) { if (iLink < 0 && laCotAnh(h)) iLink = j; });
  return { sh: sh, rows: rows, hi: hi, c: timCot(rows[hi], { ma: COT_GIA.ma, ten: COT_GIA.ten.concat(['Tên sản phẩm']) }), iLink: iLink };
}
function linkAnhCua(ma) {
  try {
    var a = bangAnh(); if (!a || a.iLink < 0) return '';
    for (var i = a.hi + 1; i < a.rows.length; i++) if (chu(a.rows[i][a.c.ma]).toUpperCase() === ma.toUpperCase()) return chu(a.rows[i][a.iLink]);
  } catch (e) { }
  return '';
}
function ghiLinkAnh(ma, ten, link) {
  var a = bangAnh();
  if (!a || a.iLink < 0) { if (!link) return false; throw new Error('Sheet Hình ảnh chưa có tab Ảnh – mở app 1 lần cho máy chủ tạo tab.'); }
  var cuoi = a.hi;
  for (var i = a.hi + 1; i < a.rows.length; i++) {
    if (chu(a.rows[i][a.c.ma])) cuoi = i;
    if (chu(a.rows[i][a.c.ma]).toUpperCase() !== ma.toUpperCase()) continue;
    if (chu(a.rows[i][a.iLink]) === link) return false;
    a.sh.getRange(i + 1, a.iLink + 1).setValue(link);
    demXoa('anh2'); return true;
  }
  if (!link) return false;
  a.sh.getRange(cuoi + 2, a.c.ma + 1).setNumberFormat('@').setValue(ma);
  if (a.c.ten !== undefined && ten) a.sh.getRange(cuoi + 2, a.c.ten + 1).setValue(ten);
  a.sh.getRange(cuoi + 2, a.iLink + 1).setValue(link);
  demXoa('anh2'); return true;
}

// ---------- Mã bên kho (tab "Nối mã": Mã tồn kho | Mã hàng) ----------
function maKhoCua(ma) {
  var sh = layTab(TAB.noima, false); if (!sh) return '';
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) if (chu(rows[i][1]) === ma) return chu(rows[i][0]);
  return '';
}
function ghiMaKho(ma, maKho) {
  var sh = layTab(TAB.noima, false);
  if (!sh) { if (!maKho) return false; khoiTaoTab(TAB.noima, TIEU_DE.noima); sh = layTab(TAB.noima, true); }
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (chu(rows[i][1]) !== ma) continue;
    if (chu(rows[i][0]) === maKho) return false;
    if (maKho) sh.getRange(i + 1, 1).setValue(maKho); else sh.deleteRow(i + 1);
    demXoa('tonkho'); return true;
  }
  if (!maKho || maKho === ma) return false;
  sh.appendRow([maKho, ma]);
  demXoa('tonkho'); return true;
}

// ============================================================
// MÃ CÓ TRONG TỒN KHO NHƯNG CHƯA CÓ TRONG BẢNG GIÁ -> thêm hàng loạt vào tab Giá.
// (App chỉ hiện sản phẩm có trong tab Giá; Sheet Tồn kho chỉ cho số tồn.)
// ============================================================
var DOAN_NHOM = [ // [từ khóa trong tên (không dấu), nhóm] – đoán sẵn, người dùng sửa được trước khi thêm
  // [từ khóa, tên nhóm mặc định, khóa để tìm đúng tên nhóm đang dùng trong bảng giá]
  [/gach|mosaic|ceramic|granite|porcelain/, 'Gạch ốp lát', 'gach'], [/ngoi /, 'Ngói', 'ngoi'], [/keo |cha ron|vua |bot tret/, 'Keo & vữa', 'keo'], [/ son |son nuoc|son lot|son phu/, 'Sơn nước', 'son'],
  [/bep |hut mui|chau rua|voi rua chen|lo nuong|may rua chen|lau dien|noi com|am sieu toc|noi chien/, 'Thiết bị nhà bếp', 'bep'], [/^ cua /, 'Cửa', 'cua'],
  [/lavabo|cau |bon cau|bet |sen |voi |tieu |bon tam|guong|ke |hop giay|thoat san|xit |vat ao|tu |phu kien|bo xa/, 'Thiết bị vệ sinh', 'vesinh']
];
function doanNhom(ten, nhomCo) {
  var t = ' ' + khongDauGiuCach(ten).replace(/[^a-z0-9]+/g, ' ') + ' ';
  for (var i = 0; i < DOAN_NHOM.length; i++) if (DOAN_NHOM[i][0].test(t)) {
    var k = DOAN_NHOM[i][2]; // dùng đúng tên nhóm đang có (vd "Gạch" thay cho "Gạch ốp lát")
    for (var j = 0; j < nhomCo.length; j++) if (khongDau(nhomCo[j]).indexOf(k) >= 0) return nhomCo[j];
    return DOAN_NHOM[i][1];
  }
  return '';
}
function khongDauGiuCach(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase(); }

function maKhoThieuGia() {
  var sh = layTabTon(true), rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_TON.ma);
  if (hi < 0) return { status: 'error', msg: 'Tab tồn kho không có cột Mã vật tư.' };
  var c = timCot(rows[hi], COT_TON);
  var noi = {}, shN = layTab(TAB.noima, false);
  if (shN) shN.getDataRange().getValues().slice(1).forEach(function (r) { if (chu(r[0]) && chu(r[1])) noi[chu(r[0])] = chu(r[1]); });
  var b = bangGiaTho(), coGia = {}, nhomCo = {}, hangCo = {};
  for (var i = b.hi + 1; i < b.rows.length; i++) {
    var m = chu(b.rows[i][b.c.ma]); if (m) coGia[m.toUpperCase()] = 1;
    if (b.c.nhom !== undefined && chu(b.rows[i][b.c.nhom])) nhomCo[chu(b.rows[i][b.c.nhom])] = 1;
    if (b.c.hang !== undefined && chu(b.rows[i][b.c.hang])) hangCo[chu(b.rows[i][b.c.hang])] = 1;
  }
  var dsNhom = Object.keys(nhomCo), dsHang = Object.keys(hangCo).filter(function (h) { return h.length >= 3; })
    .sort(function (x, y) { return y.length - x.length; });
  var kq = {}, thuTu = [];
  for (var k = hi + 1; k < rows.length; k++) {
    var r = rows[k], maGoc = chu(r[c.ma]); if (!maGoc) continue;
    var ma = noi[maGoc] || maGoc; if (coGia[ma.toUpperCase()]) continue;
    var d = kq[ma];
    if (!d) {
      var ten = c.ten === undefined ? '' : chu(r[c.ten]), dvtGoc = c.dvt === undefined ? '' : chu(r[c.dvt]);
      var qc = quyCachThung(dvtGoc, ten), kt = ten.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i), tk = khongDauGiuCach(ten);
      var hang = ''; for (var h = 0; h < dsHang.length; h++) if (tk.indexOf(khongDauGiuCach(dsHang[h])) >= 0) { hang = dsHang[h]; break; }
      d = kq[ma] = { ma: ma, ten: ten, dvtKho: dvtGoc, dvt: qc ? 'm²' : tenDonVi(dvtGoc), dg: qc && qc.m2 ? (qc.vt ? qc.vt + ' viên/thùng · ' : '') + String(qc.m2).replace('.', ',') + ' m²/thùng' : '',
        kc: kt ? kt[1].replace(',', '.') + 'x' + kt[2].replace(',', '.') : '', nhom: doanNhom(ten, dsNhom), hang: hang, ton: 0, kho: [] };
      thuTu.push(ma);
    }
    d.ton = lam3(d.ton + (soLuong(r[c.sl]) || 0));
    var tenKho = c.kho === undefined ? '' : chu(r[c.kho]); if (tenKho && d.kho.indexOf(tenKho) < 0) d.kho.push(tenKho);
  }
  return { status: 'ok', data: thuTu.map(function (m) { return kq[m]; }), nhom: dsNhom.sort(), hang: Object.keys(hangCo).sort() };
}

// p.ds = [{ ma, ten, nhom, hang, dvt, dg, kc }] – thêm 1 lần (tối đa 1000 mã), bỏ qua mã đã có.
function themHangLoat(p, ti) {
  var ds = p.ds; if (typeof ds === 'string') { try { ds = JSON.parse(ds); } catch (e) { ds = []; } }
  ds = (ds || []).filter(function (x) { return x && chu(x.ma); }).slice(0, 1000);
  if (!ds.length) return { status: 'error', msg: 'Chưa chọn mã nào.' };
  var thieu = ds.filter(function (x) { return !chu(x.ten) || !chu(x.nhom) || !chu(x.dvt); });
  if (thieu.length) return { status: 'error', msg: thieu.length + ' mã thiếu Tên / Nhóm hàng / Đơn vị, vd ' + chu(thieu[0].ma) };
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  var them = [], boQua = 0;
  try {
    var b = bangGiaTho(), co = {};
    for (var i = b.hi + 1; i < b.rows.length; i++) { var m = chu(b.rows[i][b.c.ma]); if (m) co[m.toUpperCase()] = 1; }
    var can = ['hang', 'nhom', 'ten', 'kc', 'dvt', 'dg'].filter(function (k) { return b.c[k] === undefined && ds.some(function (x) { return chu(x[k]); }); });
    if (can.length) {
      var cot = b.rows[b.hi].filter(function (x) { return chu(x); }).length;
      can.forEach(function (k) { b.sh.getRange(b.hi + 1, cot + 1).setValue(TEN_TRUONG[k]).setFontWeight('bold'); b.c[k] = cot; cot++; });
    }
    var rong = Math.max(b.sh.getLastColumn(), b.rows[b.hi].length), rows = [];
    ds.forEach(function (x) {
      var ma = chu(x.ma);
      if (co[ma.toUpperCase()] || !/^[^\s]{1,40}$/.test(ma)) { boQua++; return; }
      co[ma.toUpperCase()] = 1;
      var dong = []; for (var j = 0; j < rong; j++) dong.push('');
      dong[b.c.ma] = ma;
      ['hang', 'nhom', 'ten', 'kc', 'dvt', 'dg'].forEach(function (k) { if (b.c[k] !== undefined && chu(x[k])) dong[b.c[k]] = chu(x[k]).slice(0, 300); });
      rows.push(dong); them.push(ma);
    });
    if (rows.length) {
      var cuoi = b.hi;
      for (var k2 = b.hi + 1; k2 < b.rows.length; k2++) if (chu(b.rows[k2][b.c.ma])) cuoi = k2;
      b.sh.getRange(cuoi + 2, b.c.ma + 1, rows.length, 1).setNumberFormat('@');
      b.sh.getRange(cuoi + 2, 1, rows.length, rong).setValues(rows);
    }
  } finally { lock.releaseLock(); }
  if (them.length) {
    demXoa('gia'); demXoa('anh2');
    PropertiesService.getScriptProperties().setProperty('CAP_NHAT_GIA', new Date().toISOString());
    ghiNhatKy(ti, 'Thêm sản phẩm hàng loạt', '', them.length + ' mã từ tồn kho: ' + them.slice(0, 40).join(', ') + (them.length > 40 ? '…' : ''));
  }
  return { status: 'ok', them: them.length, boQua: boQua, msg: 'Đã thêm ' + them.length + ' mã vào bảng giá' + (boQua ? ' (bỏ qua ' + boQua + ' mã đã có / mã sai)' : '') };
}
