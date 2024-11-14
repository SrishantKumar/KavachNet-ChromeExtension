const utils = {
  showNotification: (message, duration = 2000) => {
    const notification = document.querySelector('.notification');
    const notificationText = notification.querySelector('.notification-text');
    
    notificationText.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
      notification.style.display = 'none';
    }, duration);
  },

  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      utils.showNotification('Copied to clipboard!');
    } catch (err) {
      utils.showNotification('Failed to copy text');
    }
  },

  calculateReadabilityScore: (text) => {
    const commonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
    ]);

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const commonWordCount = words.filter(word => commonWords.has(word)).length;
    
    return commonWordCount / words.length;
  }
};