import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TypingTest {
  id: string;
  title: string;
  content: string;
  language: 'english' | 'hindi';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  time_limit: number;
  is_active: boolean;
  created_at: string;
}

interface AdminPanelProps {
  onTestCreated?: (test: TypingTest) => void;
}

const AdminPanel = ({ onTestCreated }: AdminPanelProps) => {
  const [newTest, setNewTest] = useState({
    title: '',
    content: '',
    language: 'english' as 'english' | 'hindi',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: '',
    time_limit: 1 // Time in minutes
  });

  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all tests for admin view
  const { data: tests = [], refetch: refetchTests } = useQuery({
    queryKey: ['admin-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('typing_tests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TypingTest[];
    }
  });

  // Get unique categories
  const categories = Array.from(new Set(tests.map(test => test.category))).filter(Boolean);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!newTest.title || !newTest.content || !newTest.category) {
        throw new Error('Please fill in all required fields');
      }

      const { data, error } = await supabase
        .from('typing_tests')
        .insert([{
          title: newTest.title,
          content: newTest.content.trim(),
          language: newTest.language,
          difficulty: newTest.difficulty,
          category: newTest.category.trim(),
          time_limit: newTest.time_limit * 60 // Convert minutes to seconds
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test created successfully!",
      });

      // Reset form
      setNewTest({
        title: '',
        content: '',
        language: 'english',
        difficulty: 'medium',
        category: '',
        time_limit: 1
      });

      // Refresh data
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });

      if (onTestCreated) {
        onTestCreated(data);
      }
    } catch (error: any) {
      console.error('Error creating test:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('typing_tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test deleted successfully!",
      });

      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error deleting test:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (testId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('typing_tests')
        .update({ is_active: !isActive })
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Test ${!isActive ? 'activated' : 'deactivated'} successfully!`,
      });

      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error updating test:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      // Create a placeholder test with the new category
      const { error } = await supabase
        .from('typing_tests')
        .insert([{
          title: `Sample ${newCategory} Test`,
          content: 'This is a sample test for the new category. You can edit or delete this test.',
          language: 'english',
          difficulty: 'medium',
          category: newCategory.trim(),
          time_limit: 60,
          is_active: false
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully!",
      });

      setNewCategory('');
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (oldCategory: string) => {
    if (!editCategoryName.trim() || editCategoryName === oldCategory) {
      setEditingCategory(null);
      setEditCategoryName('');
      return;
    }

    try {
      const { error } = await supabase
        .from('typing_tests')
        .update({ category: editCategoryName.trim() })
        .eq('category', oldCategory);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully!",
      });

      setEditingCategory(null);
      setEditCategoryName('');
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: string) => {
    try {
      const { error } = await supabase
        .from('typing_tests')
        .delete()
        .eq('category', category);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category and all its tests deleted successfully!",
      });

      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['typing-tests'] });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create-test" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create-test">Create Test</TabsTrigger>
              <TabsTrigger value="manage-tests">Manage Tests</TabsTrigger>
              <TabsTrigger value="manage-categories">Manage Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="create-test">
              <form onSubmit={handleCreateTest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Test Title *</Label>
                    <Input
                      id="title"
                      value={newTest.title}
                      onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                      placeholder="Enter test title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={newTest.category}
                      onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                      placeholder="Enter category name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={newTest.language} onValueChange={(value: 'english' | 'hindi') => setNewTest({ ...newTest, language: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={newTest.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewTest({ ...newTest, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_limit">Time Limit (minutes) *</Label>
                    <Input
                      id="time_limit"
                      type="number"
                      min="1"
                      max="60"
                      value={newTest.time_limit}
                      onChange={(e) => setNewTest({ ...newTest, time_limit: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Test Content *</Label>
                  <Textarea
                    id="content"
                    value={newTest.content}
                    onChange={(e) => setNewTest({ ...newTest, content: e.target.value })}
                    placeholder="Enter the text for typing test"
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Words: {newTest.content.split(' ').filter(word => word.length > 0).length}
                  </p>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Creating...' : 'Create Test'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="manage-tests">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tests: {tests.length} | Active: {tests.filter(t => t.is_active).length}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tests.map((test) => (
                    <Card key={test.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{test.title}</h3>
                            <Badge variant="outline">{test.language}</Badge>
                            <Badge variant="outline">{test.difficulty}</Badge>
                            <Badge variant="outline">{test.category}</Badge>
                            <Badge variant={test.is_active ? "default" : "secondary"}>
                              {test.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {test.content.substring(0, 100)}...
                          </p>
                          <div className="text-xs text-gray-500">
                            Time: {formatTime(test.time_limit)} | Words: {test.content.split(' ').length}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={test.is_active ? "secondary" : "default"}
                            onClick={() => handleToggleActive(test.id, test.is_active)}
                          >
                            {test.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Test</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{test.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTest(test.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manage-categories">
              <div className="space-y-6">
                {/* Create New Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create New Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter category name"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                      />
                      <Button onClick={handleCreateCategory} disabled={!newCategory.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Existing Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {editingCategory === category ? (
                              <Input
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditCategory(category);
                                  if (e.key === 'Escape') {
                                    setEditingCategory(null);
                                    setEditCategoryName('');
                                  }
                                }}
                                autoFocus
                                className="w-48"
                              />
                            ) : (
                              <>
                                <span className="font-medium capitalize">{category}</span>
                                <Badge variant="secondary">
                                  {tests.filter(t => t.category === category).length} tests
                                </Badge>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {editingCategory === category ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCategory(null);
                                    setEditCategoryName('');
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setEditCategoryName(category);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the "{category}" category? This will also delete all tests in this category. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteCategory(category)}>
                                        Delete Category
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {categories.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No categories found. Create your first category above.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
