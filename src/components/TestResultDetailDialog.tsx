import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Keyboard,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Printer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface TestResultDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
}

const TestResultDetailDialog = ({ isOpen, onClose, result }: TestResultDetailDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Fetch the test content for paragraph comparison
  const { data: testData } = useQuery({
    queryKey: ['test-detail', result?.test_id],
    queryFn: async () => {
      if (!result?.test_id) return null;
      const { data, error } = await supabase
        .from('typing_tests')
        .select('content, title, language, time_limit')
        .eq('id', result.test_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!result?.test_id
  });

  if (!result) return null;

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const getPerformanceLevel = (wpm: number) => {
    if (wpm >= 80) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' };
    if (wpm >= 60) return { level: 'Advanced', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (wpm >= 40) return { level: 'Intermediate', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (wpm >= 20) return { level: 'Beginner', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { level: 'Novice', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const performance = getPerformanceLevel(result.wpm);

  // Calculate keystroke-based speeds
  const totalKeystrokes = result.total_keystrokes || result.correct_keystrokes + result.wrong_keystrokes || 0;
  const timeTakenMinutes = result.time_taken / 60;
  const grossSpeed = totalKeystrokes > 0 ? (totalKeystrokes / 5) / timeTakenMinutes : 0;
  const netSpeed = totalKeystrokes > 0 ? Math.max(0, ((totalKeystrokes / 5) - (result.errors || result.incorrect_words || 0)) / timeTakenMinutes) : 0;

  // Determine qualification status
  const isQualified = result.is_qualified ?? (
    result.accuracy >= 85 && 
    (result.time_taken >= 600 || (result.total_words || 0) >= 400)
  );

  // Render paragraph comparison
  const renderParagraphComparison = () => {
    if (!testData?.content) return null;
    
    const originalWords = testData.content.split(/\s+/);
    const typedWords = result.typed_words_array || [];
    const totalTypedWords = result.typed_words || 0;
    
    return (
      <div className="flex flex-wrap gap-1 text-sm leading-relaxed font-mono">
        {originalWords.map((word: string, index: number) => {
          const typedWord = typedWords[index] || '';
          const isTyped = index < totalTypedWords;
          const isCorrect = isTyped && word === typedWord;
          const isWrong = isTyped && word !== typedWord && typedWord !== '';
          const isSkipped = isTyped && typedWord === '';
          
          return (
            <span
              key={index}
              className={`${
                !isTyped
                  ? 'text-gray-400'
                  : isCorrect
                  ? 'text-green-600 dark:text-green-400'
                  : isWrong
                  ? 'text-red-600 dark:text-red-400'
                  : isSkipped
                  ? 'text-yellow-600 dark:text-yellow-400 line-through'
                  : 'text-gray-400'
              }`}
            >
              {word}
              {isWrong && typedWord && (
                <span className="text-red-500 text-xs ml-0.5">({typedWord})</span>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the result');
      return;
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #4F46E5; }
        .header h1 { color: #4F46E5; font-size: 24px; }
        .test-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .test-info h2 { font-size: 18px; margin-bottom: 8px; }
        .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; background: #e5e7eb; }
        .badge.qualified { background: #dcfce7; color: #16a34a; }
        .badge.not-qualified { background: #fee2e2; color: #dc2626; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
        .stat-card .value { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .stat-card .label { font-size: 12px; color: #6b7280; }
        .detailed-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; }
        .detailed-stat { text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px; }
        .detailed-stat .value { font-size: 18px; font-weight: 600; }
        .detailed-stat .label { font-size: 10px; color: #6b7280; }
        .paragraph-section { margin-top: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .paragraph-section h3 { font-size: 16px; margin-bottom: 10px; color: #374151; }
        .paragraph-content { font-family: monospace; font-size: 13px; line-height: 1.8; }
        .word-correct { color: #16a34a; }
        .word-wrong { color: #dc2626; }
        .word-untyped { color: #9ca3af; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
        @media print { body { padding: 10px; } }
      </style>
    `;

    const originalWords = testData?.content?.split(/\s+/) || [];
    const typedWordsArr = result.typed_words_array || [];
    const totalTypedWords = result.typed_words || 0;
    
    let paragraphHtml = '';
    originalWords.forEach((word: string, index: number) => {
      const typedWord = typedWordsArr[index] || '';
      const isTyped = index < totalTypedWords;
      const isCorrect = isTyped && word === typedWord;
      const isWrong = isTyped && word !== typedWord && typedWord !== '';
      
      let className = 'word-untyped';
      if (isCorrect) className = 'word-correct';
      else if (isWrong) className = 'word-wrong';
      
      paragraphHtml += `<span class="${className}">${word}${isWrong && typedWord ? `<span style="font-size:10px;color:#dc2626;">(${typedWord})</span>` : ''}</span> `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Result - ${result.typing_tests?.title || 'Unknown Test'}</title>
          ${styles}
        </head>
        <body>
          <div class="header">
            <h1>TypeScribe Zen - Test Result</h1>
            <p>typescribe.vercel.app</p>
          </div>
          
          <div class="test-info">
            <h2>${result.typing_tests?.title || 'Unknown Test'}</h2>
            <div class="badges">
              <span class="badge">${result.typing_tests?.language === 'hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</span>
              <span class="badge">${result.typing_tests?.category || 'General'}</span>
              <span class="badge ${isQualified ? 'qualified' : 'not-qualified'}">${isQualified ? '✓ Qualified' : '✗ Not Qualified'}</span>
            </div>
            <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">
              Completed on ${new Date(result.completed_at).toLocaleString()}
            </p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${Number(result.wpm).toFixed(1)}</div>
              <div class="label">Net WPM</div>
            </div>
            <div class="stat-card">
              <div class="value">${Number(result.gross_wpm || 0).toFixed(1)}</div>
              <div class="label">Gross WPM</div>
            </div>
            <div class="stat-card">
              <div class="value">${Number(result.accuracy).toFixed(1)}%</div>
              <div class="label">Accuracy</div>
            </div>
            <div class="stat-card">
              <div class="value">${formatTime(result.time_taken)}</div>
              <div class="label">Time Taken</div>
            </div>
          </div>

          <div class="detailed-stats">
            <div class="detailed-stat">
              <div class="value">${result.correct_words_count || 0}</div>
              <div class="label">Correct Words</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${result.incorrect_words || 0}</div>
              <div class="label">Wrong Words</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${totalKeystrokes}</div>
              <div class="label">Total Keystrokes</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${grossSpeed.toFixed(1)}</div>
              <div class="label">Gross Speed (5 keys)</div>
            </div>
            <div class="detailed-stat">
              <div class="value">${netSpeed.toFixed(1)}</div>
              <div class="label">Net Speed (5 keys)</div>
            </div>
          </div>

          ${testData?.content ? `
            <div class="paragraph-section">
              <h3>📝 Paragraph Comparison</h3>
              <div class="paragraph-content">
                ${paragraphHtml}
              </div>
              <div style="margin-top: 10px; font-size: 11px; color: #6b7280;">
                <span class="word-correct">■</span> Correct &nbsp;
                <span class="word-wrong">■</span> Wrong &nbsp;
                <span class="word-untyped">■</span> Not Typed
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated from TypeScribe Zen | ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Test Result Details
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-100px)] pr-4">
          <div ref={printRef} className="space-y-6">
            {/* Test Info Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{result.typing_tests?.title || 'Unknown Test'}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline">
                        {result.typing_tests?.language === 'hindi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {result.typing_tests?.difficulty || 'Medium'}
                      </Badge>
                      {result.typing_tests?.category && (
                        <Badge variant="secondary">{result.typing_tests.category}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Completed on</p>
                    <p className="font-medium">{new Date(result.completed_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{new Date(result.completed_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Badge */}
            <div className="flex justify-center gap-4">
              <Badge className={`${performance.bg} ${performance.color} px-6 py-2 text-lg font-bold border-2`}>
                {performance.level} Typist
              </Badge>
              <Badge 
                className={`px-6 py-2 text-lg font-bold border-2 ${
                  isQualified 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-300'
                }`}
              >
                {isQualified ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Qualified</>
                ) : (
                  <><AlertCircle className="h-4 w-4 mr-1" /> Not Qualified</>
                )}
              </Badge>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{Number(result.wpm).toFixed(1)}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Net WPM</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{Number(result.gross_wpm || 0).toFixed(1)}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Gross WPM</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">{Number(result.accuracy).toFixed(1)}%</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Accuracy</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                  <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{formatTime(result.time_taken)}</div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Time Taken</div>
                </CardContent>
              </Card>

              {/* Keystroke-based speeds */}
              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
                <CardContent className="p-4 text-center">
                  <Keyboard className="h-8 w-8 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                  <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{grossSpeed.toFixed(1)}</div>
                  <div className="text-sm text-cyan-600 dark:text-cyan-400">Gross Speed (5 keys)</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{netSpeed.toFixed(1)}</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">Net Speed (5 keys)</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-xl font-bold">{result.correct_words_count || 0}</div>
                <div className="text-xs text-muted-foreground">Correct Words</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <div className="text-xl font-bold">{result.incorrect_words || 0}</div>
                <div className="text-xs text-muted-foreground">Incorrect Words</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Keyboard className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-xl font-bold">{totalKeystrokes}</div>
                <div className="text-xs text-muted-foreground">Total Keystrokes</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <div className="text-xl font-bold">{result.typed_words || 0}/{result.total_words || 0}</div>
                <div className="text-xs text-muted-foreground">Words Typed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <BarChart3 className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <div className="text-xl font-bold">{result.backspace_count || 0}</div>
                <div className="text-xs text-muted-foreground">Backspace Count</div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-xl font-bold">{result.correct_keystrokes || 0}</div>
                <div className="text-xs text-muted-foreground">Correct Keystrokes</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <div className="text-xl font-bold">{result.wrong_keystrokes || 0}</div>
                <div className="text-xs text-muted-foreground">Wrong Keystrokes</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Target className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <div className="text-xl font-bold">{result.skipped_words || 0}</div>
                <div className="text-xs text-muted-foreground">Skipped Words</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <FileText className="h-5 w-5 mx-auto mb-1 text-cyan-500" />
                <div className="text-xl font-bold">{result.extra_words || 0}</div>
                <div className="text-xs text-muted-foreground">Extra Words</div>
              </div>
            </div>

            {/* Keystroke speeds if available from DB */}
            {(result.gross_speed || result.net_speed) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <Keyboard className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
                  <div className="text-xl font-bold">{Number(result.gross_speed || 0).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Gross Typing Speed (DB)</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <Zap className="h-5 w-5 mx-auto mb-1 text-teal-500" />
                  <div className="text-xl font-bold">{Number(result.net_speed || 0).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Net Typing Speed (DB)</div>
                </div>
              </div>
            )}

            {/* Paragraph Comparison Section */}
            {testData?.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paragraph Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg max-h-[300px] overflow-y-auto">
                    {renderParagraphComparison()}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-500 rounded"></span> Correct
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-500 rounded"></span> Wrong
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-gray-400 rounded"></span> Not Typed
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Qualification Criteria */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Qualification Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    {result.accuracy >= 85 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    Accuracy ≥ 85% (Your: {Number(result.accuracy).toFixed(1)}%)
                  </li>
                  <li className="flex items-center gap-2">
                    {result.time_taken >= 600 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    Time ≥ 10 minutes (Your: {formatTime(result.time_taken)})
                  </li>
                  <li className="flex items-center gap-2">
                    {(result.total_words || 0) >= 400 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    OR Total Words ≥ 400 (Your: {result.total_words || 0})
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TestResultDetailDialog;
