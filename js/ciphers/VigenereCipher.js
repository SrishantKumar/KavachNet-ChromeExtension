import BaseCipher from './BaseCipher.js';

class VigenereCipher extends BaseCipher {
    constructor() {
        super();
    }

    encrypt(text, key) {
        const keyRepeated = this.repeatKey(key, text.length);
        return text
            .split('')
            .map((char, i) => this.shiftChar(char, keyRepeated[i]))
            .join('');
    }

    decrypt(text, key) {
        const keyRepeated = this.repeatKey(key, text.length);
        return text
            .split('')
            .map((char, i) => this.shiftChar(char, keyRepeated[i], true))
            .join('');
    }

    repeatKey(key, length) {
        key = key.toUpperCase().replace(/[^A-Z]/g, '');
        return key.repeat(Math.ceil(length / key.length)).slice(0, length);
    }

    shiftChar(char, keyChar, decrypt = false) {
        if (!/[a-zA-Z]/.test(char)) return char;
        
        const code = char.charCodeAt(0);
        const isUpperCase = code >= 65 && code <= 90;
        const base = isUpperCase ? 65 : 97;
        const shift = keyChar.charCodeAt(0) - 65;
        
        const finalShift = decrypt ? -shift : shift;
        return String.fromCharCode(((code - base + finalShift + 26) % 26) + base);
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const commonWords = ['THE', 'AND', 'THAT', 'HAVE', 'FOR', 'NOT', 'WITH', 'YOU'];
        const keyLengths = this.findPossibleKeyLengths(text);

        for (const length of keyLengths) {
            const possibleKeys = await this.findPossibleKeys(text, length);
            
            for (const key of possibleKeys) {
                const decrypted = this.decrypt(text, key);
                
                // Score the result based on common words
                const score = commonWords.reduce((count, word) => 
                    count + (decrypted.toUpperCase().includes(word) ? 1 : 0), 0);

                if (score > 0) {
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

    findPossibleKeyLengths(text) {
        // Use Kasiski examination to find repeated sequences
        const sequences = {};
        const minSeqLength = 3;
        const maxKeyLength = 10;
        
        for (let i = 0; i < text.length - minSeqLength; i++) {
            const seq = text.substr(i, minSeqLength);
            const nextIndex = text.indexOf(seq, i + minSeqLength);
            
            if (nextIndex > -1) {
                const distance = nextIndex - i;
                sequences[distance] = (sequences[distance] || 0) + 1;
            }
        }

        // Find the most likely key lengths based on factors of distances
        const factors = new Set();
        Object.keys(sequences).forEach(distance => {
            for (let i = 2; i <= maxKeyLength; i++) {
                if (parseInt(distance) % i === 0) {
                    factors.add(i);
                }
            }
        });

        return Array.from(factors).sort((a, b) => a - b);
    }

    async findPossibleKeys(text, keyLength) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const columns = [];
        
        // Split text into columns based on key length
        for (let i = 0; i < keyLength; i++) {
            columns.push('');
            for (let j = i; j < text.length; j += keyLength) {
                columns[i] += text[j];
            }
        }

        // Find most likely letter for each position
        const key = [];
        for (const column of columns) {
            const frequencies = {};
            for (const char of column) {
                if (/[A-Z]/i.test(char)) {
                    const upper = char.toUpperCase();
                    frequencies[upper] = (frequencies[upper] || 0) + 1;
                }
            }
            
            // Get the most frequent character
            const mostFrequent = Object.entries(frequencies)
                .sort((a, b) => b[1] - a[1])[0][0];
            
            // Assume 'E' is the most common letter in English
            const shift = (mostFrequent.charCodeAt(0) - 'E'.charCodeAt(0) + 26) % 26;
            key.push(alphabet[shift]);
        }

        return [key.join('')];
    }

    validate(text, key) {
        return key && key.length > 0 && /^[A-Za-z]+$/.test(key);
    }

    getDescription() {
        return "The Vigenère cipher is a polyalphabetic substitution cipher that uses a keyword to shift each letter by different amounts.";
    }

    getKeyDescription() {
        return "Key should be a word or phrase containing only letters (A-Z). The key will be repeated to match the text length.";
    }
}

export default VigenereCipher;
