// ============================================================
// SHEET "HÌNH ẢNH SẢN PHẨM" – quản lý ảnh cho app Hiển Nga.
// Cách dùng: tải ảnh lên thư mục Drive "Ảnh sản phẩm Hiển Nga", đặt TÊN FILE = MÃ VẬT TƯ
//   GHT.BC6600T.jpg  (ảnh 1)   GHT.BC6600T_2.jpg  GHT.BC6600T (3).jpg  (ảnh 2, 3…)
// rồi bấm menu 📷 Ảnh SP → Quét. Sheet ghi link ảnh vào tab "Ảnh"; máy chủ app đọc tab này.
// Cũng có thể dán thẳng link ảnh (Drive / web) vào cột Ảnh 1, Ảnh 2… của tab "Ảnh".
// ============================================================
var TAB_ANH = 'Ảnh';
var TAB_HD = 'Hướng dẫn';
var TEN_THU_MUC = 'Ảnh sản phẩm Hiển Nga';
var TEN_THU_MUC_KHAC = ['Ảnh sản phẩm Hiền Nga', 'Ảnh sản phẩm Hiển Nga ']; // thư mục có thể đã tạo ở Bước 0
var SO_COT_ANH = 6;
var DUOI_ANH = /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i;

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📷 Ảnh SP')
    .addItem('1. Chuẩn bị (tạo thư mục ảnh + tab)', 'chuanBi')
    .addItem('2. Quét thư mục ảnh → cập nhật tab Ảnh', 'quetAnh')
    .addSeparator()
    .addItem('Mở thư mục ảnh', 'moThuMuc')
    .addItem('Bật tự quét mỗi giờ', 'batTuQuet')
    .addToUi();
}

function baoTin(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

// Thư mục ảnh: dùng lại thư mục đã có (theo tên), không có thì tạo mới. Mở quyền
// "Bất kỳ ai có đường liên kết – Người xem" – thiếu bước này iPhone không hiện ảnh.
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

function tabAnh(ss) {
  var sh = ss.getSheetByName(TAB_ANH);
  if (!sh) {
    sh = ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0 ? ss.getSheets()[0].setName(TAB_ANH) : ss.insertSheet(TAB_ANH, 0);
  }
  if (sh.getLastRow() === 0) {
    var td = ['Mã vật tư'];
    for (var i = 1; i <= SO_COT_ANH; i++) td.push('Ảnh ' + i);
    td.push('Ghi chú');
    sh.getRange(1, 1, 1, td.length).setValues([td]).setFontWeight('bold').setBackground('#E3F2FD');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160);
  }
  return sh;
}

function chuanBi() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), f = thuMuc();
  tabAnh(ss);
  var hd = ss.getSheetByName(TAB_HD) || ss.insertSheet(TAB_HD);
  var dong = [
    ['HÌNH ẢNH SẢN PHẨM – APP HIỂN NGA', ''],
    ['Thư mục ảnh (bấm để mở):', f.getUrl()],
    ['Lần quét gần nhất:', '(chưa quét)'],
    ['', ''],
    ['CÁCH 1 – Tải ảnh lên thư mục (khuyên dùng):', ''],
    ['  • Đặt tên file ĐÚNG mã vật tư, vd GHT.BC6600T.jpg', ''],
    ['  • Nhiều ảnh cho 1 mã: thêm _2, _3 hoặc (2), (3): GHT.BC6600T_2.jpg', ''],
    ['  • Được để ảnh trong thư mục con (vd theo hãng) – vẫn quét được.', ''],
    ['  • Xong bấm menu 📷 Ảnh SP → 2. Quét thư mục ảnh.', ''],
    ['CÁCH 2 – Dán link: tab "Ảnh", cột Mã vật tư + Ảnh 1, Ảnh 2… (link Drive phải chia sẻ "Bất kỳ ai có liên kết").', ''],
    ['', ''],
    ['Lưu ý: ảnh nên nhẹ (dưới 1–2 MB), chụp vuông hoặc ngang. Không đổi tên tab "Ảnh".', '']
  ];
  hd.clear();
  hd.getRange(1, 1, dong.length, 2).setValues(dong);
  hd.getRange(1, 1).setFontWeight('bold').setFontSize(13);
  hd.setColumnWidth(1, 520); hd.setColumnWidth(2, 460);
  baoTin('Đã chuẩn bị xong.\n\nThư mục ảnh: ' + f.getName() + '\n' + f.getUrl() +
    '\n\nTải ảnh vào thư mục này, đặt tên file = mã vật tư, rồi bấm 📷 Ảnh SP → 2. Quét.');
}

function moThuMuc() {
  var url = thuMuc().getUrl();
  var html = HtmlService.createHtmlOutput('<p style="font:14px sans-serif">Thư mục ảnh: <a href="' + url + '" target="_blank">mở thư mục</a></p>').setWidth(360).setHeight(90);
  SpreadsheetApp.getUi().showModalDialog(html, 'Ảnh sản phẩm');
}

// "GHT.BC6600T_2.jpg" -> {ma: "GHT.BC6600T", thuTu: 2}. Chỉ nhận đuôi _N hoặc (N) có 1–2 chữ số
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
    // Ảnh tải lên thường kế thừa quyền của thư mục; ảnh nào còn "Riêng tư" thì mở quyền xem bằng link.
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

function quetAnh() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), f = thuMuc(), sh = tabAnh(ss);
  var theoMa = {}, dem = { file: 0 };
  duyet(f, theoMa, dem);

  var rows = sh.getDataRange().getValues(), rong = Math.max(rows[0].length, SO_COT_ANH + 2);
  rows = rows.map(function (r) { while (r.length < rong) r.push(''); return r; });
  var viTri = {};
  for (var i = 1; i < rows.length; i++) { var ma = String(rows[i][0] || '').trim(); if (ma) viTri[ma.toUpperCase()] = i; }

  var moi = 0, capNhat = 0;
  Object.keys(theoMa).forEach(function (k) {
    var x = theoMa[k];
    x.ds.sort(function (a, b) { return a.thuTu - b.thuTu || a.ten.localeCompare(b.ten); });
    var link = x.ds.slice(0, SO_COT_ANH).map(function (a) { return 'https://drive.google.com/file/d/' + a.id + '/view'; });
    while (link.length < SO_COT_ANH) link.push('');
    var r = viTri[k];
    if (r === undefined) {
      var dongMoi = [x.ma].concat(link); while (dongMoi.length < rong) dongMoi.push('');
      rows.push(dongMoi); moi++;
    } else {
      for (var j = 0; j < SO_COT_ANH; j++) rows[r][1 + j] = link[j];
      capNhat++;
    }
  });
  sh.getRange(1, 1, rows.length, rong).setValues(rows);

  var luc = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy');
  var tom = dem.file + ' ảnh · ' + Object.keys(theoMa).length + ' mã (' + moi + ' mã mới, ' + capNhat + ' cập nhật) – lúc ' + luc;
  var hd = ss.getSheetByName(TAB_HD);
  if (hd) hd.getRange(3, 2).setValue(tom);
  try { ss.toast(tom, '📷 Đã quét ảnh', 8); } catch (e) { }
  return tom;
}

function batTuQuet() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'quetAnh') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('quetAnh').timeBased().everyHours(1).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã bật tự quét ảnh mỗi giờ.', '📷 Ảnh SP', 5);
}
