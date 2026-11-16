// ============================================================
// ẢNH GỬI KHÁCH: tải ảnh sản phẩm (Google Drive) -> nối thêm dải thông tin ở ĐÁY ảnh (không che ảnh)
// -> xuất JPEG để gửi Zalo. Dải: mã + kích thước · tên · giá · quy cách · chân (cửa hàng + SĐT).
// window.ANH_GUI = { idDrive, taiAnh, veAnh }
// ============================================================
(function () {
  'use strict';
  var MAU = { nen: '#1F2430', vien: '#3A4150', chinh: '#FFFFFF', phu: '#B5BCC9', gia: '#FFE08A', dl: '#8FD3FF', chan: '#E00000' };
  var RONG_TOI_DA = 2000;

  function idDrive(u) { var m = String(u || '').match(/[-\w]{25,}/); return m ? m[0] : ''; }
  function cho(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  // Tải ảnh gốc khổ lớn. Drive hay trả lỗi 429 (tải dồn quá nhiều) -> chờ rồi thử lại (1s, 2s, 4s, 8s).
  function taiAnh(u) {
    var id = idDrive(u), ds = id ? ['https://lh3.googleusercontent.com/d/' + id + '=w' + RONG_TOI_DA, 'https://drive.google.com/thumbnail?sz=w' + RONG_TOI_DA + '&id=' + id] : [u];
    var lan = 0;
    function thu() {
      var url = ds[0]; // lh3 có CORS; link thumbnail của Drive không có CORS khi lỗi nên chỉ dùng lh3
      return fetch(url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) {
        if (!r.ok) throw new Error(r.status === 429 ? 'Google Drive tạm chặn vì tải nhiều ảnh liên tục – chờ 1 phút rồi thử lại' : 'HTTP ' + r.status);
        return r.blob();
      }).catch(function (e) {
        lan++;
        if (lan > 4) throw e;
        return cho(1000 * Math.pow(2, lan - 1)).then(thu);
      });
    }
    return thu();
  }
  function moAnh(blob) {
    return new Promise(function (ok, loi) {
      var im = new Image(), u = URL.createObjectURL(blob);
      im.onload = function () { ok(im); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); };
      im.onerror = function () { loi(new Error('Ảnh hỏng')); };
      im.src = u;
    });
  }
  function moLogo(src) {
    if (!src) return Promise.resolve(null);
    return new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; });
  }

  // tt = { ma, ten, kc, gia: [{ nhan, so, mau: 'gia'|'dl' }], ghi: 'quy cách…', chan: 'Hiển Nga · 0939…', logo: url }
  function soanDai(w, h, tt, ctxDo) {
    var b = Math.max(16, Math.round(Math.sqrt(w * h) * 0.036)), pad = Math.round(b * 0.9), gap = Math.round(b * 0.55);
    var F = function (sz, dam) { return (dam ? 'bold ' : '') + Math.round(sz) + 'px Arial, "Segoe UI", sans-serif'; };
    var W = function (t, sz, dam) { ctxDo.font = F(sz, dam); return ctxDo.measureText(t).width; };
    var rongChu = w - pad * 2, hang = [];
    function them(phan, sz, min, mt) { // thu nhỏ cả hàng cho vừa bề ngang – chữ không bao giờ bị cắt
      var k = 1, tong = function () { return phan.reduce(function (s, p, i) { return s + W(p.t, sz * k * (p.k || 1), p.d) + (i ? gap * k : 0); }, 0); };
      while (sz * k > min && tong() > rongChu) k -= 0.03;
      var lon = 0; phan.forEach(function (p) { lon = Math.max(lon, sz * k * (p.k || 1)); });
      hang.push({ phan: phan, sz: sz * k, k: k, h: Math.round(lon * 1.5), mt: mt || 0 });
    }
    var h1 = [{ t: String(tt.ma), d: true, k: 1.2, c: MAU.chinh }]; if (tt.kc) h1.push({ t: tt.kc, d: false, k: 1, c: MAU.phu });
    them(h1, b, 11);
    if (tt.ten) them([{ t: tt.ten, d: false, k: 0.92, c: MAU.phu }], b, 10);
    (tt.gia || []).forEach(function (g, i) { them([{ t: g.nhan, d: false, k: 1, c: MAU.phu }, { t: g.so, d: true, k: 1.05, c: MAU[g.mau] || MAU.gia }], b, 11, i ? 0 : Math.round(b * 0.2)); });
    if (tt.ghi) them([{ t: tt.ghi, d: false, k: 0.8, c: MAU.phu }], b, 9);
    var hChan = tt.chan ? Math.round(b * 1.6) : 0;
    var cao = hang.reduce(function (s, r) { return s + r.h + r.mt; }, 0) + Math.round(pad * 1.4) + hChan;
    return {
      cao: cao,
      ve: function (ctx, y0, logo) {
        ctx.fillStyle = MAU.nen; ctx.fillRect(0, y0, w, cao);
        ctx.fillStyle = MAU.vien; ctx.fillRect(0, y0, w, 1);
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        var y = y0 + Math.round(pad * 0.7);
        hang.forEach(function (r) {
          y += r.mt; var x = pad, cy = y + r.h / 2;
          r.phan.forEach(function (p, i) { if (i) x += gap * r.k; ctx.font = F(r.sz * (p.k || 1), p.d); ctx.fillStyle = p.c; ctx.fillText(p.t, x, cy); x += ctx.measureText(p.t).width; });
          y += r.h;
        });
        if (tt.chan) { // chân: vạch đỏ thương hiệu + logo nhỏ + tên cửa hàng / SĐT
          var yc = y0 + cao - hChan;
          ctx.fillStyle = MAU.chan; ctx.fillRect(0, yc, w, Math.max(2, Math.round(b * 0.12)));
          var x = pad, cy2 = yc + hChan / 2 + 1, cs = Math.round(b * 0.82);
          if (logo) { var lh = Math.round(hChan * 0.62), lw = Math.round(logo.naturalWidth / logo.naturalHeight * lh); ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, cy2 - lh / 2 - 3, lw + 6, lh + 6); ctx.drawImage(logo, x, cy2 - lh / 2, lw, lh); x += lw + gap; }
          var t = tt.chan, sz = cs; ctx.font = F(sz, true);
          while (sz > 9 && x + ctx.measureText(t).width > w - pad) { sz -= 0.5; ctx.font = F(sz, true); }
          ctx.fillStyle = MAU.chinh; ctx.fillText(t, x, cy2);
        }
      }
    };
  }
  // blob ảnh gốc + thông tin -> Blob JPEG (ảnh trên, dải dưới)
  function veAnh(blob, tt) {
    return Promise.all([moAnh(blob), moLogo(tt.logo)]).then(function (kq) {
      var im = kq[0], k = Math.min(1, RONG_TOI_DA / im.naturalWidth);
      var w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
      var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
      var dai = soanDai(w, h, tt, ctx);
      cv.width = w; cv.height = h + dai.cao;
      ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(im, 0, 0, w, h);
      dai.ve(ctx, h, kq[1]);
      return new Promise(function (ok, loi) { cv.toBlob(function (b) { if (b) ok(b); else loi(new Error('Không xuất được ảnh')); }, 'image/jpeg', 0.92); });
    });
  }
  window.ANH_GUI = { idDrive: idDrive, taiAnh: taiAnh, veAnh: veAnh };
})();
