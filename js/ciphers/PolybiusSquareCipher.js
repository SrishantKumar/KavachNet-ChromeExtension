import BaseCipher from './BaseCipher.js';

class PolybiusSquareCipher extends BaseCipher {
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
        const alphabet = key.toUpperCase().replace(/J/g, 'I') + 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
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
        return text
            .toUpperCase()
            .split('')
            .map(char => {
                if (!/[A-Z]/.test(char)) return char;
                const pos = this.findPosition(char, square);
                return pos ? `${pos[0]}${pos[1]}` : char;
            })
            .join(' ');
    }

    decrypt(text, key = '') {
        const square = this.createSquare(key);
        const numbers = text.match(/\d{2}|\d\s\d|\S/g) || [];
        
        return numbers
            .map(pair => {
                if (!/\d/.test(pair)) return pair;
                const [row, col] = pair.replace(/\s/g, '').split('').map(Number);
                return this.getCharFromPosition(row, col, square);
            })
            .join('');
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const commonKeys = ['SECRET', 'CIPHER', 'POLYBIUS', 'KEY', ''];
        
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
        return "The Polybius Square cipher uses a 5x5 grid to convert letters into two-digit numbers representing their coordinates. J is usually combined with I.";
    }

    getKeyDescription() {
        return "Optional key to rearrange the square. Letters will be placed in order of appearance, followed by remaining alphabet. Leave empty for standard square.";
    }
}

export default PolybiusSquareCipher;
