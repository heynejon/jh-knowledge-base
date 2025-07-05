import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleApi, Settings } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
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
      setSettings(data);
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
      setSettings({ summarization_prompt: editedPrompt });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
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
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Settings" showBackButton={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Summarization Prompt Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summarization Prompt</h2>
            <p className="text-sm text-gray-600 mb-6">
              This prompt will be used to generate summaries for all new articles. You can customize it to get summaries in the style you prefer.
            </p>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt:
                </label>
                <textarea
                  id="prompt"
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter your summarization prompt..."
                  required
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  type="button"
                  onClick={resetToDefault}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Reset to Default
                </button>
              </div>
            </form>
          </div>

          {/* Export Data */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
            <p className="text-sm text-gray-600 mb-6">
              Download all your articles and summaries as a JSON file for backup or migration purposes.
            </p>
            
            <button
              onClick={handleExportData}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Export All Data
            </button>
          </div>

          {/* Sample Prompts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Prompts</h2>
            <p className="text-sm text-gray-600 mb-6">
              Here are some example prompts you can use or modify:
            </p>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-900 mb-2">Brief Summary</h3>
                <p className="text-sm text-gray-700 mb-2">
                  "Provide a brief 2-3 sentence summary of the main points in this article."
                </p>
                <button
                  onClick={() => setEditedPrompt("Provide a brief 2-3 sentence summary of the main points in this article.")}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Use this prompt
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-900 mb-2">Detailed Summary</h3>
                <p className="text-sm text-gray-700 mb-2">
                  "Create a detailed summary of this article, including the main arguments, key findings, and important supporting details. Structure it with clear bullet points."
                </p>
                <button
                  onClick={() => setEditedPrompt("Create a detailed summary of this article, including the main arguments, key findings, and important supporting details. Structure it with clear bullet points.")}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Use this prompt
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-900 mb-2">Technical Focus</h3>
                <p className="text-sm text-gray-700 mb-2">
                  "Summarize this article with a focus on technical details, methodologies, and concrete examples. Include any relevant data, statistics, or technical specifications mentioned."
                </p>
                <button
                  onClick={() => setEditedPrompt("Summarize this article with a focus on technical details, methodologies, and concrete examples. Include any relevant data, statistics, or technical specifications mentioned.")}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Use this prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;