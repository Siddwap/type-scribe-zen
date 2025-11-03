import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Clock, Target, Zap, XCircle, RotateCcw, Settings, Keyboard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  const [typedKeystrokes, setTypedKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<TypingTest | null>(currentTest);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categorizedTests, setCategorizedTests] = useState<Record<string, TypingTest[]>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');
  const [showSettings, setShowSettings] = useState(true);
  const [testSettings, setTestSettings] = useState(settings);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);

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
      // time_limit is already in seconds from database
      setTimeLeft(selectedTest.time_limit);
      // Calculate total keystrokes from test content (all characters including spaces)
      const totalChars = selectedTest.content.length;
      setTotalKeystrokes(totalChars);
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

  // Auto-scroll to current word
  useEffect(() => {
    if (currentWordRef.current && displayRef.current && isActive) {
      const wordElement = currentWordRef.current;
      const containerElement = displayRef.current;
      
      const wordRect = wordElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      
      // Calculate if we need to scroll horizontally
      if (wordRect.left < containerRect.left || wordRect.right > containerRect.right) {
        const scrollLeft = wordElement.offsetLeft - containerElement.offsetWidth / 2 + wordElement.offsetWidth / 2;
        containerElement.scrollLeft = Math.max(0, scrollLeft);
      }
      
      // Calculate if we need to scroll vertically
      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        const scrollTop = wordElement.offsetTop - containerElement.offsetHeight / 2 + wordElement.offsetHeight / 2;
        containerElement.scrollTop = Math.max(0, scrollTop);
      }
    }
  }, [currentWordIndex, isActive]);

  const resetTest = () => {
    setIsActive(false);
    setIsFinished(false);
    setUserInput('');
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setWrongWords(new Set());
    setStartTime(null);
    setTypedKeystrokes(0);
    setCorrectKeystrokes(0);
    setShowSettings(true);
    if (selectedTest) {
      // time_limit is already in seconds from database
      setTimeLeft(selectedTest.time_limit);
      // Recalculate total keystrokes from test content
      const totalChars = selectedTest.content.length;
      setTotalKeystrokes(totalChars);
    }
  };

  const startTest = () => {
    if (!isActive && !isFinished) {
      setIsActive(true);
      setStartTime(new Date());
      setShowSettings(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isActive && e.key !== 'Tab') {
      startTest();
    }
    
    // Only count typed keystrokes, totalKeystrokes is calculated from test content
    setTypedKeystrokes(prev => prev + 1);

    if (e.key === ' ') {
      e.preventDefault();
      
      const currentTypedWords = userInput.trim().split(' ');
      const expectedWord = words[currentWordIndex];
      const typedWord = currentTypedWords[currentWordIndex] || '';
      
      if (typedWord !== expectedWord) {
        setWrongWords(prev => new Set([...prev, currentWordIndex]));
      } else {
        setCorrectKeystrokes(prev => prev + typedWord.length + 1); // +1 for space
      }
      
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setUserInput(prev => prev + ' ');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (value.includes(' ') && !userInput.includes(' ')) {
      return;
    }
    
    if (!isActive && value.length > 0) {
      startTest();
    }

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
    
    const typedWords = value.split(' ');
    const currentTypedWord = typedWords[currentWordIndex] || '';
    const expectedWord = words[currentWordIndex] || '';
    
    let correctCount = 0;
    const newWrongWords = new Set<number>();
    
    for (let i = 0; i < Math.min(currentTypedWord.length, expectedWord.length); i++) {
      if (currentTypedWord[i] === expectedWord[i]) {
        correctCount++;
      }
    }
    
    for (let i = 0; i < currentWordIndex; i++) {
      const typedWord = typedWords[i] || '';
      const expectedWordAtIndex = words[i] || '';
      
      if (typedWord === expectedWordAtIndex) {
        correctCount += typedWord.length + 1; // +1 for space
      } else {
        newWrongWords.add(i);
      }
    }
    
    if (currentTypedWord.length > 0 && currentTypedWord !== expectedWord.substring(0, currentTypedWord.length)) {
      newWrongWords.add(currentWordIndex);
    }
    
    setCorrectKeystrokes(correctCount);
    setWrongWords(newWrongWords);
    
    if (currentWordIndex >= words.length - 1 && currentTypedWord === expectedWord) {
      handleTestComplete();
    }
  };

  const handleTestComplete = useCallback(async () => {
    if (isFinished) return;
    
    setIsActive(false);
    setIsFinished(true);
    
    const endTime = new Date();
    // time_limit is already in seconds
    const timeTaken = startTime ? (endTime.getTime() - startTime.getTime()) / 1000 : selectedTest?.time_limit || 60;
    
    const typedWords = userInput.trim().split(' ').filter(word => word.length > 0);
    const totalTypedChars = typedWords.join('').length;
    const correctWords = typedWords.filter((word, index) => word === words[index]).length;
    const incorrectWords = typedWords.length - correctWords;
    
    const accuracy = typedWords.length > 0 ? (correctWords / typedWords.length) * 100 : 0;
    
    const wpm = Math.round((correctKeystrokes / 5) / (timeTaken / 60));
    const grossWpm = Math.round((typedKeystrokes / 5) / (timeTaken / 60));
    
    const keystrokeAccuracy = typedKeystrokes > 0 ? (correctKeystrokes / typedKeystrokes) * 100 : 0;

    const results = {
      wpm,
      grossWpm,
      accuracy: Math.round(accuracy * 100) / 100,
      totalWords: words.length,
      typedWords: typedWords.length,
      correctWords,
      incorrectWords,
      totalKeystrokes,
      typedKeystrokes,
      correctKeystrokes,
      keystrokeAccuracy: Math.round(keystrokeAccuracy * 100) / 100,
      errors: wrongWords.size,
      timeTaken: Math.round(timeTaken),
      totalTime: selectedTest?.time_limit || 60,
      testTitle: selectedTest?.title || 'Unknown Test',
      language: selectedTest?.language || 'english',
      originalText: words.join(' '),
      typedText: userInput,
      wrongWordIndices: Array.from(wrongWords)
    };

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
  }, [isFinished, startTime, userInput, words, totalKeystrokes, typedKeystrokes, correctKeystrokes, selectedTest, onComplete, wrongWords, currentWordIndex]);

  const renderText = () => {
    if (!selectedTest) return null;
    
    return words.map((word, wordIndex) => {
      const typedWords = userInput.split(' ');
      const typedWord = typedWords[wordIndex] || '';
      
      let wordClassName = 'mr-2 px-1 py-0.5 rounded ';
      
      if (wordIndex < currentWordIndex) {
        if (typedWord === word) {
          wordClassName += 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
        } else {
          wordClassName += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
        }
      } else if (wordIndex === currentWordIndex) {
        if (settings.highlightText && isActive) {
          wordClassName += 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 border-2 border-blue-400';
        } else {
          wordClassName += 'text-gray-900 dark:text-gray-100';
        }
      } else {
        wordClassName += 'text-gray-500 dark:text-gray-400';
      }
      
      return (
        <span 
          key={wordIndex} 
          className={wordClassName}
          ref={wordIndex === currentWordIndex ? currentWordRef : null}
        >
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

  // Language Selection Step  
  if (!selectedLanguage && !currentTest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Language / भाषा चुनें</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              onClick={() => setSelectedLanguage('english')}
              className="h-24 text-lg"
            >
              English
            </Button>
            <Button 
              size="lg" 
              onClick={() => setSelectedLanguage('hindi')}
              className="h-24 text-lg"
            >
              हिंदी (Hindi)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter tests by selected language
  const languageFilteredTests = availableTests?.filter(
    test => test.language === selectedLanguage
  ) || [];

  // Get categories for selected language
  const availableCategories = Array.from(
    new Set(languageFilteredTests.map(test => test.category))
  ).filter(Boolean);

  // Category Selection Step
  if (!selectedCategory && !currentTest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Select Category / श्रेणी चुनें
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-sm">
              Language: {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedLanguage('english' as 'english' | 'hindi');
                setSelectedCategory('');
                setSelectedTest(null);
              }}
            >
              Change Language
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCategories.map(category => {
              const testsCount = languageFilteredTests.filter(t => t.category === category).length;
              return (
                <Button 
                  key={category}
                  variant="outline"
                  size="lg"
                  onClick={() => setSelectedCategory(category)}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <span className="font-semibold">{category}</span>
                  <span className="text-xs text-muted-foreground">{testsCount} tests</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Test Selection Step
  const categoryTests = languageFilteredTests.filter(
    test => test.category === selectedCategory
  );

  if (!selectedTest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Test / टेस्ट चुनें</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Badge variant="outline">
                {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
              </Badge>
              <Badge variant="outline">{selectedCategory}</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSelectedTest(null);
              }}
            >
              Change Category
            </Button>
          </div>
          
          <div className="space-y-3">
            {categoryTests.map((test) => (
              <Card 
                key={test.id} 
                className="p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedTest(test)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{test.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {test.content.substring(0, 150)}...
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{test.difficulty}</Badge>
                      <Badge variant="outline">
                        {Math.floor(test.time_limit / 60)} min {test.time_limit % 60} sec
                      </Badge>
                      <Badge variant="outline">
                        {test.content.split(' ').length} words
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel - Show before test starts */}
      {showSettings && !isActive && !isFinished && (
        <Card>
          <CardHeader>
            <CardTitle>Test Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Badge variant="outline">
                  {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
                </Badge>
                <Badge variant="outline">{selectedCategory}</Badge>
                <Badge variant="outline">{selectedTest.title}</Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedTest(null);
                }}
              >
                Change Test
              </Button>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Display Settings
              </h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="highlight-text" className="text-sm font-medium">
                  Highlight current text
                </Label>
                <Switch
                  id="highlight-text"
                  checked={testSettings.highlightText}
                  onCheckedChange={(checked) => 
                    setTestSettings({...testSettings, highlightText: checked})
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-errors" className="text-sm font-medium">
                  Show typing errors
                </Label>
                <Switch
                  id="show-errors"
                  checked={testSettings.showErrors}
                  onCheckedChange={(checked) => 
                    setTestSettings({...testSettings, showErrors: checked})
                  }
                />
              </div>
            </div>

            {/* Input Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Input Settings
              </h3>
              <div className="space-y-2">
                <Label htmlFor="backspace-mode" className="text-sm font-medium">
                  Backspace behavior
                </Label>
                <Select
                  value={testSettings.backspaceMode}
                  onValueChange={(value: 'full' | 'word' | 'disabled') => 
                    setTestSettings({...testSettings, backspaceMode: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select backspace mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full correction allowed</SelectItem>
                    <SelectItem value="word">Word-level correction</SelectItem>
                    <SelectItem value="disabled">Backspace disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={startTest} 
              size="lg" 
              className="w-full"
            >
              Start Test
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test Statistics - Show during and after test */}
      {(isActive || isFinished) && (
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
      )}

      {/* Main Test Card - Show during and after test */}
      {(isActive || isFinished) && (
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
            <div 
              ref={displayRef}
              className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg h-32 overflow-auto text-lg leading-relaxed whitespace-nowrap ${
                selectedTest.language === 'hindi' ? 'font-mangal' : 'font-mono'
              }`}
              style={selectedTest.language === 'hindi' ? { fontFamily: 'Noto Sans Devanagari, Mangal, serif' } : {}}
            >
              {renderText()}
            </div>

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
                  ${isFinished ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'} 
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
      )}
    </div>
  );
};

export default TypingTest;
