import BaseCipher from './BaseCipher.js';

class ROT13Cipher extends BaseCipher {
    constructor() {
        super();
        this.shift = 13;
    }

    encrypt(text, key = '') {
        return text
            .split('')
            .map(char => this.shiftChar(char))
            .join('');
    }

    decrypt(text, key = '') {
        // ROT13 is its own inverse - encryption is the same as decryption
        return this.encrypt(text);
    }

    shiftChar(char) {
        if (!/[a-zA-Z]/.test(char)) return char;
        
        const code = char.charCodeAt(0);
        const isUpperCase = code >= 65 && code <= 90;
        const base = isUpperCase ? 65 : 97;
        
        return String.fromCharCode(
            ((code - base + this.shift) % 26) + base
        );
    }

    async bruteForceDecrypt(text) {
        // ROT13 is deterministic - only one possible decryption
        const decrypted = this.decrypt(text);
        return [{
            text: decrypted,
            key: '',
            score: 1
        }];
    }

    validate(text) {
        // ROT13 can handle any text input
        return true;
    }

    getDescription() {
        return "ROT13 is a simple letter substitution cipher that replaces a letter with the 13th letter after it in the alphabet.";
    }

    getKeyDescription() {
        return "No key required. ROT13 always shifts by 13 positions.";
    }
}

export default ROT13Cipher;
