const { db } = require('../config/firebase');

const COLLECTION_NAME = 'files';

/**
 * Creates or updates file metadata in Firestore.
 * @param {string} fileId - Unique ID for the file (e.g. tracking code).
 * @param {Object} data - Metadata object to store.
 * @returns {Promise<Object>} The stored data.
 */
async function createFileMetadata(fileId, data) {
    try {
        const fileRef = db.collection(COLLECTION_NAME).doc(fileId);
        const metadata = {
            ...data,
            createdAt: new Date().toISOString(),
            status: 'pending',
            downloadCount: 0
        };
        await fileRef.set(metadata);
        console.log(`File metadata created for ${fileId}`);
        return metadata;
    } catch (error) {
        console.error("Error creating file metadata:", error);
        throw error;
    }
}

/**
 * Retrieves file metadata from Firestore.
 * @param {string} fileId - The file ID.
 * @returns {Promise<Object | null>} - The file metadata or null.
 */
async function getFileMetadata(fileId) {
    try {
        const fileRef = db.collection(COLLECTION_NAME).doc(fileId);
        const doc = await fileRef.get();
        if (!doc.exists) {
            console.log(`File metadata not found for ${fileId}`);
            return null;
        }
        return doc.data();
    } catch (error) {
        console.error("Error getting file metadata:", error);
        throw error;
    }
}

/**
 * Updates file status in Firestore.
 * @param {string} fileId - The file ID.
 * @param {string} status - New status.
 * @returns {Promise<void>}
 */
async function updateFileStatus(fileId, status) {
    try {
        const fileRef = db.collection(COLLECTION_NAME).doc(fileId);
        await fileRef.update({ status });
        console.log(`File status updated to ${status} for ${fileId}`);
    } catch (error) {
        console.error("Error updating file status:", error);
        throw error;
    }
}

module.exports = {
    createFileMetadata,
    getFileMetadata,
    updateFileStatus
};
