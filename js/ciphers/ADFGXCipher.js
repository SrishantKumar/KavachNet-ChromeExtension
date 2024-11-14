import BaseCipher from './BaseCipher.js';

class ADFGXCipher extends BaseCipher {
    constructor() {
        super();
        this.coordinates = ['A', 'D', 'F', 'G', 'X'];
    }

    createSquare(key = '') {
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
                    return [this.coordinates[row], this.coordinates[col]];
                }
            }
        }
        return null;
    }

    getCharFromPosition(row, col, square) {
        const rowIndex = this.coordinates.indexOf(row);
        const colIndex = this.coordinates.indexOf(col);
        if (rowIndex !== -1 && colIndex !== -1) {
            return square[rowIndex][colIndex];
        }
        return '';
    }

    columnarTransposition(text, key) {
        // Create columns based on key
        const keyLength = key.length;
        const columns = Array(keyLength).fill('');
        
        // Fill columns
        for (let i = 0; i < text.length; i++) {
            columns[i % keyLength] += text[i];
        }

        // Sort columns based on key
        const keyOrder = [...key].map((char, index) => ({char, index}))
            .sort((a, b) => a.char.localeCompare(b.char))
            .map(item => item.index);

        // Read off columns in key order
        return keyOrder.map(index => columns[index]).join('');
    }

    inverseColumnarTransposition(text, key) {
        const keyLength = key.length;
        const numRows = Math.ceil(text.length / keyLength);
        
        // Calculate column lengths (last row may be incomplete)
        const colLengths = Array(keyLength).fill(numRows);
        const remainder = text.length % keyLength;
        if (remainder > 0) {
            for (let i = keyLength - 1; i >= remainder; i--) {
                colLengths[i]--;
            }
        }

        // Get key order
        const keyOrder = [...key].map((char, index) => ({char, index}))
            .sort((a, b) => a.char.localeCompare(b.char))
            .map(item => item.index);

        // Split text into columns
        let pos = 0;
        const columns = Array(keyLength).fill('');
        for (let i = 0; i < keyLength; i++) {
            const col = keyOrder[i];
            columns[col] = text.substr(pos, colLengths[col]);
            pos += colLengths[col];
        }

        // Read off rows
        let result = '';
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < keyLength; col++) {
                if (row < colLengths[col]) {
                    result += columns[col][row];
                }
            }
        }

        return result;
    }

    encrypt(text, key) {
        if (!this.validate(text, key)) return text;

        const [squareKey, transKey] = key.split(',').map(k => k.trim());
        const square = this.createSquare(squareKey);

        // First substitution using Polybius square
        let substituted = text
            .toUpperCase()
            .split('')
            .map(char => {
                if (!/[A-Z]/.test(char)) return char;
                const pos = this.findPosition(char, square);
                return pos ? pos.join('') : char;
            })
            .join('');

        // Then columnar transposition
        return this.columnarTransposition(substituted, transKey);
    }

    decrypt(text, key) {
        if (!this.validate(text, key)) return text;

        const [squareKey, transKey] = key.split(',').map(k => k.trim());
        const square = this.createSquare(squareKey);

        // First inverse columnar transposition
        const untransposed = this.inverseColumnarTransposition(text, transKey);

        // Then substitute back using Polybius square
        const pairs = untransposed.match(/.{2}|./g) || [];
        return pairs
            .map(pair => {
                if (pair.length !== 2) return pair;
                return this.getCharFromPosition(pair[0], pair[1], square);
            })
            .join('');
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const commonSquareKeys = ['SECRET', 'CIPHER', 'KEY'];
        const commonTransKeys = ['ADFGX', 'CIPHER', 'KEY'];

        for (const sKey of commonSquareKeys) {
            for (const tKey of commonTransKeys) {
                const key = `${sKey},${tKey}`;
                const decrypted = this.decrypt(text, key);
                const score = this.scoreText(decrypted);

                if (score > 0.5) {
                    results.push({
                        text: decrypted,
                        key: key,
                        score: score
                    });
                }
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
        if (!key || !key.includes(',')) return false;
        
        const [squareKey, transKey] = key.split(',').map(k => k.trim());
        return (
            squareKey && 
            transKey && 
            /^[A-Z]+$/i.test(squareKey.replace(/[^A-Z]/gi, '')) &&
            /^[A-Z]+$/i.test(transKey.replace(/[^A-Z]/gi, ''))
        );
    }

    getDescription() {
        return "The ADFGX cipher combines a Polybius square using ADFGX as coordinates with a columnar transposition, making it a fractionating cipher.";
    }

    getKeyDescription() {
        return "Two keys required, separated by comma. First key arranges the Polybius square, second key determines the transposition. Example: 'SQUARE,TRANS'";
    }
}

export default ADFGXCipher;
