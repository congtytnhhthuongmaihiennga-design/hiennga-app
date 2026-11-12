// ============================================================
// SỔ TỒN KHO (Excel) – gom tồn kho + bảng giá + đơn đang giữ thành 1 file Excel gọn gàng cho chủ DN / kế toán / kho.
// Trang tính: 1. Tổng hợp  2. Theo nhóm hàng  3. Theo kho & lô  4. Cần nhập thêm  5. Hàng đang giữ  6. Cần kiểm tra
// Dùng: window.taoSoTonKho({ ton, gia, don, tonLuc, cty, nguong }) -> sách cho XLSX_HN.tao / taiVe
// ============================================================
(function () {
  'use strict';
  var TEN_TIER = { nhanh: 'Có ngay', mai: 'Mai có', cho: 'Chờ hàng' };
  var TEN_TT = { moi: 'Chờ duyệt', giu: 'Đang chừa hàng', xacnhan: 'Đã xác nhận', danggiao: 'Đang giao' };
  function lam(n, k) { var p = Math.pow(10, k || 2); return Math.round((Number(n) || 0) * p) / p; }
  function m2Thung(d, p) {
    if (d && d.m2) return Number(d.m2);
    var m = String((p && p.dg) || '').toLowerCase().match(/([\d.,]+)\s*m(?:²|2)\s*\/\s*th/);
    return m ? parseFloat(m[1].replace(',', '.')) || 0 : 0;
  }
  function laM2(dvt) { return /^m\s*(2|²)$/i.test(String(dvt || '').trim()); }
  function dd(d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  window.taoSoTonKho = function (o) {
    var ton = o.ton || {}, gia = o.gia || [], don = o.don || [], nguong = o.nguong || 5;
    var cty = o.cty || 'Công ty', luc = new Date(), tonLuc = o.tonLuc ? new Date(o.tonLuc) : null;
    var theoMa = {}; gia.forEach(function (p) { theoMa[p.ma] = p; });

    // ---------- Tính từng mã ----------
    var ds = Object.keys(ton).map(function (ma) {
      var d = ton[ma], p = theoMa[ma] || null;
      var thuc = d.tonGoc !== undefined ? d.tonGoc : d.tong, giu = d.giu || 0, ban = d.tong;
      var dg = p ? (p.dl > 0 ? p.dl : p.ny) : 0, m2 = m2Thung(d, p);
      // Giá gạch tính theo m², tồn tính theo thùng -> đổi ra m² trước khi nhân giá.
      var heSo = p && laM2(p.dvt) && d.dvt === 'thùng' && m2 ? m2 : 1;
      var tt = thuc <= 0 ? 'Hết hàng' : giu > thuc ? 'Giữ vượt tồn' : ban <= 0 ? 'Đã giữ hết' : ban <= nguong ? 'Sắp hết' : 'Còn hàng';
      return { ma: ma, p: p, d: d, ten: d.ten || (p ? (p.tenGoc || p.ten) : '') || '(không có tên)', nhom: p ? p.nhom : '(chưa có trong bảng giá)', hang: p ? p.hang : '', kc: p ? (p.kc || '') : '',
        dvt: d.dvt || '', thuc: lam(thuc, 3), giu: lam(giu, 3), ban: lam(ban, 3), tier: d.tier || {}, m2: m2,
        quyM2: d.dvt === 'thùng' && m2 ? lam(ban * m2) : '', dgia: dg, dvGia: p ? p.dvt : '', giaTri: Math.round(thuc * heSo * dg), tt: tt };
    });
    var thuTuTT = { 'Giữ vượt tồn': 0, 'Đã giữ hết': 1, 'Sắp hết': 2, 'Còn hàng': 3, 'Hết hàng': 4 };
    ds.sort(function (a, b) { return String(a.nhom).localeCompare(String(b.nhom), 'vi') || String(a.hang).localeCompare(String(b.hang), 'vi') || a.ma.localeCompare(b.ma); });
    var kieuTT = function (t) { return t === 'Còn hàng' ? 'ttXanh' : t === 'Sắp hết' || t === 'Đã giữ hết' ? 'ttCam' : 'ttDo'; };
    var tongGT = ds.reduce(function (s, x) { return s + x.giaTri; }, 0);
    var sapHet = ds.filter(function (x) { return x.tt === 'Sắp hết' || x.tt === 'Đã giữ hết'; });
    var hetTrongGia = gia.filter(function (p) { return !ton[p.ma]; });
    var vuot = ds.filter(function (x) { return x.tt === 'Giữ vượt tồn'; });
    var chuaGia = ds.filter(function (x) { return x.p && !(x.p.ny > 0); });
    var moCoi = ds.filter(function (x) { return !x.p; });
    var chanTrang = cty + ' – Sổ tồn kho xuất lúc ' + dd(luc);

    function dauTrang(ten, soCot, phu) {
      var cuoi = window.XLSX_HN.chuCot(soCot - 1);
      return { hang: [{ cao: 30, o: [{ v: ten, s: 'tieuDe' }] }, { o: [{ v: phu, s: 'phu' }] }], gop: ['A1:' + cuoi + '1', 'A2:' + cuoi + '2'] };
    }
    var phuChung = cty + ' · Xuất lúc ' + dd(luc) + (tonLuc ? ' · Tồn kho cập nhật ' + dd(tonLuc) : '');

    // ---------- 1. Tổng hợp ----------
    var COT1 = ['STT', 'Mã hàng', 'Tên vật tư', 'Nhóm hàng', 'Hãng', 'Kích cỡ', 'ĐVT tồn', 'Tồn thực', 'Đang giữ cho đơn', 'Được bán', 'Có ngay', 'Mai có', 'Chờ hàng', 'Được bán quy m²', 'Đơn giá (ĐL)', 'ĐVT giá', 'Giá trị tồn', 'Tình trạng'];
    var t1 = dauTrang('BÁO CÁO TỒN KHO', COT1.length, phuChung);
    var h1 = t1.hang;
    h1.push(null);
    h1.push({ o: [{ v: 'Số mã có tồn', s: 'oTheNhan' }, null, { v: ds.length, s: 'oTheSo' }, { v: 'Tổng giá trị tồn (theo giá ĐL)', s: 'oTheNhan' }, null, null, { v: tongGT, s: 'oTheSo' }, null,
      { v: 'Sắp hết / đã giữ hết', s: 'oTheNhan' }, null, null, { v: sapHet.length, s: 'oTheSo' }, null, { v: 'Mã có giá nhưng hết hàng', s: 'oTheNhan' }, null, null, { v: hetTrongGia.length, s: 'oTheSo' }] });
    t1.gop.push('A4:B4', 'D4:F4', 'G4:H4', 'I4:K4', 'L4:M4', 'N4:P4', 'Q4:R4');
    h1.push(null);
    var dong0 = h1.length + 1; // dòng tiêu đề bảng (1-based)
    h1.push({ cao: 34, o: COT1.map(function (c) { return { v: c, s: 'dau' }; }) });
    ds.forEach(function (x, i) {
      var sTT = kieuTT(x.tt);
      h1.push({ o: [{ v: i + 1, s: 'giua' }, { v: x.ma, s: 'chu' }, { v: x.ten, s: 'chu' }, { v: x.nhom, s: 'chu' }, { v: x.hang, s: 'chu' }, { v: x.kc, s: 'giua' }, { v: x.dvt, s: 'giua' },
        { v: x.thuc, s: 'so' }, { v: x.giu || '', s: x.giu ? 'soCam' : 'so' }, { v: x.ban, s: x.tt === 'Còn hàng' ? 'soXanh' : x.tt === 'Sắp hết' ? 'soCam' : 'soDo' },
        { v: lam(x.tier.nhanh || 0, 3), s: 'so' }, { v: lam(x.tier.mai || 0, 3), s: 'so' }, { v: lam(x.tier.cho || 0, 3), s: 'so' },
        { v: x.quyM2, s: 'so' }, { v: x.dgia || '', s: 'tien' }, { v: x.dvGia, s: 'giua' }, { v: x.giaTri || '', s: 'tien' }, { v: x.tt, s: sTT }] });
    });
    var d1 = dong0 + 1, d2 = dong0 + ds.length;
    // SUBTOTAL(109,…) = cộng theo dòng đang hiện -> lọc tới đâu, tổng theo tới đó.
    h1.push({ o: [{ v: 'TỔNG (theo dòng đang lọc)', s: 'tong' }, { v: '', s: 'tong' }, { f: 'SUBTOTAL(103,B' + d1 + ':B' + d2 + ')&" mã"', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' },
      { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' }, { v: '', s: 'tong' },
      { f: 'SUBTOTAL(109,Q' + d1 + ':Q' + d2 + ')', s: 'tongTien' }, { v: '', s: 'tong' }] });
    t1.gop.push('A' + (d2 + 1) + ':B' + (d2 + 1));
    h1.push(null);
    h1.push({ o: [{ v: 'Ghi chú: Tồn thực = số trong Sheet Tồn kho. Đang giữ = hàng của đơn chờ duyệt / chừa hàng / đã xác nhận / đang giao. Được bán = Tồn thực − Đang giữ. ' +
      'Giá trị tồn = Tồn thực × giá đại lý (gạch: đổi thùng ra m²). Ngưỡng "Sắp hết": được bán ≤ ' + nguong + '.', s: 'ghi' }] });
    t1.gop.push('A' + (d2 + 3) + ':R' + (d2 + 3));
    var trang = [{ ten: 'Tổng hợp', mauTab: 'FF0140FF', cot: [6, 18, 46, 18, 14, 10, 9, 10, 11, 10, 9, 9, 9, 11, 13, 8, 15, 14], hang: h1, gop: t1.gop,
      codinh: dong0, loc: 'A' + dong0 + ':R' + d2, inLap: dong0 + ':' + dong0, chanTrang: chanTrang }];

    // ---------- 2. Theo nhóm hàng ----------
    var nhom = {};
    ds.forEach(function (x) {
      var k = x.nhom || '(chưa có trong bảng giá)', n = nhom[k] || (nhom[k] = { ten: k, ma: 0, sap: 0, vuot: 0, giu: 0, gt: 0 });
      n.ma++; n.gt += x.giaTri; if (x.tt === 'Sắp hết' || x.tt === 'Đã giữ hết') n.sap++; if (x.tt === 'Giữ vượt tồn') n.vuot++; if (x.giu) n.giu++;
    });
    hetTrongGia.forEach(function (p) { var k = p.nhom || '(không nhóm)'; (nhom[k] || (nhom[k] = { ten: k, ma: 0, sap: 0, vuot: 0, giu: 0, gt: 0 })).het = ((nhom[k].het || 0) + 1); });
    var COT2 = ['Nhóm hàng', 'Số mã có tồn', 'Mã đang giữ cho đơn', 'Sắp hết / giữ hết', 'Giữ vượt tồn', 'Mã có giá nhưng hết hàng', 'Giá trị tồn', 'Tỷ trọng'];
    var t2 = dauTrang('TỒN KHO THEO NHÓM HÀNG', COT2.length, phuChung), h2 = t2.hang;
    h2.push(null); var n0 = h2.length + 1;
    h2.push({ cao: 34, o: COT2.map(function (c) { return { v: c, s: 'dau' }; }) });
    var dsNhom = Object.keys(nhom).map(function (k) { return nhom[k]; }).sort(function (a, b) { return b.gt - a.gt; });
    dsNhom.forEach(function (n, i) {
      var r = n0 + 1 + i;
      h2.push({ o: [{ v: n.ten, s: 'chu' }, { v: n.ma, s: 'soNguyen' }, { v: n.giu, s: 'soNguyen' }, { v: n.sap, s: n.sap ? 'soCam' : 'soNguyen' }, { v: n.vuot, s: n.vuot ? 'soDo' : 'soNguyen' },
        { v: n.het || 0, s: 'soNguyen' }, { v: n.gt, s: 'tien' }, { f: 'IF($G$' + (n0 + dsNhom.length + 1) + '=0,"",G' + r + '/$G$' + (n0 + dsNhom.length + 1) + ')', s: 'phanTram' }] });
    });
    var nc = n0 + dsNhom.length;
    h2.push({ o: [{ v: 'TỔNG', s: 'tong' }].concat(['B', 'C', 'D', 'E', 'F', 'G'].map(function (c) { return { f: 'SUM(' + c + (n0 + 1) + ':' + c + nc + ')', s: c === 'G' ? 'tongTien' : 'tongSo' }; }), [{ v: '', s: 'tong' }]) });
    trang.push({ ten: 'Theo nhóm hàng', mauTab: 'FF1F7A3A', cot: [34, 13, 15, 14, 12, 16, 18, 10], hang: h2, gop: t2.gop, codinh: n0, inDoc: true, chanTrang: chanTrang });

    // ---------- 3. Theo kho & lô ----------
    var COT3 = ['Kho', 'Nhóm giao', 'Mã hàng', 'Tên vật tư', 'Nhóm hàng', 'ĐVT', 'Số lượng', 'Số lô (số lượng)'];
    var t3 = dauTrang('TỒN KHO THEO KHO & SỐ LÔ', COT3.length, phuChung), h3 = t3.hang;
    h3.push(null); var k0 = h3.length + 1;
    h3.push({ cao: 30, o: COT3.map(function (c) { return { v: c, s: 'dau' }; }) });
    var dongKho = [];
    ds.forEach(function (x) { (x.d.kho || []).forEach(function (k) { dongKho.push({ kho: k.ten, nhom: TEN_TIER[k.nhom] || k.nhom || '', x: x, sl: lam(k.tong, 3), lo: (k.lo || []).map(function (l) { return l.so + ' (' + lam(l.sl, 3) + ')'; }).join(', ') }); }); });
    dongKho.sort(function (a, b) { return String(a.kho).localeCompare(String(b.kho), 'vi') || a.x.ma.localeCompare(b.x.ma); });
    dongKho.forEach(function (r) {
      h3.push({ o: [{ v: r.kho, s: 'chu' }, { v: r.nhom, s: 'giua' }, { v: r.x.ma, s: 'chu' }, { v: r.x.ten, s: 'chu' }, { v: r.x.nhom, s: 'chu' }, { v: r.x.dvt, s: 'giua' }, { v: r.sl, s: 'so' }, { v: r.lo, s: 'chuXuong' }] });
    });
    if (!dongKho.length) h3.push({ o: [{ v: 'Tài khoản này không xem được chi tiết kho / lô.', s: 'ghi' }] });
    trang.push({ ten: 'Theo kho & lô', mauTab: 'FF6941C6', cot: [16, 12, 18, 46, 18, 9, 11, 40], hang: h3, gop: t3.gop, codinh: k0, loc: dongKho.length ? 'A' + k0 + ':H' + (k0 + dongKho.length) : '', inLap: k0 + ':' + k0, chanTrang: chanTrang });

    // ---------- 4. Cần nhập thêm ----------
    var COT4 = ['Mức', 'Mã hàng', 'Tên vật tư', 'Nhóm hàng', 'Hãng', 'Kích cỡ', 'ĐVT', 'Tồn thực', 'Đang giữ', 'Được bán', 'Giá ĐL', 'Gợi ý'];
    var t4 = dauTrang('DANH SÁCH CẦN NHẬP THÊM', COT4.length, phuChung + ' · Sắp hết = được bán ≤ ' + nguong), h4 = t4.hang;
    h4.push(null); var c0 = h4.length + 1;
    h4.push({ cao: 30, o: COT4.map(function (c) { return { v: c, s: 'dau' }; }) });
    var can = vuot.map(function (x) { return [x, 'Giữ vượt tồn', 'ttDo', 'Đơn đang giữ nhiều hơn tồn – nhập gấp hoặc báo đại lý']; })
      .concat(ds.filter(function (x) { return x.tt === 'Đã giữ hết'; }).map(function (x) { return [x, 'Đã giữ hết', 'ttCam', 'Tồn đã giữ hết cho đơn – khách mới sẽ thấy hết hàng']; }))
      .concat(ds.filter(function (x) { return x.tt === 'Sắp hết'; }).map(function (x) { return [x, 'Sắp hết', 'ttCam', 'Cân nhắc nhập thêm']; }));
    can.forEach(function (c) {
      var x = c[0];
      h4.push({ o: [{ v: c[1], s: c[2] }, { v: x.ma, s: 'chu' }, { v: x.ten, s: 'chu' }, { v: x.nhom, s: 'chu' }, { v: x.hang, s: 'chu' }, { v: x.kc, s: 'giua' }, { v: x.dvt, s: 'giua' },
        { v: x.thuc, s: 'so' }, { v: x.giu || '', s: 'so' }, { v: x.ban, s: 'soDo' }, { v: x.p ? (x.p.dl || x.p.ny || '') : '', s: 'tien' }, { v: c[3], s: 'chu' }] });
    });
    hetTrongGia.slice().sort(function (a, b) { return String(a.nhom).localeCompare(String(b.nhom), 'vi') || a.ma.localeCompare(b.ma); }).forEach(function (p) {
      h4.push({ o: [{ v: 'Hết hàng', s: 'ttXam' }, { v: p.ma, s: 'chu' }, { v: p.tenGoc || p.ten, s: 'chu' }, { v: p.nhom, s: 'chu' }, { v: p.hang, s: 'chu' }, { v: p.kc || '', s: 'giua' }, { v: p.dvt, s: 'giua' },
        { v: 0, s: 'so' }, { v: '', s: 'so' }, { v: 0, s: 'so' }, { v: p.dl || p.ny || '', s: 'tien' }, { v: 'Có trong bảng giá nhưng kho không còn – nhập hoặc ẩn mã', s: 'chu' }] });
    });
    var cn = c0 + can.length + hetTrongGia.length;
    trang.push({ ten: 'Cần nhập thêm', mauTab: 'FFB42318', cot: [13, 18, 44, 18, 14, 10, 8, 10, 10, 10, 13, 44], hang: h4, gop: t4.gop, codinh: c0, loc: 'A' + c0 + ':L' + cn, inLap: c0 + ':' + c0, chanTrang: chanTrang });

    // ---------- 5. Hàng đang giữ ----------
    var COT5 = ['Mã đơn', 'Ngày đặt', 'Đại lý / cửa hàng', 'SĐT', 'Trạng thái', 'Hạn chừa', 'Mã hàng', 'Tên hàng', 'Số lượng', 'Đơn vị', 'Quy đổi', 'Thành tiền'];
    var t5 = dauTrang('HÀNG ĐANG GIỮ CHO ĐƠN', COT5.length, phuChung + ' · Đơn chờ duyệt, đang chừa, đã xác nhận, đang giao'), h5 = t5.hang;
    h5.push(null); var g0 = h5.length + 1;
    h5.push({ cao: 30, o: COT5.map(function (c) { return { v: c, s: 'dau' }; }) });
    var soDongGiu = 0;
    don.filter(function (d) { return TEN_TT[d.tt]; }).forEach(function (d) {
      var het = d.tt === 'giu' && d.han && new Date(d.han) < luc;
      d.items.forEach(function (it) {
        soDongGiu++;
        h5.push({ o: [{ v: d.ma, s: 'chu' }, { v: new Date(d.ngay), s: 'ngay' }, { v: d.ten, s: 'chu' }, { v: d.sdt, s: 'chu' },
          { v: TEN_TT[d.tt] + (het ? ' – HẾT HẠN' : ''), s: het ? 'ttDo' : d.tt === 'giu' ? 'ttCam' : 'giua' }, { v: d.han ? new Date(d.han) : '', s: 'ngay' },
          { v: it.ma, s: 'chu' }, { v: it.ten, s: 'chu' }, { v: Number(it.sl) || 0, s: 'so' }, { v: it.dv, s: 'giua' }, { v: it.qd || '', s: 'giua' }, { v: it.tien || 0, s: 'tien' }] });
      });
    });
    if (!soDongGiu) h5.push({ o: [{ v: 'Không có đơn nào đang giữ hàng.', s: 'ghi' }] });
    else {
      var gc = g0 + soDongGiu;
      h5.push({ o: [{ v: 'TỔNG', s: 'tong' }].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function () { return { v: '', s: 'tong' }; }), [{ f: 'SUBTOTAL(109,L' + (g0 + 1) + ':L' + gc + ')', s: 'tongTien' }]) });
    }
    trang.push({ ten: 'Hàng đang giữ', mauTab: 'FFD97706', cot: [15, 16, 26, 13, 27, 16, 18, 36, 10, 8, 12, 14], hang: h5, gop: t5.gop, codinh: g0, loc: soDongGiu ? 'A' + g0 + ':L' + (g0 + soDongGiu) : '', inLap: g0 + ':' + g0, chanTrang: chanTrang });

    // ---------- 6. Cần kiểm tra (dữ liệu lộn xộn) ----------
    var COT6 = ['Vấn đề', 'Mã', 'Tên vật tư', 'Tồn thực', 'Cách xử lý'];
    var t6 = dauTrang('DỮ LIỆU CẦN KIỂM TRA', COT6.length, 'Các chỗ làm số tồn / giá trên app bị sai – sửa xong tải lại sổ này để kiểm tra'), h6 = t6.hang;
    h6.push(null); var v0 = h6.length + 1;
    h6.push({ cao: 30, o: COT6.map(function (c) { return { v: c, s: 'dau' }; }) });
    var vd = [];
    moCoi.forEach(function (x) { vd.push(['Mã tồn kho không có trong bảng giá', x.ma, x.ten, x.thuc, 'Thêm mã vào bảng giá (mục Sản phẩm) hoặc ghi "Mã bên phần mềm kho" cho mã bán tương ứng', 'ttDo']); });
    vuot.forEach(function (x) { vd.push(['Đơn giữ nhiều hơn tồn', x.ma, x.ten, x.thuc, 'Kiểm tra lại tồn thực tế; nhập thêm hoặc liên hệ đại lý', 'ttDo']); });
    chuaGia.forEach(function (x) { vd.push(['Có tồn nhưng chưa có giá niêm yết', x.ma, x.ten, x.thuc, 'Nhập giá (mục Nhập giá) – đại lý đang thấy "Liên hệ báo giá"', 'ttCam']); });
    ds.filter(function (x) { return x.p && laM2(x.p.dvt) && x.dvt === 'thùng' && !x.m2; }).forEach(function (x) {
      vd.push(['Gạch thiếu quy cách m²/thùng', x.ma, x.ten, x.thuc, 'Điền "Đóng gói" (vd 4 viên/thùng · 1,44 m²/thùng) để app quy đổi và tính giá trị tồn', 'ttCam']);
    });
    vd.forEach(function (r) { h6.push({ o: [{ v: r[0], s: r[5] }, { v: r[1], s: 'chu' }, { v: r[2], s: 'chu' }, { v: r[3], s: 'so' }, { v: r[4], s: 'chuXuong' }] }); });
    if (!vd.length) h6.push({ o: [{ v: '✓ Không thấy chỗ nào cần sửa', s: 'ttXanh' }] });
    trang.push({ ten: 'Cần kiểm tra', mauTab: 'FF667085', cot: [34, 20, 44, 11, 70], hang: h6, gop: t6.gop, codinh: v0, loc: vd.length ? 'A' + v0 + ':E' + (v0 + vd.length) : '', inLap: v0 + ':' + v0, chanTrang: chanTrang });

    return { tieuDe: 'Sổ tồn kho ' + cty, tacGia: cty, trang: trang, tomTat: { soMa: ds.length, giaTri: tongGT, sapHet: sapHet.length, het: hetTrongGia.length, vuot: vuot.length, moCoi: moCoi.length, chuaGia: chuaGia.length } };
  };
})();
