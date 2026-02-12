import { useState, useRef, useEffect } from 'react'
import './App.css'
import placeholderImg from './assets/placeholder.png';

function App() {
  const [displayedText, setDisplayedText] = useState(''); // State for translated text
  const [matchCount, setMatchCount] = useState(0); // State for number of matches
  const [translationMap, setTranslationMap] = useState<Map<string, string>>(new Map()); // Map for translations
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref to get textarea value
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for button
  const resetButtonRef = useRef<HTMLButtonElement>(null); // Ref for reset button
  
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
          ['hun', 'hu'],
          ['vil', 'vilj'],
          ['jeg', 'æ'],
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
    
    if (isLoading) {
      setDisplayedText(`${inputText}\n\n---\nLaster oversettelsesdata...`);
      setMatchCount(0);
      return;
    }
    
    // Debug: Log what we're working with
    console.log('Input text:', inputText);
    
    // Create a custom split function that properly handles Norwegian characters
    const splitWords = (text: string) => {
      const result = [];
      let currentWord = '';
      let inWord = false;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        // Check if character is a letter (including Norwegian) or apostrophe/hyphen for compound words
        const isWordChar = /[a-zA-ZæøåÆØÅ0-9]/.test(char);
        
        if (isWordChar) {
          currentWord += char;
          inWord = true;
        } else {
          if (inWord) {
            result.push(currentWord);
            currentWord = '';
            inWord = false;
          }
          result.push(char); // Add punctuation or whitespace as separate item
        }
      }
      
      // Add last word if exists
      if (inWord && currentWord) {
        result.push(currentWord);
      }
      
      console.log('Split result:', result);
      return result;
    };
    
    const words = splitWords(inputText);
    let translatedText = '';
    let matches = 0;
    
    words.forEach(word => {
      // Check if it's a word (not punctuation or whitespace)
      // Use a simpler check for word characters
      const isWord = /^[a-zA-ZæøåÆØÅ0-9]+$/.test(word);
      
      if (isWord) {
        const lowerWord = word.toLowerCase();
        console.log('Checking word:', word, 'lowercase:', lowerWord);
        const translation = translationMap.get(lowerWord);
        
        if (translation) {
          console.log('Found translation:', translation, 'for word:', word);
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
          console.log('No translation found for:', word);
          translatedText += word;
        }
      } else {
        // Keep punctuation and whitespace as is
        translatedText += word;
      }
    });
    
    console.log('Final translated text:', translatedText);
    console.log('Matches:', matches);
    
    setMatchCount(matches);
    setDisplayedText(translatedText);
  }

  const handleResetClick = () => {
    if (textareaRef.current) {
      textareaRef.current.value = ''; // Clear textarea
    }
    setDisplayedText(''); // Clear translated text
    setMatchCount(0); // Reset match count
  }
  
  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-[700px]">
        <img src={placeholderImg} style={{ width: '100px', display: 'grid', placeItems: 'center' }}/>
        <h1 className="text-4xl font-bold mb-8 text-center">
          T r ø n d e r o m a t!    
        </h1> 
        <p className="text-gray-600">
          Beta versjon 1.0
        </p>
        <br></br>
        <br></br>
      
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-8">
            {/* Original text box - always shown */}
            <div className="w-full">
              <textarea 
                ref={textareaRef}
                id="message" 
                rows={6}
                className="bg-white/65 border-2 border-default-medium text-gray-700 text-base rounded-lg focus:ring-brand focus:border-brand block w-full p-4 shadow-md placeholder-gray-400 placeholder:text-body min-h-[200px] resize-y text-left"
                placeholder="Skriv tekst som skal oversettes til trøndersk her..."/>
            </div>

            {/* Button and match count */}
            <div className="flex flex-col items-center w-full">
              <div className="flex gap-4 w-full">
                <button 
                  ref={buttonRef}
                  type="button" 
                  onClick={handleButtonClick}
                  disabled={isLoading}
                  className={`flex-2 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-8 py-4 text-center leading-5 border-2 border-default-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 transition-transform'}`}
                >
                  {isLoading ? 'Laster...' : 'Oversett til trøndersk!'}
                </button>
   
                <button 
                  ref={resetButtonRef}
                  type="button" 
                  onClick={handleResetClick}
                  className={`flex-1 bg-transparent! hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-8 py-4 text-center leading-5 border-2 border-gray-400 text-gray-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 transition-transform'}`}>
                  Nullstill
                </button>
              </div>
              <br></br>
              
              {/* Translated text box - always shown */}
              <div className="w-full">
                <div className="bg-white/65 border-2 border-gray-400 rounded-lg p-4 shadow-sm">
                  <div className="text-body whitespace-pre-wrap font-sans text-base text-left text-gray-700">
                    {displayedText || (
                      <div className="text-gray-700 italic">
                        {isLoading ? 'Laster oversettelsesdata...' : 'Oversettelsen vises her...'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Match count displayed below button 
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
            */}
            
            {matchCount === 0 && displayedText && !isLoading && !displayedText.includes('Laster') && (
              <div className="mt-8 p-6 border-2 border-default-medium rounded-lg bg-yellow-50 w-full">
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

        {/* Your page content here */}
        <div className="flex flex-col">
          <h2 className="text-xl font-bold mb-8 text-left">
            <br></br>
            Hva er Trønderomat?
          </h2> 
          <p className="text-gray-600 text-left">
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
          </p>
        </div>
      </div>
      
      {/* Copyright stuff */}
      <div className="w-full max-w-[700px] mt-auto">
        <p className="text-gray-600 text-sm">
          Copyright Ina Vangen
        </p>
      </div>
    </div>
  );
}

export default App;