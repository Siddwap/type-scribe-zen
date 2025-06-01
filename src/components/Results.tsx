
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Clock, Zap, CheckCircle, XCircle, Type, Calendar } from 'lucide-react';

const Results = ({ results }) => {
  if (!results) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Complete a typing test to see your detailed results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceLevel = (wpm) => {
    if (wpm >= 70) return { level: 'Expert', color: 'bg-purple-500', textColor: 'text-purple-600' };
    if (wpm >= 50) return { level: 'Advanced', color: 'bg-green-500', textColor: 'text-green-600' };
    if (wpm >= 30) return { level: 'Intermediate', color: 'bg-blue-500', textColor: 'text-blue-600' };
    if (wpm >= 15) return { level: 'Beginner', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { level: 'Novice', color: 'bg-red-500', textColor: 'text-red-600' };
  };

  const performance = getPerformanceLevel(results.wpm);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
        <CardContent className="p-8 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-2">Test Complete!</h2>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="outline" className={performance.textColor}>
              {performance.level} Level
            </Badge>
            <Badge variant="outline">
              {results.language === 'hindi' ? 'हिंदी' : 'English'}
            </Badge>
          </div>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {results.wpm} WPM
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {results.accuracy}% Accuracy
          </div>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 mx-auto mb-3 text-blue-500" />
            <div className="text-2xl font-bold mb-1">{results.wpm}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Words Per Minute</div>
            <Progress value={(results.wpm / 100) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-3 text-green-500" />
            <div className="text-2xl font-bold mb-1">{results.accuracy}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            <Progress value={results.accuracy} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-3 text-purple-500" />
            <div className="text-2xl font-bold mb-1">{results.timeTaken}s</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Taken</div>
            <Progress value={(results.timeTaken / results.timeLimit) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Type className="h-8 w-8 mx-auto mb-3 text-orange-500" />
            <div className="text-2xl font-bold mb-1">{results.totalKeystrokes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Keystrokes</div>
            <div className="text-xs text-gray-500 mt-1">
              {results.correctKeystrokes} correct
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Word Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Words</span>
              <Badge variant="outline">{results.totalWords}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Typed Words</span>
              <Badge variant="outline">{results.typedWords}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Correct Words</span>
              <Badge className="bg-green-500">{results.correctWords}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Incorrect Words</span>
              <Badge variant="destructive">{results.incorrectWords}</Badge>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Correct vs Incorrect</span>
                <span>{Math.round((results.correctWords / results.typedWords) * 100)}%</span>
              </div>
              <div className="flex h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(results.correctWords / results.typedWords) * 100}%` }}
                />
                <div 
                  className="bg-red-500" 
                  style={{ width: `${(results.incorrectWords / results.typedWords) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Error Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Errors</span>
              <Badge variant="destructive">{results.errors}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Error Rate</span>
              <Badge variant="outline">
                {Math.round((results.errors / results.totalKeystrokes) * 100)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Gross WPM</span>
              <Badge variant="outline">{results.grossWpm}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Net WPM</span>
              <Badge className="bg-blue-500">{results.wpm}</Badge>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Performance Tip
              </div>
              <div className="text-sm">
                {results.accuracy > 95 ? 
                  "Excellent accuracy! Focus on increasing speed." :
                  results.accuracy > 85 ?
                  "Good accuracy. Practice difficult letter combinations." :
                  "Focus on accuracy before speed. Slow down and type correctly."
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {results.wpm}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Net WPM</div>
              <div className="text-xs text-gray-500 mt-1">
                Words per minute after errors
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {results.accuracy}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
              <div className="text-xs text-gray-500 mt-1">
                Percentage of correct keystrokes
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {Math.round((results.correctKeystrokes / results.timeTaken) * 60)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">CPM</div>
              <div className="text-xs text-gray-500 mt-1">
                Correct characters per minute
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button size="lg" onClick={() => window.location.reload()}>
          Take Another Test
        </Button>
        <Button variant="outline" size="lg">
          Share Results
        </Button>
      </div>
    </div>
  );
};

export default Results;
