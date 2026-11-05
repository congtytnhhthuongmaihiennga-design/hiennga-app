// ============================================================
// Tạo mã QR (chuẩn ISO/IEC 18004) – chế độ byte, mức sửa lỗi M, phiên bản 1–10 (tới ~213 byte).
// Viết riêng cho app (không tải thư viện ngoài). Thuật toán theo cách làm phổ biến của
// Project Nayuki "QR Code generator" (MIT). Dùng: window.QR.svg('https://…', 3) -> chuỗi <svg>.
// ============================================================
(function (g) {
  'use strict';
  // Mức M, phiên bản 1..10: số byte sửa lỗi mỗi khối, số khối.
  var ECC_M = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  var KHOI_M = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

  function soModuleDuLieu(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function viTriCanChinh(v) {
    if (v === 1) return [];
    var na = Math.floor(v / 7) + 2, size = v * 4 + 17;
    var buoc = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2, kq = [6];
    for (var p = size - 7; kq.length < na; p -= buoc) kq.splice(1, 0, p);
    return kq;
  }
  // ---- Reed-Solomon trên GF(256), đa thức 0x11D ----
  function nhan(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function boChia(bac) {
    var kq = []; for (var i = 0; i < bac - 1; i++) kq.push(0); kq.push(1);
    var goc = 1;
    for (var i2 = 0; i2 < bac; i2++) {
      for (var j = 0; j < kq.length; j++) { kq[j] = nhan(kq[j], goc); if (j + 1 < kq.length) kq[j] ^= kq[j + 1]; }
      goc = nhan(goc, 0x02);
    }
    return kq;
  }
  function phanDu(data, chia) {
    var kq = chia.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ kq.shift(); kq.push(0);
      chia.forEach(function (c, i) { kq[i] ^= nhan(c, f); });
    });
    return kq;
  }
  function utf8(s) {
    var out = [], e = unescape(encodeURIComponent(s));
    for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i));
    return out;
  }

  function tao(text) {
    var bytes = utf8(text), v, cap;
    for (v = 1; v <= 10; v++) {
      cap = soModuleDuLieu(v) / 8 - ECC_M[v] * KHOI_M[v];
      if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap * 8) break;
    }
    if (v > 10) throw new Error('Nội dung QR quá dài');
    var size = v * 4 + 17;

    // ---- Bit dữ liệu ----
    var bits = [];
    function them(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    them(4, 4); them(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(function (b) { them(b, 8); });
    them(0, Math.min(4, cap * 8 - bits.length));
    them(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap * 8; pad ^= 0xEC ^ 0x11) them(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; data.push(b); }

    // ---- Sửa lỗi + xen kẽ khối ----
    var soKhoi = KHOI_M[v], eccLen = ECC_M[v], tong = soModuleDuLieu(v) / 8;
    var ngan = soKhoi - tong % soKhoi, dodaiNgan = Math.floor(tong / soKhoi), chia = boChia(eccLen);
    var khoi = [], vt = 0;
    for (var bi = 0; bi < soKhoi; bi++) {
      var dat = data.slice(vt, vt + dodaiNgan - eccLen + (bi < ngan ? 0 : 1));
      vt += dat.length;
      var ecc = phanDu(dat, chia);
      if (bi < ngan) dat.push(0);
      khoi.push(dat.concat(ecc));
    }
    var cw = [];
    for (var ci = 0; ci < khoi[0].length; ci++) for (var bj = 0; bj < khoi.length; bj++) {
      if (ci !== dodaiNgan - eccLen || bj >= ngan) cw.push(khoi[bj][ci]);
    }

    // ---- Ma trận ----
    var m = [], ham = [];
    for (var y = 0; y < size; y++) { m.push([]); ham.push([]); for (var x = 0; x < size; x++) { m[y].push(false); ham[y].push(false); } }
    function dat1(x, y, den) { m[y][x] = den; ham[y][x] = true; }
    for (var t = 0; t < size; t++) { dat1(6, t, t % 2 === 0); dat1(t, 6, t % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) dat1(xx, yy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var al = viTriCanChinh(v), n = al.length;
    for (var ai = 0; ai < n; ai++) for (var aj = 0; aj < n; aj++) {
      if ((ai === 0 && aj === 0) || (ai === 0 && aj === n - 1) || (ai === n - 1 && aj === 0)) continue;
      for (var ey = -2; ey <= 2; ey++) for (var ex = -2; ex <= 2; ex++) dat1(al[ai] + ex, al[aj] + ey, Math.max(Math.abs(ex), Math.abs(ey)) !== 1);
    }
    function dinhDang(mask) {
      var d = (0 << 3) | mask, r = d; // mức M = 00
      for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var bt = ((d << 10) | r) ^ 0x5412;
      function b(i) { return ((bt >>> i) & 1) !== 0; }
      for (var i1 = 0; i1 <= 5; i1++) dat1(8, i1, b(i1));
      dat1(8, 7, b(6)); dat1(8, 8, b(7)); dat1(7, 8, b(8));
      for (var i2 = 9; i2 < 15; i2++) dat1(14 - i2, 8, b(i2));
      for (var i3 = 0; i3 < 8; i3++) dat1(size - 1 - i3, 8, b(i3));
      for (var i4 = 8; i4 < 15; i4++) dat1(8, size - 15 + i4, b(i4));
      dat1(8, size - 8, true);
      return bt;
    }
    dinhDang(0);
    if (v >= 7) {
      var r = v; for (var vi = 0; vi < 12; vi++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      var vb = (v << 12) | r;
      for (var vk = 0; vk < 18; vk++) { var bit = ((vb >>> vk) & 1) !== 0, a = size - 11 + vk % 3, bb = Math.floor(vk / 3); dat1(a, bb, bit); dat1(bb, a, bit); }
    }
    // Đặt codeword theo đường zigzag
    var idx = 0;
    for (var phai = size - 1; phai >= 1; phai -= 2) {
      if (phai === 6) phai = 5;
      for (var doc = 0; doc < size; doc++) for (var jj = 0; jj < 2; jj++) {
        var xx = phai - jj, len = ((phai + 1) & 2) === 0, yy = len ? size - 1 - doc : doc;
        if (!ham[yy][xx] && idx < cw.length * 8) { m[yy][xx] = ((cw[idx >>> 3] >>> (7 - (idx & 7))) & 1) !== 0; idx++; }
      }
    }
    function apMask(mask) {
      for (var y2 = 0; y2 < size; y2++) for (var x2 = 0; x2 < size; x2++) {
        var dao;
        switch (mask) {
          case 0: dao = (x2 + y2) % 2 === 0; break;
          case 1: dao = y2 % 2 === 0; break;
          case 2: dao = x2 % 3 === 0; break;
          case 3: dao = (x2 + y2) % 3 === 0; break;
          case 4: dao = (Math.floor(x2 / 3) + Math.floor(y2 / 2)) % 2 === 0; break;
          case 5: dao = x2 * y2 % 2 + x2 * y2 % 3 === 0; break;
          case 6: dao = (x2 * y2 % 2 + x2 * y2 % 3) % 2 === 0; break;
          default: dao = ((x2 + y2) % 2 + x2 * y2 % 3) % 2 === 0;
        }
        if (!ham[y2][x2] && dao) m[y2][x2] = !m[y2][x2];
      }
    }
    function diemPhat() {
      var p = 0, den = 0;
      function chuoi(arr) { return arr.map(function (c) { return c ? '1' : '0'; }).join(''); }
      var hang = [], cot = [];
      for (var y3 = 0; y3 < size; y3++) { hang.push(chuoi(m[y3])); cot.push(chuoi(m.map(function (r2) { return r2[y3]; }))); }
      hang.concat(cot).forEach(function (s) {
        (s.match(/0{5,}|1{5,}/g) || []).forEach(function (run) { p += 3 + run.length - 5; });
        var a1 = s.split('10111010000').length - 1, a2 = s.split('00001011101').length - 1;
        p += 40 * (a1 + a2);
      });
      for (var y4 = 0; y4 < size - 1; y4++) for (var x4 = 0; x4 < size - 1; x4++) {
        var c = m[y4][x4];
        if (c === m[y4][x4 + 1] && c === m[y4 + 1][x4] && c === m[y4 + 1][x4 + 1]) p += 3;
      }
      m.forEach(function (r3) { r3.forEach(function (c2) { if (c2) den++; }); });
      p += Math.floor(Math.abs(den * 100 / (size * size) - 50) / 5) * 10;
      return p;
    }
    var tot = 0, diemTot = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      apMask(mk); dinhDang(mk);
      var d2 = diemPhat();
      if (d2 < diemTot) { diemTot = d2; tot = mk; }
      apMask(mk); // gỡ mask (XOR 2 lần)
    }
    apMask(tot); dinhDang(tot);
    return { size: size, m: m, version: v, mask: tot };
  }

  function svg(text, le) {
    var q = tao(text), b = le == null ? 3 : le, d = '';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.m[y][x]) d += 'M' + (x + b) + ',' + (y + b) + 'h1v1h-1z';
    var w = q.size + 2 * b;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + w + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  g.QR = { tao: tao, svg: svg, _noi: { boChia: boChia, phanDu: phanDu, nhan: nhan } };
})(typeof window !== 'undefined' ? window : this);
