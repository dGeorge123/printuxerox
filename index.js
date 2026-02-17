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
        res.status(500).json({ message: "Error generating download link." });
    }
});

app.listen(process.env.PORT || 4000, () => {
    console.log("Server running");
});
