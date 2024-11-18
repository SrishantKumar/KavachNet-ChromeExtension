// Particle Animation System
class Particle {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.velocity = {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5
        };
        this.radius = Math.random() * 1.5 + 0.5;
        this.baseRadius = this.radius;
        this.color = `rgba(255, ${Math.random() * 30}, ${Math.random() * 30}, ${0.6 + Math.random() * 0.4})`;
        this.mass = this.radius;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    update(mouse) {
        // Base movement
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Mouse interaction
        if (mouse.x !== undefined && mouse.y !== undefined) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 80;

            if (distance < maxDistance) {
                // Calculate repulsion force
                const force = (1 - distance / maxDistance) * 0.8;
                const angle = Math.atan2(dy, dx);
                
                // Apply repulsion
                this.velocity.x -= Math.cos(angle) * force;
                this.velocity.y -= Math.sin(angle) * force;
                
                // Particle expansion effect
                this.radius = this.baseRadius + (force * 4);
                
                // Add glow effect when near mouse
                this.color = `rgba(255, ${Math.random() * 30}, ${Math.random() * 30}, ${0.8 + force * 0.2})`;
            } else {
                // Reset size and color when far from mouse
                this.radius = this.baseRadius;
                this.color = `rgba(255, ${Math.random() * 30}, ${Math.random() * 30}, ${0.6 + Math.random() * 0.4})`;
            }
        }

        // Add some randomness to movement
        this.velocity.x += (Math.random() - 0.5) * 0.01;
        this.velocity.y += (Math.random() - 0.5) * 0.01;

        // Dampen velocity
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;

        // Bounce off edges with damping
        if (this.x + this.radius > this.canvas.width) {
            this.x = this.canvas.width - this.radius;
            this.velocity.x *= -0.8;
        }
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.velocity.x *= -0.8;
        }
        if (this.y + this.radius > this.canvas.height) {
            this.y = this.canvas.height - this.radius;
            this.velocity.y *= -0.8;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.velocity.y *= -0.8;
        }
    }
}

// Initialize particle system
function initParticleSystem() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const mouse = { x: undefined, y: undefined };
    const particleCount = 80; // Increased number of particles

    // Set canvas size and handle resize
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Initialize canvas size
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas, ctx));
    }

    // Mouse move handler
    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    // Mouse leave handler
    document.addEventListener('mouseleave', () => {
        mouse.x = undefined;
        mouse.y = undefined;
    });

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update(mouse);
            particle.draw();
        });

        // Connect nearby particles with lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 60) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 0, 0, ${0.2 * (1 - distance / 60)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// Start the particle system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initParticleSystem();

    // Cursor Glow Effect
    const cursorGlow = document.querySelector('.cursor-glow');
    
    // Direct cursor movement for better responsiveness
    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            cursorGlow.style.left = `${e.clientX}px`;
            cursorGlow.style.top = `${e.clientY}px`;
        });
    });

    // Hide cursor glow when mouse leaves the window
    document.addEventListener('mouseleave', () => {
        cursorGlow.style.opacity = '0';
    });

    // Show cursor glow when mouse enters the window
    document.addEventListener('mouseenter', (e) => {
        cursorGlow.style.opacity = '1';
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
    });

    // Add glow effect on interactive elements
    const interactiveElements = document.querySelectorAll('button, textarea, a');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorGlow.style.width = '80px';
            cursorGlow.style.height = '80px';
            cursorGlow.style.filter = 'blur(10px)';
            element.style.cursor = 'pointer';
        });
        
        element.addEventListener('mouseleave', () => {
            cursorGlow.style.width = '50px';
            cursorGlow.style.height = '50px';
            cursorGlow.style.filter = 'blur(8px)';
        });
    });

    // UI Elements
    const inputText = document.getElementById('inputText');
    const decryptButton = document.getElementById('decryptAction');
    const decryptResult = document.getElementById('decryptResult');
    const decryptedContent = document.getElementById('decryptedContent');
    const threatContent = document.getElementById('threatContent');

    // Verify all elements are found
    const requiredElements = {
        inputText,
        decryptButton,
        decryptResult,
        decryptedContent,
        threatContent
    };

    // Check if any required element is missing
    const missingElements = Object.entries(requiredElements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }

    // Add click event listener to decrypt button
    decryptButton.addEventListener('click', () => {
        console.log('Decrypt button clicked');
        handleDecryption();
    });

    // Handle decryption and analysis
    function handleDecryption() {
        const text = inputText.value.trim();
        
        if (!text) {
            decryptedContent.textContent = 'Please enter text to decrypt';
            return;
        }

        try {
            // Decrypt the text
            const decrypted = caesarCipherDecrypt(text);
            decryptedContent.textContent = decrypted;
            
            // Show the results section
            decryptResult.classList.remove('hidden');
            
            // Analyze threats in decrypted text
            const threats = analyzeThreat(decrypted);
            displayThreats(threats);
            
        } catch (error) {
            console.error('Decryption error:', error);
            decryptedContent.textContent = 'Error during decryption. Please try again.';
        }
    }

    // Caesar cipher decryption function
    function caesarCipherDecrypt(text) {
        if (!text.trim()) return '';

        // English letter frequency order (most common to least common)
        const englishFreq = 'ETAOINSHRDLCUMWFGYPBVKJXQZ'.toLowerCase();
        
        // Count frequencies in the encrypted text
        const freqCount = {};
        let totalLetters = 0;
        
        // Count only letters
        text.toLowerCase().split('').forEach(char => {
            if (/[a-z]/.test(char)) {
                freqCount[char] = (freqCount[char] || 0) + 1;
                totalLetters++;
            }
        });

        // Convert to frequency array and sort
        const freqArray = Object.entries(freqCount)
            .map(([char, count]) => ({
                char,
                freq: count / totalLetters
            }))
            .sort((a, b) => b.freq - a.freq);

        // Get the most frequent letters from the text
        const textFreq = freqArray.map(item => item.char).join('');

        // Try all possible shifts and score them
        let bestShift = 0;
        let bestScore = -Infinity;

        for (let shift = 0; shift < 26; shift++) {
            let score = 0;
            
            // Score based on frequency matching
            for (let i = 0; i < Math.min(textFreq.length, 6); i++) {
                const expectedPos = englishFreq.indexOf(textFreq[i]);
                const currentPos = (expectedPos + shift) % 26;
                score -= Math.abs(i - currentPos);
            }

            // Score based on common English words after decryption
            const decrypted = text.toLowerCase().split('').map(char => {
                if (!/[a-z]/.test(char)) return char;
                const code = char.charCodeAt(0) - 97;
                return String.fromCharCode(((code + shift) % 26) + 97);
            }).join('');

            // Common English words to check
            const commonWords = ['the', 'is', 'at', 'in', 'on', 'and', 'or', 'for', 'to', 'with'];
            commonWords.forEach(word => {
                if (decrypted.includes(word)) {
                    score += 10;
                }
            });

            if (score > bestScore) {
                bestScore = score;
                bestShift = shift;
            }
        }

        // Apply the best shift to decrypt
        return text.split('').map(char => {
            if (!/[a-zA-Z]/.test(char)) return char;
            
            const isUpperCase = char === char.toUpperCase();
            const base = isUpperCase ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
            const code = char.toLowerCase().charCodeAt(0) - base;
            const shifted = ((code + bestShift) % 26 + 26) % 26;
            const decrypted = String.fromCharCode(base + shifted);
            
            return isUpperCase ? decrypted.toUpperCase() : decrypted;
        }).join('');
    }

    // Analyze threats with improved scoring
    function analyzeThreat(text) {
        const threats = [];
        
        // Define threat patterns with weights
        const threatPatterns = {
            high: [
                { pattern: /\b(bomb|blast|explosion|attack)\b/i, label: 'HIGH: Potential Security Threat', weight: 10.0 },
                { pattern: /\b(terrorist|terrorism|terror|weapon|explosive)\b/i, label: 'HIGH: Security Alert', weight: 10.0 },
                { pattern: /\b(kill|death|threat|violence)\b/i, label: 'HIGH: Violence-related Content', weight: 10.0 },
                { pattern: /password\s*[:=]\s*['"][^'"]+['"]/, label: 'HIGH: Exposed Password', weight: 10.0 },
                { pattern: /\b\d{16}\b/, label: 'HIGH: Possible Credit Card Number', weight: 10.0 }
            ],
            medium: [
                { pattern: /\b(hack|breach|vulnerability)\b/i, label: 'MEDIUM: Security Concern', weight: 6.0 },
                { pattern: /\b(admin|root|password|login)\b/i, label: 'MEDIUM: Sensitive Keyword', weight: 5.0 },
                { pattern: /\b(select|insert|update|delete)\s+from\b/i, label: 'MEDIUM: SQL Pattern', weight: 5.0 },
                { pattern: /\b(token|secret|key)\b/i, label: 'MEDIUM: Security Term', weight: 5.0 }
            ],
            low: [
                { pattern: /\b(debug|test|todo)\b/i, label: 'LOW: Development Term', weight: 2.0 },
                { pattern: /\b(http|https):\/\/\b/i, label: 'LOW: URL Found', weight: 1.0 },
                { pattern: /\b(function|class|var|let|const)\b/i, label: 'LOW: Code Structure', weight: 1.0 }
            ]
        };

        // Check each pattern and calculate total weight
        let totalWeight = 0;
        Object.entries(threatPatterns).forEach(([level, patterns]) => {
            patterns.forEach(({ pattern, label, weight }) => {
                if (pattern.test(text)) {
                    threats.push({
                        level,
                        label,
                        weight
                    });
                    totalWeight += weight;
                }
            });
        });

        // Sort threats by weight
        threats.sort((a, b) => b.weight - a.weight);
        
        return threats;
    }

    // Display threats with detailed analysis
    function displayThreats(threats) {
        if (!threats.length) {
            threatContent.innerHTML = '<div class="threat threat-low">No significant threats detected</div>';
            return;
        }

        // Count threats by severity
        const threatCounts = {
            high: 0,
            medium: 0,
            low: 0
        };

        // Process threat indicators with severity
        const threatIndicators = new Map();
        threats.forEach(threat => {
            threatCounts[threat.level]++;
            
            // Extract individual words and their context
            const words = threat.label.split(/[\s:]+/).filter(word => 
                word.length > 3 && 
                !['the', 'and', 'for', 'with'].includes(word.toLowerCase())
            );
            
            words.forEach(word => {
                const key = word.toLowerCase();
                if (!threatIndicators.has(key)) {
                    threatIndicators.set(key, {
                        word: word,
                        severity: threat.level,
                        context: threat.label
                    });
                }
            });
        });

        // Calculate total threat score based on weighted counts
        const threatScore = Math.ceil(
            (threatCounts.high * 10.0) + 
            (threatCounts.medium * 5.0) + 
            (threatCounts.low * 1.0)
        );

        // Generate detailed threat analysis
        const threatHTML = `
            <div class="threat-analysis">
                <h3 class="threat-header">Threat Level:</h3>
                <div class="threat-level ${threats[0].level}">${threats[0].level.toUpperCase()}</div>
                
                <h3 class="threat-header">Summary:</h3>
                <p class="threat-summary">
                    ${threats[0].level.toUpperCase()} THREAT LEVEL: Detected ${threatIndicators.size} threat indicators. 
                    ${threats[0].level === 'high' ? 'Immediate attention required!' :
                      threats[0].level === 'medium' ? 'Careful review needed.' : 'Monitor situation.'}
                </p>

                <h3 class="threat-header">Threat Indicators:</h3>
                <div class="threat-indicators">
                    ${Array.from(threatIndicators.values()).map(({ word, severity, context }) => `
                        <div class="indicator ${severity}">
                            ${word.toLowerCase()} (${severity}) - ${context}
                        </div>
                    `).join('')}
                </div>

                <div class="threat-score">
                    <h3 class="threat-header">Threat Score: ${threatScore}</h3>
                    <div class="score-breakdown">
                        ${Object.entries(threatCounts).map(([level, count]) => 
                            count > 0 ? `<div class="${level}">${level.toUpperCase()}: ${count}</div>` : ''
                        ).filter(Boolean).join('')}
                    </div>
                </div>
            </div>
        `;

        threatContent.innerHTML = threatHTML;
    }
});
