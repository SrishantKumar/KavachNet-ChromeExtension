class BaseCipher {
    constructor() {
        if (this.constructor === BaseCipher) {
            throw new Error("Abstract class 'BaseCipher' cannot be instantiated.");
        }
    }

    encrypt(text, key) {
        throw new Error("Method 'encrypt' must be implemented.");
    }

    decrypt(text, key) {
        throw new Error("Method 'decrypt' must be implemented.");
    }

    validate(text, key) {
        throw new Error("Method 'validate' must be implemented.");
    }

    getName() {
        return this.constructor.name.replace('Cipher', '');
    }

    getDescription() {
        throw new Error("Method 'getDescription' must be implemented.");
    }

    getKeyDescription() {
        throw new Error("Method 'getKeyDescription' must be implemented.");
    }
}

export default BaseCipher;
