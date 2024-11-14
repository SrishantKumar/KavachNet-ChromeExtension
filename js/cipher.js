class CaesarCipher {
  static decrypt(text, shift) {
    return text
      .split('')
      .map(char => {
        if (char.match(/[a-z]/i)) {
          const code = char.charCodeAt(0);
          const isUpperCase = code >= 65 && code <= 90;
          const base = isUpperCase ? 65 : 97;
          return String.fromCharCode(
            ((code - base - shift + 26) % 26) + base
          );
        }
        return char;
      })
      .join('');
  }

  static analyzeText(text) {
    const analysis = {
      dates: [],
      locations: [],
      potential_targets: [],
      urgency_indicators: []
    };

    // Extract dates (various formats)
    const datePattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g;
    analysis.dates = text.match(datePattern) || [];

    // Look for location indicators
    const locationIndicators = ['at', 'in', 'near', 'location'];
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word, i) => {
      if (locationIndicators.includes(word) && words[i + 1]) {
        analysis.locations.push(words[i + 1]);
      }
    });

    // Check for urgency words
    const urgencyWords = ['immediate', 'urgent', 'asap', 'quickly', 'soon', 'emergency'];
    words.forEach(word => {
      if (urgencyWords.includes(word)) {
        analysis.urgency_indicators.push(word);
      }
    });

    // Look for potential targets
    const targetIndicators = ['target', 'objective', 'goal', 'attack'];
    words.forEach((word, i) => {
      if (targetIndicators.includes(word) && words[i + 1]) {
        analysis.potential_targets.push(words[i + 1]);
      }
    });

    return analysis;
  }

  static decryptAll(text) {
    const results = [];
    
    for (let shift = 0; shift < 26; shift++) {
      const decrypted = this.decrypt(text, shift);
      const score = utils.calculateReadabilityScore(decrypted);
      const analysis = this.analyzeText(decrypted);
      
      results.push({
        shift,
        text: decrypted,
        score,
        analysis
      });
    }

    // Sort by score and analysis findings
    return results.sort((a, b) => {
      // Prioritize results with more analysis findings
      const aFindings = Object.values(a.analysis).flat().length;
      const bFindings = Object.values(b.analysis).flat().length;
      
      if (bFindings !== aFindings) {
        return bFindings - aFindings;
      }
      
      // If findings are equal, use readability score
      return b.score - a.score;
    });
  }
}