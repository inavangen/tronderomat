import { useEffect, useRef, useState } from 'react';
import './App.css';
import logoImg from './assets/logo.png';
import './index.css';

function App() {
  const [displayedText, setDisplayedText] = useState(''); // State for translated text
  const [matchCount, setMatchCount] = useState(0); // State for number of matches
  const [translationMap, setTranslationMap] = useState<Map<string, string>>(new Map()); // Map for translations
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [placeholder, setPlaceholder] = useState('Skriv tekst som skal oversettes til trøndersk her...'); // State for placeholder text
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
    // Reset placeholder when resetting
    setPlaceholder('Skriv tekst som skal oversettes til trøndersk her...');
  }

  // Handle click on textarea to remove placeholder immediately
  const handleTextareaClick = () => {
    setPlaceholder(''); // Clear placeholder on click
  }

  // Handle blur to restore placeholder if empty
  const handleTextareaBlur = () => {
    if (textareaRef.current && textareaRef.current.value === '') {
      setPlaceholder('Skriv tekst som skal oversettes til trøndersk her...');
    }
  }
  
  return (
    
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-[900px]">
        {/* Centered logo */}
        <div className="flex justify-center mb-4">
          <img src={logoImg} style={{ width: '300px' }} alt="Trønderomat logo"/>
        </div>
        <br></br>
      
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          {/* Two-column layout for desktop, single column for mobile/tablet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Original text box - LEFT COLUMN on desktop */}
            <div className="w-full flex flex-col">
              <label htmlFor="original-text" className="text-gray-300  text-left mb-2 text-sm">
                Original text
              </label>
              <textarea 
                ref={textareaRef}
                id="original-text"
                rows={4}
                className="bg-white/85 border-2 border-gray-400 text-gray-800 text-base rounded-lg focus:ring-brand focus:border-brand block w-full p-4 shadow-sm resize-y text-left flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={placeholder}
                onClick={handleTextareaClick}
                onBlur={handleTextareaBlur}
              />
            </div>
              
            {/* Translated text box - RIGHT COLUMN on desktop */}
            <div className="w-full flex flex-col">
              <label htmlFor="translated-text" className="text-gray-300 text-left mb-2 text-sm">
                Trøndersk
              </label>
              <div 
                id="translated-text"
                className="bg-white/85 border-2 border-gray-400 rounded-lg p-4 shadow-sm flex flex-col flex-1"
              >
                <div className="text-body whitespace-pre-wrap text-base text-left text-gray-700 overflow-auto">
                  {displayedText || (
                    <div className="text-gray-500">
                      {isLoading ? 'Laster oversettelsesdata...' : 'Oversettelsen vises her...'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Translation Buttons - Aligned with boxes on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {/* Left button area - aligns with left text box */}
            <div className="w-full">
              <button 
                ref={buttonRef}
                type="button" 
                onClick={handleButtonClick}
                disabled={isLoading}
                className={`w-full text-white bg-gradient-to-br from-purple-500 to-purple-800 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-bold rounded-lg text-lg px-8 py-4 text-center leading-5 border-2 border-default-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 transition-transform'}`}
              >
                {isLoading ? 'Laster...' : 'Oversett til trøndersk!'}
              </button>
            </div>

            {/* Right button area - aligns with right text box */}
            <div className="w-full">
              <button 
                ref={resetButtonRef}
                type="button" 
                onClick={handleResetClick}
                className={`w-full bg-transparent! hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-lg px-8 py-4 text-center leading-5 border-2 border-gray-400 text-gray-400 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 transition-transform'}`}>
                Nullstill
              </button>
            </div>
          </div>
          
          <br></br>            
          
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
        </form>

        {/* Divider Separator line */}
        <br></br>
        <br></br>
        <br></br>
        <hr className="my-12 h-0.5 border-t-0 bg-neutral-100 dark:bg-white/10" />   

        {/* Two-column layout for About and Donation sections on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* About Content - LEFT COLUMN on desktop */}
          <div className="flex flex-col">
            <p className="text-gray-200 text-left">
              <b>HVA ER TRØNDEROMAT?</b><br></br><br></br>Trønderomat er en oversettelsesapp laget av Ina som oversetter fra norsk bokmål til trøndersk, slik at ingen lengre kan si at man ikke forstår trøndersk. Det kan hende det finnes feil i oversettelsen. Da kan du sende inn forbedringspotensialer, så fixer jeg det.
              <br></br><br></br><a href="https://docs.google.com/forms/d/e/1FAIpQLSeAtGdhf7M_o5f8la10LPcGGPp2z-u0hC6TwJ4Hjg7dtm1FuQ/viewform?usp=header">Gi tilbakemelding</a>
            </p>
          </div>

          {/* Donation Content - RIGHT COLUMN on desktop */}
          <div className="flex flex-col">
            <p className="text-gray-200 text-left">
              <b>STØTT TRØNDEROMATEN?</b><br></br><br></br>Hvis du synes dette var festlig, og vil større videreuutviklingen av Trønderomaten, og kanskje fremtidige andre, morsomme webapper, kan du sende en liten donasjon her
              <br></br><br></br><a href="https://ko-fi.com/ina553388">Støtt Trønderomaten!</a>
            </p>
          </div>
        </div>
        
        <br></br>
        <br></br>

      </div>
      
      
      {/* Copyright stuff */}
      <div className="w-full max-w-[900px] mt-auto">
        <p className="text-gray-400 text-sm">
          Copyright Ina Vangen <br></br> Beta versjon 1.4
        </p>
        
      </div>
    </div>
  );
}

export default App;