
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings, Clock, Type, Eye, ArrowLeft } from 'lucide-react';

const TestSettings = ({ settings, onSettingsChange }) => {
  const updateSetting = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Language
            </Label>
            <Select 
              value={settings.language} 
              onValueChange={(value) => updateSetting('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Limit (seconds)
            </Label>
            <Select 
              value={settings.timeLimit.toString()} 
              onValueChange={(value) => updateSetting('timeLimit', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="120">2 minutes</SelectItem>
                <SelectItem value="180">3 minutes</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Highlight Text */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Highlight Current Text</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Highlight the character you're currently typing
              </p>
            </div>
            <Switch
              checked={settings.highlightText}
              onCheckedChange={(checked) => updateSetting('highlightText', checked)}
            />
          </div>

          {/* Show Errors */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Errors</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Highlight incorrect characters in red
              </p>
            </div>
            <Switch
              checked={settings.showErrors}
              onCheckedChange={(checked) => updateSetting('showErrors', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Backspace Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={settings.backspaceMode} 
            onValueChange={(value) => updateSetting('backspaceMode', value)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Full Backspace</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Allow unlimited backspacing
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="word" id="word" />
              <Label htmlFor="word" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">One Word Back</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Only allow backspacing within the current word
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="disabled" />
              <Label htmlFor="disabled" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Backspace Disabled</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    No backspacing allowed - move forward only
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Language:</span> {settings.language}
              </div>
              <div>
                <span className="font-medium">Time:</span> {settings.timeLimit}s
              </div>
              <div>
                <span className="font-medium">Highlight:</span> {settings.highlightText ? 'On' : 'Off'}
              </div>
              <div>
                <span className="font-medium">Show Errors:</span> {settings.showErrors ? 'On' : 'Off'}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Backspace:</span> {
                  settings.backspaceMode === 'full' ? 'Full' :
                  settings.backspaceMode === 'word' ? 'One Word' : 'Disabled'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSettings;
