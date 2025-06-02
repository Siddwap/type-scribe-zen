
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, Zap, CheckCircle2, XCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TypingTest {
  id: string;
  title: string;
  content: string;
  language: 'english' | 'hindi';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  time_limit: number;
}

interface TestSettings {
  highlightText: boolean;
  showErrors: boolean;
  backspaceMode: 'full' | 'word' | 'disabled';
  timeLimit: number;
  language: 'english' | 'hindi';
}

interface TypingTestProps {
  settings: TestSettings;
  onComplete: (results: any) => void;
  currentTest: TypingTest | null;
}

const TypingTest = ({ settings, onComplete, currentTest }: TypingTestProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [userInput, setUserInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wrongWords, setWrongWords] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<TypingTest | null>(currentTest);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categorizedTests, setCategorizedTests] = useState<Record<string, TypingTest[]>>({});
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  // Fetch available tests and organize by category
  const { data: availableTests = [] } = useQuery({
    queryKey: ['typing-tests', settings.language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('typing_tests')
        .select('*')
        .eq('language', settings.language)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TypingTest[];
    }
  });

  // Organize tests by category
  useEffect(() => {
    if (availableTests.length > 0) {
      const grouped = availableTests.reduce((acc, test) => {
        if (!acc[test.category]) {
          acc[test.category] = [];
        }
        acc[test.category].push(test);
        return acc;
      }, {} as Record<string, TypingTest[]>);
      
      setCategorizedTests(grouped);
      
      // Set default category and test if none selected
      if (!selectedCategory && Object.keys(grouped).length > 0) {
        const firstCategory = Object.keys(grouped)[0];
        setSelectedCategory(firstCategory);
        if (!selectedTest) {
          setSelectedTest(grouped[firstCategory][0]);
        }
      }
    }
  }, [availableTests, selectedCategory, selectedTest]);

  useEffect(() => {
    if (currentTest) {
      setSelectedTest(currentTest);
    }
  }, [currentTest]);

  useEffect(() => {
    if (selectedTest) {
      const testWords = selectedTest.content.split(' ');
      setWords(testWords);
      setTimeLeft(selectedTest.time_limit);
      resetTest();
    }
  }, [selectedTest]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTestComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const resetTest = () => {
    setIsActive(false);
    setIsFinished(false);
    setUserInput('');
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setWrongWords(new Set());
    setStartTime(null);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    if (selectedTest) {
      setTimeLeft(selectedTest.time_limit);
    }
  };

  const startTest = () => {
    if (!isActive && !isFinished) {
      setIsActive(true);
      setStartTime(new Date());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle space key to move to next word
    if (e.key === ' ') {
      e.preventDefault();
      
      if (!isActive && userInput.length === 0) {
        startTest();
      }
      
      // Move to next word
      const currentTypedWords = userInput.trim().split(' ');
      const expectedWord = words[currentWordIndex];
      const typedWord = currentTypedWords[currentWordIndex] || '';
      
      // Check if current word is wrong
      if (typedWord !== expectedWord) {
        setWrongWords(prev => new Set([...prev, currentWordIndex]));
      }
      
      // Move to next word
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setUserInput(prev => prev + ' ');
        setTotalKeystrokes(prev => prev + 1);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Prevent manual spaces - only allow through space key handler
    if (value.includes(' ') && !userInput.includes(' ')) {
      return;
    }
    
    if (!isActive && value.length > 0) {
      startTest();
    }

    setTotalKeystrokes(prev => prev + 1);
    
    // Handle backspace restrictions
    if (value.length < userInput.length) {
      if (settings.backspaceMode === 'disabled') {
        return;
      } else if (settings.backspaceMode === 'word') {
        const currentWordStart = userInput.lastIndexOf(' ') + 1;
        if (value.length < currentWordStart) {
          return;
        }
      }
    }

    setUserInput(value);
    
    // Calculate correct keystrokes and wrong words
    const typedWords = value.split(' ');
    const currentTypedWord = typedWords[currentWordIndex] || '';
    const expectedWord = words[currentWordIndex] || '';
    
    let correctCount = 0;
    const newWrongWords = new Set<number>();
    
    // Count correct characters in current word
    for (let i = 0; i < Math.min(currentTypedWord.length, expectedWord.length); i++) {
      if (currentTypedWord[i] === expectedWord[i]) {
        correctCount++;
      }
    }
    
    // Add correct characters from completed words
    for (let i = 0; i < currentWordIndex; i++) {
      const typedWord = typedWords[i] || '';
      const expectedWordAtIndex = words[i] || '';
      
      if (typedWord === expectedWordAtIndex) {
        correctCount += typedWord.length;
      } else {
        newWrongWords.add(i);
      }
    }
    
    // Check if current word is wrong
    if (currentTypedWord.length > 0 && currentTypedWord !== expectedWord.substring(0, currentTypedWord.length)) {
      newWrongWords.add(currentWordIndex);
    }
    
    setCorrectKeystrokes(correctCount);
    setWrongWords(newWrongWords);
    
    // Auto-scroll
    if (displayRef.current && textareaRef.current) {
      const lines = Math.floor(value.length / 80);
      const scrollPosition = lines * 24;
      displayRef.current.scrollTop = scrollPosition;
    }
    
    // Check if test is complete
    if (currentWordIndex >= words.length - 1 && currentTypedWord === expectedWord) {
      handleTestComplete();
    }
  };

  const handleTestComplete = useCallback(async () => {
    if (isFinished) return;
    
    setIsActive(false);
    setIsFinished(true);
    
    const endTime = new Date();
    const timeTaken = startTime ? (endTime.getTime() - startTime.getTime()) / 1000 : selectedTest?.time_limit || 60;
    
    const typedWords = userInput.trim().split(' ').filter(word => word.length > 0);
    const totalTypedChars = typedWords.join('').length;
    const correctWords = typedWords.filter((word, index) => word === words[index]).length;
    const incorrectWords = typedWords.length - correctWords;
    
    // More accurate calculations
    const accuracy = typedWords.length > 0 ? (correctWords / typedWords.length) * 100 : 0;
    
    // WPM calculation (standard: 5 characters = 1 word)
    const wpm = Math.round((correctKeystrokes / 5) / (timeTaken / 60));
    const grossWpm = Math.round((totalTypedChars / 5) / (timeTaken / 60));
    
    // Keystroke accuracy
    const keystrokeAccuracy = totalKeystrokes > 0 ? (correctKeystrokes / totalKeystrokes) * 100 : 0;

    const results = {
      wpm,
      grossWpm,
      accuracy: Math.round(accuracy * 100) / 100,
      totalWords: words.length,
      typedWords: typedWords.length,
      correctWords,
      incorrectWords,
      totalKeystrokes,
      correctKeystrokes,
      keystrokeAccuracy: Math.round(keystrokeAccuracy * 100) / 100,
      errors: wrongWords.size,
      timeTaken: Math.round(timeTaken),
      totalTime: selectedTest?.time_limit || 60,
      testTitle: selectedTest?.title || 'Unknown Test',
      language: selectedTest?.language || 'english'
    };

    // Save results to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && selectedTest) {
        await supabase.from('test_results').insert([{
          user_id: user.id,
          test_id: selectedTest.id,
          wpm: results.wpm,
          gross_wpm: results.grossWpm,
          accuracy: results.accuracy,
          total_words: results.totalWords,
          typed_words: results.typedWords,
          correct_words: results.correctWords,
          incorrect_words: results.incorrectWords,
          total_keystrokes: results.totalKeystrokes,
          correct_keystrokes: results.correctKeystrokes,
          errors: results.errors,
          time_taken: results.timeTaken
        }]);
      }
    } catch (error) {
      console.error('Error saving results:', error);
    }
    
    onComplete(results);
  }, [isFinished, startTime, userInput, words, totalKeystrokes, correctKeystrokes, selectedTest, onComplete, wrongWords, currentWordIndex]);

  const renderText = () => {
    if (!selectedTest) return null;
    
    return words.map((word, wordIndex) => {
      const typedWords = userInput.split(' ');
      const typedWord = typedWords[wordIndex] || '';
      
      let wordClassName = 'mr-2 ';
      
      if (wordIndex < currentWordIndex) {
        // Completed word
        if (typedWord === word) {
          wordClassName += 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
        } else {
          wordClassName += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
        }
      } else if (wordIndex === currentWordIndex) {
        // Current word
        if (settings.highlightText && isActive) {
          wordClassName += 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100';
        } else {
          wordClassName += 'text-gray-900 dark:text-gray-100';
        }
      } else {
        // Future words
        wordClassName += 'text-gray-500 dark:text-gray-400';
      }
      
      return (
        <span key={wordIndex} className={wordClassName}>
          {word}
        </span>
      );
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const progress = selectedTest ? ((currentWordIndex + (userInput.split(' ')[currentWordIndex]?.length || 0) / (words[currentWordIndex]?.length || 1)) / words.length) * 100 : 0;
  const wpm = startTime && correctKeystrokes > 0 ? 
    Math.round(((correctKeystrokes / 5) / ((Date.now() - startTime.getTime()) / 1000 / 60))) : 0;

  if (!selectedTest) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            {availableTests.length === 0 ? 'No tests available for this language' : 'Loading test...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Category Selection */}
      {!currentTest && Object.keys(categorizedTests).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Test Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(categorizedTests).map((category) => (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="flex items-center justify-between w-full"
                    >
                      <span className="capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{categorizedTests[category].length}</Badge>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80">
                    {categorizedTests[category].map((test) => (
                      <DropdownMenuItem 
                        key={test.id}
                        className="cursor-pointer p-4"
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedTest(test);
                        }}
                      >
                        <div className="w-full">
                          <div className="font-semibold">{test.title}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{test.difficulty}</Badge>
                            <Badge variant="outline" className="text-xs">{formatTime(test.time_limit)}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {test.content.split(' ').length} words
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">remaining</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{wpm}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{wrongWords.size}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Wrong Words</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Test Text Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {selectedTest.title}
              <Badge>{selectedTest.language === 'hindi' ? 'हिंदी' : 'English'}</Badge>
              <Badge variant="outline">{selectedTest.difficulty}</Badge>
              <Badge variant="outline">{selectedTest.category}</Badge>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetTest}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Display */}
          <div 
            ref={displayRef}
            className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg h-32 overflow-y-auto text-lg leading-relaxed ${
              selectedTest.language === 'hindi' ? 'font-mangal' : 'font-mono'
            }`}
            style={selectedTest.language === 'hindi' ? { fontFamily: 'Noto Sans Devanagari, Mangal, serif' } : {}}
          >
            {renderText()}
          </div>

          {/* Typing Area */}
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isFinished}
              placeholder={isActive ? "Type the text above. Press space to move to next word..." : "Click here and start typing to begin the test"}
              className={`w-full h-32 p-4 border rounded-lg resize-none text-lg 
                ${selectedTest.language === 'hindi' ? 'font-mangal' : 'font-mono'}
                ${isFinished ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'} 
                text-gray-900 dark:text-gray-100 
                border-gray-300 dark:border-gray-600 
                focus:border-blue-500 dark:focus:border-blue-400 
                focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
                placeholder:text-gray-500 dark:placeholder:text-gray-400`}
              style={selectedTest.language === 'hindi' ? { fontFamily: 'Noto Sans Devanagari, Mangal, serif' } : {}}
            />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Word {currentWordIndex + 1} of {words.length} | {wrongWords.size} wrong words
              </div>
              
              {isActive && (
                <Button onClick={handleTestComplete} variant="outline">
                  Submit Test
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypingTest;
