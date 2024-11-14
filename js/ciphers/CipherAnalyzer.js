import { englishFrequencies, commonWords, commonPatterns } from './utils/languageData.js';

class CipherAnalyzer {
    constructor() {
        this.cipherMethods = new Map();
        this.languageModel = this.loadLanguageModel();
    }

    // Initialize language model with frequency data and patterns
    loadLanguageModel() {
        return {
            letterFreq: englishFrequencies,
            commonWords: commonWords,
            patterns: commonPatterns
        };
    }

    // Register a new cipher method
    registerCipher(name, cipher) {
        this.cipherMethods.set(name, cipher);
    }

    // Calculate text statistics
    analyzeText(text) {
        const stats = {
            length: text.length,
            uniqueChars: new Set(text).size,
            letterFrequencies: {},
            wordLengths: {},
            patterns: [],
            entropy: this.calculateEntropy(text)
        };

        // Calculate letter frequencies
        for (const char of text.toLowerCase()) {
            stats.letterFrequencies[char] = (stats.letterFrequencies[char] || 0) + 1;
        }

        // Normalize frequencies
        Object.keys(stats.letterFrequencies).forEach(key => {
            stats.letterFrequencies[key] /= text.length;
        });

        return stats;
    }

    // Calculate text entropy (randomness measure)
    calculateEntropy(text) {
        const frequencies = {};
        for (const char of text) {
            frequencies[char] = (frequencies[char] || 0) + 1;
        }

        return -Object.values(frequencies).reduce((entropy, freq) => {
            const p = freq / text.length;
            return entropy + p * Math.log2(p);
        }, 0);
    }

    // Score decrypted text based on language model
    scoreText(text) {
        let score = 0;
        const words = text.toLowerCase().split(/\s+/);
        
        // Check for common words
        score += words.filter(word => this.languageModel.commonWords.includes(word)).length * 2;

        // Check letter frequency correlation
        const textFreq = this.analyzeText(text).letterFrequencies;
        score += this.calculateFrequencyCorrelation(textFreq, this.languageModel.letterFreq);

        // Check for common patterns
        score += this.languageModel.patterns.filter(pattern => 
            text.toLowerCase().includes(pattern.toLowerCase())
        ).length;

        // Penalize non-printable characters
        score -= text.split('').filter(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) > 126).length * 2;

        return score;
    }

    // Calculate correlation between two frequency distributions
    calculateFrequencyCorrelation(freq1, freq2) {
        const keys = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
        let correlation = 0;

        for (const key of keys) {
            const f1 = freq1[key] || 0;
            const f2 = freq2[key] || 0;
            correlation += 1 - Math.abs(f1 - f2);
        }

        return correlation / keys.size;
    }

    // Try to detect the most likely cipher method
    detectCipherMethod(encryptedText) {
        const stats = this.analyzeText(encryptedText);
        const predictions = [];

        // Check for specific cipher characteristics
        if (stats.uniqueChars === 2) {
            predictions.push({ method: 'Bacon', confidence: 0.9 });
        }

        if (/^[A-Z]+$/.test(encryptedText)) {
            predictions.push({ method: 'Caesar', confidence: 0.7 });
            predictions.push({ method: 'Vigenere', confidence: 0.6 });
        }

        if (/^\d+(\s+\d+)*$/.test(encryptedText)) {
            predictions.push({ method: 'A1Z26', confidence: 0.8 });
        }

        // Add more detection rules based on statistical analysis
        if (stats.entropy < 3.0) {
            predictions.push({ method: 'Simple Substitution', confidence: 0.5 });
        }

        if (stats.entropy > 4.0) {
            predictions.push({ method: 'Enigma', confidence: 0.4 });
        }

        return predictions.sort((a, b) => b.confidence - a.confidence);
    }

    // Attempt to decrypt text using all registered methods
    async bruteForceDecrypt(encryptedText) {
        const results = [];
        const detectedMethods = this.detectCipherMethod(encryptedText);

        // Try each cipher method with various keys
        for (const [methodName, cipher] of this.cipherMethods) {
            const methodConfidence = detectedMethods.find(m => m.method === methodName)?.confidence || 0.3;
            
            try {
                const decryptionAttempts = await cipher.bruteForceDecrypt(encryptedText);
                
                for (const attempt of decryptionAttempts) {
                    const score = this.scoreText(attempt.text);
                    results.push({
                        method: methodName,
                        text: attempt.text,
                        key: attempt.key,
                        score: score * methodConfidence,
                        confidence: methodConfidence
                    });
                }
            } catch (error) {
                console.warn(`Failed to decrypt with ${methodName}:`, error);
            }
        }

        // Sort results by score and return top matches
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(result => ({
                ...result,
                analysis: {
                    readability: this.calculateReadabilityScore(result.text),
                    possibleContext: this.detectContext(result.text),
                    confidence: result.score > 10 ? 'High' : result.score > 5 ? 'Medium' : 'Low'
                }
            }));
    }

    // Calculate readability score
    calculateReadabilityScore(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.length > 0);
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        
        return {
            score: (words.length / sentences.length) * (1 / avgWordLength) * 100,
            avgWordLength,
            sentenceCount: sentences.length,
            wordCount: words.length
        };
    }

    // Detect possible context of the message
    detectContext(text) {
        const contexts = [
            { category: 'Military', keywords: ['attack', 'defense', 'troops', 'enemy', 'command'] },
            { category: 'Diplomatic', keywords: ['treaty', 'agreement', 'negotiate', 'alliance'] },
            { category: 'Personal', keywords: ['love', 'friend', 'family', 'home', 'meet'] },
            { category: 'Business', keywords: ['contract', 'money', 'deal', 'price', 'market'] }
        ];

        const matches = contexts.map(context => ({
            category: context.category,
            matches: context.keywords.filter(keyword => 
                text.toLowerCase().includes(keyword.toLowerCase())
            ).length
        }));

        return matches
            .filter(m => m.matches > 0)
            .sort((a, b) => b.matches - a.matches);
    }
}

export default CipherAnalyzer;
