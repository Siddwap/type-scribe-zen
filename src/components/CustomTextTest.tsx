import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FileText, Play, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomTextTestProps {
  onStartTest: (customTest: { content: string; time_limit: number }) => void;
  onBack: () => void;
}

const CustomTextTest = ({ onStartTest, onBack }: CustomTextTestProps) => {
  const [customText, setCustomText] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);

  const handleStartTest = () => {
    if (!customText.trim()) {
      toast({
        title: "Empty text",
        description: "Please enter some text to practice with.",
        variant: "destructive"
      });
      return;
    }

    const wordCount = customText.trim().split(/\s+/).length;
    if (wordCount < 10) {
      toast({
        title: "Text too short",
        description: "Please enter at least 10 words to practice with.",
        variant: "destructive"
      });
      return;
    }

    onStartTest({
      content: customText.trim(),
      time_limit: timeLimit
    });
  };

  const wordCount = customText.trim() ? customText.trim().split(/\s+/).length : 0;
  const charCount = customText.length;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
          <FileText className="h-8 w-8" />
          Custom Text Practice
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Type your own text and practice at your own pace
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="custom-text" className="text-base font-semibold">
            Enter Your Text
          </Label>
          <Textarea
            id="custom-text"
            placeholder="Paste or type the text you want to practice with... (minimum 10 words)"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="min-h-[250px] text-base leading-relaxed"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="font-medium">{wordCount}</span> words
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">{charCount}</span> characters
              </span>
            </div>
            {wordCount > 0 && wordCount < 10 && (
              <span className="text-red-500 font-medium">
                Need {10 - wordCount} more words
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="time-limit" className="text-base font-semibold">
            Time Limit: {timeLimit} seconds
          </Label>
          <Slider
            id="time-limit"
            min={30}
            max={300}
            step={15}
            value={[timeLimit]}
            onValueChange={(value) => setTimeLimit(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30s</span>
            <span>60s</span>
            <span>120s</span>
            <span>300s</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Back to Tests
          </Button>
          <Button
            onClick={handleStartTest}
            disabled={wordCount < 10}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Practice
          </Button>
        </div>

        <Card className="bg-muted">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tips for Custom Text Practice
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Paste articles, quotes, or any text you want to practice</li>
              <li>Perfect for learning specific terminology or technical content</li>
              <li>Minimum 10 words required for meaningful practice</li>
              <li>Adjust time limit based on text length and difficulty</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CustomTextTest;
