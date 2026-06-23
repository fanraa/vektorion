 * VEKTORION SPREADSHEET SYNC SCRIPT v2.1
 * --------------------------------------
 * Gunakan kode ini di Google Apps Script (Extensions > Apps Script).
 * 
 * Pengaturan:
 * 1. APP_URL: Masukkan URL web Vektorion kamu (tanpa garis miring di akhir).
 */

const APP_URL = "https://ais-dev-zeq4q6g7mtj4ya4jl63pvs-56491373313.asia-southeast1.run.app"; // Ganti dengan URL web kamu

const WEEKLY_TARGET_DEFAULT = 2000;
const START_ROW = 6;
const START_COL = 4;
const YEAR_REGEX = /\b(202[6-9]|2030)\b/;

const YEARS = ["2026", "2027", "2028", "2029", "2030"];
const MONTHS = [
  "januari", "februari", "maret", "april", "mei", "juni",
  "juli", "agustus", "september", "oktober", "november", "desember"
];

/**
 * Membuat menu manual di spreadsheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Vektorion Sync")
    .addItem("Sinkronkan Semua Data ke Firebase", "syncAllByYear")
    .addToUi();
}

/**
 * Trigger Otomatis saat edit.
 */
function handleEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();

  if (isKasSheet(sheetName)) {
    handleKasEdit(e, sheet, sheetName);
    return;
  }

  if (sheetName === "Pengeluaran") {
    const year = getExpenseYearFromEditedRow(sheet, e.range.getRow()) || "2026";
    syncExpensesToFirestore(year);
    syncSummaryToFirestore(getKasSheetByYear(year), year);
    return;
  }

  if (sheetName === "Anggota Keluar") {
    syncAllSummaryOnly();
    return;
  }
}

/**
 * Menangani edit pada sheet Kas.
 */
function handleKasEdit(e, sheet, sheetName) {
  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (row < START_ROW) return;

  const year = sheetName.replace("Kas ", "").trim();
  const weekCount = getWeekCount(year);
  const endCol = START_COL + weekCount - 1;

  if (col >= START_COL && col <= endCol) {
    const amount = parseAmount(e.range.getValue());
    const weeklyTarget = getWeeklyTarget(sheet, col);

    if (amount > weeklyTarget) {
      // Jika pembayaran besar, bagi ke kolom lain secara otomatis
      distributePayment(sheet, row, col, amount, weekCount);
      SpreadsheetApp.flush();
      syncChangedRowActivities(sheet, row, year, amount);
    } else if (amount <= 0) {
      // Jika dihapus, rapatkan pembayaran ke kiri
      compactRowPayments(sheet, row, weekCount);
      SpreadsheetApp.flush();
      syncChangedRowActivities(sheet, row, year, 0);
    } else {
      // Pembayaran Normal
      const oldVal = parseAmount(e.oldValue);
      const diff = amount - oldVal;
      syncChangedRowActivities(sheet, row, year, diff > 0 ? diff : 0);
    }

    syncSingleMemberToFirestore(sheet, row, year);
    syncSummaryToFirestore(sheet, year);
    return;
  }

  // Jika edit di luar kolom pembayaran (misal edit Nama/NIM)
  if (col < START_COL) {
    syncSingleMemberToFirestore(sheet, row, year);
    syncChangedRowActivities(sheet, row, year);
    syncSummaryToFirestore(sheet, year);
  }
}

/**
 * Merapikan pembayaran dalam satu baris (Shift Left).
 */
function compactRowPayments(sheet, row, weekCount) {
  const range = sheet.getRange(row, START_COL, 1, weekCount);
  const values = range.getValues()[0];
  const filledValues = values.filter(v => parseAmount(v) > 0);
  const compacted = Array(weekCount).fill("").map((_, i) => filledValues[i] || "");
  range.setValues([compacted]);
}

/**
 * Membagi pembayaran besar ke kolom minggu secara beruntun.
 */
function distributePayment(sheet, row, editedCol, amount, weekCount) {
  const range = sheet.getRange(row, START_COL, 1, weekCount);
  const values = range.getValues()[0];
  const targets = sheet.getRange(3, START_COL, 1, weekCount).getValues()[0];

  const editedIndex = editedCol - START_COL;
  values[editedIndex] = ""; // Kosongkan sel yang diedit karena akan diredistribusi

  let remaining = amount;
  const order = [];

  // Urutan pengisian: dari index edit ke kanan, lalu putar ke kiri jika sisa
  for (let i = editedIndex; i < weekCount; i++) order.push(i);
  for (let i = editedIndex - 1; i >= 0; i--) order.push(i);

  order.forEach(index => {
    if (remaining <= 0) return;
    const target = parseAmount(targets[index]) || WEEKLY_TARGET_DEFAULT;
    const current = parseAmount(values[index]);
    if (current >= target) return;

    const need = target - current;
    const add = Math.min(need, remaining);
    values[index] = current + add;
    remaining -= add;
  });

  // Jika masih sisa setelah semua target penuh, masukkan sebagai dana lebih di sel edit
  if (remaining > 0) {
    values[editedIndex] = parseAmount(values[editedIndex]) + remaining;
  }

  range.setValues([values]);
}

/**
 * Sinkronisasi Utama: Mengirim data ke Web Backend (Proxy ke Firestore).
 */
function sendToWebBackend(path, data, method = "patch") {
  const url = APP_URL + "/api/sync/spreadsheet";
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      path: path,
      data: data,
      method: method
    }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code !== 200) {
      Logger.log("ERROR [" + code + "] Sync " + path + ": " + response.getContentText());
    } else {
      Logger.log("SUCCESS Sync " + path);
    }
  } catch (e) {
    Logger.log("CRITICAL Sync Error: " + e.toString());
  }
}

/**
 * Fitur Sinkron Semua Data.
 */
function syncAllByYear() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  YEARS.forEach(year => {
    const sheet = ss.getSheetByName("Kas " + year);
    if (sheet) syncSheetToFirestore(sheet, year);
    syncExpensesToFirestore(year);
    syncFormerMembersToFirestore(year);
    syncSummaryToFirestore(sheet, year);
  });
  SpreadsheetApp.getUi().alert("Sinkronisasi Selesai!");
}

function syncAllSummaryOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  YEARS.forEach(year => {
    const sheet = ss.getSheetByName("Kas " + year);
    syncExpensesToFirestore(year);
    syncFormerMembersToFirestore(year);
    syncSummaryToFirestore(sheet, year);
  });
}

function syncSheetToFirestore(sheet, year) {
  const lastRow = sheet.getLastRow();
  if (lastRow < START_ROW) return;
  for (let row = START_ROW; row <= lastRow; row++) {
    syncSingleMemberToFirestore(sheet, row, year);
    syncChangedRowActivities(sheet, row, year);
  }
}

function syncSingleMemberToFirestore(sheet, rowIdx, year) {
  const weekCount = getWeekCount(year);
  const rowData = sheet.getRange(rowIdx, 1, 1, START_COL + weekCount - 1).getValues()[0];
  const targets = sheet.getRange(3, START_COL, 1, weekCount).getValues()[0];

  const no = rowData[0], nama = rowData[1], nim = String(rowData[2] || "").trim();
  if (!nama || !nim || nama.toLowerCase().includes("total")) return;

  const values = rowData.slice(START_COL - 1, START_COL - 1 + weekCount);
  const payments = {};
  let totalLunas = 0, totalTagihan = 0, colIdx = 0;

  MONTHS.forEach((month, mIdx) => {
    if (String(year) === "2026" && mIdx === 0) return;
    const weeks = {};
    for (let w = 1; w <= 4; w++) {
      const val = parseAmount(values[colIdx]);
      const target = parseAmount(targets[colIdx]) || WEEKLY_TARGET_DEFAULT;
      weeks["minggu" + w] = val;
      totalLunas += val;
      totalTagihan += target;
      colIdx++;
    }
    payments[month] = weeks;
  });

  const payload = {
    no: Number(no || 0),
    nama: String(nama || ""),
    nim: nim,
    tahun: String(year),
    payments: payments,
    totalLunas: totalLunas,
    totalTagihan: totalTagihan,
    totalTunggak: Math.max(0, totalTagihan - totalLunas),
    status: totalLunas >= totalTagihan ? "LUNAS" : "TUNGGAKAN",
    updatedAt: new Date().toISOString()
  };

  sendToWebBackend("v2_kas_data/" + year + "/members/" + nim, payload);
}

function syncChangedRowActivities(sheet, row, year, addedAmount) {
  const nim = String(sheet.getRange(row, 3).getValue() || "").trim();
  const nama = String(sheet.getRange(row, 2).getValue() || "").trim();
  if (!nim || !nama || nama.toLowerCase().includes("total")) return;

  const weekCount = getWeekCount(year);
  const values = sheet.getRange(row, START_COL, 1, weekCount).getValues()[0];
  let totalPaid = values.reduce((sum, v) => sum + parseAmount(v), 0);

  const docId = year + "_" + nim + "_last_edit";
  if (totalPaid <= 0) {
    sendToWebBackend("v2_kas_activity/" + docId, {}, "delete");
    return;
  }

  const payload = {
    type: "in",
    tahun: String(year),
    nama: nama,
    nim: nim,
    nominal: totalPaid,
    added: Number(addedAmount || 0),
    lastUpdated: new Date().toISOString()
  };

  sendToWebBackend("v2_kas_activity/" + docId, payload);
}

function syncSummaryToFirestore(sheet, yearStr) {
  const year = String(yearStr);
  const targetSheet = sheet || getKasSheetByYear(year);
  const totalAktif = targetSheet ? calculateActiveMemberIncome(targetSheet, year) : 0;
  const totalKeluar = calculateFormerMemberIncome(year);
  const totalPemasukan = totalAktif + totalKeluar;
  const totalPengeluaran = calculateYearExpense(year);
  const saldo = totalPemasukan - totalPengeluaran;

  sendToWebBackend("v2_kas_summary/" + year, {
    tahun: year,
    totalPemasukan,
    pemasukanAnggotaAktif: totalAktif,
    pemasukanAnggotaKeluar: totalKeluar,
    totalPengeluaran,
    saldo,
    lastUpdated: new Date().toISOString()
  });
}

function syncExpensesToFirestore(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Pengeluaran");
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  const targetYear = String(year);

  for (let i = 6; i < values.length; i++) {
    const rowYear = String(values[i][0] || "").trim();
    const normalizedYear = rowYear || "2026";
    const docId = "expense_" + targetYear + "_row_" + (i + 1);
    const amount = parseAmount(values[i][5]);

    if (normalizedYear !== targetYear || !values[i][1] || amount <= 0) {
      sendToWebBackend("v2_kas_expenses/" + docId, {}, "delete");
      continue;
    }

    sendToWebBackend("v2_kas_expenses/" + docId, {
      tahun: normalizedYear,
      bulan: String(values[i][1]),
      tanggal: String(values[i][2] || "1"),
      kategori: String(values[i][3]),
      keterangan: String(values[i][4]),
      nominal: amount,
      catatan: String(values[i][6]),
      sourceRow: i + 1,
      lastUpdated: new Date().toISOString()
    });
  }
}

function syncFormerMembersToFirestore(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Anggota Keluar");
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  const targetYear = String(year);

  for (let i = 1; i < values.length; i++) {
    const nama = String(values[i][1] || "").trim();
    const amount = parseAmount(values[i][3]);
    const rowYear = "2026"; // Default mapping

    if (nama && amount > 0 && rowYear === targetYear) {
      const docId = "former_" + targetYear + "_row_" + (i + 1);
      sendToWebBackend("v2_kas_former/" + docId, {
        no: Number(values[i][0] || 0),
        nama,
        keterangan: String(values[i][2]),
        nominal: amount,
        catatan: String(values[i][4]),
        tahun: rowYear,
        sourceRow: i + 1,
        lastUpdated: new Date().toISOString()
      });
    }
  }
}

// --- HELPERS ---

function calculateActiveMemberIncome(sheet, year) {
  const lastRow = sheet.getLastRow();
  const weekCount = getWeekCount(year);
  if (lastRow < START_ROW) return 0;
  const data = sheet.getRange(START_ROW, 1, lastRow - START_ROW + 1, START_COL + weekCount - 1).getValues();
  let total = 0;
  data.forEach(row => {
    if (!row[1] || String(row[1]).toLowerCase().includes("total")) return;
    for (let i = START_COL - 1; i < START_COL - 1 + weekCount; i++) total += parseAmount(row[i]);
  });
  return total;
}

function calculateFormerMemberIncome(year) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Anggota Keluar");
  if (!sheet) return 0;
  const data = sheet.getDataRange().getValues();
  let total = 0;
  for (let i = 1; i < data.length; i++) {
    if (parseAmount(data[i][3]) > 0 && "2026" === String(year)) total += parseAmount(data[i][3]);
  }
  return total;
}

function calculateYearExpense(year) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pengeluaran");
  if (!sheet) return 0;
  const data = sheet.getDataRange().getValues();
  let total = 0;
  for (let i = 6; i < data.length; i++) {
    const rYear = String(data[i][0] || "2026").trim();
    if (rYear === String(year)) total += parseAmount(data[i][5]);
  }
  return total;
}

function parseAmount(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  let s = String(val).toLowerCase().replace(/rp|\s/g, "");
  let mul = 1;
  if (s.includes("jt")) { mul = 1e6; s = s.replace("jt", ""); }
  else if (s.includes("rb") || s.includes("k")) { mul = 1e3; s = s.replace(/rb|k/g, ""); }
  s = s.replace(/,/g, ".");
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num * mul;
}

function getWeekCount(year) { return String(year) === "2026" ? 44 : 48; }
function isKasSheet(name) { return /^Kas 20(26|27|28|29|30)$/.test(name); }
function getKasSheetByYear(year) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kas " + year); }
function getExpenseYearFromEditedRow(sheet, row) { return row < 7 ? "" : String(sheet.getRange(row, 1).getValue()).trim(); }
function getWeeklyTarget(sheet, col) { return parseAmount(sheet.getRange(3, col).getValue()) || WEEKLY_TARGET_DEFAULT; }
