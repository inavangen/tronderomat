import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [displayedText, setDisplayedText] = useState(''); // State for translated text
  const [originalText, setOriginalText] = useState(''); // State for original text
  const [matchCount, setMatchCount] = useState(0); // State for number of matches
  const [translationMap, setTranslationMap] = useState<Map<string, string>>(new Map()); // Map for translations
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref to get textarea value
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for button
  
  // Load data.txt file on component mount
  useEffect(() => {
    const loadDataFile = async () => {
      try {
        // Fetch the data.txt file from public folder
        const response = await fetch('/data.txt');
        if (!response.ok) {
          throw new Error(`Failed to load data.txt: ${response.status}`);
        }
        const text = await response.text();
        
        // Parse the file content into a translation map
        const map = new Map<string, string>();
        const lines = text.split('\n');
        let validEntries = 0;
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && trimmedLine.includes(' ')) {
            const parts = trimmedLine.split(' ');
            const original = parts.slice(0, -1).join(' '); // Get all parts except last as original
            const translation = parts[parts.length - 1]; // Last part is the translation
            if (original && translation) {
              // Store in lowercase for case-insensitive matching
              map.set(original.toLowerCase(), translation);
              validEntries++;
            }
          }
        });
        
        setTranslationMap(map);
        console.log(`Loaded ${validEntries} translation entries from data.txt`);
      } catch (error) {
        console.error('Failed to load data.txt:', error);
        // Fallback to mock data if file loading fails
        const fallbackMap = new Map([
          ['jeg', 'æ'],
          ['er', 'e'],
          ['ikke', 'itj'],
          ['og', 'å'],
          ['det', 'd'],
          ['i', 'i'],
          ['på', 'på'],
          ['han', 'hanj'],
          ['hun', 'hu'],
          ['vil', 'vilj'],
          ['ha', 'ha'],
          ['vaffel', 'rutatkak']
        ]);
        setTranslationMap(fallbackMap);
        console.log('Using fallback translation data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDataFile();
  }, []);
  
  // Handle Enter key in textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Enter is pressed without Shift (Shift+Enter for new line)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default Enter behavior (new line)
        if (buttonRef.current && !isLoading) {
          buttonRef.current.click(); // Trigger button click
        }
      }
    };
    
    textarea.addEventListener('keydown', handleKeyDown);
    
    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading]);
  
  const handleButtonClick = () => {
    if (!textareaRef.current) return;
    
    const inputText = textareaRef.current.value || '';
    setOriginalText(inputText); // Store original text
    
    if (isLoading) {
      setDisplayedText(`${inputText}\n\n---\nLaster oversettelsesdata...`);
      setMatchCount(0);
      return;
    }
    
    // Split input into words while preserving punctuation and whitespace
    const words = inputText.match(/(\b[\wæøåÆØÅ]+\b|[^\w\sæøåÆØÅ])|\s+/g) || [];
    let translatedText = '';
    let matches = 0;
    
    words.forEach(word => {
      // Check if it's a word (not punctuation or whitespace)
      if (word.match(/^[\wæøåÆØÅ]+$/)) {
        const lowerWord = word.toLowerCase();
        const translation = translationMap.get(lowerWord);
        
        if (translation) {
          // Check the case of the original word and apply same case to translation
          if (word === word.toUpperCase()) {
            // If original was ALL UPPERCASE, make translation uppercase
            translatedText += translation.toUpperCase();
          } else if (word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) {
            // If original was Capitalized (first letter uppercase, rest lowercase), capitalize translation
            translatedText += translation.charAt(0).toUpperCase() + translation.slice(1);
          } else if (word === word.toLowerCase()) {
            // If original was all lowercase, keep translation as is from data.txt
            translatedText += translation;
          } else {
            // Mixed case or other pattern - keep translation as is from data.txt
            translatedText += translation;
          }
          matches++;
        } else {
          // Keep original word if no translation found
          translatedText += word;
        }
      } else {
        // Keep punctuation and whitespace as is
        translatedText += word;
      }
    });
    
    setMatchCount(matches);
    setDisplayedText(translatedText);
  }
  
  return (
    <div className="min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Trønderomat BETA v. 1.0!  
      </h1> 
    
      <form onSubmit={(e) => e.preventDefault()} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-8">
          {/* Original text box - always shown */}
          <div className="w-full">
            {/*
            <label htmlFor="message" className="block text-heading font-medium mb-2 text-base">
              Original tekst:
            </label>
            */}
            <textarea 
              ref={textareaRef}
              id="message" 
              rows={6}
              className="bg-neutral-secondary-medium border-2 border-default-medium text-heading text-base rounded-lg focus:ring-brand focus:border-brand block w-full p-4 shadow-md placeholder:text-body min-h-[200px] resize-y"
              placeholder="Skriv tekst som skal oversettes til trøndersk her..."
            />
            {/*
            <div className="mt-2 text-sm text-gray-600">
              Tips: Trykk <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Enter</kbd> for å oversette
            </div>
            */}
          </div>
          
          {/* Translated text box - always shown */}
          <div className="w-full">
            {/*
            <label className="block text-heading font-medium mb-2 text-base">
              Oversettelse:
            </label>
            */}
            <div className="bg-neutral-secondary-light border-2 border-default-medium rounded-lg p-4 min-h-[200px] shadow-md">
              <div className="text-body whitespace-pre-wrap font-sans text-base min-h-[150px]">
                {displayedText || (
                  <div className="text-gray-500 italic">
                    {isLoading ? 'Laster oversettelsesdata...' : 'Oversettelsen vises her...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Button and match count */}
        <div className="flex flex-col items-center">
          <button 
            ref={buttonRef}
            type="button" 
            onClick={handleButtonClick}
            disabled={isLoading}
            className={`text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-8 py-4 text-center leading-5 border-2 border-default-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 transition-transform'}`}
          >
            {isLoading ? 'Laster...' : 'Oversett til trøndersk'}
          </button>
          
          {/* Match count displayed below button */}
          {matchCount > 0 && (
            <div className="mt-8 p-6 border-2 border-default-medium rounded-lg bg-blue-50 w-full max-w-2xl">
              <p className="text-blue-800 text-xl font-medium text-center">
                Antall oversatte ord: <span className="font-bold text-2xl">{matchCount}</span>
              </p>
              <p className="text-blue-600 text-base text-center mt-2">
                {matchCount === 1 ? '1 ord ble oversatt' : `${matchCount} ord ble oversatt`}
              </p>
            </div>
          )}
          
          {matchCount === 0 && displayedText && !isLoading && !displayedText.includes('Laster') && (
            <div className="mt-8 p-6 border-2 border-default-medium rounded-lg bg-yellow-50 w-full max-w-2xl">
              <p className="text-yellow-800 text-xl font-medium text-center">
                Ingen ord ble oversatt
              </p>
              <p className="text-yellow-600 text-base text-center mt-2">
                Prøv med andre ord eller sjekk at data.txt filen er korrekt
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default App