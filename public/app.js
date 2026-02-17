const codeInput = document.getElementById('code-input');
const downloadBtn = document.getElementById('download-btn');
const uploadBtn = document.getElementById('upload-btn');
const messageEl = document.getElementById('message');
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-content');

let selectedFile = null;

function switchTab(tabName) {
    tabs.forEach(btn => btn.classList.remove('active'));
    sections.forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });

    if (tabName === 'download') {
        tabs[0].classList.add('active');
        document.getElementById('download-section').style.display = 'block';
        document.getElementById('download-section').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('upload-section').style.display = 'block';
        document.getElementById('upload-section').classList.add('active');
    }
    showMessage("", "");
}

function handleFileSelect(input) {
    if (input.files && input.files[0]) {
        selectedFile = input.files[0];
        document.getElementById('file-name').textContent = selectedFile.name;
        document.getElementById('file-name').style.color = 'var(--text)';
        uploadBtn.disabled = false;
    }
}

async function uploadFile() {
    if (!selectedFile) return;

    setLoading(true, uploadBtn);
    showMessage("", "");

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Upload failed");

        showMessage(`Success! Your code: ${data.code}`, "success");
        // Reset file input
        selectedFile = null;
        document.getElementById('file-name').textContent = "Click to select file";
        document.getElementById('file-name').style.color = 'var(--text-muted)';
        uploadBtn.disabled = true;

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        setLoading(false, uploadBtn);
    }
}

async function downloadFile() {
    const code = codeInput.value.trim();

    if (!code) {
        showMessage("Please enter a code.", "error");
        return;
    }

    setLoading(true, downloadBtn);
    showMessage("", "");

    try {
        const response = await fetch(`/api/download/${code}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        if (data.downloadUrl) {
            showMessage("Code found! Downloading...", "success");
            window.open(data.downloadUrl, '_blank');
        } else {
            throw new Error("No download URL returned.");
        }

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        setLoading(false, downloadBtn);
    }
}

function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
}

function setLoading(isLoading, btn) {
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
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
