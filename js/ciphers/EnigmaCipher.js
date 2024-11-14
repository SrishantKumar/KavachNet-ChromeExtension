import BaseCipher from './BaseCipher.js';

class EnigmaRotor {
    constructor(wiring, notch) {
        this.wiring = wiring;
        this.notch = notch;
        this.position = 0;
        this.ring = 0;
    }

    forward(input) {
        const shift = (input + this.position - this.ring + 26) % 26;
        const output = (this.wiring[shift] - this.position + this.ring + 26) % 26;
        return output;
    }

    backward(input) {
        const shift = (input + this.position - this.ring + 26) % 26;
        const output = (this.wiring.indexOf(shift) - this.position + this.ring + 26) % 26;
        return output;
    }

    rotate() {
        this.position = (this.position + 1) % 26;
        return this.position === this.notch;
    }
}

class EnigmaReflector {
    constructor(wiring) {
        this.wiring = wiring;
    }

    reflect(input) {
        return this.wiring[input];
    }
}

class EnigmaMachine {
    constructor(rotors, reflector, plugboard = {}) {
        this.rotors = rotors;
        this.reflector = reflector;
        this.plugboard = plugboard;
    }

    process(input) {
        // Rotate rotors
        let rotate = true;
        for (let i = this.rotors.length - 1; i >= 0 && rotate; i--) {
            rotate = this.rotors[i].rotate();
        }

        // Apply plugboard
        let current = this.plugboard[input] || input;

        // Forward through rotors
        for (let i = this.rotors.length - 1; i >= 0; i--) {
            current = this.rotors[i].forward(current);
        }

        // Through reflector
        current = this.reflector.reflect(current);

        // Backward through rotors
        for (let i = 0; i < this.rotors.length; i++) {
            current = this.rotors[i].backward(current);
        }

        // Apply plugboard again
        return this.plugboard[current] || current;
    }
}

class EnigmaCipher extends BaseCipher {
    constructor() {
        super();
        this.initializeRotors();
    }

    initializeRotors() {
        // Historical Enigma rotor wirings
        this.rotorWirings = {
            I:    "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
            II:   "AJDKSIRUXBLHWTMCQGZNPYFVOE",
            III:  "BDFHJLCPRTXVZNYEIWGAKMUSQO",
            IV:   "ESOVPZJAYQUIRHXLNFTGKDCMWB",
            V:    "VZBRGITYUPSDNHLXAWMJQOFECK"
        };

        this.rotorNotches = {
            I: 'Q', II: 'E', III: 'V', IV: 'J', V: 'Z'
        };

        // Historical reflector wirings
        this.reflectorWirings = {
            B: "YRUHQSLDPXNGOKMIEBFZCWVJAT",
            C: "FVPJIAOYEDRZXWGCTKUQSBNMHL"
        };
    }

    stringToNumbers(text) {
        return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => c.charCodeAt(0) - 65);
    }

    numbersToString(numbers) {
        return numbers.map(n => String.fromCharCode((n % 26) + 65)).join('');
    }

    createMachine(key) {
        const rotors = key.rotors.map((name, i) => {
            const wiring = this.rotorWirings[name].split('').map(c => c.charCodeAt(0) - 65);
            const notch = this.rotorNotches[name].charCodeAt(0) - 65;
            const rotor = new EnigmaRotor(wiring, notch);
            rotor.position = key.positions[i].charCodeAt(0) - 65;
            rotor.ring = key.rings[i].charCodeAt(0) - 65;
            return rotor;
        });

        const reflectorWiring = this.reflectorWirings[key.reflector].split('').map(c => c.charCodeAt(0) - 65);
        const reflector = new EnigmaReflector(reflectorWiring);

        const plugboard = {};
        if (key.plugboard) {
            key.plugboard.split(' ').forEach(pair => {
                if (pair.length === 2) {
                    const [a, b] = pair.split('').map(c => c.charCodeAt(0) - 65);
                    plugboard[a] = b;
                    plugboard[b] = a;
                }
            });
        }

        return new EnigmaMachine(rotors, reflector, plugboard);
    }

    encrypt(text, key) {
        const machine = this.createMachine(key);
        const numbers = this.stringToNumbers(text);
        const result = numbers.map(n => machine.process(n));
        return this.numbersToString(result);
    }

    decrypt(text, key) {
        // Enigma is symmetric - encryption is the same as decryption
        return this.encrypt(text, key);
    }

    async bruteForceDecrypt(text) {
        const results = [];
        const rotorCombinations = this.generateRotorCombinations();
        
        for (const rotorCombo of rotorCombinations) {
            const key = {
                rotors: rotorCombo.rotors,
                positions: rotorCombo.positions,
                rings: ['A', 'A', 'A'], // Default ring settings
                reflector: 'B',
                plugboard: '' // No plugboard connections
            };

            try {
                const decrypted = this.decrypt(text, key);
                results.push({
                    text: decrypted,
                    key: JSON.stringify(key)
                });
            } catch (error) {
                console.warn('Failed attempt:', error);
            }

            // Limit the number of attempts to prevent excessive computation
            if (results.length >= 100) break;
        }

        return results;
    }

    generateRotorCombinations() {
        const rotors = ['I', 'II', 'III', 'IV', 'V'];
        const positions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const combinations = [];

        // Generate a subset of possible combinations
        for (let i = 0; i < rotors.length - 2; i++) {
            for (let j = i + 1; j < rotors.length - 1; j++) {
                for (let k = j + 1; k < rotors.length; k++) {
                    // Use a limited set of positions for practical purposes
                    for (let p = 0; p < 5; p++) {
                        combinations.push({
                            rotors: [rotors[i], rotors[j], rotors[k]],
                            positions: [
                                positions[Math.floor(Math.random() * 26)],
                                positions[Math.floor(Math.random() * 26)],
                                positions[Math.floor(Math.random() * 26)]
                            ]
                        });
                    }
                }
            }
        }

        return combinations;
    }

    validate(text, key) {
        const requiredFields = ['rotors', 'positions', 'rings', 'reflector'];
        return requiredFields.every(field => key && key[field]);
    }

    getDescription() {
        return "The Enigma machine was a complex encryption device used during World War II. " +
               "It uses multiple rotors, a reflector, and a plugboard to create sophisticated polyalphabetic substitution.";
    }

    getKeyDescription() {
        return "Key should include rotor selection (I-V), rotor positions (A-Z), ring settings (A-Z), " +
               "reflector type (B/C), and optional plugboard connections.";
    }
}

export default EnigmaCipher;
