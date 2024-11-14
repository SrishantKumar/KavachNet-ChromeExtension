import BaseCipher from './BaseCipher.js';

class RailFenceCipher extends BaseCipher {
    constructor() {
        super();
    }

    encrypt(text, key) {
        const rails = parseInt(key);
        if (!this.validate(text, key)) return text;

        // Create the rail fence pattern
        const pattern = this.createPattern(text.length, rails);
        const fence = Array(rails).fill('');

        // Place characters in the fence pattern
        for (let i = 0; i < text.length; i++) {
            fence[pattern[i]] += text[i];
        }

        return fence.join('');
    }

    decrypt(text, key) {
        const rails = parseInt(key);
        if (!this.validate(text, key)) return text;

        // Create the rail fence pattern
        const pattern = this.createPattern(text.length, rails);
        
        // Calculate the length of each rail
        const railLengths = Array(rails).fill(0);
        pattern.forEach(rail => railLengths[rail]++);

        // Split the text into rails
        const fence = [];
        let pos = 0;
        for (let i = 0; i < rails; i++) {
            fence[i] = text.substr(pos, railLengths[i]);
            pos += railLengths[i];
        }

        // Reconstruct the original text
        let result = '';
        let railPos = Array(rails).fill(0);
        
        for (let i = 0; i < text.length; i++) {
            const rail = pattern[i];
            result += fence[rail][railPos[rail]++];
        }

        return result;
    }

    createPattern(length, rails) {
        const pattern = [];
        let rail = 0;
        let step = 1;

        for (let i = 0; i < length; i++) {
            pattern[i] = rail;

            rail += step;

            if (rail === rails - 1) step = -1;
            else if (rail === 0) step = 1;
        }

        return pattern;
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const maxRails = Math.min(10, text.length);  // Reasonable maximum number of rails

        for (let rails = 2; rails <= maxRails; rails++) {
            const decrypted = this.decrypt(text, rails.toString());
            
            // Simple scoring based on letter frequency
            const score = this.scoreText(decrypted);
            
            if (score > 0.5) {  // Only include reasonably likely results
                results.push({
                    text: decrypted,
                    key: rails.toString(),
                    score: score
                });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    scoreText(text) {
        // Common English letter frequencies
        const freqs = {
            'E': 0.13, 'T': 0.091, 'A': 0.082, 'O': 0.075, 'I': 0.07,
            'N': 0.067, 'S': 0.063, 'H': 0.061, 'R': 0.06, 'D': 0.043
        };

        let score = 0;
        const total = text.length;
        const counts = {};

        // Count letter frequencies in the text
        for (const char of text.toUpperCase()) {
            if (/[A-Z]/.test(char)) {
                counts[char] = (counts[char] || 0) + 1;
            }
        }

        // Compare with expected frequencies
        for (const [letter, expectedFreq] of Object.entries(freqs)) {
            const actualFreq = (counts[letter] || 0) / total;
            score += 1 - Math.abs(expectedFreq - actualFreq);
        }

        return score / Object.keys(freqs).length;
    }

    validate(text, key) {
        const rails = parseInt(key);
        return !isNaN(rails) && rails > 1 && rails <= text.length;
    }

    getDescription() {
        return "The Rail Fence cipher writes text in a zigzag pattern on a number of 'rails' and reads off each rail in turn.";
    }

    getKeyDescription() {
        return "Key should be a number greater than 1 and less than the text length, representing the number of rails.";
    }
}

export default RailFenceCipher;
