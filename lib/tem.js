// ============================================================
// IN TEM GIÁ – dùng cho trang quản trị (app đại lý có bản riêng trong app.js, cùng giao diện tem / cùng giỏ tem trên máy).
// window.TEM_HN = { KHO, chuanSP, htmlTem, inTem }
// ============================================================
(function () {
  'use strict';
  var KHO = {
    the: { ten: 'Thẻ 90×55 mm', w: 90, h: 55 },
    nho: { ten: 'Tem nhiệt 50×30 mm', w: 50, h: 30, nhiet: true },
    a4: { ten: 'Giấy A4 · 10 tem', w: 95, h: 54, a4: true },
    tuy: { ten: 'Tự nhập kích thước', w: 60, h: 40 }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tenGon(t) {
    return String(t || '').replace(/\(\s*\d+\s*v\s*\/\s*th\s*\)/gi, '').replace(/#\d+\s*$/, '').replace(/[@*]+/g, '').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  }
  function chuanKc(s) {
    var m = String(s || '').replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)(?:\s*[x×*]\s*(\d+(?:\.\d+)?))?/i);
    return m ? m[1] + 'x' + m[2] + (m[3] ? 'x' + m[3] : '') : String(s || '').trim();
  }
  // Thêm các trường hiển thị giống app: _ten, _kc, _vt (viên/thùng), _cap (loại 1/2/3).
  function chuanSP(p) {
    var goc = String(p.tenGoc || p.ten || '');
    var kt = goc.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i);
    return Object.assign({}, p, { _ten: tenGon(p.ten) || p.ma, _kc: chuanKc(p.kc || (kt ? kt[1] + 'x' + kt[2] : '')),
      _vt: (goc.match(/\(\s*(\d+)\s*v\s*\/\s*th/i) || [])[1] || '', _cap: (goc.match(/lo[aạ]i\s*(\d)/i) || [])[1] || '' });
  }
  // o: { p (đã chuanSP), gia (số), logo, logoDay, tenApp, link (link xem mẫu cho QR) }
  function htmlTem(o, kho) {
    var p = o.p, gia = Number(o.gia) || 0, lon = kho.h >= 40, bw = lon ? 90 : 50, bh = lon ? 55 : 30;
    var tl = Math.min(kho.w / bw, kho.h / bh), dv = p.dvt ? 'đ/' + p.dvt : 'đ', giaChu = gia > 0 ? gia.toLocaleString('vi-VN') : 'Liên hệ';
    var logo = '<img class="t-logo" src="' + esc((lon ? o.logoDay : o.logo) || o.logo || '') + '" alt="">';
    var qr = '<div class="t-qr">' + (window.QR ? window.QR.svg(o.link, 2) : '') + '</div>';
    var n = new Date(), ngayIn = ('0' + n.getDate()).slice(-2) + '/' + ('0' + (n.getMonth() + 1)).slice(-2) + '/' + n.getFullYear();
    var noi = lon
      ? '<div class="t-dau">' + logo + '<div class="t-ten">' + esc(p._ten) + '</div>' + qr + '</div>' +
        '<div class="t-dong"><span>Mã số / Code:</span><b class="t-ke">' + esc(p.ma) + '</b></div>' +
        '<div class="t-dong"><span>Kích thước:</span><b class="t-ke">' + esc(p._kc || '—') + '</b>' + (p._vt ? '<span class="t-phu">' + p._vt + ' viên/thùng</span>' : '') + (p._cap ? '<span class="t-cap">Loại ' + p._cap + '</span>' : '') + '</div>' +
        '<div class="t-dong t-gia-dong"><span>Giá đã gồm VAT:</span><b class="t-ke t-gia">' + giaChu + '</b><span class="t-dv">' + (gia > 0 ? esc(dv) : '') + '</span></div>' +
        '<div class="t-chan">' + esc(o.tenApp || '') + ' · Quét mã QR xem mẫu · In ' + ngayIn + '</div>'
      : '<div class="t-nho-trai">' + logo + '<div class="t-ten">' + esc(p._ten) + '</div><div class="t-ma">' + esc(p.ma) + (p._kc ? ' · ' + esc(p._kc) : '') + '</div>' +
        '<div class="t-gia">' + giaChu + '<small>' + (gia > 0 ? esc(dv) : '') + '</small></div></div>' + qr;
    return '<div class="tem-o" style="width:' + kho.w + 'mm;height:' + kho.h + 'mm"><div class="tem ' + (lon ? 'tem-lon' : 'tem-nho') + '" style="width:' + bw + 'mm;height:' + bh + 'mm;transform:scale(' + tl + ')">' + noi + '</div></div>';
  }
  // ds: mảng chuỗi HTML tem (mỗi tem 1 phần tử). Mở hộp thoại in, xong thì dọn.
  function inTem(dsHtml, kho, xong) {
    var vung = document.getElementById('vung-in'), kieu = document.getElementById('kieu-in');
    if (kho.a4) {
      var trang = [];
      for (var i = 0; i < dsHtml.length; i += 10) trang.push('<div class="in-a4">' + dsHtml.slice(i, i + 10).join('') + '</div>');
      vung.innerHTML = trang.join(''); kieu.textContent = '@page{size:A4;margin:0}';
    } else {
      vung.innerHTML = dsHtml.map(function (h) { return '<div class="in-mot">' + h + '</div>'; }).join('');
      kieu.textContent = '@page{size:' + kho.w + 'mm ' + kho.h + 'mm;margin:0}';
    }
    vung.hidden = false; document.body.classList.add('dang-in');
    var don = function () { document.body.classList.remove('dang-in'); vung.hidden = true; vung.innerHTML = ''; window.removeEventListener('afterprint', don); if (xong) xong(); };
    window.addEventListener('afterprint', don);
    var anh = vung.querySelectorAll('img'), con = anh.length, mo = function () { setTimeout(function () { window.print(); }, 150); };
    if (!con) mo(); else anh.forEach(function (im) { if (im.complete) { if (--con === 0) mo(); } else im.onload = im.onerror = function () { if (--con === 0) mo(); }; });
  }
  // ---------- Ảnh tem cho máy in nhiệt ----------
  // Máy in nhiệt mini in qua app điện thoại: gửi file PDF/A4 thì bị thu nhỏ vào góc. Gửi ẢNH đúng khổ thì in kín tem.
  // Vẽ thẳng lên canvas: chỉ đen / trắng (máy in nhiệt không in màu xám), chữ đậm, QR vẽ từng ô cho sắc nét.
  var PX_MM = 16; // 16 điểm ảnh / mm (≈ 400 dpi) – app máy in tự thu về đúng độ phân giải đầu in
  function vuaChu(g, chu, rong, co, dam, toiThieu) { // giảm cỡ chữ tới khi vừa chiều ngang
    for (var c = co; c >= toiThieu; c -= 0.5) { g.font = (dam ? '800 ' : '500 ') + c + 'px Arial, "Segoe UI", sans-serif'; if (g.measureText(chu).width <= rong) return c; }
    return toiThieu;
  }
  function tachDong(g, chu, rong, soDong) { // xuống dòng theo chữ, tối đa soDong dòng, dòng cuối có "…"
    var tu = String(chu || '').split(/\s+/), dong = [], cur = '';
    for (var i = 0; i < tu.length; i++) {
      var thu = cur ? cur + ' ' + tu[i] : tu[i];
      if (g.measureText(thu).width <= rong || !cur) cur = thu;
      else { dong.push(cur); cur = tu[i]; if (dong.length === soDong) break; }
    }
    if (dong.length < soDong && cur) dong.push(cur);
    var het = dong.join(' ').split(/\s+/).length < tu.length;
    if (het) { var d = dong[dong.length - 1]; while (d && g.measureText(d + '…').width > rong) d = d.slice(0, -1); dong[dong.length - 1] = d + '…'; }
    return dong;
  }
  // o: như htmlTem. Trả Promise<Blob> PNG kho.w × kho.h mm.
  function veTemAnh(o, kho) {
    var p = o.p, gia = Number(o.gia) || 0, W = kho.w * PX_MM, H = kho.h * PX_MM, mm = function (n) { return n * PX_MM * Math.min(kho.w / 50, kho.h / 30); };
    var c = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H);
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#000'; g.textBaseline = 'alphabetic';
    var le = mm(1.6), qrCo = Math.min(mm(14.5), H - 2 * le - mm(9)), qrX = W - le - qrCo, qrY = le;
    // QR (link xem mẫu)
    if (window.QR && o.link) {
      var q = window.QR.tao(o.link), o1 = qrCo / q.size;
      for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.m[y][x]) g.fillRect(Math.floor(qrX + x * o1), Math.floor(qrY + y * o1), Math.ceil(o1), Math.ceil(o1));
    }
    var trai = le, rongTrai = qrX - le - mm(1.2), yy = le;
    // Tên cửa hàng (dòng nhỏ, có gạch dưới)
    if (o.tenApp) { var cT = vuaChu(g, String(o.tenApp).toUpperCase(), rongTrai, mm(2.6), true, mm(1.8)); yy += cT; g.fillText(String(o.tenApp).toUpperCase(), trai, yy); g.fillRect(trai, yy + mm(0.6), rongTrai, Math.max(2, mm(0.25))); yy += mm(1.5); }
    // Tên hàng: tối đa 2 dòng
    g.font = '800 ' + mm(3) + 'px Arial, "Segoe UI", sans-serif';
    tachDong(g, p._ten || p.ma, rongTrai, 2).forEach(function (d) { yy += mm(3.3); g.fillText(d, trai, yy); });
    // Mã + kích cỡ / viên/thùng / loại
    var phu = [p._kc, p._vt ? p._vt + ' v/th' : '', p._cap ? 'L' + p._cap : ''].filter(String).join(' · ');
    yy += mm(3.2); var cM = vuaChu(g, p.ma, rongTrai, mm(2.7), true, mm(1.8)); g.fillText(p.ma, trai, yy);
    if (phu) { yy += mm(2.9); vuaChu(g, phu, rongTrai, mm(2.5), false, mm(1.7)); g.fillText(phu, trai, yy); }
    // Giá: dòng to dưới cùng, kín bề ngang
    var giaChu = gia > 0 ? gia.toLocaleString('vi-VN') : 'Liên hệ', dv = gia > 0 ? (p.dvt ? 'đ/' + p.dvt : 'đ') : '';
    var day = H - le - mm(0.4), cDv = mm(2.6);
    g.font = '700 ' + cDv + 'px Arial, "Segoe UI", sans-serif'; var rDv = dv ? g.measureText(dv).width + mm(0.8) : 0;
    var cG = vuaChu(g, giaChu, W - 2 * le - rDv, mm(7.5), true, mm(4));
    var dinh = day - cG * 0.78; if (dinh < qrY + qrCo + mm(0.8)) { cG = Math.max(mm(4), (day - qrY - qrCo - mm(0.8)) / 0.78); g.font = '800 ' + cG + 'px Arial, "Segoe UI", sans-serif'; }
    g.fillText(giaChu, le, day);
    var rG = g.measureText(giaChu).width;
    if (dv) { g.font = '700 ' + cDv + 'px Arial, "Segoe UI", sans-serif'; g.fillText(dv, le + rG + mm(0.8), day); }
    return new Promise(function (ok) { c.toBlob(ok, 'image/png'); });
  }
  window.TEM_HN = { KHO: KHO, chuanSP: chuanSP, htmlTem: htmlTem, inTem: inTem, veTemAnh: veTemAnh };
})();
