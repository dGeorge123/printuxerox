const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

function initializeFirebase() {
    if (admin.apps.length) return;

    try {
        let serviceAccount = null;

        // Method 1: Load from local file (development only)
        const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');
        const absolutePath = path.isAbsolute(saPath) ? saPath : path.resolve(process.cwd(), saPath);
        if (fs.existsSync(absolutePath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
                console.log("✅ Loaded credentials from file");
            } catch (err) {
                console.warn("⚠️ Failed to parse service account file:", err.message);
            }
        }

        // Method 2: Load from FIREBASE_SERVICE_ACCOUNT env var (JSON string)
        if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                console.log("✅ Loaded credentials from FIREBASE_SERVICE_ACCOUNT env var");
            } catch (err) {
                console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT:", err.message);
            }
        }

        // Method 3: Load from individual env vars (already set on Render)
        if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            serviceAccount = {
                type: 'service_account',
                project_id: process.env.FIREBASE_PROJECT_ID,
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            };
            console.log("✅ Loaded credentials from individual env vars (FIREBASE_PROJECT_ID etc.)");
        }

        const storageBucket = process.env.STORAGE_BUCKET_URL
            || process.env.FIREBASE_STORAGE_BUCKET
            || (serviceAccount ? `${serviceAccount.project_id}.appspot.com` : null);

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: storageBucket,
                projectId: serviceAccount.project_id
            });
            console.log("🔥 Firebase initialized for project:", serviceAccount.project_id);
        } else {
            console.error("❌ No Firebase credentials found! Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY on Render.");
        }

    } catch (error) {
        console.error("❌ Firebase Initialization Error:", error.message);
    }
}

initializeFirebase();

const db = admin.apps.length ? admin.firestore() : null;
const bucket = admin.apps.length ? admin.storage().bucket() : null;

module.exports = { db, bucket, admin };
