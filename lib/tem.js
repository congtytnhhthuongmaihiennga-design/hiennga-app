// ============================================================
// IN TEM GIÁ – dùng cho trang quản trị (app đại lý có bản riêng trong app.js, cùng giao diện tem / cùng giỏ tem trên máy).
// window.TEM_HN = { KHO, chuanSP, htmlTem, inTem }
// ============================================================
(function () {
  'use strict';
  var KHO = {
    the: { ten: 'Thẻ 90×55 mm', w: 90, h: 55 },
    nho: { ten: 'Tem nhiệt 50×30 mm', w: 50, h: 30 },
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
  window.TEM_HN = { KHO: KHO, chuanSP: chuanSP, htmlTem: htmlTem, inTem: inTem };
})();
