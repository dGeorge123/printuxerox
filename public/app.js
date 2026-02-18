const codeInput = document.getElementById('code-input');
const downloadBtn = document.getElementById('download-btn');
const messageEl = document.getElementById('message');

async function downloadFile() {
    const code = codeInput.value.trim();

    if (!code) {
        showMessage("Te rog introdu un cod.", "error");
        return;
    }

    setLoading(true);
    showMessage("", "");

    try {
        const response = await fetch(`/api/download/${code}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Ceva nu a mers bine.");
        }

        if (data.downloadUrl) {
            showMessage("Cod găsit! Se descarcă...", "success");
            window.open(data.downloadUrl, '_blank');
        } else {
            throw new Error("Nu s-a primit URL de descărcare.");
        }

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        setLoading(false);
    }
}

function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
}

function setLoading(isLoading) {
    if (isLoading) {
        downloadBtn.classList.add('loading');
        downloadBtn.disabled = true;
    } else {
        downloadBtn.classList.remove('loading');
        downloadBtn.disabled = false;
    }
}

// Enter key support
if (codeInput) {
    codeInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            downloadFile();
        }
    });
}
