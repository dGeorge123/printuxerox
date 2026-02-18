const express = require('express');
const cors = require('cors');
const { db } = require('./config/firebase');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get("/health", (req, res) => {
    res.send("Server merge boss");
});

// Download API - cauta in colectia print_jobs (generata de serverul principal)
app.get('/api/download/:code', async (req, res) => {
    try {
        const code = req.params.code;
        console.log(`🔍 Cautare cod: ${code}`);

        if (!db) {
            return res.status(500).json({ message: "Baza de date nu e conectata." });
        }

        // Cauta in colectia print_jobs
        const docRef = db.collection('print_jobs').doc(String(code));
        const doc = await docRef.get();

        if (!doc.exists) {
            console.warn(`❌ Codul ${code} nu exista in print_jobs`);
            return res.status(404).json({ message: "Cod invalid. Verifica codul si incearca din nou." });
        }

        const data = doc.data();
        console.log(`✅ Cod gasit:`, { code, status: data.status, hasFileUrl: !!data.file_url });

        // Verifica daca a expirat
        if (data.expiresAt) {
            const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
            if (expiresAt < new Date()) {
                return res.status(410).json({ message: "Codul a expirat. Genereaza un cod nou." });
            }
        }

        // Verifica daca are URL fisier
        if (!data.file_url) {
            return res.status(500).json({ message: "Fisierul nu a fost inca incarcat. Incearca din nou in cateva secunde." });
        }

        // Returneaza URL-ul direct (e deja semnat de serverul principal)
        res.json({
            downloadUrl: data.file_url,
            filename: data.fileName || data.filename || `document_${code}.pdf`
        });

    } catch (error) {
        console.error("🔥 Eroare download:", error);
        res.status(500).json({ message: "Eroare server: " + error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
