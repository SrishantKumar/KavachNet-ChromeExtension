import decryptionEngine from './decryption.js';

// DOM Elements
const inputText = document.getElementById('input-text');
const decryptBtn = document.getElementById('decrypt-btn');
const clearBtn = document.getElementById('clear-btn');
const pasteBtn = document.getElementById('paste-btn');
const resultsArea = document.getElementById('results');

// Toast notification system
const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after animation
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Create result card for decryption attempt
const createResultCard = (result) => {
    const card = document.createElement('div');
    card.className = 'result-item';
    
    const confidencePercent = Math.round(result.confidence * 100);
    const methodName = result.method.replace('Cipher', '');
    
    card.innerHTML = `
        <h3>${methodName} <span class="confidence">${confidencePercent}% confidence</span></h3>
        <p class="decrypted-text">${result.text}</p>
        <button class="btn secondary copy-btn" data-text="${result.text}">
            <span>Copy</span>
        </button>
    `;
    
    // Add copy functionality
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
        const text = copyBtn.dataset.text;
        navigator.clipboard.writeText(text)
            .then(() => showToast('Copied to clipboard!', 'success'))
            .catch(err => showToast('Failed to copy text', 'error'));
    });
    
    return card;
};

// Handle decryption
const handleDecryption = async () => {
    const text = inputText.value.trim();
    
    if (!text) {
        showToast('Please enter some text to decrypt', 'error');
        return;
    }
    
    try {
        // Show loading state
        decryptBtn.disabled = true;
        resultsArea.innerHTML = '<div class="loading">Analyzing text...</div>';
        
        // Attempt decryption with all methods
        const results = await decryptionEngine.decryptText(text);
        
        // Clear loading state
        resultsArea.innerHTML = '';
        
        if (results.length === 0) {
            resultsArea.innerHTML = '<p class="no-results">No valid decryption found</p>';
            return;
        }
        
        // Display results
        results.forEach(result => {
            if (result.confidence > 0.1) { // Only show reasonably confident results
                resultsArea.appendChild(createResultCard(result));
            }
        });
        
    } catch (error) {
        console.error('Decryption error:', error);
        showToast('An error occurred during decryption', 'error');
    } finally {
        decryptBtn.disabled = false;
    }
};

// Handle paste from clipboard
const handlePaste = async () => {
    try {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        showToast('Text pasted from clipboard', 'success');
    } catch (error) {
        console.error('Paste error:', error);
        showToast('Failed to paste from clipboard', 'error');
    }
};

// Clear input and results
const handleClear = () => {
    inputText.value = '';
    resultsArea.innerHTML = '';
    showToast('Cleared all input and results', 'info');
};

// Event listeners
decryptBtn.addEventListener('click', handleDecryption);
clearBtn.addEventListener('click', handleClear);
pasteBtn.addEventListener('click', handlePaste);

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to decrypt
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleDecryption();
    }
    // Esc to clear
    if (e.key === 'Escape') {
        handleClear();
    }
    // Ctrl/Cmd + V to paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        handlePaste();
    }
});
