
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Sun, Keyboard, Target, Trophy, Settings } from 'lucide-react';
import AdminPanel from '@/components/AdminPanel';
import TypingTest from '@/components/TypingTest';
import TestSettings from '@/components/TestSettings';
import Results from '@/components/Results';

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('test');
  const [testSettings, setTestSettings] = useState({
    highlightText: true,
    showErrors: true,
    backspaceMode: 'full', // 'full', 'word', 'disabled'
    timeLimit: 60,
    language: 'english'
  });
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleTestComplete = (results) => {
    setTestResults(results);
    setActiveTab('results');
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Keyboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TypeScribe Zen
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Master your typing skills
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
                <Moon className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Typing Test
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <TypingTest 
              settings={testSettings}
              onComplete={handleTestComplete}
              currentTest={currentTest}
            />
          </TabsContent>

          <TabsContent value="settings">
            <TestSettings 
              settings={testSettings}
              onSettingsChange={setTestSettings}
            />
          </TabsContent>

          <TabsContent value="results">
            <Results results={testResults} />
          </TabsContent>

          <TabsContent value="admin">
            <AdminPanel onTestCreated={setCurrentTest} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2024 TypeScribe Zen. Built with ❤️ using React & Tailwind</p>
      </footer>
    </div>
  );
};

export default Index;
