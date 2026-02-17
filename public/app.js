const codeInput = document.getElementById('code-input');
const downloadBtn = document.getElementById('download-btn');
const messageEl = document.getElementById('message');

async function downloadFile() {
    const code = codeInput.value.trim();

    if (!code) {
        showMessage("Please enter a code.", "error");
        return;
    }

    setLoading(true);
    showMessage("", ""); // Clear previous messages

    try {
        const response = await fetch(`/api/download/${code}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        if (data.downloadUrl) {
            showMessage("Code found! Downloading...", "success");
            // Trigger download in new tab
            window.open(data.downloadUrl, '_blank');
        } else {
            throw new Error("No download URL returned.");
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
codeInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        downloadFile();
    }
});
