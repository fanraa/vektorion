var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
import_dotenv.default.config();
if (import_firebase_admin.default.apps.length === 0) {
  import_firebase_admin.default.initializeApp({
    projectId: "vektorion-25"
  });
}
var dbAdmin = import_firebase_admin.default.firestore();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "15mb" }));
  const genAI = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  app.post("/api/sync/kas", async (req, res) => {
    try {
      const authHeader = req.headers["x-sync-token"];
      const SECRET_TOKEN = process.env.SYNC_SECRET_TOKEN;
      if (!SECRET_TOKEN || authHeader !== SECRET_TOKEN) {
        console.warn("Unauthorized sync attempt from Apps Script");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { updates } = req.body;
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format. Expected { updates: [] }" });
      }
      const batch = dbAdmin.batch();
      for (const update of updates) {
        const { collectionPath, docId, data, method = "set" } = update;
        if (!collectionPath || !docId) continue;
        const docRef = dbAdmin.collection(collectionPath).doc(docId);
        if (method === "delete") {
          batch.delete(docRef);
        } else if (method === "update") {
          batch.update(docRef, { ...data, updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp() });
        } else {
          batch.set(docRef, { ...data, updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
      }
      await batch.commit();
      console.log(`Successfully synced ${updates.length} items from Spreadsheet`);
      res.json({ success: true, count: updates.length });
    } catch (error) {
      console.error("Sync Error:", error);
      res.status(500).json({ error: "Failed to sync data to Firestore" });
    }
  });
  app.post("/api/ai/generate-caption", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Image and mimeType are required" });
      }
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analisis gambar ini dan buatkan caption yang menarik untuk galeri angkatan kuliah. 
                     Berikan respons dalam format JSON: { "title": "Judul Singkat", "description": "Deskripsi menarik" }.
                     Gunakan Bahasa Indonesia yang santai tapi sopan.`;
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: image,
            mimeType
          }
        }
      ]);
      const response = await result.response;
      let text = response.text();
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0];
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0];
      }
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Gagal membuat caption AI" });
    }
  });
  app.post("/api/ai/check-receipt", async (req, res) => {
    try {
      const { image, mimeType, amount } = req.body;
      if (!image || !mimeType || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Sistem Deteksi Struk Kas Vektorion.
                     Tujuan: Verifikasi keaslian struk dan kesesuaian nominal.
                     Aturan Sangat Ketat: 
                     1. Nominal Wajib: Rp ${amount}. Jika di struk nominal berbeda (perhatikan angka dan titik/koma), valid = false.
                     2. Penerima Wajib: Nama penerima harus mengandung kata "Relyleaf". Jika tidak ada nama "Relyleaf" sebagai penerima transaksi, valid = false.
                     3. Keaslian UI: Wajib cari ciri khas Bank/E-Wallet resmi (BCA, Mandiri, BNI, Dana, Ovo, QRIS). Jika struk hanya teks editan (mentah) tanpa logo atau font perbankan yang spesifik, tandai TIDAK VALID.
                     4. Metadata Struk: Scan kode referensi, waktu transaksi, dan detail pengirim.
                     5. Ketajaman: Periksa distorsi pada area nominal. Jika terlihat editan (copy-paste font), valid = false.
                     6. Waktu Saat Ini: ${(/* @__PURE__ */ new Date()).toLocaleString("id-ID")}.
                     7. Batas Waktu: Struk WAJIB merupakan transaksi 3 jam terakhir dari waktu saat ini. Jika jam transaksi di struk lebih dari 3 jam yang lalu, valid = false.
                     Hasil harus JSON dalam format: { "valid": boolean, "reason": "Alasan spesifik jika tidak valid" }. 
                     PENTING: Jika tidak valid, berikan alasan yang jelas kenapa (misal: nominal tidak sesuai, penerima salah, atau struk lama).`;
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: image,
            mimeType
          }
        }
      ]);
      const response = await result.response;
      let text = response.text();
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0];
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0];
      }
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("AI Receipt Check Error:", error);
      res.status(500).json({ error: "Gagal memverifikasi struk via AI" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
