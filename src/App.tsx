import React, { useState } from 'react';

interface AnalysisResult {
  dates: string[];
  locations: string[];
  potential_targets: string[];
  urgency_indicators: string[];
}

interface DecryptionResult {
  shift_used: number;
  decrypted_text: string;
  analysis: AnalysisResult;
}

function App() {
  const [encryptedText, setEncryptedText] = useState('');
  const [result, setResult] = useState<DecryptionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDecrypt = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted_text: encryptedText }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Caesar Cipher Analyzer</h1>
                
                {/* Input Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encrypted Text
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={encryptedText}
                    onChange={(e) => setEncryptedText(e.target.value)}
                    placeholder="Enter your encrypted text here..."
                  />
                </div>

                <button
                  onClick={handleDecrypt}
                  disabled={loading || !encryptedText}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Decrypt & Analyze'}
                </button>

                {/* Results Section */}
                {result && (
                  <div className="mt-8 space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Decryption Results</h2>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p><span className="font-medium">Shift Used:</span> {result.shift_used}</p>
                        <p><span className="font-medium">Decrypted Text:</span> {result.decrypted_text}</p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis</h2>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <p>
                          <span className="font-medium">Dates Mentioned:</span>{' '}
                          {result.analysis.dates.length > 0 ? result.analysis.dates.join(', ') : 'None'}
                        </p>
                        <p>
                          <span className="font-medium">Locations:</span>{' '}
                          {result.analysis.locations.length > 0 ? result.analysis.locations.join(', ') : 'None'}
                        </p>
                        <p>
                          <span className="font-medium">Potential Targets:</span>{' '}
                          {result.analysis.potential_targets.length > 0 ? result.analysis.potential_targets.join(', ') : 'None'}
                        </p>
                        <p>
                          <span className="font-medium">Urgency Indicators:</span>{' '}
                          {result.analysis.urgency_indicators.length > 0 ? result.analysis.urgency_indicators.join(', ') : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
