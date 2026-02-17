const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { db } = require('./config/firebase');
const { createFileMetadata, getFileMetadata } = require('./models/fileModel');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get("/", (req, res) => {
    res.send("Server merge boss");
});

// Example route to test DB connection (create a dummy file entry)
app.post('/test-db', async (req, res) => {
    try {
        const fileId = `test-${Date.now()}`;
        const fileData = {
            filename: 'test.pdf',
            size: 1024,
            uploadedBy: 'admin'
        };

        await createFileMetadata(fileId, fileData);
        const retrieved = await getFileMetadata(fileId);

        res.json({
            message: 'Database connection successful!',
            createdFileId: fileId,
            retrievedData: retrieved
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message,
            hint: "Make sure serviceAccountKey.json is present and valid."
        });
    }
});

app.listen(process.env.PORT || 4000, () => {
    console.log("Server running");
});
