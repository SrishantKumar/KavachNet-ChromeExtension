import BaseCipher from './BaseCipher.js';

class NihilistCipher extends BaseCipher {
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

    getNumberFromPosition(pos) {
        return parseInt(`${pos[0]}${pos[1]}`);
    }

    getPositionFromNumber(num) {
        const str = num.toString().padStart(2, '0');
        return [parseInt(str[0]), parseInt(str[1])];
    }

    repeatKey(key, length) {
        return key.repeat(Math.ceil(length / key.length)).slice(0, length);
    }

    encrypt(text, key) {
        if (!this.validate(text, key)) return text;

        const [squareKey, keyPhrase] = key.split(',').map(k => k.trim());
        const square = this.createSquare(squareKey);
        const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
        
        // Convert text to numbers using Polybius square
        const textNumbers = [];
        for (const char of cleanText) {
            const pos = this.findPosition(char, square);
            if (pos) {
                textNumbers.push(this.getNumberFromPosition(pos));
            }
        }

        // Convert key phrase to numbers
        const keyNumbers = [];
        const repeatedKey = this.repeatKey(keyPhrase, cleanText.length);
        for (const char of repeatedKey) {
            const pos = this.findPosition(char, square);
            if (pos) {
                keyNumbers.push(this.getNumberFromPosition(pos));
            }
        }

        // Add numbers together
        return textNumbers
            .map((num, i) => num + keyNumbers[i])
            .join(' ');
    }

    decrypt(text, key) {
        if (!this.validate(text, key)) return text;

        const [squareKey, keyPhrase] = key.split(',').map(k => k.trim());
        const square = this.createSquare(squareKey);
        
        // Parse numbers from text
        const numbers = text.split(/\s+/).map(Number);
        
        // Convert key phrase to numbers
        const keyNumbers = [];
        const repeatedKey = this.repeatKey(keyPhrase, numbers.length);
        for (const char of repeatedKey) {
            const pos = this.findPosition(char, square);
            if (pos) {
                keyNumbers.push(this.getNumberFromPosition(pos));
            }
        }

        // Subtract key numbers and convert back to text
        let result = '';
        for (let i = 0; i < numbers.length; i++) {
            const diff = numbers[i] - keyNumbers[i];
            const pos = this.getPositionFromNumber(diff);
            result += this.getCharFromPosition(pos[0], pos[1], square);
        }

        return result;
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const commonSquareKeys = ['SECRET', 'CIPHER', 'KEY'];
        const commonPhrases = ['NIHILIST', 'PASSWORD', 'KEY'];

        for (const sKey of commonSquareKeys) {
            for (const phrase of commonPhrases) {
                const key = `${sKey},${phrase}`;
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
        
        const [squareKey, keyPhrase] = key.split(',').map(k => k.trim());
        return (
            squareKey && 
            keyPhrase && 
            /^[A-Z]+$/i.test(squareKey.replace(/[^A-Z]/gi, '')) &&
            /^[A-Z]+$/i.test(keyPhrase.replace(/[^A-Z]/gi, ''))
        );
    }

    getDescription() {
        return "The Nihilist cipher combines a Polybius square with a repeating key addition, creating a polyalphabetic substitution cipher.";
    }

    getKeyDescription() {
        return "Two keys required, separated by comma. First key arranges the Polybius square, second is the key phrase. Example: 'SQUARE,PHRASE'";
    }
}

export default NihilistCipher;
