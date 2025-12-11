// setAdminClaim.js (CommonJS version)
// Usage: node setAdminClaim.js <uid-or-email>

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(process.cwd(), "serviceAccountKey.json");

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node setAdminClaim.js <uid-or-email>");
  process.exit(1);
}

if (!fs.existsSync(keyPath)) {
  console.error("Missing serviceAccountKey.json in this folder.");
  process.exit(1);
}

// Load service account key
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

// Init firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function run() {
  try {
    let userRecord;

    // Try by UID first
    try {
      userRecord = await admin.auth().getUser(arg);
    } catch (e) {
      // Try by email fallback
      try {
        userRecord = await admin.auth().getUserByEmail(arg);
      } catch (ee) {
        console.error("Cannot find user by UID or email:", arg);
        process.exit(1);
      }
    }

    console.log("Found user:", userRecord.uid, userRecord.email);

    // Set admin claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log("✔ Admin claim added successfully!");

    console.log("⚠ Please SIGN OUT and SIGN IN again for the admin to activate.");
    process.exit(0);

  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
