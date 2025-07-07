import React, { useState, useEffect } from 'react';
import { articleApi, Settings } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, Button, Textarea } from '../components/ui';
import { SettingsIcon, ExternalLinkIcon } from '../components/ui/Icons';

const SettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await articleApi.getSettings();
      setEditedPrompt(data.summarization_prompt);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      await articleApi.updateSettings({ summarization_prompt: editedPrompt });
      // TODO: Replace with proper toast notification
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Replace with proper error notification
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await articleApi.exportArticles();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jh-knowledge-base-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const resetToDefault = () => {
    const defaultPrompt = "Summarize the following article in a clear, concise manner:";
    setEditedPrompt(defaultPrompt);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Settings" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Settings" showBackButton={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary-600" />
            </div>
            <h1 className="text-xl sm:text-h1 font-heading text-gray-900">Settings</h1>
          </div>
          <p className="text-body sm:text-body-lg text-gray-600">
            Customize your knowledge base preferences and export your data
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* AI Summarization Settings */}
          <Card>
            <h2 className="text-lg sm:text-h2 font-semibold text-gray-900 mb-4">AI Summarization</h2>
            <p className="text-body text-gray-600 mb-6">
              Customize the prompt used to generate summaries for all new articles. 
              This helps you get summaries in the style and format you prefer.
            </p>
            
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <Textarea
                label="Custom Prompt"
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={4}
                placeholder="Enter your summarization prompt..."
                helperText="This prompt will be sent to the AI along with each article to generate summaries."
                required
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  isLoading={isSaving}
                  variant="primary"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isSaving ? 'Saving Settings...' : 'Save Settings'}
                </Button>
                <Button
                  type="button"
                  onClick={resetToDefault}
                  variant="secondary"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Reset to Default
                </Button>
              </div>
            </form>
          </Card>

          {/* Data Management */}
          <Card>
            <h2 className="text-lg sm:text-h2 font-semibold text-gray-900 mb-4">Data Management</h2>
            <p className="text-body text-gray-600 mb-6">
              Export your knowledge base for backup or migration purposes.
            </p>
            
            <Button
              onClick={handleExportData}
              variant="secondary"
              leftIcon={<ExternalLinkIcon />}
              className="w-full sm:w-auto"
              size="sm"
            >
              Export All Data as JSON
            </Button>
          </Card>

          {/* Sample Prompts */}
          <Card>
            <h2 className="text-lg sm:text-h2 font-semibold text-gray-900 mb-4">Prompt Templates</h2>
            <p className="text-body text-gray-600 mb-6">
              Get started with these proven prompt templates, or use them as inspiration for your own custom prompts.
            </p>
            
            <div className="grid gap-3 sm:gap-4">
              {[
                {
                  title: "Brief Summary",
                  description: "Perfect for quick overviews and key takeaways",
                  prompt: "Provide a brief 2-3 sentence summary of the main points in this article."
                },
                {
                  title: "Detailed Summary", 
                  description: "Comprehensive analysis with structured bullet points",
                  prompt: "Create a detailed summary of this article, including the main arguments, key findings, and important supporting details. Structure it with clear bullet points."
                },
                {
                  title: "Technical Focus",
                  description: "Emphasizes data, methodologies, and technical specifications",
                  prompt: "Summarize this article with a focus on technical details, methodologies, and concrete examples. Include any relevant data, statistics, or technical specifications mentioned."
                }
              ].map((template, index) => (
                <Card key={index} padding="sm" className="border border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-body sm:text-body-lg font-semibold text-gray-900 mb-1">{template.title}</h3>
                      <p className="text-body-sm text-gray-500 mb-3">{template.description}</p>
                      <p className="text-body text-gray-700 italic">"{template.prompt}"</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditedPrompt(template.prompt)}
                      className="w-full sm:w-auto sm:flex-shrink-0"
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;