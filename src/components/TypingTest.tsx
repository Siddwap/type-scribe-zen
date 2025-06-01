
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, Zap, CheckCircle } from 'lucide-react';

const TypingTest = ({ settings, onComplete, currentTest }) => {
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  
  const textareaRef = useRef(null);
  const paragraphRef = useRef(null);

  // Sample texts for demo
  const sampleTexts = {
    english: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. It is commonly used for testing typewriters and computer keyboards. Typography and font design often use this phrase to display fonts because it shows most letters clearly. Practice makes perfect, so keep typing to improve your speed and accuracy.",
    hindi: "यह एक हिंदी टाइपिंग टेस्ट है। हिंदी भाषा दुनिया की सबसे पुरानी भाषाओं में से एक है। देवनागरी लिपि का उपयोग करके हिंदी लिखी जाती है। भारत में हिंदी सबसे अधिक बोली जाने वाली भाषा है। टाइपिंग का अभ्यास करने से आपकी गति और सटीकता में सुधार होता है।"
  };

  const currentText = currentTest?.content || sampleTexts[settings.language];

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (typedText.length > 0 && startTime) {
      const timeElapsed = (Date.now() - startTime) / 60000; // minutes
      const wordsTyped = typedText.split(' ').length;
      setWpm(Math.round(wordsTyped / timeElapsed) || 0);
      
      const correctChars = typedText.split('').filter((char, index) => 
        char === currentText[index]
      ).length;
      setAccuracy(Math.round((correctChars / typedText.length) * 100) || 100);
    }
  }, [typedText, startTime, currentText]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (!isActive && value.length > 0) {
      setIsActive(true);
      setStartTime(Date.now());
    }

    // Handle backspace modes
    if (value.length < typedText.length) {
      if (settings.backspaceMode === 'disabled') {
        return;
      } else if (settings.backspaceMode === 'word') {
        const lastSpaceIndex = typedText.lastIndexOf(' ');
        if (value.length < lastSpaceIndex) {
          return;
        }
      }
    }

    setTypedText(value);
    setCurrentIndex(value.length);
    setTotalKeystrokes(prev => prev + 1);

    // Track errors
    const newErrors = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== currentText[i]) {
        newErrors.push(i);
      }
    }
    setErrors(newErrors);

    // Auto-scroll logic
    if (paragraphRef.current) {
      const currentLine = Math.floor(currentIndex / 80); // Approximate chars per line
      const lineHeight = 1.5; // em
      paragraphRef.current.scrollTop = currentLine * lineHeight * 16; // 16px = 1em
    }
  };

  const handleTestComplete = () => {
    setIsActive(false);
    const timeTaken = settings.timeLimit - timeLeft;
    const wordsTyped = typedText.split(' ').length;
    const correctWords = typedText.split(' ').filter((word, index) => {
      const originalWords = currentText.split(' ');
      return word === originalWords[index];
    }).length;
    
    const results = {
      wpm: wpm,
      grossWpm: Math.round((totalKeystrokes / 5) / (timeTaken / 60)),
      accuracy: accuracy,
      totalWords: currentText.split(' ').length,
      typedWords: wordsTyped,
      correctWords: correctWords,
      incorrectWords: wordsTyped - correctWords,
      totalKeystrokes: totalKeystrokes,
      correctKeystrokes: typedText.split('').filter((char, index) => 
        char === currentText[index]
      ).length,
      timeTaken: timeTaken,
      timeLimit: settings.timeLimit,
      errors: errors.length,
      language: settings.language
    };
    
    onComplete(results);
  };

  const resetTest = () => {
    setTimeLeft(settings.timeLimit);
    setIsActive(false);
    setCurrentIndex(0);
    setTypedText('');
    setErrors([]);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setTotalKeystrokes(0);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const renderText = () => {
    return currentText.split('').map((char, index) => {
      let className = 'transition-all duration-150 ';
      
      if (index < typedText.length) {
        if (typedText[index] === char) {
          className += 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
        } else if (settings.showErrors) {
          className += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
        }
      } else if (index === currentIndex && settings.highlightText) {
        className += 'bg-blue-200 dark:bg-blue-800 animate-pulse';
      } else {
        className += 'text-gray-700 dark:text-gray-300';
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{timeLeft}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Left</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{wpm}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{totalKeystrokes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Keystrokes</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <Progress value={(typedText.length / currentText.length) * 100} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>{typedText.length} / {currentText.length} characters</span>
            <span>{Math.round((typedText.length / currentText.length) * 100)}% complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Text Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Typing Test</span>
            <div className="flex gap-2">
              <Badge variant="outline">{settings.language}</Badge>
              <Badge variant="outline">{settings.timeLimit}s</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={paragraphRef}
            className={`p-6 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 h-40 overflow-y-auto leading-relaxed text-lg ${
              settings.language === 'hindi' ? 'font-mangal' : 'font-mono'
            }`}
            style={settings.language === 'hindi' ? { fontFamily: 'Mangal, serif' } : {}}
          >
            {renderText()}
          </div>
          
          <textarea
            ref={textareaRef}
            value={typedText}
            onChange={handleInputChange}
            placeholder="Start typing here..."
            className={`w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              settings.language === 'hindi' ? 'font-mangal' : 'font-mono'
            } text-lg`}
            style={settings.language === 'hindi' ? { fontFamily: 'Mangal, serif' } : {}}
            disabled={timeLeft === 0}
          />
          
          <div className="flex gap-4 mt-4">
            <Button onClick={handleTestComplete} disabled={!isActive}>
              Submit Test
            </Button>
            <Button variant="outline" onClick={resetTest}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypingTest;
