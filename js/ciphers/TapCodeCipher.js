import BaseCipher from './BaseCipher.js';

class TapCodeCipher extends BaseCipher {
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

        // Create alphabet without duplicates, replacing J with I and C with K
        const alphabet = (key.toUpperCase().replace(/[JC]/g, match => match === 'J' ? 'I' : 'K') + 
            'ABDEFGHIKLMNOPQRSTUVWXYZ').replace(/[^A-Z]/g, '');
        const uniqueLetters = [...new Set(alphabet.split(''))];
        
        // Create 5x5 square
        const square = [];
        for (let i = 0; i < 5; i++) {
            square[i] = uniqueLetters.slice(i * 5, (i + 1) * 5);
        }
        
        return square;
    }

    findPosition(char, square) {
        char = char.toUpperCase().replace(/[JC]/g, match => match === 'J' ? 'I' : 'K');
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
                if (!pos) return char;
                return `${'.'.repeat(pos[0])} ${'.'.repeat(pos[1])}`;
            })
            .join(' / ');
    }

    decrypt(text, key = '') {
        const square = this.createSquare(key);
        
        // Split into individual tap patterns
        return text
            .split('/')
            .map(pattern => {
                pattern = pattern.trim();
                if (!pattern.includes(' ')) return pattern;

                const [row, col] = pattern.split(' ')
                    .map(taps => taps.split('.').length - 1);
                
                return this.getCharFromPosition(row, col, square);
            })
            .join('');
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const commonKeys = ['SECRET', 'CIPHER', 'KEY', 'TAP', ''];

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
        return "The Tap code cipher represents letters as sequences of taps (dots), using a 5x5 grid. Commonly used by prisoners to communicate through walls.";
    }

    getKeyDescription() {
        return "Optional key to arrange the square. Note that C and K share the same position, as do I and J. Example: Leave empty for standard arrangement.";
    }
}

export default TapCodeCipher;
