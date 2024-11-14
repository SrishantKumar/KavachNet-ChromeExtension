import { allCiphers } from './ciphers/index.js';

// Scoring weights for different aspects of text analysis
const SCORING_WEIGHTS = {
    letterFrequency: 0.4,
    wordMatch: 0.4,
    patternConsistency: 0.2
};

// English letter frequency map
const ENGLISH_FREQUENCIES = {
    'e': 12.7, 't': 9.1, 'a': 8.2, 'o': 7.5, 'i': 7.0,
    'n': 6.7, 's': 6.3, 'h': 6.1, 'r': 6.0, 'd': 4.3,
    'l': 4.0, 'c': 2.8, 'u': 2.8, 'm': 2.4, 'w': 2.4,
    'f': 2.2, 'g': 2.0, 'y': 2.0, 'p': 1.9, 'b': 1.5,
    'v': 1.0, 'k': 0.8, 'j': 0.15, 'x': 0.15, 'q': 0.10,
    'z': 0.07
};

class DecryptionEngine {
    constructor() {
        this.ciphers = allCiphers;
    }

    // Main decryption method that tries all available ciphers
    async decryptText(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid input: text must be a non-empty string');
        }

        const results = [];
        const caesarCipher = this.ciphers[0]; // We know it's Caesar cipher

        // Try all possible shifts (0-25)
        for (let shift = 0; shift < 26; shift++) {
            try {
                const decrypted = caesarCipher.decrypt(text, shift);
                const score = this.scoreText(decrypted);
                
                results.push({
                    method: 'Caesar Cipher',
                    text: decrypted,
                    confidence: score,
                    key: shift.toString(),
                    original: text
                });
            } catch (error) {
                console.warn(`Error with shift ${shift}:`, error);
            }
        }

        // Sort by confidence score
        return results.sort((a, b) => b.confidence - a.confidence);
    }

    // Calculate a confidence score for the decrypted text
    scoreText(text) {
        if (!text) return 0;
        
        const letterFreqScore = this.scoreLetterFrequency(text.toLowerCase());
        const wordMatchScore = this.scoreWordPatterns(text.toLowerCase());
        const patternScore = this.scorePatternConsistency(text);

        return (
            letterFreqScore * SCORING_WEIGHTS.letterFrequency +
            wordMatchScore * SCORING_WEIGHTS.wordMatch +
            patternScore * SCORING_WEIGHTS.patternConsistency
        );
    }

    // Score based on English letter frequencies
    scoreLetterFrequency(text) {
        const letters = text.match(/[a-z]/g);
        if (!letters) return 0;

        const frequencies = {};
        letters.forEach(letter => {
            frequencies[letter] = (frequencies[letter] || 0) + 1;
        });

        let score = 0;
        const total = letters.length;

        Object.keys(frequencies).forEach(letter => {
            const observed = (frequencies[letter] / total) * 100;
            const expected = ENGLISH_FREQUENCIES[letter] || 0;
            score += 1 - Math.abs(observed - expected) / 100;
        });

        return score / 26; // Normalize by number of letters
    }

    // Score based on common English word patterns
    scoreWordPatterns(text) {
        const commonPatterns = ['the', 'and', 'ing', 'ion', 'ed', 's'];
        let score = 0;

        commonPatterns.forEach(pattern => {
            if (text.includes(pattern)) {
                score += 1;
            }
        });

        return score / commonPatterns.length;
    }

    // Score based on pattern consistency
    scorePatternConsistency(text) {
        const letterGroups = text.match(/(.)\1+/g) || [];
        const repeatedLetters = letterGroups.join('').length;
        
        // English texts typically have some repeated letters, but not too many
        const ratio = repeatedLetters / text.length;
        return ratio <= 0.2 ? 1 : (1 - (ratio - 0.2));
    }
}

export default new DecryptionEngine();
