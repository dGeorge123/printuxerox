const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { db } = require('./config/firebase');
const { createFileMetadata, getFileMetadata } = require('./models/fileModel');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from 'public' folder
app.use(express.static('public'));

// Basic health check
app.get("/health", (req, res) => {
    res.send("Server merge boss");
});

// Download API
app.get('/api/download/:code', async (req, res) => {
    try {
        const fileId = req.params.code;
        const metadata = await getFileMetadata(fileId);

        if (!metadata) {
            return res.status(404).json({ message: "File not found. Check the code." });
        }

        // Logic to get signed URL
        // stored metadata should have 'storagePath' or 'filename'
        // For now, assuming 'filename' was stored as the path in bucket, or 'storagePath'

        const filePath = metadata.storagePath || metadata.filename;

        if (!filePath) {
            return res.status(500).json({ message: "File path missing in metadata." });
        }

        // Generate Signed URL
        // These options will allow temporary read access to the file
        const options = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        };

        // Only try to sign if bucket is available (credentials loaded)
        // From config/firebase.js, bucket might be null if no creds.
        const { bucket } = require('./config/firebase');

        if (!bucket) {
            return res.status(500).json({ message: "Storage not configured (missing credentials)." });
        }

        const [url] = await bucket.file(filePath).getSignedUrl(options);

        // Update stats (optional)
        // await updateFileStatus(fileId, 'downloaded'); // or increment count

        res.json({ downloadUrl: url, filename: metadata.filename });

    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ message: error.message || "Error generating download link." });
    }
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

app.post('/api/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const filename = `${code}-${req.file.originalname}`;

        // Check DB connection first
        const { bucket } = require('./config/firebase');
        if (!bucket) {
            throw new Error("Storage not configured (missing credentials).");
        }

        // Upload to Firebase Storage
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
            resumable: false,
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        blobStream.on('error', (err) => {
            console.error("Blob stream error:", err);
            res.status(500).json({ message: "Upload to storage failed." });
        });

        blobStream.on('finish', async () => {
            try {
                // Save metadata to Firestore
                await createFileMetadata(code, {
                    filename: filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedAt: new Date().toISOString()
                });

                res.json({
                    message: "Upload successful!",
                    code: code,
                    filename: req.file.originalname
                });
            } catch (dbError) {
                console.error("Metadata save error:", dbError);
                // If DB fails, we should probably delete the file from storage to keep it clean, 
                // but for now just report error.
                res.status(500).json({ message: "File uploaded but database save failed: " + dbError.message });
            }
        });

        blobStream.end(req.file.buffer);

    } catch (error) {
        console.error("Upload handler error:", error);
        res.status(500).json({ message: error.message || "Server error during upload." });
    }
});

app.listen(process.env.PORT || 4000, () => {
    console.log("Server running");
});
