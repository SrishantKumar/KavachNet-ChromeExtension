// Letter frequencies in English text
export const englishFrequencies = {
    'e': 0.1202, 't': 0.0910, 'a': 0.0812, 'o': 0.0768, 'i': 0.0731,
    'n': 0.0695, 's': 0.0628, 'r': 0.0602, 'h': 0.0592, 'd': 0.0432,
    'l': 0.0398, 'u': 0.0288, 'c': 0.0271, 'm': 0.0261, 'f': 0.0230,
    'y': 0.0211, 'w': 0.0209, 'g': 0.0203, 'p': 0.0182, 'b': 0.0149,
    'v': 0.0111, 'k': 0.0069, 'x': 0.0017, 'q': 0.0011, 'j': 0.0010, 'z': 0.0007
};

// Common English words for scoring
export const commonWords = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
    "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
    "than", "then", "now", "look", "only", "come", "its", "over", "think", "also"
];

// Common English patterns and phrases
export const commonPatterns = [
    "ing ", "ion ", "the ", " the ", " of ", " and ", " to ", " a ",
    "tion", "ment", "that", "with", "have", "this", "from", "they",
    "would", "there", "their", "what", "about", "which", "when", "make",
    "please", "thank", "best", "regards", "dear", "hello", "sincerely",
    "first", "second", "third", "between", "after", "before", "during",
    "should", "could", "might", "every", "never", "always", "sometimes"
];

// Bigram frequencies for English text
export const englishBigrams = {
    'th': 0.0152, 'he': 0.0128, 'in': 0.0094, 'er': 0.0094, 'an': 0.0082,
    're': 0.0068, 'nd': 0.0063, 'at': 0.0059, 'on': 0.0057, 'nt': 0.0056,
    'ha': 0.0056, 'es': 0.0056, 'st': 0.0055, 'en': 0.0055, 'ed': 0.0053,
    'to': 0.0052, 'it': 0.0050, 'ou': 0.0050, 'ea': 0.0047, 'hi': 0.0046
};

// Trigram frequencies for English text
export const englishTrigrams = {
    'the': 0.0181, 'and': 0.0073, 'ing': 0.0072, 'ent': 0.0042, 'ion': 0.0042,
    'her': 0.0036, 'for': 0.0034, 'tha': 0.0033, 'nth': 0.0033, 'int': 0.0032,
    'ere': 0.0031, 'tio': 0.0031, 'ter': 0.0030, 'est': 0.0028, 'ers': 0.0028
};

// Common word endings
export const commonEndings = [
    'ing', 'ed', 'tion', 'sion', 'ment', 'ness', 'ous', 'ful', 'less', 'able',
    'ible', 'ize', 'ise', 'ly', 'ity', 'ty', 'al', 'ary', 'ery', 'ory'
];

// Context-specific vocabularies
export const contextVocabularies = {
    military: [
        'attack', 'defense', 'troops', 'enemy', 'command', 'officer', 'soldier',
        'weapon', 'target', 'mission', 'strategy', 'tactical', 'operation', 'intel'
    ],
    diplomatic: [
        'treaty', 'agreement', 'negotiate', 'alliance', 'diplomatic', 'embassy',
        'minister', 'delegation', 'conference', 'bilateral', 'relations'
    ],
    personal: [
        'love', 'friend', 'family', 'home', 'meet', 'feel', 'hope', 'miss',
        'care', 'happy', 'sorry', 'please', 'thank', 'dear'
    ],
    business: [
        'contract', 'money', 'deal', 'price', 'market', 'company', 'product',
        'service', 'client', 'meeting', 'project', 'budget', 'profit'
    ]
};
