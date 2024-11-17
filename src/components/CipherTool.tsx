import React, { useState, useEffect } from 'react';
import InteractiveCanvas from './InteractiveCanvas';
import { useMousePosition } from '../utils/animations';
import { Lock, Unlock, Zap, Search, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useDecryptionHistory } from '../hooks/useDecryptionHistory';
import { analyzeThreat, ThreatAnalysis } from '../utils/threatAnalysis';
import ThreatVisualizer from './ThreatVisualizer';

interface CipherToolProps {
  /**
   * The initial message to be decrypted.
   */
  initialMessage?: string;
  /**
   * A callback function to be executed when the decryption is complete.
   */
  onDecryptionComplete?: () => void;
}

interface ClueAnalysis {
  /**
   * An array of dates mentioned in the decrypted text.
   */
  dates: string[];
  /**
   * An array of locations mentioned in the decrypted text.
   */
  locations: string[];
  /**
   * An array of actions mentioned in the decrypted text.
   */
  actions: string[];
  /**
   * An array of security-related keywords mentioned in the decrypted text.
   */
  keywords: string[];
  /**
   * The threat level of the decrypted text, which can be 'low', 'medium', or 'high'.
   */
  threatLevel: 'low' | 'medium' | 'high';
  /**
   * A timeline of events mentioned in the decrypted text.
   */
  timeline: string;
  /**
   * A strategy analysis of the decrypted text.
   */
  strategy: string;
  /**
   * An array of context-related information mentioned in the decrypted text.
   */
  context: string[];
  /**
   * An array of patterns detected in the decrypted text, including their type, description, and confidence level.
   */
  patterns: {
    type: string;
    description: string;
    confidence: number;
  }[];
}

const CipherTool: React.FC<CipherToolProps> = ({ initialMessage = '', onDecryptionComplete }) => {
  const [input, setInput] = useState(initialMessage);
  const [shift, setShift] = useState(3);
  const [manualDecryption, setManualDecryption] = useState('');
  const [autoDecryptions, setAutoDecryptions] = useState<string[]>([]);
  const [bestDecryption, setBestDecryption] = useState('');
  const [clueAnalysis, setClueAnalysis] = useState<ClueAnalysis | null>(null);
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mousePosition = useMousePosition();
  const [user] = useAuthState(auth);
  const { addDecryptionHistory } = useDecryptionHistory();

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
      handleAutoDecrypt();
    }
  }, [initialMessage]);

  const saveToHistory = async (encryptedText: string, decryptedText: string) => {
    if (!user) return;
    
    await addDecryptionHistory({
      userId: user.uid,
      encryptedText,
      decryptedText,
      timestamp: new Date(),
      method: 'auto',
      analysis: clueAnalysis
    });
    
    onDecryptionComplete?.();
  };

  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const charsetLength = charset.length;

  const caesarDecrypt = (text: string, shift: number): string => {
    return text
      .split('')
      .map(char => {
        const index = charset.indexOf(char);
        if (index === -1) return char;
        
        const newIndex = (index - shift + charsetLength) % charsetLength;
        return charset[newIndex];
      })
      .join('');
  };

  const commonPatterns = {
    words: [
      // Very common words (weight: 3)
      { pattern: /\b(the|be|to|of|and|a|in|that|have|i|it|for|not|on|with|he|as|you|do|at)\b/gi, weight: 3 },
      // Common words (weight: 2)
      { pattern: /\b(this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their)\b/gi, weight: 2 },
      // Technical terms (weight: 2)
      { pattern: /\b(bomb|threat|attack|security|emergency|alert|warning|danger|critical|urgent)\b/gi, weight: 2 },
      // Location indicators (weight: 2)
      { pattern: /\b(in|at|near|around|inside|outside|behind|front|building|room)\b/gi, weight: 2 }
    ],
    // Common word endings (weight: 1)
    suffixes: [
      { pattern: /(?:ing|ed|ly|tion|ment|ness|ous|ful|less|able|ible)$/gi, weight: 1 }
    ],
    // Common word beginnings (weight: 1)
    prefixes: [
      { pattern: /^(?:un|re|in|im|dis|pre|pro|con|com|ex|en|em|de|sub|sup|trans|inter|intra)(?=[a-z])/gi, weight: 1 }
    ],
    // Common bigrams (weight: 1)
    bigrams: [
      { pattern: /\b(?:of the|in the|to the|on the|for the|with the|at the|is a|from the|by the)\b/gi, weight: 1 }
    ]
  };

  const scoreText = (text: string): number => {
    let score = 0;
    
    // Word pattern scoring
    commonPatterns.words.forEach(({ pattern, weight }) => {
      const matches = text.match(pattern) || [];
      score += matches.length * weight;
    });

    // Suffix scoring
    commonPatterns.suffixes.forEach(({ pattern, weight }) => {
      const matches = text.match(pattern) || [];
      score += matches.length * weight;
    });

    // Prefix scoring
    commonPatterns.prefixes.forEach(({ pattern, weight }) => {
      const matches = text.match(pattern) || [];
      score += matches.length * weight;
    });

    // Bigram scoring
    commonPatterns.bigrams.forEach(({ pattern, weight }) => {
      const matches = text.match(pattern) || [];
      score += matches.length * weight;
    });

    // Character frequency analysis
    const charFreq = new Map<string, number>();
    const totalChars = text.length;
    text.toLowerCase().split('').forEach(char => {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    });

    // English letter frequency scoring
    const englishFreq = new Map([
      ['e', 12.7], ['t', 9.1], ['a', 8.2], ['o', 7.5], ['i', 7.0],
      ['n', 6.7], ['s', 6.3], ['h', 6.1], ['r', 6.0], ['d', 4.3],
      ['l', 4.0], ['u', 2.8], ['c', 2.8], ['m', 2.4], ['w', 2.4],
      ['f', 2.2], ['g', 2.0], ['y', 2.0], ['p', 1.9], ['b', 1.5]
    ]);

    englishFreq.forEach((expectedFreq, char) => {
      const actualFreq = ((charFreq.get(char) || 0) / totalChars) * 100;
      score += (1 - Math.abs(expectedFreq - actualFreq) / expectedFreq) * 2;
    });

    // Sentence structure scoring
    const sentences = text.match(/[.!?]+\s+[A-Z][a-z]+/g) || [];
    score += sentences.length * 2;

    // Capitalization scoring
    const properNouns = text.match(/[A-Z][a-z]+/g) || [];
    score += properNouns.length;

    // Punctuation scoring
    const punctuation = text.match(/[,.!?;:]/g) || [];
    score += punctuation.length * 0.5;

    // Context-specific scoring for security-related content
    const securityTerms = /\b(bomb|threat|attack|urgent|emergency)\b/gi;
    const securityMatches = text.match(securityTerms) || [];
    score += securityMatches.length * 5; // High weight for security terms

    return score;
  };

  const commonWords = [
    // Common English words
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    // Technical terms
    'data', 'file', 'code', 'key', 'encrypt', 'decrypt', 'secure', 'password',
    'system', 'access', 'user', 'network', 'server', 'client', 'protocol',
    // Common patterns
    'http', 'https', 'www', 'com', 'org', 'net', 'gov', 'edu'
  ];

  const analyzeText = (text: string): ClueAnalysis => {
    // Enhanced date and time patterns
    const dateTimePatterns = [
      // Numeric dates
      { 
        pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
        type: 'date'
      },
      { 
        pattern: /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
        type: 'date'
      },
      // Written dates with numbers
      { 
        pattern: /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?\b/gi,
        type: 'date'
      },
      // Written dates with written numbers
      {
        pattern: /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty-second|twenty-third|twenty-fourth|twenty-fifth|twenty-sixth|twenty-seventh|twenty-eighth|twenty-ninth|thirtieth|thirty-first)\s+(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s*,?\s*\d{4})?\b/gi,
        type: 'date'
      },
      // Time patterns
      {
        pattern: /\b(?:(?:0?[1-9]|1[0-2])[:.](?:[0-5][0-9])(?:\s*[AaPp][Mm])?|\d{1,2}\s*[AaPp][Mm])\b/g, // 12-hour format
        type: 'time'
      },
      {
        pattern: /\b(?:[01]?[0-9]|2[0-3])[:.](?:[0-5][0-9])(?:\s*(?:hours|hrs))?\b/g, // 24-hour format
        type: 'time'
      },
      // Written times
      {
        pattern: /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+o'?clock\b/gi,
        type: 'time'
      },
      // Time periods
      {
        pattern: /\b(?:morning|afternoon|evening|night|midnight|noon)\b/gi,
        type: 'period'
      },
      // Relative time
      {
        pattern: /\b(?:today|tomorrow|tonight|yesterday)\b/gi,
        type: 'relative'
      }
    ];

    // Number word to digit mapping
    const numberWords: { [key: string]: number } = {
      'one': 1, 'first': 1,
      'two': 2, 'second': 2,
      'three': 3, 'third': 3,
      'four': 4, 'fourth': 4,
      'five': 5, 'fifth': 5,
      'six': 6, 'sixth': 6,
      'seven': 7, 'seventh': 7,
      'eight': 8, 'eighth': 8,
      'nine': 9, 'ninth': 9,
      'ten': 10, 'tenth': 10,
      'eleven': 11, 'eleventh': 11,
      'twelve': 12, 'twelfth': 12,
      'thirteen': 13, 'thirteenth': 13,
      'fourteen': 14, 'fourteenth': 14,
      'fifteen': 15, 'fifteenth': 15,
      'sixteen': 16, 'sixteenth': 16,
      'seventeen': 17, 'seventeenth': 17,
      'eighteen': 18, 'eighteenth': 18,
      'nineteen': 19, 'nineteenth': 19,
      'twenty': 20, 'twentieth': 20
    };

    // Month word to number mapping
    const monthWords: { [key: string]: number } = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4,
      'may': 5, 'june': 6, 'july': 7, 'august': 8,
      'september': 9, 'october': 10, 'november': 11, 'december': 12
    };

    // Function to convert written time to 24-hour format
    const parseWrittenTime = (timeStr: string): string => {
      timeStr = timeStr.toLowerCase();
      let hour = 0;
      let period = '';

      // Extract hour from words
      for (const [word, num] of Object.entries(numberWords)) {
        if (timeStr.includes(word)) {
          hour = num;
          break;
        }
      }

      // Determine period
      if (timeStr.includes('morning') || timeStr.includes('am')) period = 'AM';
      else if (timeStr.includes('afternoon') || timeStr.includes('evening') || timeStr.includes('pm')) period = 'PM';
      else if (timeStr.includes('night')) period = 'PM';

      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      return `${hour.toString().padStart(2, '0')}:00`;
    };

    // Function to convert written date to standardized format
    const parseWrittenDate = (dateStr: string): string => {
      dateStr = dateStr.toLowerCase();
      let month = 0;
      let day = 0;
      let year = new Date().getFullYear(); // Default to current year if not specified

      // Extract month
      for (const [word, num] of Object.entries(monthWords)) {
        if (dateStr.includes(word)) {
          month = num;
          break;
        }
      }

      // Extract day
      for (const [word, num] of Object.entries(numberWords)) {
        if (dateStr.includes(word)) {
          day = num;
          break;
        }
      }

      // Extract year if present
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) {
        year = parseInt(yearMatch[0]);
      }

      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };

    // Extract all date and time references
    const dateTimeRefs = dateTimePatterns.flatMap(({ pattern, type }) => {
      const matches = text.match(pattern) || [];
      return matches.map(match => {
        let standardized = match;
        if (type === 'time' && match.toLowerCase().includes('o\'clock')) {
          standardized = parseWrittenTime(match);
        } else if (type === 'date' && /[a-zA-Z]/.test(match)) {
          standardized = parseWrittenDate(match);
        }
        return { original: match, standardized, type };
      });
    });

    // Combine date and time references into a timeline
    const timelineEvents = dateTimeRefs.reduce((events: string[], ref) => {
      if (ref.type === 'date') {
        // Look for associated time references nearby in the text
        const timeRefs = dateTimeRefs.filter(t => t.type === 'time');
        if (timeRefs.length > 0) {
          timeRefs.forEach(timeRef => {
            events.push(`${ref.standardized} ${timeRef.standardized} - "${ref.original} at ${timeRef.original}"`);
          });
        } else {
          events.push(`${ref.standardized} - "${ref.original}"`);
        }
      }
      return events;
    }, []);

    // If no specific dates found, look for relative time references
    if (timelineEvents.length === 0) {
      const relativeRefs = dateTimeRefs.filter(ref => ref.type === 'relative' || ref.type === 'period');
      if (relativeRefs.length > 0) {
        timelineEvents.push(...relativeRefs.map(ref => `Relative time: ${ref.original}`));
      }
    }

    // Tripura Educational Institutions (with variations)
    const tripuraInstitutions = [
      'NIT Agartala',
      'National Institute of Technology Agartala',
      'NIT, Agartala',
      'N.I.T. Agartala',
      'NIT-Agartala',
      'NITA',
      'Barjala, Jirania',
      'Jirania',
    ];

    // Tripura Cities and Areas
    const tripuraCities = [
      'Agartala',
      'Dharmanagar',
      'Udaipur',
      'Kailashahar',
      'Ambassa',
      'Khowai',
      'Teliamura',
      'Melaghar',
      'Belonia',
      'Sabroom',
      'Barjala',
      'Jirania',
      'Old Agartala',
      'Ranirbazar',
      'Jogendranagar',
      'Badharghat',
      'Bishramganj',
      'Mohanpur',
      'Amarpur',
      'Kamalpur'
    ];

    // Tripura Landmarks
    const tripuraLandmarks = [
      'Ujjayanta Palace',
      'Neermahal',
      'Unakoti',
      'Tripura Sundari Temple',
      'Sepahijala Wildlife Sanctuary',
      'Dumboor Lake',
      'Jampui Hills',
      'Cloudtail Hills',
      'Heritage Park',
      'College Tilla',
      'Maharaja Bir Bikram College',
      'Tripura University',
      'ICFAI University',
      'Agartala Airport',
      'MBB College',
      'Agartala Railway Station',
      'Agartala City Center',
      'Buddha Temple',
      'Fourteen Gods Temple',
      'Chaturdash Devata Temple'
    ];

    // Function to create a case-insensitive pattern from array of terms
    const createLocationPattern = (terms: string[]) => {
      const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      return new RegExp(`\\b(?:${escapedTerms.join('|')})\\b`, 'i');
    };

    // Create patterns from our location lists
    const locationPatterns = [
      // Tripura specific patterns
      createLocationPattern(tripuraInstitutions),
      createLocationPattern(tripuraCities),
      createLocationPattern(tripuraLandmarks),
      
      // Campus-specific patterns
      /\b(?:Block|Building|Campus|Wing|Gate|Hostel|Lab|Library|Auditorium|Canteen|Ground|Department)\s+[A-Za-z0-9-]+\b/i,
      /\b(?:Room|Hall|Floor|Office)\s+[A-Za-z0-9-]+\b/i,
      
      // Directional patterns
      /\b(?:North|South|East|West|Central)\s+(?:Block|Wing|Gate|Campus)\b/i,
      
      // Infrastructure patterns
      /\b(?:Server Room|Data Center|Control Room|Command Center|Security Office|Main Gate|Research Lab)\b/i,
      
      // Address patterns
      /\b(?:Barjala|Jirania|Agartala)\s+(?:Road|Highway|Street|Lane|Path|Avenue)\b/i,
      
      // Coordinate patterns
      /\b\d{1,2}°\s*[NS]\s*\d{1,2}°\s*[EW]\b/
    ];

    // Function to find all locations in text
    const findLocations = (text: string): string[] => {
      const locations = new Set<string>();
      
      // Direct match for NIT Agartala variations
      if (text.toLowerCase().includes('nit') && text.toLowerCase().includes('agartala')) {
        locations.add('NIT Agartala');
      }
      
      // Check all other patterns
      locationPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Clean up the match and add to locations
            const cleanMatch = match.trim();
            locations.add(cleanMatch);
            
            // If we find a building/room in NIT, add NIT Agartala as context
            if (cleanMatch.match(/\b(?:Block|Building|Room|Lab|Department)\b/i)) {
              locations.add('NIT Agartala');
            }
          });
        }
      });

      return Array.from(locations);
    };

    // Find actions (using existing patterns)
    const actionPatterns = [
      // Critical severity actions (immediate threat)
      { 
        pattern: /\b(?:bomb|explosive|detonate|blast|kill|murder|assassinate|eliminate|destroy)\b/i, 
        severity: 4,
        category: 'CRITICAL'
      },
      // High severity actions (potential violence)
      { 
        pattern: /\b(?:hack|breach|infiltrate|steal|hijack|kidnap|assault|attack|weapon|threat)\b/i, 
        severity: 3,
        category: 'HIGH'
      },
      // Medium severity actions (suspicious activity)
      { 
        pattern: /\b(?:access|compromise|execute|launch|target|exploit|disrupt|damage)\b/i, 
        severity: 2,
        category: 'MEDIUM'
      },
      // Low severity actions (reconnaissance)
      { 
        pattern: /\b(?:scan|probe|monitor|observe|gather|collect|survey|watch)\b/i, 
        severity: 1,
        category: 'LOW'
      }
    ];

    // Analyze actions and their severity
    const detectedActions = actionPatterns.flatMap(({ pattern, severity, category }) => {
      const matches = text.match(pattern) || [];
      return matches.map(match => ({
        action: match,
        severity,
        category
      }));
    });

    // Critical location patterns
    const criticalLocations = [
      'NIT Agartala',
      'National Institute of Technology',
      'Airport',
      'Railway Station',
      'Government',
      'Police',
      'Military',
      'Hospital',
      'School',
      'College',
      'University',
      'Temple',
      'Mosque',
      'Church'
    ];

    // Calculate enhanced threat level
    const maxSeverity = Math.max(...detectedActions.map(a => a.severity), 0);
    const hasCriticalKeywords = detectedActions.some(a => a.category === 'CRITICAL');
    const hasCriticalLocation = findLocations(text).some(loc => 
      criticalLocations.some(critical => 
        loc.toLowerCase().includes(critical.toLowerCase())
      )
    );
    
    // Determine threat level with more nuanced analysis
    let threatLevel: 'low' | 'medium' | 'high';
    if (hasCriticalKeywords && hasCriticalLocation) {
      threatLevel = 'high';
    } else if (hasCriticalKeywords || (maxSeverity >= 3 && hasCriticalLocation)) {
      threatLevel = 'high';
    } else if (maxSeverity >= 2 || hasCriticalLocation) {
      threatLevel = 'medium';
    } else {
      threatLevel = 'low';
    }

    // Generate detailed analysis
    const analysis = {
      dates: dateTimeRefs.filter(ref => ref.type === 'date').map(ref => ref.original),
      locations: findLocations(text),
      actions: detectedActions.map(a => a.action),
      keywords: text.match(/\b(?:password|credentials|key|token|secret|classified)\b/i) || [],
      threatLevel,
      timeline: timelineEvents.length > 0
        ? timelineEvents.join('\n')
        : 'No specific dates or times mentioned',
      strategy: `Detected ${detectedActions.length} suspicious actions. ${
        hasCriticalKeywords ? 'CRITICAL THREAT DETECTED' : 
        hasCriticalLocation ? 'Sensitive location identified' : 
        'Standard monitoring advised'
      }`,
      context: [
        ...findLocations(text),
        ...detectedActions.map(a => `${a.category} severity action: ${a.action}`),
        ...timelineEvents
      ],
      patterns: [
        ...detectedActions.map(a => ({
          type: a.category,
          description: `Detected "${a.action}" - ${a.category} severity action`,
          confidence: a.severity * 25
        })),
        ...dateTimeRefs.map(ref => ({
          type: 'TEMPORAL',
          description: `Detected ${ref.type}: ${ref.original}`,
          confidence: 90
        }))
      ]
    };

    return analysis;
  };

  const handleManualDecrypt = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const decrypted = caesarDecrypt(input, shift);
      setManualDecryption(decrypted);
      setClueAnalysis(analyzeText(decrypted));
      setIsProcessing(false);
    }, 500);
  };

  const handleAutoDecrypt = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setAutoDecryptions([]);
    setBestDecryption('');
    setClueAnalysis(null);
    setThreatAnalysis(null);

    try {
      // Try different shifts for Caesar cipher
      const attempts: { text: string; score: number }[] = [];
      for (let i = 1; i < charsetLength; i++) {
        const decrypted = caesarDecrypt(input, i);
        const score = scoreText(decrypted);
        attempts.push({ text: decrypted, score });
        setAutoDecryptions(prev => [...prev, decrypted]);
      }

      // Find the best decryption
      const best = attempts.reduce((prev, current) => 
        current.score > prev.score ? current : prev
      );

      setBestDecryption(best.text);

      // Perform clue analysis first
      const clues = analyzeText(best.text);
      setClueAnalysis(clues);

      // Then perform threat analysis with timeout
      const threatAnalysisPromise = analyzeThreat(best.text);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Threat analysis timeout')), 10000)
      );

      const threatResult = await Promise.race([
        threatAnalysisPromise,
        timeoutPromise
      ]);

      setThreatAnalysis(threatResult);

      // Save to history if user is logged in
      if (user) {
        await saveToHistory(input, best.text);
      }
    } catch (error) {
      console.error('Error during decryption:', error);
      // Set a default threat analysis in case of error
      setThreatAnalysis({
        threatLevel: 'low',
        score: 0,
        indicators: [],
        locations: [],
        timeIndicators: [],
        summary: 'Error occurred during analysis'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="decryption" className="py-20 px-4 relative">
      {/* Interactive Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(239, 68, 68, 0.2), transparent 80%)`
        }}
      />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-red-500 to-red-600">
              Decryption Tool
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            Decrypt encoded messages and analyze potential threats
          </p>
        </div>
        <div className="relative w-full max-w-4xl mx-auto p-4 space-y-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter encrypted text..."
                className="w-full h-32 p-4 bg-black/30 backdrop-blur-sm text-white rounded-lg border border-red-500/20 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 resize-none"
              />
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-gray-400">
                <Lock size={16} />
                <span className="text-sm">{input.length} characters</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleAutoDecrypt}
                disabled={isProcessing || !input.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg transition-colors"
              >
                <Zap size={18} />
                <span>Auto Decrypt</span>
              </button>
            </div>
          </div>

          {/* Processing Animation */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          )}

          {/* Results Section */}
          {bestDecryption && (
            <div className="space-y-6">
              {/* Best Decryption Result */}
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-red-500/20">
                <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center">
                  <Unlock size={20} className="mr-2" />
                  Best Decryption Result
                </h3>
                <p className="text-white whitespace-pre-wrap">{bestDecryption}</p>
              </div>

              {/* Threat Analysis */}
              <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-red-500/20 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-red-500/20 to-transparent border-b border-red-500/20">
                  <h3 className="text-lg font-semibold text-red-500 flex items-center">
                    <AlertTriangle size={20} className="mr-2" />
                    Threat Analysis
                  </h3>
                </div>
                <div className="p-6">
                  {isProcessing ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                  ) : threatAnalysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">Threat Level:</span>
                        <span className={`font-semibold ${
                          threatAnalysis.threatLevel === 'critical' ? 'text-red-500' :
                          threatAnalysis.threatLevel === 'high' ? 'text-orange-500' :
                          threatAnalysis.threatLevel === 'medium' ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          {threatAnalysis.threatLevel.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">Threat Score:</span>
                        <span className="text-white">{threatAnalysis.score.toFixed(1)}/10</span>
                      </div>

                      {threatAnalysis.indicators.length > 0 && (
                        <div>
                          <h4 className="text-red-400 mb-2">Threat Indicators:</h4>
                          <ul className="list-disc list-inside text-white space-y-1">
                            {threatAnalysis.indicators.map((indicator, i) => (
                              <li key={i} className="text-sm">
                                <span className="text-red-400">{indicator.category}:</span> {indicator.word}
                                <span className="text-gray-400 text-xs ml-2">({indicator.context})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {threatAnalysis.locations.length > 0 && (
                        <div>
                          <h4 className="text-red-400 mb-2">Locations at Risk:</h4>
                          <ul className="list-disc list-inside text-white space-y-1">
                            {threatAnalysis.locations.map((location, i) => (
                              <li key={i} className="text-sm">
                                {location.city}
                                <span className="text-gray-400 text-xs ml-2">({location.context})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {threatAnalysis.summary && (
                        <div className="mt-4 p-4 bg-black/20 rounded-lg">
                          <h4 className="text-red-400 mb-2">Analysis Summary:</h4>
                          <p className="text-white text-sm">{threatAnalysis.summary}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-4">
                      No threat analysis available
                    </div>
                  )}
                </div>
              </div>

              {/* Clue Analysis */}
              {clueAnalysis && (
                <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-red-500/20">
                  <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center">
                    <Search size={20} className="mr-2" />
                    Clue Analysis
                  </h3>
                  <div className="space-y-4">
                    {clueAnalysis.locations.length > 0 && (
                      <div>
                        <h4 className="text-red-400">Locations:</h4>
                        <ul className="list-disc list-inside text-white">
                          {clueAnalysis.locations.map((loc, i) => (
                            <li key={i}>{loc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {clueAnalysis.dates.length > 0 && (
                      <div>
                        <h4 className="text-red-400">Dates:</h4>
                        <ul className="list-disc list-inside text-white">
                          {clueAnalysis.dates.map((date, i) => (
                            <li key={i}>{date}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {clueAnalysis.actions.length > 0 && (
                      <div>
                        <h4 className="text-red-400">Actions:</h4>
                        <ul className="list-disc list-inside text-white">
                          {clueAnalysis.actions.map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CipherTool;