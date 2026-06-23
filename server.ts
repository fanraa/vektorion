import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import fs from "fs";

console.log("[SERVER_START] Initializing...");

dotenv.config();

async function startServer() {
  console.log("[SERVER_BOOT] Initializing startServer()...");

  // Initialize Firebase Admin for secure server-side operations
  let projectId =
    process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  let customDatabaseId = "";

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.projectId) {
        projectId = config.projectId;
      }
      if (config.firestoreDatabaseId) {
        customDatabaseId = config.firestoreDatabaseId;
      }
      console.log(
        `[FIREBASE] Config loaded. Project: ${projectId}, DB: ${customDatabaseId || "(default)"}`,
      );
    }
  } catch (e) {
    console.warn("[FIREBASE] Could not load config file.");
  }

  if (admin.apps.length === 0) {
    try {
      console.log(`[FIREBASE] Initializing Admin for Project: ${projectId}...`);
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId,
      });
      console.log("[FIREBASE] Admin initialized with ADC.");
    } catch (e: any) {
      console.log(
        "[FIREBASE] ADC initialization failed, trying simple init...",
      );
      try {
        admin.initializeApp({ projectId });
        console.log("[FIREBASE] Admin initialized with Project ID fallback.");
      } catch (err2: any) {
        console.error(
          "[FIREBASE] All Admin initialization attempts failed:",
          err2.message,
        );
      }
    }
  }

  // Use the correct database instance if specified
  const dbAdmin = customDatabaseId
    ? getFirestore(customDatabaseId)
    : getFirestore();

  // Test connection to Firestore
  try {
    await dbAdmin.collection("test").limit(1).get();
    console.log("[FIREBASE] Firestore connection verified.");
  } catch (testError: any) {
    console.error(
      `[FIREBASE] Firestore check FAILED [Project: ${projectId}]:`,
      testError.message,
    );
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // API Route: Secure Sync from Google Sheets
  // This endpoint bypasses Firestore rules using Firebase Admin SDK
  app.post("/api/sync/kas", async (req, res) => {
    try {
      const { updates } = req.body; // updates is an array of { path, data, method }

      if (!updates || !Array.isArray(updates)) {
        return res
          .status(400)
          .json({ error: "Invalid updates format. Expected { updates: [] }" });
      }

      const batch = dbAdmin.batch();

      for (const update of updates) {
        const { collectionPath, docId, data, method = "set" } = update;
        if (!collectionPath || !docId) continue;

        const docRef = dbAdmin.collection(collectionPath).doc(docId);

        if (method === "delete") {
          batch.delete(docRef);
        } else if (method === "update") {
          batch.update(docRef, {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Default to set with merge
          batch.set(
            docRef,
            {
              ...data,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
      }

      await batch.commit();
      console.log(
        `Successfully synced ${updates.length} items from Spreadsheet`,
      );
      res.json({ success: true, count: updates.length });
    } catch (error) {
      console.error("Sync Error:", error);
      res.status(500).json({ error: "Failed to sync data to Firestore" });
    }
  });

  // API Route: Record Page View
  app.post("/api/stats/view", async (req, res) => {
    try {
      const statRef = dbAdmin.collection("appConfig").doc("systemSettings");
      await dbAdmin.runTransaction(async (t) => {
        const doc = await t.get(statRef);
        if (!doc.exists) {
          t.set(statRef, { totalViews: 1 }, { merge: true });
        } else {
          t.update(statRef, { totalViews: FieldValue.increment(1) });
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("View Count Error:", error);
      res.status(500).json({ error: "Failed to update view count" });
    }
  });

  // Helper: Mask API Key for safe logging
  function maskKey(key: string | undefined) {
    if (!key) return "NOT_SET";
    if (key.length < 10) return "***";
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  // Interface for Unified AI Response
  interface AIResponse {
    text: string;
    error?: string;
  }

  // Helper: Get AI Instances to try (Fallback mechanism)
  async function getAIProvidersList() {
    let providers: { provider: string; apiKey: string }[] = [];

    try {
      const snap = await dbAdmin
        .collection("appConfig")
        .doc("systemSettings")
        .get();
      if (snap.exists) {
        const data = snap.data();
        const activeProvider = data?.activeAIProvider || "Google (Gemini)";
        const keys = data?.apiKeys || {};

        // Push active provider first if available
        if (keys[activeProvider] && keys[activeProvider].length > 10) {
          providers.push({
            provider: activeProvider,
            apiKey: keys[activeProvider],
          });
        }

        // Push others
        for (const [prov, key] of Object.entries(keys)) {
          if (
            prov !== activeProvider &&
            typeof key === "string" &&
            key.length > 10
          ) {
            providers.push({ provider: prov, apiKey: key });
          }
        }
      }
    } catch (e) {
      console.warn(
        "[AI_INIT] Failed to fetch DB settings, using Environment defaults",
      );
    }

    // Secondary Check: Environment variables
    if (
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    ) {
      if (!providers.find((p) => p.provider === "Google (Gemini)")) {
        providers.push({
          provider: "Google (Gemini)",
          apiKey: process.env.GEMINI_API_KEY,
        });
      }
    }
    if (process.env.OPENAI_API_KEY) {
      if (
        !providers.find(
          (p) => p.provider === "OpenAI" || p.provider === "OpenAI (ChatGPT)",
        )
      ) {
        providers.push({
          provider: "OpenAI (ChatGPT)",
          apiKey: process.env.OPENAI_API_KEY,
        });
      }
    }

    if (providers.length > 0) {
      console.log(
        `[AI_INIT] Loaded ${providers.length} providers for fallback testing. Primary: ${providers[0].provider}`,
      );
    } else {
      console.warn(`[AI_INIT] No AI providers found.`);
    }

    return providers;
  }

  async function generateWithAI(
    prompt: string,
    imageBase64?: string,
    mimeType?: string,
  ): Promise<AIResponse> {
    const providers = await getAIProvidersList();

    if (providers.length === 0) {
      throw new Error(
        "API Key AI tidak valid atau belum dikonfigurasi. Silakan periksa menu Secrets.",
      );
    }

    let lastError: any = null;

    for (const { provider, apiKey } of providers) {
      try {
        console.log(`[AI_EXEC] Attempting generation with ${provider}...`);

        if (provider === "OpenAI" || provider === "OpenAI (ChatGPT)") {
          const openai = new OpenAI({ apiKey });
          const messages: any[] = [
            {
              role: "user",
              content: [{ type: "text", text: prompt }],
            },
          ];

          if (imageBase64) {
            messages[0].content.push({
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            });
          }

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            response_format: { type: "json_object" },
          });

          return { text: response.choices[0].message.content || "" };
        } else if (provider === "OpenRouter") {
          const openai = new OpenAI({
            apiKey,
            baseURL: "https://openrouter.ai/api/v1",
          });
          const response = await openai.chat.completions.create({
            model: "openrouter/auto",
            messages: [{ role: "user", content: prompt }], // OpenRouter may not support image Base64 identically on all free models
          });
          return { text: response.choices[0].message.content || "" };
        } else if (provider === "Groq") {
          const openai = new OpenAI({
            apiKey,
            baseURL: "https://api.groq.com/openai/v1",
          });
          const response = await openai.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
          });
          return { text: response.choices[0].message.content || "" };
        } else if (provider === "Anthropic (Claude)") {
          const response = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }],
              }),
            },
          );
          if (!response.ok) {
            throw new Error(`Anthropic error: ${response.statusText}`);
          }
          const resMap = await response.json();
          return { text: resMap.content[0].text };
        } else {
          // Default to Gemini
          const genAI = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } },
          });

          const parts: any[] = [{ text: prompt }];
          if (imageBase64 && mimeType) {
            parts.push({ inlineData: { data: imageBase64, mimeType } });
          }

          const response = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: parts,
          });
          return { text: response.text || "" };
        }
      } catch (e: any) {
        lastError = e;
        const msg = e?.message || String(e);
        console.warn(`[AI_EXEC][${provider}] Failed:`, msg);
        // Continue to the next provider
      }
    }

    // If we exhausted all providers
    console.error(
      `[AI_EXEC] All providers failed. Last error:`,
      lastError?.message,
    );
    throw (
      lastError || new Error("All AI Providers failed to generate content.")
    );
  }

  async function logSys(
    type: "info" | "error",
    provider: string,
    message: string,
  ) {
    try {
      console.log(`[SYS_LOG][${type}][${provider}]: ${message}`);
      await dbAdmin.collection("systemLogs").add({
        type,
        provider,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error(
        "Log failed (Firestore Write Error):",
        e instanceof Error ? e.message : e,
      );
    }
  }

  // API Route: Test API Key
  app.post("/api/test-key", async (req, res) => {
    try {
      const { provider, apiKey } = req.body;
      if (!provider || !apiKey) {
        return res.status(400).json({ error: "Missing provider or API key" });
      }

      if (provider === "Google (Gemini)") {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: "Hello",
        });
        return res.json({ success: true });
      } else if (provider === "OpenAI (ChatGPT)") {
        const openai = new OpenAI({ apiKey });
        await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        });
        return res.json({ success: true });
      } else if (provider === "OpenRouter") {
        const openai = new OpenAI({
          apiKey,
          baseURL: "https://openrouter.ai/api/v1",
        });
        await openai.chat.completions.create({
          model: "openrouter/auto",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        });
        return res.json({ success: true });
      } else if (provider === "Groq") {
        const openai = new OpenAI({
          apiKey,
          baseURL: "https://api.groq.com/openai/v1",
        });
        await openai.chat.completions.create({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        });
        return res.json({ success: true });
      } else if (provider === "Anthropic (Claude)") {
        // Fetch Anthropic API directly to avoid new SDK install
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 5,
            messages: [{ role: "user", content: "Hello" }],
          }),
        });
        if (!response.ok) {
          throw new Error(`Anthropic error: ${response.statusText}`);
        }
        return res.json({ success: true });
      } else {
        return res.status(400).json({ error: "Unsupported provider" });
      }
    } catch (error: any) {
      console.error("[TEST_KEY] Error:", error.message || error);
      return res
        .status(500)
        .json({ error: error.message || "Invalid API Key" });
    }
  });

  // API Route: AI Caption Generation for Gallery
  app.post("/api/ai/generate-caption", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res
          .status(400)
          .json({ error: "Image and mimeType are required" });
      }

      const prompt = `Analisis gambar ini dan buatkan caption yang menarik untuk galeri angkatan kuliah. 
                     Berikan respons dalam format JSON: { "title": "Judul Singkat", "description": "Deskripsi menarik" }.
                     Gunakan Bahasa Indonesia yang santai tapi sopan.`;

      const result = await generateWithAI(prompt, image, mimeType);
      let text = result.text;

      // Clean up JSON response
      if (text.includes("```json")) {
        text = text.split("```json")[1].split("```")[0];
      } else if (text.includes("```")) {
        text = text.split("```")[1].split("```")[0];
      }

      res.json(JSON.parse(text.trim()));
    } catch (error) {
      console.error("AI Generation Error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);

      if (
        errMsg.includes("leaked") ||
        errMsg.includes("403") ||
        errMsg.includes("401") ||
        errMsg.includes("key")
      ) {
        return res.status(403).json({
          error:
            "API Key AI terdeteksi bermasalah (bocor/invalid). Silakan ganti API Key baru di menu Settings > Secrets pada AI Studio atau di Database.",
        });
      }

      await logSys("error", "AI_SYSTEM", `Gallery Caption Error: ${errMsg}`);
      res.status(500).json({
        error: "Gagal membuat caption AI. Pastikan API Key sudah benar.",
      });
    }
  });

  // API Route: AI Receipt Verification for Kas
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
                     6. Waktu Saat Ini: ${new Date().toLocaleString("id-ID")}.
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

      if (
        errMsg.includes("leaked") ||
        errMsg.includes("403") ||
        errMsg.includes("401") ||
        errMsg.includes("key")
      ) {
        return res.status(403).json({
          error:
            "API Key AI terdeteksi bermasalah (bocor/invalid). Silakan ganti API Key baru di menu Settings > Secrets pada AI Studio atau di Database.",
        });
      }

      await logSys(
        "error",
        "AI_SYSTEM",
        `Receipt Verification Error: ${errMsg}`,
      );
      res.status(500).json({
        error:
          "Gagal memverifikasi struk via AI. Pastikan API Key sudah benar.",
      });
    }
  });

  // --- ADMIN RESET KAS DATA ---
  app.post("/api/admin/reset-kas", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const email = decodedToken.email?.toLowerCase();

      const adminEmails = [
        "irfanrizkiaditri@gmail.com",
        "irfanrizkiaditricreator@gmail.com",
        "irfanrizkiaditribusiness@gmail.com",
        "irfan125110007@vektorion.io",
        "admin@vektorion.com",
        "admin.system@vektorion.io",
      ];

      if (!email || !adminEmails.includes(email)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Admin access required" });
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
        "v2_kas_transactions",
      ];

      console.log(
        `[RESET_INIT] Admin ${email} is clearing Kas data (v1 & v2)...`,
      );

      // Batch delete for top-level collections
      for (const colName of collections) {
        const snap = await dbAdmin.collection(colName).get();
        if (snap.empty) continue;

        const batch = dbAdmin.batch();
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`[RESET] Cleared collection: ${colName}`);
      }

      // Special handling for nested kasData
      const years = ["2026", "2027", "2028", "2029", "2030"];
      for (const year of years) {
        // v1
        const membersSnap = await dbAdmin
          .collection(`kasData/${year}/members`)
          .get();
        if (!membersSnap.empty) {
          const batch = dbAdmin.batch();
          membersSnap.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          console.log(`[RESET] Cleared v1 members for: ${year}`);
        }
        // v2
        const v2MembersSnap = await dbAdmin
          .collection(`v2_kas_data/${year}/members`)
          .get();
        if (!v2MembersSnap.empty) {
          const batch = dbAdmin.batch();
          v2MembersSnap.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          console.log(`[RESET] Cleared v2 members for: ${year}`);
        }
      }

      res.json({
        success: true,
        message:
          "Seluruh data kas telah dibersihkan. Anda dapat melakukan sinkron ulang dari Spreadsheet.",
      });
    } catch (error: any) {
      console.error("[RESET_ERROR]", error);
      res.status(500).json({
        error: error.message || "Gagal membersihkan data kas.",
        code: error.code,
      });
    }
  });

  // --- SPREADSHEET SYNC PROXY ---
  // Endpoint ini digunakan oleh Google Apps Script untuk sinkronisasi data Kas.
  app.post("/api/sync/spreadsheet", async (req, res) => {
    const { path, data, method } = req.body;

    if (!path) {
      return res.status(400).json({ error: "Path is required" });
    }

    try {
      if (method === "delete") {
        await dbAdmin.doc(path).delete();
        console.log(`[SYNC_SUCCESS] Deleted doc: ${path}`);
      } else {
        // Transform data to plain object since firebase-admin handles it better than raw Firestore REST format
        await dbAdmin.doc(path).set(
          {
            ...data,
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        console.log(`[SYNC_SUCCESS] Updated doc: ${path}`);
      }
      res.json({ status: "ok" });
    } catch (error) {
      console.error("[SYNC_ERR] Firestore Admin Write Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("[VITE_INIT] Starting Vite dev server middleware...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("[VITE_SUCCESS] Vite middleware integrated.");

      // Development wildcard fallback to compile and serve index.html via Vite
      app.get("*", async (req, res, next) => {
        const url = req.originalUrl;
        try {
          const rawTemplatePath = path.join(process.cwd(), "index.html");
          if (!fs.existsSync(rawTemplatePath)) {
            return res.status(404).send("Root index.html not found.");
          }
          let template = fs.readFileSync(rawTemplatePath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (viteError) {
      console.error("[VITE_ERROR] Failed to start Vite:", viteError);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", async (req, res) => {
      const idxPath = path.join(distPath, "index.html");
      if (!fs.existsSync(idxPath)) {
        return res
          .status(404)
          .send(
            "Production build index.html not found. Please build the application.",
          );
      }

      try {
        let html = fs.readFileSync(idxPath, "utf8");
        const photoId = req.query.id as string;

        let title = "Vektorion";
        let image =
          "https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png";
        let description = "Physics ITERA 2025 - Vektorion";

        const protocol =
          req.headers["x-forwarded-proto"] || req.protocol || "https";
        const host =
          req.headers["host"] || req.get("host") || "vektorion.vercel.app";
        const shareUrl = `${protocol}://${host}${req.originalUrl}`;

        if (photoId) {
          try {
            console.log(
              `[SEO_LOOKUP] Searching details for photo ID: ${photoId}...`,
            );
            const docSnap = await dbAdmin
              .collection("gallery")
              .doc(photoId)
              .get();
            if (docSnap.exists) {
              const data = docSnap.data();
              title = data?.title
                ? `${data.title} - Vektorion`
                : "Momen Vektorion";
              image = data?.url || image;
              description =
                data?.description ||
                "Lihat keseruan momen angkatan kami di Galeri Vektorion.";
              console.log(
                `[SEO_LOOKUP] Found record! Title: "${title}", Image: ${image.substring(0, 40)}...`,
              );
            } else {
              console.log(
                `[SEO_LOOKUP] Document ID ${photoId} not found in gallery collection.`,
              );
            }
          } catch (dbErr: any) {
            console.error(
              "[SEO_DB_ERR] Failed to fetch gallery item from Firestore Admin:",
              dbErr.message,
            );
          }
        }

        // Replace metadata placeholder tags or inject them
        html = html
          .replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`)
          .replace(
            /<meta property="og:title" content=".*?" \/>/gi,
            `<meta property="og:title" content="${title}" />`,
          )
          .replace(
            /<meta property="og:image" content=".*?" \/>/gi,
            `<meta property="og:image" content="${image}" />`,
          )
          .replace(
            /<meta property="og:description" content=".*?" \/>/gi,
            `<meta property="og:description" content="${description}" />`,
          )
          .replace(
            /<meta property="og:url" content=".*?" \/>/gi,
            `<meta property="og:url" content="${shareUrl}" />`,
          )
          .replace(
            /<meta property="twitter:title" content=".*?" \/>/gi,
            `<meta property="twitter:title" content="${title}" />`,
          )
          .replace(
            /<meta property="twitter:image" content=".*?" \/>/gi,
            `<meta property="twitter:image" content="${image}" />`,
          )
          .replace(
            /<meta property="twitter:description" content=".*?" \/>/gi,
            `<meta property="twitter:description" content="${description}" />`,
          )
          .replace(
            /<meta property="twitter:url" content=".*?" \/>/gi,
            `<meta property="twitter:url" content="${shareUrl}" />`,
          )
          .replace(
            /<meta name="description" content=".*?" \/>/gi,
            `<meta name="description" content="${description}" />`,
          );

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
