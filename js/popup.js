document.addEventListener('DOMContentLoaded', () => {
  const encryptedText = document.getElementById('encryptedText');
  const decryptBtn = document.getElementById('decryptBtn');
  const outputSection = document.querySelector('.output-section');
  const bestMatch = document.getElementById('bestMatch');
  const allResults = document.getElementById('allResults');
  const shiftsContainer = document.querySelector('.shifts-container');
  const copyBtn = document.getElementById('copyBtn');
  const toggleAllBtn = document.getElementById('toggleAllBtn');

  let currentResults = [];

  const formatAnalysis = (analysis) => {
    const sections = [
      { title: 'Dates', items: analysis.dates },
      { title: 'Locations', items: analysis.locations },
      { title: 'Potential Targets', items: analysis.potential_targets },
      { title: 'Urgency Indicators', items: analysis.urgency_indicators }
    ];

    return sections
      .filter(section => section.items.length > 0)
      .map(section => `
        <div class="analysis-section">
          <strong>${section.title}:</strong> 
          ${section.items.join(', ')}
        </div>
      `)
      .join('') || '<div class="analysis-section">No significant patterns detected</div>';
  };

  const updateOutput = () => {
    if (!currentResults.length) return;

    const bestResult = currentResults[0];
    
    // Update best match section
    bestMatch.innerHTML = `
      <div class="decrypted-text">${bestResult.text}</div>
      <div class="analysis-results">
        <h4>Analysis Results:</h4>
        ${formatAnalysis(bestResult.analysis)}
      </div>
    `;
    
    // Update all results section
    shiftsContainer.innerHTML = currentResults
      .map((result, index) => `
        <div class="shift-item ${index === 0 ? 'best-match' : ''}">
          <div class="shift-header">
            <strong>Shift ${result.shift}</strong>
            ${index === 0 ? '<span class="best-match-badge">Best Match</span>' : ''}
            <span class="score-badge">Score: ${result.score.toFixed(2)}</span>
          </div>
          <div class="shift-text">
            ${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}
          </div>
          <div class="shift-analysis">
            ${formatAnalysis(result.analysis)}
          </div>
        </div>
      `)
      .join('');
  };

  decryptBtn.addEventListener('click', () => {
    const text = encryptedText.value.trim();
    
    if (!text) {
      utils.showNotification('Please enter some text to decrypt');
      return;
    }

    decryptBtn.disabled = true;
    decryptBtn.innerHTML = '<span class="btn-content">Analyzing...</span>';

    // Use setTimeout to prevent UI freezing during analysis
    setTimeout(() => {
      currentResults = CaesarCipher.decryptAll(text);
      outputSection.style.display = 'block';
      updateOutput();
      
      decryptBtn.disabled = false;
      decryptBtn.innerHTML = '<span class="btn-content"><svg class="decrypt-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9a9 9 0 0 0 9 9m9-9H3m9-9v18"></path></svg>Decrypt</span>';
    }, 0);
  });

  copyBtn.addEventListener('click', () => {
    if (!currentResults.length) return;
    utils.copyToClipboard(currentResults[0].text);
  });

  toggleAllBtn.addEventListener('click', () => {
    const isVisible = allResults.style.display === 'block';
    allResults.style.display = isVisible ? 'none' : 'block';
    toggleAllBtn.querySelector('svg').style.transform = 
      isVisible ? '' : 'rotate(180deg)';
  });
});