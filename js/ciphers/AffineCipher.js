import BaseCipher from './BaseCipher.js';

class AffineCipher extends BaseCipher {
    constructor() {
        super();
        this.m = 26; // Size of alphabet
    }

    encrypt(text, key) {
        const [a, b] = this.parseKey(key);
        if (!this.validate(text, key)) return text;

        return text
            .split('')
            .map(char => this.encryptChar(char, a, b))
            .join('');
    }

    decrypt(text, key) {
        const [a, b] = this.parseKey(key);
        if (!this.validate(text, key)) return text;

        const aInverse = this.modInverse(a, this.m);
        return text
            .split('')
            .map(char => this.decryptChar(char, aInverse, b))
            .join('');
    }

    encryptChar(char, a, b) {
        if (!/[a-zA-Z]/.test(char)) return char;
        
        const isUpperCase = char === char.toUpperCase();
        const x = char.toUpperCase().charCodeAt(0) - 65;
        const result = ((a * x + b) % this.m + this.m) % this.m;
        const encryptedChar = String.fromCharCode(result + 65);
        
        return isUpperCase ? encryptedChar : encryptedChar.toLowerCase();
    }

    decryptChar(char, aInverse, b) {
        if (!/[a-zA-Z]/.test(char)) return char;
        
        const isUpperCase = char === char.toUpperCase();
        const y = char.toUpperCase().charCodeAt(0) - 65;
        const result = ((aInverse * (y - b)) % this.m + this.m) % this.m;
        const decryptedChar = String.fromCharCode(result + 65);
        
        return isUpperCase ? decryptedChar : decryptedChar.toLowerCase();
    }

    parseKey(key) {
        const [a, b] = key.split(',').map(x => parseInt(x.trim()));
        return [a, b];
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    modInverse(a, m) {
        a = ((a % m) + m) % m;
        for (let x = 1; x < m; x++) {
            if ((a * x) % m === 1) {
                return x;
            }
        }
        return 1;
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const validAs = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]; // Numbers coprime with 26

        for (const a of validAs) {
            for (let b = 0; b < this.m; b++) {
                const key = `${a},${b}`;
                const decrypted = this.decrypt(text, key);
                
                // Score the result based on letter frequency
                const score = this.scoreText(decrypted);
                
                if (score > 0.5) { // Only include reasonably likely results
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

    validate(text, key) {
        try {
            const [a, b] = this.parseKey(key);
            return (
                Number.isInteger(a) && 
                Number.isInteger(b) && 
                this.gcd(a, this.m) === 1 && 
                a > 0 && 
                b >= 0 && 
                b < this.m
            );
        } catch (e) {
            return false;
        }
    }

    getDescription() {
        return "The Affine cipher is a type of monoalphabetic substitution cipher, where each letter is mapped to its numeric equivalent, encrypted using a mathematical function, and converted back to a letter.";
    }

    getKeyDescription() {
        return "Key should be two numbers 'a,b' where 'a' is coprime with 26 and 'b' is between 0 and 25. Example: '5,8'";
    }
}

export default AffineCipher;
