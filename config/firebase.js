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
    serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
}

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (error) {
    console.error("Error loading service account key from:", serviceAccountPath);
    console.error("Error details:", error.message);
    console.error("Please make sure 'serviceAccountKey.json' exists in the root directory or update GOOGLE_APPLICATION_CREDENTIALS in .env");
    // process.exit(1); // Don't exit yet, might be running without full config for dev
}

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.STORAGE_BUCKET_URL // e.g., 'your-project-id.appspot.com'
        });
        console.log("Firebase initialized successfully");
    } catch (error) {
        console.error("Firebase initialization failed:", error.message);
    }
}

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

module.exports = { db, bucket, admin };
