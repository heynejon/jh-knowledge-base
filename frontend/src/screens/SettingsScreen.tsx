import React, { useState, useEffect } from 'react';
import { articleApi } from '../utils/api';
import Header from '../components/Header';
import { SettingsPageSkeleton } from '../components/LoadingSpinner';
import { Card, Button, Textarea, useSuccessToast, useErrorToast } from '../components/ui';
import { SettingsIcon, ExternalLinkIcon } from '../components/ui/Icons';

const SettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSummarizationPrompt, setEditedSummarizationPrompt] = useState('');
  const [editedCleaningPrompt, setEditedCleaningPrompt] = useState('');
  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await articleApi.getSettings();
      setEditedSummarizationPrompt(data.summarization_prompt);
      setEditedCleaningPrompt(data.cleaning_prompt);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSummarizationPrompt = async () => {
    try {
      setIsSaving(true);
      await articleApi.updateSettings({ 
        summarization_prompt: editedSummarizationPrompt,
        cleaning_prompt: editedCleaningPrompt
      });
      showSuccessToast('Summarization Prompt Saved', 'Your summarization prompt has been updated successfully.');
    } catch (error) {
      console.error('Error saving summarization prompt:', error);
      showErrorToast('Failed to Save Prompt', 'Please try again in a moment.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCleaningPrompt = async () => {
    try {
      setIsSaving(true);
      await articleApi.updateSettings({ 
        summarization_prompt: editedSummarizationPrompt,
        cleaning_prompt: editedCleaningPrompt
      });
      showSuccessToast('Cleaning Prompt Saved', 'Your content cleaning prompt has been updated successfully.');
    } catch (error) {
      console.error('Error saving cleaning prompt:', error);
      showErrorToast('Failed to Save Prompt', 'Please try again in a moment.');
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
      showSuccessToast('Export Complete', 'Your knowledge base has been exported successfully.');
    } catch (error) {
      console.error('Error exporting data:', error);
      showErrorToast('Export Failed', 'Please try again in a moment.');
    }
  };

  const resetSummarizationToDefault = () => {
    const defaultPrompt = "Summarize the following article in a clear, concise manner:";
    setEditedSummarizationPrompt(defaultPrompt);
  };

  const resetCleaningToDefault = () => {
    const defaultPrompt = `You are a content extraction specialist. Your task is to clean scraped webpage content by removing all irrelevant elements while preserving the main article text EXACTLY as written.

CRITICAL INSTRUCTIONS:
1. NEVER change, rephrase, or modify even a single word of the actual article content
2. ONLY remove content that is clearly not part of the main article
3. Preserve all original formatting, line breaks, and paragraph structure
4. Do NOT add any new content or commentary

REMOVE these types of content:
- Navigation menus and breadcrumbs
- Website headers and footers
- Newsletter signup prompts
- Social media sharing buttons and links
- Author bios and "About the author" sections
- Related articles lists
- Advertisement content
- Comment sections
- "Subscribe" or "Follow us" calls-to-action
- Publication metadata (dates, categories, tags)
- Table of contents (if it's just navigation)
- Repeated promotional content
- Website navigation elements

KEEP these elements:
- The main article title
- All body paragraphs of the article
- Subheadings that are part of the article structure
- Quotes and citations within the article
- Lists that are part of the article content
- Any content that is clearly part of the author's intended message

Return ONLY the cleaned article content with no additional commentary or explanation.`;
    setEditedCleaningPrompt(defaultPrompt);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Settings" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <SettingsPageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
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
            
            <div className="space-y-6">
              <Textarea
                label="Summarization Prompt"
                value={editedSummarizationPrompt}
                onChange={(e) => setEditedSummarizationPrompt(e.target.value)}
                rows={4}
                placeholder="Enter your summarization prompt..."
                helperText="This prompt will be sent to the AI along with each article to generate summaries."
                required
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={handleSaveSummarizationPrompt}
                  disabled={isSaving}
                  isLoading={isSaving}
                  variant="primary"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isSaving ? 'Saving...' : 'Save Prompt'}
                </Button>
                <Button
                  type="button"
                  onClick={resetSummarizationToDefault}
                  variant="secondary"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          </Card>

          {/* AI Content Cleaning Settings */}
          <Card>
            <h2 className="text-lg sm:text-h2 font-semibold text-gray-900 mb-4">AI Content Cleaning</h2>
            <p className="text-body text-gray-600 mb-6">
              Customize the prompt used to clean article content when you use the "Clean Content" feature. 
              This removes navigation, ads, and other irrelevant content while preserving the main article text.
            </p>
            
            <div className="space-y-6">
              <Textarea
                label="Content Cleaning Prompt"
                value={editedCleaningPrompt}
                onChange={(e) => setEditedCleaningPrompt(e.target.value)}
                rows={8}
                placeholder="Enter your content cleaning prompt..."
                helperText="This prompt will be used to clean scraped content and remove irrelevant elements."
                required
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={handleSaveCleaningPrompt}
                  disabled={isSaving}
                  isLoading={isSaving}
                  variant="primary"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isSaving ? 'Saving...' : 'Save Prompt'}
                </Button>
                <Button
                  type="button"
                  onClick={resetCleaningToDefault}
                  variant="secondary"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          </Card>

        </div>

        <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">

          {/* Data Export */}
          <Card>
            <h2 className="text-lg sm:text-h2 font-semibold text-gray-900 mb-4">Data Export</h2>
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

          {/* Summarization Prompt Templates */}
          <Card>
            <h2 className="text-lg sm:text-h2 font-semibold text-gray-900 mb-4">Summarization Templates</h2>
            <p className="text-body text-gray-600 mb-6">
              Get started with these proven summarization prompt templates, or use them as inspiration for your own custom prompts.
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
                      onClick={() => setEditedSummarizationPrompt(template.prompt)}
                      className="w-full sm:w-auto sm:flex-shrink-0"
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Content Cleaning Prompt Templates */}
          <Card>
            <h2 className="text-lg sm:text-h2 font-semibold text-gray-900 mb-4">Content Cleaning Templates</h2>
            <p className="text-body text-gray-600 mb-6">
              Choose from these content cleaning prompt templates to customize how articles are cleaned.
            </p>
            
            <div className="grid gap-3 sm:gap-4">
              {[
                {
                  title: "Conservative Cleaning",
                  description: "Removes only obvious non-article content like navigation and ads",
                  prompt: "Remove navigation menus, advertisements, social media buttons, and other non-article content. Preserve the main article text exactly as written, including all formatting and structure."
                },
                {
                  title: "Aggressive Cleaning", 
                  description: "More thorough removal of metadata, author info, and promotional content",
                  prompt: "Remove all non-essential content including navigation, ads, author bios, related articles, comments, promotional content, and metadata. Keep only the main article title and body content. Preserve original text and formatting exactly."
                },
                {
                  title: "Academic Focus",
                  description: "Optimized for academic and research articles",
                  prompt: "Clean this academic article by removing website navigation, promotional content, and social elements while preserving the title, abstract, main content, citations, and any academic formatting. Keep all scholarly elements intact."
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
                      onClick={() => setEditedCleaningPrompt(template.prompt)}
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