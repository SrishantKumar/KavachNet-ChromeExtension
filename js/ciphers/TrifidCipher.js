import BaseCipher from './BaseCipher.js';

class TrifidCipher extends BaseCipher {
    constructor() {
        super();
        this.defaultCube = this.createDefaultCube();
    }

    createDefaultCube() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ+';
        const cube = [];
        
        for (let i = 0; i < 3; i++) {
            cube[i] = [];
            for (let j = 0; j < 3; j++) {
                cube[i][j] = [];
                for (let k = 0; k < 3; k++) {
                    const index = i * 9 + j * 3 + k;
                    cube[i][j][k] = alphabet[index] || '+';
                }
            }
        }
        
        return cube;
    }

    createCube(key = '') {
        if (!key) return this.defaultCube;

        // Create alphabet without duplicates
        const alphabet = (key.toUpperCase() + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ+')
            .replace(/[^A-Z+]/g, '');
        const uniqueLetters = [...new Set(alphabet.split(''))];
        
        // Create 3x3x3 cube
        const cube = [];
        let index = 0;
        
        for (let i = 0; i < 3; i++) {
            cube[i] = [];
            for (let j = 0; j < 3; j++) {
                cube[i][j] = [];
                for (let k = 0; k < 3; k++) {
                    cube[i][j][k] = uniqueLetters[index++] || '+';
                }
            }
        }
        
        return cube;
    }

    findPosition(char, cube) {
        char = char.toUpperCase();
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    if (cube[i][j][k] === char) {
                        return [i + 1, j + 1, k + 1];
                    }
                }
            }
        }
        return [1, 1, 1]; // Default position for unknown characters
    }

    getCharFromPosition(i, j, k, cube) {
        if (i >= 1 && i <= 3 && j >= 1 && j <= 3 && k >= 1 && k <= 3) {
            return cube[i - 1][j - 1][k - 1];
        }
        return '+';
    }

    encrypt(text, key = '') {
        const cube = this.createCube(key);
        const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
        const period = 5; // Standard grouping size
        
        // Get trigrams for each character
        const trigrams = [];
        for (const char of cleanText) {
            trigrams.push(this.findPosition(char, cube));
        }

        // Separate coordinates into three rows
        const rows = [[], [], []];
        for (const trigram of trigrams) {
            rows[0].push(trigram[0]);
            rows[1].push(trigram[1]);
            rows[2].push(trigram[2]);
        }

        // Group by period
        let result = '';
        for (let i = 0; i < cleanText.length; i += period) {
            const group = [];
            for (let row = 0; row < 3; row++) {
                for (let j = 0; j < period && i + j < cleanText.length; j++) {
                    group.push(rows[row][i + j]);
                }
            }

            // Convert groups back to letters
            for (let j = 0; j < period && i + j < cleanText.length; j++) {
                const pos = [
                    group[j],
                    group[j + period],
                    group[j + period * 2]
                ];
                result += this.getCharFromPosition(...pos, cube);
            }
        }

        return result;
    }

    decrypt(text, key = '') {
        const cube = this.createCube(key);
        const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
        const period = 5; // Standard grouping size

        // Get trigrams for each character
        const trigrams = [];
        for (const char of cleanText) {
            trigrams.push(this.findPosition(char, cube));
        }

        // Process in groups of period length
        let result = '';
        for (let i = 0; i < cleanText.length; i += period) {
            const groupSize = Math.min(period, cleanText.length - i);
            const group = [];
            
            // Collect coordinates for this group
            for (let j = 0; j < groupSize; j++) {
                const trigram = trigrams[i + j];
                group.push(trigram[0], trigram[1], trigram[2]);
            }

            // Reconstruct original letters
            for (let j = 0; j < groupSize; j++) {
                const pos = [
                    group[j],
                    group[j + groupSize],
                    group[j + groupSize * 2]
                ];
                result += this.getCharFromPosition(...pos, cube);
            }
        }

        return result;
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const commonKeys = ['SECRET', 'CIPHER', 'KEY', 'TRIFID', ''];

        for (const key of commonKeys) {
            const decrypted = this.decrypt(text, key);
            const score = this.scoreText(decrypted);

            if (score > 0.5) {
                results.push({
                    text: decrypted,
                    key: key || '(default)',
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

    validate(text, key = '') {
        if (key) {
            return /^[A-Z+]+$/i.test(key.replace(/[^A-Z+]/gi, ''));
        }
        return true;
    }

    getDescription() {
        return "The Trifid cipher uses a 3x3x3 cube to convert letters into trigrams, then applies a period-based mixing step.";
    }

    getKeyDescription() {
        return "Optional key to arrange the cube. Letters will be placed in order of appearance, followed by remaining alphabet and '+'. Example: Leave empty for standard arrangement.";
    }
}

export default TrifidCipher;
