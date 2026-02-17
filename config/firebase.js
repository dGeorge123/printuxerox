const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Path to your service account key file
let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (serviceAccountPath) {
    // If it's a relative path in .env, resolve it relative to the project root (process.cwd())
    if (!path.isAbsolute(serviceAccountPath)) {
        serviceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
    }
} else {
    // Default to looking in root if not specified in env
    serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
}

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (error) {
    console.log("Could not load serviceAccountKey.json. Checking for environment variables...");
}

if (!admin.apps.length) {
    try {
        const config = {
            storageBucket: process.env.STORAGE_BUCKET_URL
        };

        if (serviceAccount) {
            config.credential = admin.credential.cert(serviceAccount);
        } else {
            // Try to let Google Cloud auto-discover credentials (works on some hosting platforms)
            // or check for parsing env var if needed. 
            // For now, if no serviceAccount, we might fail unless we are in a GCP environment.
            console.log("No service account loaded. Attempting default application credentials/environment...");
            config.credential = admin.credential.applicationDefault();
        }

        admin.initializeApp(config);
        console.log("Firebase initialized successfully");
    } catch (error) {
        console.error("Firebase initialization failed:", error.message);
    }
}

let db, storage, bucket;
try {
    if (admin.apps.length) {
        db = admin.firestore();
        storage = admin.storage();
        bucket = storage.bucket();
    } else {
        console.warn("Firebase not initialized. DB features will not work.");
        db = null;
        storage = null;
        bucket = null;
    }
} catch (e) {
    console.error("Error creating Firebase clients:", e);
}

module.exports = { db, bucket, admin };
