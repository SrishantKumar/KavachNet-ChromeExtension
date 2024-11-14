import BaseCipher from './BaseCipher.js';

class BifidCipher extends BaseCipher {
    constructor() {
        super();
        this.defaultSquare = [
            ['A', 'B', 'C', 'D', 'E'],
            ['F', 'G', 'H', 'I', 'K'],
            ['L', 'M', 'N', 'O', 'P'],
            ['Q', 'R', 'S', 'T', 'U'],
            ['V', 'W', 'X', 'Y', 'Z']
        ];
    }

    createSquare(key = '') {
        if (!key) return this.defaultSquare;

        // Create alphabet without duplicates, replacing J with I
        const alphabet = (key.toUpperCase().replace(/J/g, 'I') + 'ABCDEFGHIKLMNOPQRSTUVWXYZ')
            .replace(/[^A-Z]/g, '');
        const uniqueLetters = [...new Set(alphabet.split(''))];
        
        // Create 5x5 square
        const square = [];
        for (let i = 0; i < 5; i++) {
            square[i] = uniqueLetters.slice(i * 5, (i + 1) * 5);
        }
        
        return square;
    }

    findPosition(char, square) {
        char = char.toUpperCase().replace(/J/g, 'I');
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (square[row][col] === char) {
                    return [row + 1, col + 1];
                }
            }
        }
        return null;
    }

    getCharFromPosition(row, col, square) {
        if (row >= 1 && row <= 5 && col >= 1 && col <= 5) {
            return square[row - 1][col - 1];
        }
        return '';
    }

    encrypt(text, key = '') {
        const square = this.createSquare(key);
        const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
        
        // Get coordinates for each letter
        const coordinates = [];
        const rows = [];
        const cols = [];
        
        for (const char of cleanText) {
            const pos = this.findPosition(char, square);
            if (pos) {
                rows.push(pos[0]);
                cols.push(pos[1]);
            }
        }

        // Combine coordinates in order: all rows then all columns
        coordinates.push(...rows, ...cols);

        // Create pairs from the combined coordinates
        let result = '';
        for (let i = 0; i < cleanText.length; i++) {
            const row = coordinates[i];
            const col = coordinates[i + cleanText.length];
            result += this.getCharFromPosition(row, col, square);
        }

        return result;
    }

    decrypt(text, key = '') {
        const square = this.createSquare(key);
        const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
        
        // Get coordinates for each letter
        const coordinates = [];
        for (const char of cleanText) {
            const pos = this.findPosition(char, square);
            if (pos) {
                coordinates.push(pos[0], pos[1]);
            }
        }

        // Split coordinates back into rows and columns
        const half = coordinates.length / 2;
        const rows = coordinates.slice(0, half);
        const cols = coordinates.slice(half);

        // Reconstruct the original text
        let result = '';
        for (let i = 0; i < rows.length; i++) {
            result += this.getCharFromPosition(rows[i], cols[i], square);
        }

        return result;
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const commonKeys = ['SECRET', 'CIPHER', 'KEY', 'BIFID', ''];

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
            return /^[A-Z]+$/i.test(key.replace(/[^A-Z]/gi, ''));
        }
        return true;
    }

    getDescription() {
        return "The Bifid cipher combines a Polybius square with a fractionation step to create a more complex substitution.";
    }

    getKeyDescription() {
        return "Optional key to arrange the Polybius square. Letters will be placed in order of appearance, followed by remaining alphabet.";
    }
}

export default BifidCipher;
