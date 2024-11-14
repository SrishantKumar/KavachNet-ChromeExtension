import BaseCipher from './BaseCipher.js';

class CaesarCipher extends BaseCipher {
    constructor() {
        super();
    }

    encrypt(text, key) {
        const shift = parseInt(key) % 26;
        return text
            .split('')
            .map(char => this.shiftChar(char, shift))
            .join('');
    }

    decrypt(text, key) {
        const shift = (26 - (parseInt(key) % 26)) % 26;
        return text
            .split('')
            .map(char => this.shiftChar(char, shift))
            .join('');
    }

    shiftChar(char, shift) {
        if (!/[a-zA-Z]/.test(char)) return char;
        
        const code = char.charCodeAt(0);
        const isUpperCase = code >= 65 && code <= 90;
        const base = isUpperCase ? 65 : 97;
        
        return String.fromCharCode(((code - base + shift) % 26) + base);
    }

    async bruteForceDecrypt(text) {
        const results = [];
        
        // Try all possible shifts (0-25)
        for (let shift = 0; shift < 26; shift++) {
            const decrypted = this.decrypt(text, shift);
            results.push({
                text: decrypted,
                key: shift.toString()
            });
        }

        return results;
    }

    validate(text, key) {
        const shift = parseInt(key);
        return !isNaN(shift) && shift >= 0;
    }

    getDescription() {
        return "The Caesar cipher is a simple substitution cipher that shifts each letter in the plaintext by a fixed number of positions in the alphabet.";
    }

    getKeyDescription() {
        return "Key should be a number between 0 and 25 representing the number of positions to shift.";
    }
}

export default CaesarCipher;
