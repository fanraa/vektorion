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
var import_openai = __toESM(require("openai"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_firestore = require("firebase-admin/firestore");
var import_fs = __toESM(require("fs"), 1);
console.log("[SERVER_START] Initializing...");
import_dotenv.default.config();
async function startServer() {
  console.log("[SERVER_BOOT] Initializing startServer()...");
  let projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  let customDatabaseId = "";
  try {
    const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
    if (import_fs.default.existsSync(configPath)) {
      const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
      if (config.projectId) {
        projectId = config.projectId;
      }
      if (config.firestoreDatabaseId) {
        customDatabaseId = config.firestoreDatabaseId;
      }
      console.log(`[FIREBASE] Config loaded. Project: ${projectId}, DB: ${customDatabaseId || "(default)"}`);
    }
  } catch (e) {
    console.warn("[FIREBASE] Could not load config file.");
  }
  if (import_firebase_admin.default.apps.length === 0) {
    try {
      console.log(`[FIREBASE] Initializing Admin for Project: ${projectId}...`);
      import_firebase_admin.default.initializeApp({
        credential: import_firebase_admin.default.credential.applicationDefault(),
        projectId
      });
      console.log("[FIREBASE] Admin initialized with ADC.");
    } catch (e) {
      console.log("[FIREBASE] ADC initialization failed, trying simple init...");
      try {
        import_firebase_admin.default.initializeApp({ projectId });
        console.log("[FIREBASE] Admin initialized with Project ID fallback.");
      } catch (err2) {
        console.error("[FIREBASE] All Admin initialization attempts failed:", err2.message);
      }
    }
  }
  const dbAdmin = customDatabaseId ? (0, import_firestore.getFirestore)(customDatabaseId) : (0, import_firestore.getFirestore)();
  try {
    await dbAdmin.collection("test").limit(1).get();
    console.log("[FIREBASE] Firestore connection verified.");
  } catch (testError) {
    console.error(`[FIREBASE] Firestore check FAILED [Project: ${projectId}]:`, testError.message);
  }
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "15mb" }));
  app.post("/api/sync/kas", async (req, res) => {
    try {
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
  function maskKey(key) {
    if (!key) return "NOT_SET";
    if (key.length < 10) return "***";
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }
  async function getAIProvider() {
    let provider = "Google (Gemini)";
    let apiKey = process.env.GEMINI_API_KEY || "";
    try {
      const snap = await dbAdmin.collection("appConfig").doc("systemSettings").get();
      if (snap.exists) {
        const data = snap.data();
        const activeProvider = data?.activeAIProvider || "Google (Gemini)";
        const keys = data?.apiKeys || {};
        if (keys[activeProvider] && keys[activeProvider].length > 10) {
          provider = activeProvider;
          apiKey = keys[activeProvider];
          console.log(`[AI_INIT] Using DB Provider: ${provider}, Key: ${maskKey(apiKey)}`);
        } else {
          console.log(`[AI_INIT] DB Provider ${activeProvider} has no valid key, checking environment`);
        }
      }
    } catch (e) {
      console.warn("[AI_INIT] Failed to fetch DB settings, using Environment defaults");
    }
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      if (process.env.GEMINI_API_KEY) {
        provider = "Google (Gemini)";
        apiKey = process.env.GEMINI_API_KEY;
      } else if (process.env.OPENAI_API_KEY) {
        provider = "OpenAI";
        apiKey = process.env.OPENAI_API_KEY;
      }
    }
    console.log(`[AI_INIT] Final Selected Provider: ${provider}, Key: ${maskKey(apiKey)}`);
    return { provider, apiKey };
  }
  async function generateWithAI(prompt, imageBase64, mimeType) {
    const { provider, apiKey } = await getAIProvider();
    if (!apiKey || apiKey.length < 10 || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("API Key AI tidak valid atau belum dikonfigurasi. Silakan periksa menu Secrets.");
    }
    try {
      if (provider === "OpenAI") {
        const openai = new import_openai.default({ apiKey });
        const messages = [
          {
            role: "user",
            content: [
              { type: "text", text: prompt }
            ]
          }
        ];
        if (imageBase64) {
          messages[0].content.push({
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}` }
          });
        }
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          response_format: { type: "json_object" }
        });
        return { text: response.choices[0].message.content || "" };
      } else {
        const genAI = new import_genai.GoogleGenAI({
          apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } }
        });
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const parts = [{ text: prompt }];
        if (imageBase64) {
          parts.push({ inlineData: { data: imageBase64, mimeType } });
        }
        const result = await model.generateContent(parts);
        const response = await result.response;
        return { text: response.text() };
      }
    } catch (e) {
      const msg = e?.message || String(e);
      console.error(`[AI_EXEC][${provider}] Error:`, msg);
      throw e;
    }
  }
  async function logSys(type, provider, message) {
    try {
      console.log(`[SYS_LOG][${type}][${provider}]: ${message}`);
      await dbAdmin.collection("systemLogs").add({
        type,
        provider,
        message,
        timestamp: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error("Log failed (Firestore Write Error):", e instanceof Error ? e.message : e);
    }
  }
  app.post("/api/ai/generate-caption", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Image and mimeType are required" });
      }
      const prompt = `Analisis gambar ini dan buatkan caption yang menarik untuk galeri angkatan kuliah. 
                     Berikan respons dalam format JSON: { "title": "Judul Singkat", "description": "Deskripsi menarik" }.
                     Gunakan Bahasa Indonesia yang santai tapi sopan.`;
      const result = await generateWithAI(prompt, image, mimeType);
      let text = result.text;
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0];
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0];
      }
      res.json(JSON.parse(text.trim()));
    } catch (error) {
      console.error("AI Generation Error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("leaked") || errMsg.includes("403") || errMsg.includes("401") || errMsg.includes("key")) {
        return res.status(403).json({
          error: "API Key AI terdeteksi bermasalah (bocor/invalid). Silakan ganti API Key baru di menu Settings > Secrets pada AI Studio atau di Database."
        });
      }
      await logSys("error", "AI_SYSTEM", `Gallery Caption Error: ${errMsg}`);
      res.status(500).json({ error: "Gagal membuat caption AI. Pastikan API Key sudah benar." });
    }
  });
  app.post("/api/ai/check-receipt", async (req, res) => {
    try {
      const { image, mimeType, amount } = req.body;
      if (!image || !mimeType || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
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
      const result = await generateWithAI(prompt, image, mimeType);
      let text = result.text;
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0];
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0];
      }
      res.json(JSON.parse(text.trim()));
    } catch (error) {
      console.error("AI Receipt Check Error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("leaked") || errMsg.includes("403") || errMsg.includes("401") || errMsg.includes("key")) {
        return res.status(403).json({
          error: "API Key AI terdeteksi bermasalah (bocor/invalid). Silakan ganti API Key baru di menu Settings > Secrets pada AI Studio atau di Database."
        });
      }
      await logSys("error", "AI_SYSTEM", `Receipt Verification Error: ${errMsg}`);
      res.status(500).json({ error: "Gagal memverifikasi struk via AI. Pastikan API Key sudah benar." });
    }
  });
  app.post("/api/admin/reset-kas", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await import_firebase_admin.default.auth().verifyIdToken(idToken);
      const email = decodedToken.email?.toLowerCase();
      const adminEmails = [
        "irfanrizkiaditri@gmail.com",
        "irfanrizkiaditricreator@gmail.com",
        "irfanrizkiaditribusiness@gmail.com",
        "irfan125110007@vektorion.io",
        "admin@vektorion.com",
        "admin.system@vektorion.io"
      ];
      if (!email || !adminEmails.includes(email)) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
      const collections = [
        "kasSummary",
        "kasExpenses",
        "kasFormerMembers",
        "kasActivity",
        "transactions",
        "v2_kas_summary",
        "v2_kas_expenses",
        "v2_kas_former",
        "v2_kas_activity",
        "v2_kas_transactions"
      ];
      console.log(`[RESET_INIT] Admin ${email} is clearing Kas data (v1 & v2)...`);
      for (const colName of collections) {
        const snap = await dbAdmin.collection(colName).get();
        if (snap.empty) continue;
        const batch = dbAdmin.batch();
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`[RESET] Cleared collection: ${colName}`);
      }
      const years = ["2026", "2027", "2028", "2029", "2030"];
      for (const year of years) {
        const membersSnap = await dbAdmin.collection(`kasData/${year}/members`).get();
        if (!membersSnap.empty) {
          const batch = dbAdmin.batch();
          membersSnap.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          console.log(`[RESET] Cleared v1 members for: ${year}`);
        }
        const v2MembersSnap = await dbAdmin.collection(`v2_kas_data/${year}/members`).get();
        if (!v2MembersSnap.empty) {
          const batch = dbAdmin.batch();
          v2MembersSnap.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          console.log(`[RESET] Cleared v2 members for: ${year}`);
        }
      }
      res.json({ success: true, message: "Seluruh data kas telah dibersihkan. Anda dapat melakukan sinkron ulang dari Spreadsheet." });
    } catch (error) {
      console.error("[RESET_ERROR]", error);
      res.status(500).json({
        error: error.message || "Gagal membersihkan data kas.",
        code: error.code
      });
    }
  });
  app.post("/api/sync/spreadsheet", async (req, res) => {
    const { path: path2, data, method } = req.body;
    if (!path2) {
      return res.status(400).json({ error: "Path is required" });
    }
    try {
      if (method === "delete") {
        await dbAdmin.doc(path2).delete();
        console.log(`[SYNC_SUCCESS] Deleted doc: ${path2}`);
      } else {
        await dbAdmin.doc(path2).set({
          ...data,
          lastSyncAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`[SYNC_SUCCESS] Updated doc: ${path2}`);
      }
      res.json({ status: "ok" });
    } catch (error) {
      console.error("[SYNC_ERR] Firestore Admin Write Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[VITE_INIT] Starting Vite dev server middleware...");
    try {
      const vite = await (0, import_vite.createServer)({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      console.log("[VITE_SUCCESS] Vite middleware integrated.");
    } catch (viteError) {
      console.error("[VITE_ERROR] Failed to start Vite:", viteError);
    }
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", async (req, res) => {
      const idxPath = import_path.default.join(distPath, "index.html");
      if (!import_fs.default.existsSync(idxPath)) {
        return res.sendFile(idxPath);
      }
      try {
        let html = import_fs.default.readFileSync(idxPath, "utf8");
        const photoId = req.query.id;
        let title = "Vektorion";
        let image = "https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png";
        let description = "Physics ITERA 2025 - Vektorion";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host = req.headers["host"] || req.get("host") || "vektorion.vercel.app";
        const shareUrl = `${protocol}://${host}${req.originalUrl}`;
        if (photoId) {
          try {
            console.log(`[SEO_LOOKUP] Searching details for photo ID: ${photoId}...`);
            const docSnap = await dbAdmin.collection("gallery").doc(photoId).get();
            if (docSnap.exists) {
              const data = docSnap.data();
              title = data?.title ? `${data.title} - Vektorion` : "Momen Vektorion";
              image = data?.url || image;
              description = data?.description || "Lihat keseruan momen angkatan kami di Galeri Vektorion.";
              console.log(`[SEO_LOOKUP] Found record! Title: "${title}", Image: ${image.substring(0, 40)}...`);
            } else {
              console.log(`[SEO_LOOKUP] Document ID ${photoId} not found in gallery collection.`);
            }
          } catch (dbErr) {
            console.error("[SEO_DB_ERR] Failed to fetch gallery item from Firestore Admin:", dbErr.message);
          }
        }
        html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`).replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${title}" />`).replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${image}" />`).replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${description}" />`).replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${shareUrl}" />`).replace(/<meta property="twitter:title" content=".*?" \/>/gi, `<meta property="twitter:title" content="${title}" />`).replace(/<meta property="twitter:image" content=".*?" \/>/gi, `<meta property="twitter:image" content="${image}" />`).replace(/<meta property="twitter:description" content=".*?" \/>/gi, `<meta property="twitter:description" content="${description}" />`).replace(/<meta property="twitter:url" content=".*?" \/>/gi, `<meta property="twitter:url" content="${shareUrl}" />`).replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${description}" />`);
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      } catch (err) {
        console.error("[SEO_MIDDLEWARE_ERR] Error processing SEO HTML:", err);
        res.sendFile(idxPath);
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER_SUCCESS] Server running on http://localhost:${PORT}`);
  });
}
console.log("[SERVER_BOOT] Calling startServer()...");
startServer().catch((err) => {
  console.error("[SERVER_CRASH] Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
