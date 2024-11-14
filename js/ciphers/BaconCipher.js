import BaseCipher from './BaseCipher.js';

class BaconCipher extends BaseCipher {
    constructor() {
        super();
        this.initializeMappings();
    }

    initializeMappings() {
        // Standard Bacon cipher mapping (I/J and U/V share codes)
        this.letterToBacon = {
            'A': 'aaaaa', 'B': 'aaaab', 'C': 'aaaba', 'D': 'aaabb', 'E': 'aabaa',
            'F': 'aabab', 'G': 'aabba', 'H': 'aabbb', 'I': 'abaaa', 'J': 'abaaa',
            'K': 'abaab', 'L': 'ababa', 'M': 'ababb', 'N': 'abbaa', 'O': 'abbab',
            'P': 'abbba', 'Q': 'abbbb', 'R': 'baaaa', 'S': 'baaab', 'T': 'baaba',
            'U': 'baabb', 'V': 'baabb', 'W': 'babaa', 'X': 'babab', 'Y': 'babba',
            'Z': 'babbb'
        };

        // Create reverse mapping for decryption
        this.baconToLetter = {};
        for (const [letter, code] of Object.entries(this.letterToBacon)) {
            if (!this.baconToLetter[code]) {
                this.baconToLetter[code] = letter;
            }
        }
    }

    encrypt(text, key = '') {
        return text
            .toUpperCase()
            .split('')
            .map(char => {
                if (!/[A-Z]/.test(char)) return char;
                return this.letterToBacon[char] || char;
            })
            .join(' ');
    }

    decrypt(text, key = '') {
        // Remove any characters that aren't 'a' or 'b'
        const cleanText = text.toLowerCase().replace(/[^ab]/g, '');
        
        // Split into groups of 5
        const groups = cleanText.match(/.{1,5}/g) || [];
        
        return groups
            .map(group => this.baconToLetter[group] || group)
            .join('');
    }

    async bruteForceDecrypt(text) {
        // Try different interpretations of the text
        const results = [];
        
        // Standard a/b interpretation
        const standard = this.decrypt(text);
        results.push({
            text: standard,
            key: 'Standard (A/B)',
            score: 1
        });

        // Try 0/1 interpretation
        const binary = this.decrypt(text.replace(/0/g, 'a').replace(/1/g, 'b'));
        if (binary !== standard) {
            results.push({
                text: binary,
                key: 'Binary (0/1)',
                score: 0.9
            });
        }

        // Try uppercase/lowercase interpretation
        const upperLower = this.decrypt(
            text.replace(/[A-Z]/g, 'b').replace(/[a-z]/g, 'a')
        );
        if (upperLower !== standard) {
            results.push({
                text: upperLower,
                key: 'Case (Upper/Lower)',
                score: 0.8
            });
        }

        return results;
    }

    validate(text) {
        // Check if the text consists of only 'a' and 'b' (or '0' and '1')
        const cleanText = text.toLowerCase().replace(/[^ab01]/g, '');
        return cleanText.length > 0 && cleanText.length % 5 === 0;
    }

    getDescription() {
        return "The Bacon cipher replaces each letter with a unique 5-character sequence of 'a's and 'b's.";
    }

    getKeyDescription() {
        return "No key required. Text should be sequences of 'a' and 'b' (or '0' and '1').";
    }
}

export default BaconCipher;
