// ============================================================
// SHEET "HÌNH ẢNH SẢN PHẨM" – quản lý ảnh cho app Hiển Nga.
// Tab "Ảnh": Mã sản phẩm | Tên sản phẩm | Link Drive hình ảnh | Link ảnh 2 | Link ảnh 3 | Ghi chú
//   • Mã + Tên do máy chủ app tự điền từ bảng Giá (mã mới tự thêm dòng).
//   • Người lo ảnh chỉ dán link ảnh Google Drive vào cột "Link Drive hình ảnh".
// Menu 📷 Ảnh SP:
//   • Mở quyền xem cho các link ảnh – link Drive phải "Bất kỳ ai có liên kết" thì iPhone mới hiện.
//   • Quét thư mục ảnh (tùy chọn) – ảnh tải vào thư mục Drive, tên file = mã (GHT.BC6600T.jpg, _2, (2)…)
//     tự điền link vào đúng dòng.
// ============================================================
var TAB_ANH = 'Ảnh';
var TAB_HD = 'Hướng dẫn';
var TEN_THU_MUC = 'Ảnh sản phẩm Hiển Nga';
var TEN_THU_MUC_KHAC = ['Ảnh sản phẩm Hiền Nga'];
var TIEU_DE = ['Mã sản phẩm', 'Tên sản phẩm', 'Link Drive hình ảnh', 'Link ảnh 2', 'Link ảnh 3', 'Ghi chú'];
var DUOI_ANH = /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i;

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📷 Ảnh SP')
    .addItem('Mở quyền xem cho các link ảnh', 'moQuyenLink')
    .addSeparator()
    .addItem('Tạo thư mục ảnh + hướng dẫn', 'chuanBi')
    .addItem('Quét thư mục ảnh → điền link theo mã', 'quetAnh')
    .addItem('Bật tự quét thư mục mỗi giờ', 'batTuQuet')
    .addToUi();
}

function baoTin(msg) { try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); } }
function khongDau(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function laCotAnh(h) { var k = khongDau(h); return k.indexOf('link') >= 0 || k.indexOf('hinhanh') >= 0 || /^anh\d*$/.test(k); }
function idDrive(u) { var m = String(u || '').match(/\/d\/([\w-]{20,})/) || String(u || '').match(/[?&]id=([\w-]{20,})/); return m ? m[1] : ''; }

// Tab "Ảnh": tìm cột mã + các cột link theo tiêu đề (máy chủ app tạo sẵn tiêu đề và dòng mã).
function tabAnh() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(TAB_ANH);
  if (!sh) { sh = ss.insertSheet(TAB_ANH, 0); }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, TIEU_DE.length).setValues([TIEU_DE]).setFontWeight('bold').setBackground('#E3F2FD');
    sh.setFrozenRows(1);
  }
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], iMa = -1, cotLink = [];
  head.forEach(function (h, i) {
    var k = khongDau(h);
    if (iMa < 0 && (k === 'masanpham' || k === 'mahang' || k === 'mavattu' || k === 'ma')) iMa = i;
    else if (laCotAnh(h)) cotLink.push(i);
  });
  return { sh: sh, iMa: iMa, cotLink: cotLink };
}

// Mở quyền "Bất kỳ ai có đường liên kết – Người xem" cho mọi ảnh Drive đã dán trong tab Ảnh.
function moQuyenLink() {
  var t = tabAnh(), rows = t.sh.getDataRange().getValues(), da = {}, mo = 0, loi = 0, tong = 0;
  for (var r = 1; r < rows.length; r++) {
    t.cotLink.forEach(function (c) {
      String(rows[r][c] || '').split(/[\s,;]+/).forEach(function (u) {
        var id = idDrive(u);
        if (!id || da[id]) return;
        da[id] = 1; tong++;
        try {
          var f = DriveApp.getFileById(id), q = f.getSharingAccess();
          if (q !== DriveApp.Access.ANYONE_WITH_LINK && q !== DriveApp.Access.ANYONE) { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); mo++; }
        } catch (e) { loi++; }
      });
    });
  }
  ghiTrangThai('Mở quyền: ' + tong + ' ảnh, mở thêm ' + mo + (loi ? ', ' + loi + ' link không mở được (không phải file của tài khoản này / link sai)' : ''));
  baoTin('Đã kiểm tra ' + tong + ' ảnh.\nMở quyền xem thêm cho ' + mo + ' ảnh.' + (loi ? '\n' + loi + ' link không mở được – kiểm tra link có đúng là ảnh trong Drive của tài khoản này không.' : '') +
    '\n\nKhoảng 10 phút sau app sẽ hiện ảnh.');
}

function ghiTrangThai(s) {
  var hd = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_HD);
  if (hd) hd.getRange(3, 2).setValue(s + ' – lúc ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy'));
}

// ---------- Thư mục ảnh (tùy chọn) ----------
function thuMuc() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('THU_MUC_ANH'), f = null;
  if (id) { try { f = DriveApp.getFolderById(id); if (f.isTrashed()) f = null; } catch (e) { f = null; } }
  var ten = [TEN_THU_MUC].concat(TEN_THU_MUC_KHAC);
  for (var i = 0; i < ten.length && !f; i++) {
    var it = DriveApp.getFoldersByName(ten[i]);
    while (it.hasNext() && !f) { var x = it.next(); if (!x.isTrashed()) f = x; }
  }
  if (!f) f = DriveApp.createFolder(TEN_THU_MUC);
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
  p.setProperty('THU_MUC_ANH', f.getId());
  return f;
}

function chuanBi() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), f = thuMuc();
  tabAnh();
  var hd = ss.getSheetByName(TAB_HD) || ss.insertSheet(TAB_HD);
  var dong = [
    ['HÌNH ẢNH SẢN PHẨM – APP HIỂN NGA', ''],
    ['Thư mục ảnh (tùy chọn):', f.getUrl()],
    ['Lần xử lý gần nhất:', ''],
    ['', ''],
    ['CÁCH 1 – Dán link (đơn giản nhất):', ''],
    ['  • Tab "Ảnh" đã có sẵn Mã + Tên sản phẩm lấy từ bảng Giá.', ''],
    ['  • Mở ảnh trên Google Drive → Chia sẻ → Sao chép đường liên kết → dán vào cột "Link Drive hình ảnh" đúng dòng mã.', ''],
    ['  • Nhiều ảnh: dán vào "Link ảnh 2", "Link ảnh 3", hoặc nhiều link trong 1 ô (mỗi link 1 dòng).', ''],
    ['  • Dán xong bấm 📷 Ảnh SP → "Mở quyền xem cho các link ảnh" (để iPhone xem được).', ''],
    ['CÁCH 2 – Tải ảnh vào thư mục ở dòng 2, đặt tên file = mã (vd GHT.BC6600T.jpg, GHT.BC6600T_2.jpg), rồi bấm "Quét thư mục ảnh".', ''],
    ['', ''],
    ['Không đổi tên tab "Ảnh" và các tiêu đề cột. Không cần gõ mã/tên – máy chủ tự điền từ bảng Giá.', '']
  ];
  hd.clear();
  hd.getRange(1, 1, dong.length, 2).setValues(dong);
  hd.getRange(1, 1).setFontWeight('bold').setFontSize(13);
  hd.setColumnWidth(1, 620); hd.setColumnWidth(2, 420);
  baoTin('Đã chuẩn bị xong.\n\nThư mục ảnh: ' + f.getUrl());
}

// "GHT.BC6600T_2.jpg" -> {ma: "GHT.BC6600T", thuTu: 2}. Chỉ nhận đuôi _N hoặc (N) 1–2 chữ số
// (mã thật có thể chứa "-7", ".5", "_801" nên không cắt các phần đó).
function tachTenFile(ten) {
  var base = String(ten).replace(DUOI_ANH, '').trim();
  var m = base.match(/^(.+?)\s*(?:_(\d{1,2})|\((\d{1,2})\))$/);
  if (m) return { ma: m[1].trim(), thuTu: Number(m[2] || m[3]) };
  return { ma: base, thuTu: 1 };
}

function duyet(folder, theoMa, dem) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    if (f.isTrashed()) continue;
    var ten = f.getName();
    if (!DUOI_ANH.test(ten) && String(f.getMimeType()).indexOf('image/') !== 0) continue;
    dem.file++;
    try {
      var q = f.getSharingAccess();
      if (q !== DriveApp.Access.ANYONE_WITH_LINK && q !== DriveApp.Access.ANYONE) f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) { }
    var t = tachTenFile(ten);
    if (!t.ma) continue;
    var k = t.ma.toUpperCase();
    (theoMa[k] = theoMa[k] || { ma: t.ma, ds: [] }).ds.push({ thuTu: t.thuTu, ten: ten, id: f.getId() });
  }
  var con = folder.getFolders();
  while (con.hasNext()) { var c = con.next(); if (!c.isTrashed()) duyet(c, theoMa, dem); }
}

// Ảnh trong thư mục -> điền vào các cột link của đúng dòng mã (dòng chưa có thì thêm).
function quetAnh() {
  var t = tabAnh(), sh = t.sh, theoMa = {}, dem = { file: 0 };
  if (t.iMa < 0 || !t.cotLink.length) { baoTin('Tab "Ảnh" thiếu cột "Mã sản phẩm" hoặc cột "Link Drive hình ảnh".'); return; }
  duyet(thuMuc(), theoMa, dem);
  var rows = sh.getDataRange().getValues(), rong = rows[0].length, viTri = {};
  for (var i = 1; i < rows.length; i++) { var ma = String(rows[i][t.iMa] || '').trim(); if (ma) viTri[ma.toUpperCase()] = i; }
  var moi = 0, capNhat = 0;
  Object.keys(theoMa).forEach(function (k) {
    var x = theoMa[k];
    x.ds.sort(function (a, b) { return a.thuTu - b.thuTu || a.ten.localeCompare(b.ten); });
    var link = x.ds.map(function (a) { return 'https://drive.google.com/file/d/' + a.id + '/view'; });
    var r = viTri[k];
    if (r === undefined) { var d = []; for (var j = 0; j < rong; j++) d.push(''); d[t.iMa] = x.ma; rows.push(d); r = rows.length - 1; moi++; } else capNhat++;
    // Cột link cuối nhận phần còn lại (nhiều link trong 1 ô).
    t.cotLink.forEach(function (c, idx) {
      rows[r][c] = idx < t.cotLink.length - 1 ? (link[idx] || '') : link.slice(idx).join('\n');
    });
  });
  sh.getRange(1, 1, rows.length, rong).setValues(rows);
  var tom = dem.file + ' ảnh · ' + Object.keys(theoMa).length + ' mã (' + capNhat + ' cập nhật, ' + moi + ' mã không có trong bảng giá)';
  ghiTrangThai('Quét thư mục: ' + tom);
  try { SpreadsheetApp.getActiveSpreadsheet().toast(tom, '📷 Đã quét ảnh', 8); } catch (e) { }
}

function batTuQuet() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'quetAnh') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('quetAnh').timeBased().everyHours(1).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã bật tự quét thư mục ảnh mỗi giờ.', '📷 Ảnh SP', 5);
}
