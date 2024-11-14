import BaseCipher from './BaseCipher.js';

class A1Z26Cipher extends BaseCipher {
    constructor() {
        super();
        this.separator = ' ';
    }

    encrypt(text, key = '') {
        return text
            .toUpperCase()
            .split('')
            .map(char => {
                if (!/[A-Z]/.test(char)) return char;
                return (char.charCodeAt(0) - 64).toString();
            })
            .join(this.separator);
    }

    decrypt(text, key = '') {
        return text
            .split(this.separator)
            .map(num => {
                if (!/^\d+$/.test(num)) return num;
                const code = parseInt(num);
                if (code < 1 || code > 26) return '';
                return String.fromCharCode(code + 64);
            })
            .join('');
    }

    async bruteForceDecrypt(text) {
        // A1Z26 is a direct number-to-letter mapping, so no brute force needed
        const decrypted = this.decrypt(text);
        return [{
            text: decrypted,
            key: '',
            score: 1
        }];
    }

    validate(text) {
        // Check if the text consists of numbers between 1-26 separated by spaces
        const numbers = text.split(this.separator);
        return numbers.every(num => 
            /^\d+$/.test(num) && parseInt(num) >= 1 && parseInt(num) <= 26
        );
    }

    getDescription() {
        return "The A1Z26 cipher replaces each letter with its position in the alphabet (A=1, B=2, ..., Z=26).";
    }

    getKeyDescription() {
        return "No key required. Numbers should be space-separated.";
    }
}

export default A1Z26Cipher;
