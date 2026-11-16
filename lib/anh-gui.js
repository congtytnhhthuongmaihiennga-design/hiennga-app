// ============================================================
// ẢNH GỬI KHÁCH (theo mô tả "Giỏ ảnh" của Sales Tool): tải ảnh sản phẩm từ Google Drive,
// MỞ RỘNG canvas thêm 1 dải thông tin ở đáy (không đè lên ảnh) rồi xuất JPEG (điện thoại) / PNG (máy tính).
// window.ANH_GUI = { idDrive, taiAnh(url, kichCo), veAnh(blob, thongTin, tuyChon), CHAT_LUONG }
// ============================================================
(function () {
  'use strict';
  var MAU = { nen: '#2A2A2A', vien: '#3C3C3C', chinh: '#FFFFFF', phu: '#A9A9A9', gia: '#F3E2B3', dl: '#9FD8FF', chan: '#E00000' };
  // 3 mức chất lượng: cạnh dài tối đa · JPEG · tham số xin Google
  var CHAT_LUONG = {
    nhanh: { ten: 'Nhanh', px: 1600, q: 0.8, s: '=s1600' },
    chuan: { ten: 'Chuẩn', px: 2400, q: 0.92, s: '=s2400' },
    goc: { ten: 'Gốc', px: 0, q: 1, s: '=s0' }
  };
  var DIEM_ANH_TOI_DA = 15e6; // Safari iPhone không vẽ được canvas lớn hơn ~16 triệu điểm ảnh (ra ảnh trắng)

  function idDrive(u) { var m = String(u || '').match(/[-\w]{25,}/); return m ? m[0] : ''; }
  function cho(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  // lh3.googleusercontent.com có CORS "*" nên fetch + vẽ canvas được. File Drive phải "Bất kỳ ai có đường liên kết".
  // Không gửi Referer (Google trả 429 cho một số trang gọi tới). Lỗi mạng / 429 / 5xx: thử lại 3 lần (0,5s · 1s · 2s).
  function taiAnh(u, kichCo) {
    var id = idDrive(u), url = id ? 'https://lh3.googleusercontent.com/d/' + id + (kichCo || '=s2400') : u, lan = 0;
    function thu() {
      return fetch(url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) {
        if (!r.ok) throw new Error(r.status === 429 ? 'Google tạm chặn vì tải nhiều ảnh liền – chờ chút rồi thử lại' : 'Không tải được ảnh (HTTP ' + r.status + ')');
        var ct = r.headers.get('content-type') || '';
        if (ct && ct.indexOf('image') < 0) throw new Error('Ảnh chưa mở quyền xem (Drive: "Bất kỳ ai có đường liên kết")');
        return r.blob();
      }).catch(function (e) {
        lan++; if (lan > 3) throw e;
        return cho(500 * Math.pow(2, lan - 1)).then(thu);
      });
    }
    return thu();
  }
  function moAnh(blob) {
    return new Promise(function (ok, loi) {
      var im = new Image(), u = URL.createObjectURL(blob);
      im.onload = function () { ok(im); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); };
      im.onerror = function () { loi(new Error('Ảnh hỏng hoặc không phải ảnh')); };
      im.src = u;
    });
  }
  function moLogo(src) {
    if (!src) return Promise.resolve(null);
    return new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; });
  }

  // tt = { ma, kc, gia: [{ nhan, so, mau: 'gia'|'dl' }], ghi, chan, logo }
  function soanDai(w, h, tt, ctxDo) {
    var b = Math.max(16, Math.round(Math.sqrt(w * h) * 0.04)), pad = Math.round(b * 0.9), gap = Math.round(b * 0.6);
    var F = function (sz, dam) { return (dam ? 'bold ' : '') + Math.round(sz) + 'px Arial, sans-serif'; };
    var W = function (t, sz, dam) { ctxDo.font = F(sz, dam); return ctxDo.measureText(t).width; };
    var rongChu = w - pad * 2, hang = [];
    function them(phan, sz, min, mt) { // dòng quá dài tự thu nhỏ (3%/bước) – chữ không bao giờ bị cắt
      var k = 1, tong = function () { return phan.reduce(function (s, p, i) { return s + W(p.t, sz * k * (p.k || 1), p.d) + (i ? gap * 0.6 * k : 0); }, 0); };
      while (sz * k > min && tong() > rongChu) k -= 0.03;
      var lon = 0; phan.forEach(function (p) { lon = Math.max(lon, sz * k * (p.k || 1)); });
      hang.push({ phan: phan, sz: sz * k, k: k, h: Math.round(lon * 1.55), mt: mt || 0 });
    }
    var h1 = [{ t: String(tt.ma), d: true, k: 1.25, c: MAU.chinh }]; if (tt.kc) h1.push({ t: tt.kc, d: false, k: 1, c: MAU.phu });
    them(h1, b, 11);
    (tt.gia || []).forEach(function (g, i) { them([{ t: g.nhan, d: false, k: 1, c: MAU.phu }, { t: g.so, d: true, k: 1, c: MAU[g.mau] || MAU.gia }], b, i ? b * 0.78 : 11, i ? Math.round(b * 0.15) : 0); });
    if (tt.ghi) them([{ t: tt.ghi, d: false, k: 0.78, c: MAU.phu }], b, 9, Math.round(b * 0.15));
    var hChan = tt.chan ? Math.round(b * 1.6) : 0;
    var cao = hang.reduce(function (s, r) { return s + r.h + r.mt; }, 0) + Math.round(pad * 1.5) + hChan;
    return {
      cao: cao,
      ve: function (ctx, y0, logo) {
        ctx.fillStyle = MAU.nen; ctx.fillRect(0, y0, w, cao);
        ctx.fillStyle = MAU.vien; ctx.fillRect(0, y0, w, 1);
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        var y = y0 + Math.round(pad * 0.75);
        hang.forEach(function (r) {
          y += r.mt; var x = pad, cy = y + r.h / 2;
          r.phan.forEach(function (p, i) { if (i) x += gap * 0.6 * r.k; ctx.font = F(r.sz * (p.k || 1), p.d); ctx.fillStyle = p.c; ctx.fillText(p.t, x, cy); x += ctx.measureText(p.t).width; });
          y += r.h;
        });
        if (tt.chan) { // chân: vạch đỏ + logo nhỏ (nếu có) + tên cửa hàng · SĐT
          var yc = y0 + cao - hChan, x2 = pad, cy2 = yc + hChan / 2 + 1;
          ctx.fillStyle = MAU.chan; ctx.fillRect(0, yc, w, Math.max(2, Math.round(b * 0.1)));
          if (logo) { var lh = Math.round(hChan * 0.6), lw = Math.round(logo.naturalWidth / logo.naturalHeight * lh); ctx.fillStyle = '#fff'; ctx.fillRect(x2 - 3, cy2 - lh / 2 - 3, lw + 6, lh + 6); ctx.drawImage(logo, x2, cy2 - lh / 2, lw, lh); x2 += lw + gap; }
          var sz = b * 0.85; ctx.font = F(sz, true);
          while (sz > 9 && x2 + ctx.measureText(tt.chan).width > w - pad) { sz -= 0.5; ctx.font = F(sz, true); }
          ctx.fillStyle = MAU.chinh; ctx.fillText(tt.chan, x2, cy2);
        }
      }
    };
  }
  // tuyChon: { px: cạnh dài tối đa (0 = giữ nguyên), q: chất lượng JPEG, png: true = xuất PNG (clipboard máy tính) }
  function veAnh(blob, tt, tuyChon) {
    var o = tuyChon || {};
    return Promise.all([moAnh(blob), moLogo(tt.logo)]).then(function (kq) {
      var im = kq[0], W0 = im.naturalWidth, H0 = im.naturalHeight;
      var k = o.px ? Math.min(1, o.px / Math.max(W0, H0)) : 1;
      k = Math.min(k, Math.sqrt(DIEM_ANH_TOI_DA / (W0 * H0 * 1.2))); // chừa ~20% cho dải thông tin
      var w = Math.round(W0 * k), h = Math.round(H0 * k);
      var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
      var dai = soanDai(w, h, tt, ctx);
      cv.width = w; cv.height = h + dai.cao;
      ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); // JPEG không có nền trong suốt
      ctx.drawImage(im, 0, 0, w, h);
      dai.ve(ctx, h, kq[1]);
      return new Promise(function (ok, loi) {
        cv.toBlob(function (b) { cv.width = cv.height = 0; if (b) ok(b); else loi(new Error('Không xuất được ảnh')); }, o.png ? 'image/png' : 'image/jpeg', o.png ? undefined : (o.q || 0.92));
      });
    });
  }
  window.ANH_GUI = { idDrive: idDrive, taiAnh: taiAnh, veAnh: veAnh, CHAT_LUONG: CHAT_LUONG };
})();
