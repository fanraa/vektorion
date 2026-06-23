
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

async function cleanup() {
  console.log("--- STARTING KAS DATA CLEANUP ---");
  
  let projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  let databaseId = "";

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      projectId = config.projectId;
      databaseId = config.firestoreDatabaseId || "";
    }
  } catch (e) {}

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }

  // Use getFirestore from firebase-admin/firestore to support databaseId
  const { getFirestore } = await import("firebase-admin/firestore");
  const db = databaseId ? getFirestore(databaseId) : getFirestore();

  const collections = [
    "kasSummary",
    "kasExpenses",
    "kasFormerMembers",
    "kasActivity",
    "transactions"
  ];

  for (const colName of collections) {
    const snap = await db.collection(colName).get();
    if (snap.empty) {
      console.log(`Collection ${colName} is already empty.`);
      continue;
    }
    
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleared ${snap.size} documents from ${colName}.`);
  }

  // Clear nested kasData members
  const years = ["2026", "2027", "2028", "2029", "2030"];
  for (const year of years) {
    const membersSnap = await db.collection(`kasData/${year}/members`).get();
    if (!membersSnap.empty) {
      // Small batches for safety
      const batch = db.batch();
      membersSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Cleared ${membersSnap.size} members from year ${year}.`);
    } else {
      console.log(`No members found for year ${year}.`);
    }
  }

  console.log("--- CLEANUP FINISHED ---");
  process.exit(0);
}

cleanup().catch(err => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
