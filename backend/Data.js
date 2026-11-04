// ============================================================
// ĐỌC DỮ LIỆU: Giá, Ảnh, Tồn kho. Mọi cột đọc theo TÊN tiêu đề,
// chèn/đổi thứ tự cột trên Sheet vẫn chạy đúng.
// ============================================================

function docGia() {
  var rows = layTab(TAB.gia, true).getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) return { status: 'error', msg: 'Tab "' + TAB.gia + '" không có cột "Mã hàng".' };
  var c = timCot(rows[hi], COT_GIA);
  var thieu = ['ma', 'ny'].filter(function (k) { return c[k] === undefined; });
  if (thieu.length) return { status: 'error', msg: 'Tab "' + TAB.gia + '" thiếu cột: ' + thieu.map(function (k) { return COT_GIA[k][0]; }).join(', ') };
  function o(r, k) { return c[k] === undefined ? '' : chu(r[c[k]]); }
  var an = ['khong', 'no', '0', 'an', 'false'];
  var data = [], daCo = {};
  for (var i = hi + 1; i < rows.length; i++) {
    var r = rows[i], ma = o(r, 'ma');
    if (!ma || daCo[ma]) continue;
    if (c.hien !== undefined && an.indexOf(norm(r[c.hien])) >= 0) continue;
    daCo[ma] = 1;
    data.push({
      ma: ma, hang: o(r, 'hang'), nhom: o(r, 'nhom'), ten: o(r, 'ten'), kc: o(r, 'kc'),
      loai: o(r, 'loai'), dvt: o(r, 'dvt'), dg: o(r, 'dg'),
      ny: soTien(r[c.ny]), dl: c.dl === undefined ? 0 : soTien(r[c.dl]), gc: o(r, 'gc'),
      mau: o(r, 'mau'), congNang: o(r, 'congNang'), tinhNang: o(r, 'tinhNang'),
      hoaVan: o(r, 'hoaVan'), men: o(r, 'men'), dungTich: o(r, 'dungTich')
    });
  }
  return { status: 'ok', count: data.length, coGiaDL: c.dl !== undefined, data: data, luc: new Date().toISOString() };
}

function docAnh() {
  var sh = layTab(TAB.anh, false);
  if (!sh) return { status: 'ok', data: {} };
  var rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_GIA.ma);
  if (hi < 0) return { status: 'ok', data: {} };
  var iMa = timCot(rows[hi], { ma: COT_GIA.ma }).ma, cotAnh = [];
  rows[hi].forEach(function (h, i) { if (i !== iMa && norm(h).indexOf('anh') === 0) cotAnh.push(i); });
  var data = {};
  for (var r = hi + 1; r < rows.length; r++) {
    var ma = chu(rows[r][iMa]);
    if (!ma) continue;
    var ds = cotAnh.map(function (i) { return linkAnh(rows[r][i]); }).filter(String);
    if (ds.length) data[ma] = ds;
  }
  return { status: 'ok', data: data };
}

// Nhóm giao theo kho (tab "Kho"): nhanh = có hàng ngay, mai = mai có hàng, cho = chờ đặt.
function nhomGiao(s) {
  var k = norm(s);
  if (!k || k.indexOf('ngay') >= 0 || k.indexOf('nhanh') >= 0) return 'nhanh';
  if (k.indexOf('mai') >= 0) return 'mai';
  return 'cho';
}

function docTonKho() {
  var sh = layTab(TAB.tonkho, true);
  var rows = sh.getDataRange().getValues();
  var hi = timDongTieuDe(rows, COT_TON.ma);
  if (hi < 0) return { status: 'error', msg: 'Tab "' + TAB.tonkho + '" không có cột "Mã hàng" – kiểm tra đã dán đúng bản xuất từ phần mềm kho chưa.' };
  var c = timCot(rows[hi], COT_TON);
  if (c.sl === undefined) return { status: 'error', msg: 'Tab "' + TAB.tonkho + '" thiếu cột "Số lượng".' };

  // Nối mã tồn kho -> mã hàng (chỉ khi 2 file dùng mã khác nhau).
  var noi = {}, shN = layTab(TAB.noima, false);
  if (shN) shN.getDataRange().getValues().slice(1).forEach(function (r) { if (chu(r[0]) && chu(r[1])) noi[chu(r[0])] = chu(r[1]); });
  // Kho -> nhóm giao.
  var kho = {}, shK = layTab(TAB.kho, false);
  if (shK) shK.getDataRange().getValues().slice(1).forEach(function (r) { if (chu(r[0])) kho[norm(r[0])] = nhomGiao(r[1]); });

  var data = {};
  for (var i = hi + 1; i < rows.length; i++) {
    var r = rows[i], maGoc = chu(r[c.ma]);
    if (!maGoc) continue;
    var sl = soLuong(r[c.sl]);
    if (sl <= 0) continue;
    var ma = noi[maGoc] || maGoc;
    var tenKho = c.kho === undefined ? 'Kho' : (chu(r[c.kho]) || 'Kho');
    var nhom = kho[norm(tenKho)] || 'nhanh';
    var d = data[ma] || (data[ma] = { tong: 0, dvt: c.dvt === undefined ? '' : chu(r[c.dvt]), tier: { nhanh: 0, mai: 0, cho: 0 }, kho: {} });
    d.tong += sl; d.tier[nhom] += sl;
    var k = d.kho[tenKho] || (d.kho[tenKho] = { ten: tenKho, nhom: nhom, tong: 0, lo: [] });
    k.tong += sl;
    var so = c.lo === undefined ? '' : chu(r[c.lo]);
    if (so) k.lo.push({ so: so, sl: sl });
  }
  Object.keys(data).forEach(function (ma) {
    var d = data[ma];
    d.kho = Object.keys(d.kho).map(function (t) { return d.kho[t]; }).sort(function (a, b) { return b.tong - a.tong; });
  });
  return { status: 'ok', data: data, luc: new Date().toISOString() };
}

// ---------- Trả cho app (đã lọc theo quyền) ----------
function getAll(ti) {
  var gia = quaDem('gia', docGia);
  if (gia.status !== 'ok') return gia;
  // Chưa đăng nhập: máy chủ KHÔNG gửi giá đại lý xuống trình duyệt.
  if (!ti) gia.data.forEach(function (p) { p.dl = 0; });
  var anh = quaDem('anh', docAnh);
  var capNhat = PropertiesService.getScriptProperties().getProperty('CAP_NHAT_GIA') || '';
  return { status: 'ok', data: gia.data, anh: anh.data || {}, luc: gia.luc, capNhat: capNhat, daDangNhap: !!ti };
}

function getTonKho(ti) {
  var res = quaDem('tonkho', docTonKho);
  if (res.status !== 'ok' || ti.role !== 'khachhang') return res;
  // Đại lý: không gửi tên kho, số lô, số thật – mọi số chặn trần (app hiện "50+").
  var cap = function (n) { return Math.min(Number(n) || 0, TRAN_TON_KHACH); };
  Object.keys(res.data).forEach(function (ma) {
    var d = res.data[ma];
    res.data[ma] = { tong: cap(d.tong), dvt: d.dvt, tier: { nhanh: cap(d.tier.nhanh), mai: cap(d.tier.mai), cho: cap(d.tier.cho) } };
  });
  return res;
}
