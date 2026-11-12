// ============================================================
// Bộ tạo file Excel (.xlsx) tự viết – không dùng thư viện ngoài.
// .xlsx = gói ZIP các file XML (Office Open XML). Ở đây nén kiểu STORE (không nén) cho gọn mã.
// Hỗ trợ: nhiều trang tính, chữ / số / công thức, kiểu ô (đậm, màu nền, viền, định dạng số, căn lề),
// độ rộng cột, gộp ô, cố định dòng tiêu đề, bộ lọc, in ngang vừa 1 trang bề ngang, lặp tiêu đề khi in.
// Dùng: XLSX_HN.taiVe('ten.xlsx', { trang: [{ ten, cot: [rộng…], hang: [[ô…]], codinh: 5, loc: 'A5:Q80', gop: ['A1:Q1'], inLap: '5:5' }] })
//   ô = giá trị (chữ / số) | null | { v, s: 'kiểu', f: 'công thức không có dấu =' }
// ============================================================
(function () {
  'use strict';
  // ---------- Kiểu ô ----------
  var MAU = { xanh: 'FF0140FF', xanhDam: 'FF0030C2', do: 'FFB42318', nenDo: 'FFFDECEA', nenCam: 'FFFFF1DC', nenXanhLa: 'FFE7F5EC', nenXam: 'FFF3F4F6', nenTong: 'FFE3ECFF', nenTieuDe: 'FFF5F8FF', vien: 'FFD0D5DD', chuXam: 'FF667085', chuCam: 'FF9A5B00', chuXanhLa: 'FF1F7A3A' };
  // font: [đậm, nghiêng, cỡ, màu]
  var FONT = [[0, 0, 11, ''], [1, 0, 11, ''], [1, 0, 16, MAU.xanhDam], [0, 1, 10, MAU.chuXam], [1, 0, 11, 'FFFFFFFF'], [1, 0, 11, MAU.do], [1, 0, 11, MAU.chuCam], [1, 0, 11, MAU.chuXanhLa], [1, 0, 12, MAU.xanhDam], [0, 0, 10, MAU.chuXam]];
  var NEN = ['', '', MAU.xanh, MAU.nenDo, MAU.nenCam, MAU.nenXanhLa, MAU.nenXam, MAU.nenTong, MAU.nenTieuDe];
  // Kiểu đặt tên: { font, nen, vien (0/1), so (numFmtId), ngang ('left'|'center'|'right'), xuong (wrap) }
  var KIEU = {
    thuong: { vien: 1 }, chu: { vien: 1 }, chuXuong: { vien: 1, xuong: 1 }, giua: { vien: 1, ngang: 'center' },
    so: { vien: 1, so: 0 }, phanTram: { vien: 1, so: 10, ngang: 'right' }, soNguyen: { vien: 1, so: 3 }, tien: { vien: 1, so: 3 }, ngay: { vien: 1, so: 166, ngang: 'center' },
    tieuDe: { font: 2 }, phu: { font: 3 }, ghi: { font: 9, xuong: 0 }, nhan: { font: 8 },
    dau: { font: 4, nen: 2, vien: 1, ngang: 'center', xuong: 1 },
    tong: { font: 1, nen: 7, vien: 1 }, tongSo: { font: 1, nen: 7, vien: 1, so: 0 }, tongTien: { font: 1, nen: 7, vien: 1, so: 3 },
    oTheNhan: { font: 9, nen: 8, vien: 1 }, oTheSo: { font: 8, nen: 8, vien: 1, so: 3, ngang: 'left' },
    ttDo: { font: 5, nen: 3, vien: 1, ngang: 'center' }, ttCam: { font: 6, nen: 4, vien: 1, ngang: 'center' }, ttXanh: { font: 7, nen: 5, vien: 1, ngang: 'center' }, ttXam: { font: 9, nen: 6, vien: 1, ngang: 'center' },
    soDo: { font: 5, vien: 1, so: 0 }, soCam: { font: 6, vien: 1, so: 0 }, soXanh: { font: 7, vien: 1, so: 0 }
  };
  var TEN_KIEU = Object.keys(KIEU), CHI_SO = {}; TEN_KIEU.forEach(function (k, i) { CHI_SO[k] = i + 1; }); // 0 = mặc định

  function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function chuCot(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

  function stylesXml() {
    var fonts = FONT.map(function (f) {
      return '<font>' + (f[0] ? '<b/>' : '') + (f[1] ? '<i/>' : '') + '<sz val="' + f[2] + '"/>' + (f[3] ? '<color rgb="' + f[3] + '"/>' : '') + '<name val="Calibri"/><family val="2"/></font>';
    }).join('');
    var fills = '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      NEN.slice(2).map(function (c) { return '<fill><patternFill patternType="solid"><fgColor rgb="' + c + '"/><bgColor indexed="64"/></patternFill></fill>'; }).join('');
    var b = '<left style="thin"><color rgb="' + MAU.vien + '"/></left><right style="thin"><color rgb="' + MAU.vien + '"/></right><top style="thin"><color rgb="' + MAU.vien + '"/></top><bottom style="thin"><color rgb="' + MAU.vien + '"/></bottom><diagonal/>';
    var borders = '<border><left/><right/><top/><bottom/><diagonal/></border><border>' + b + '</border>';
    var xf = function (k) {
      var fid = k.font || 0, nen = k.nen || 0, vien = k.vien || 0, so = k.so || 0;
      var al = k.ngang || k.xuong ? '<alignment' + (k.ngang ? ' horizontal="' + k.ngang + '"' : '') + ' vertical="center"' + (k.xuong ? ' wrapText="1"' : '') + '/>' : '<alignment vertical="center"/>';
      return '<xf numFmtId="' + so + '" fontId="' + fid + '" fillId="' + nen + '" borderId="' + vien + '" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + al + '</xf>';
    };
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="1"><numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm"/></numFmts>' +
      '<fonts count="' + FONT.length + '">' + fonts + '</fonts><fills count="' + (NEN.length) + '">' + fills + '</fills><borders count="2">' + borders + '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + (TEN_KIEU.length + 1) + '"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' + TEN_KIEU.map(function (n) { return xf(KIEU[n]); }).join('') + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  function sheetXml(t) {
    var hang = t.hang || [], x = [];
    x.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
    x.push('<sheetPr>' + (t.mauTab ? '<tabColor rgb="' + t.mauTab + '"/>' : '') + '<pageSetUpPr fitToPage="1"/></sheetPr>');
    x.push('<sheetViews><sheetView workbookViewId="0"' + (t.chon ? ' tabSelected="1"' : '') + ' zoomScale="100">' +
      (t.codinh ? '<pane ySplit="' + t.codinh + '" topLeftCell="A' + (t.codinh + 1) + '" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A' + (t.codinh + 1) + '" sqref="A' + (t.codinh + 1) + '"/>' : '') +
      '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>');
    if (t.cot && t.cot.length) x.push('<cols>' + t.cot.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>');
    x.push('<sheetData>');
    hang.forEach(function (r, i) {
      if (!r) { x.push('<row r="' + (i + 1) + '"/>'); return; }
      var cao = r.cao ? ' ht="' + r.cao + '" customHeight="1"' : '';
      var o = r.o || r;
      x.push('<row r="' + (i + 1) + '"' + cao + '>');
      o.forEach(function (c, j) {
        if (c === null || c === undefined || c === '') return;
        var ob = typeof c === 'object' ? c : { v: c }, ref = chuCot(j) + (i + 1);
        var s = ob.s && CHI_SO[ob.s] ? ' s="' + CHI_SO[ob.s] + '"' : '';
        if (ob.f) x.push('<c r="' + ref + '"' + s + '><f>' + xmlEsc(ob.f) + '</f></c>');
        else if (ob.v === null || ob.v === undefined || ob.v === '') x.push('<c r="' + ref + '"' + s + '/>');
        else if (typeof ob.v === 'number' && isFinite(ob.v)) x.push('<c r="' + ref + '"' + s + '><v>' + ob.v + '</v></c>');
        else if (ob.v instanceof Date) x.push('<c r="' + ref + '"' + s + '><v>' + (ob.v.getTime() / 86400000 + 25569 - ob.v.getTimezoneOffset() / 1440) + '</v></c>');
        else x.push('<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(ob.v) + '</t></is></c>');
      });
      x.push('</row>');
    });
    x.push('</sheetData>');
    if (t.loc) x.push('<autoFilter ref="' + t.loc + '"/>');
    if (t.gop && t.gop.length) x.push('<mergeCells count="' + t.gop.length + '">' + t.gop.map(function (g) { return '<mergeCell ref="' + g + '"/>'; }).join('') + '</mergeCells>');
    x.push('<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>');
    x.push('<pageSetup paperSize="9" orientation="' + (t.inDoc ? 'portrait' : 'landscape') + '" fitToWidth="1" fitToHeight="0"/>');
    x.push('<headerFooter><oddFooter>&amp;L' + xmlEsc(t.chanTrang || '') + '&amp;RTrang &amp;P / &amp;N</oddFooter></headerFooter>');
    x.push('</worksheet>');
    return x.join('');
  }

  function workbookXml(trang) {
    var dn = [];
    trang.forEach(function (t, i) {
      var ten = "'" + t.ten.replace(/'/g, "''") + "'";
      if (t.loc) dn.push('<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">' + xmlEsc(ten + '!' + t.loc.replace(/([A-Z]+)(\d+)/g, '$$$1$$$2')) + '</definedName>');
      if (t.inLap) dn.push('<definedName name="_xlnm.Print_Titles" localSheetId="' + i + '">' + xmlEsc(ten + '!$' + t.inLap.replace(':', ':$')) + '</definedName>');
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="15000" activeTab="0"/></bookViews><sheets>' +
      trang.map(function (t, i) { return '<sheet name="' + xmlEsc(t.ten) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>' +
      (dn.length ? '<definedNames>' + dn.join('') + '</definedNames>' : '') + '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
  }

  function tepXlsx(sach) {
    var tr = sach.trang;
    tr.forEach(function (t, i) { t.ten = String(t.ten).replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31); t.chon = i === 0; });
    var tep = [];
    tep.push(['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      tr.map(function (t, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>']);
    tep.push(['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>']);
    var nay = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    tep.push(['docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>' + xmlEsc(sach.tieuDe || '') + '</dc:title><dc:creator>' + xmlEsc(sach.tacGia || '') + '</dc:creator>' +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + nay + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + nay + '</dcterms:modified></cp:coreProperties>']);
    tep.push(['docProps/app.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>']);
    tep.push(['xl/workbook.xml', workbookXml(tr)]);
    tep.push(['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      tr.map(function (t, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (tr.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']);
    tep.push(['xl/styles.xml', stylesXml()]);
    tr.forEach(function (t, i) { tep.push(['xl/worksheets/sheet' + (i + 1) + '.xml', sheetXml(t)]); });
    return zip(tep);
  }

  // ---------- ZIP (STORE) ----------
  var BANG_CRC = (function () { var b = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; b[n] = c >>> 0; } return b; })();
  function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = BANG_CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function zip(tep) {
    var phan = [], tt = [], vt = 0, d = new Date();
    var gio = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), ngay = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    tep.forEach(function (t) {
      var ten = utf8(t[0]), du = utf8(t[1]), crc = crc32(du);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, gio, true); h.setUint16(12, ngay, true); h.setUint32(14, crc, true); h.setUint32(18, du.length, true); h.setUint32(22, du.length, true);
      h.setUint16(26, ten.length, true); h.setUint16(28, 0, true);
      phan.push(new Uint8Array(h.buffer), ten, du);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, gio, true); c.setUint16(14, ngay, true); c.setUint32(16, crc, true); c.setUint32(20, du.length, true); c.setUint32(24, du.length, true);
      c.setUint16(28, ten.length, true); c.setUint32(42, vt, true);
      tt.push(new Uint8Array(c.buffer), ten);
      vt += 30 + ten.length + du.length;
    });
    var coTT = tt.reduce(function (s, x) { return s + x.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, tep.length, true); e.setUint16(10, tep.length, true); e.setUint32(12, coTT, true); e.setUint32(16, vt, true);
    return new Blob(phan.concat(tt, [new Uint8Array(e.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function taiVe(tenTep, sach) {
    var blob = tepXlsx(sach), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = tenTep;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return blob;
  }
  window.XLSX_HN = { tao: tepXlsx, taiVe: taiVe, chuCot: chuCot };
})();
