'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DEFAULT_SUMMARY_PROMPT } from '@/lib/constants';
import ConfirmModal from '@/components/ConfirmModal';

export default function SettingsPage() {
  const [prompt, setPrompt] = useState('');
  const [savedPrompt, setSavedPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSaveAsDefaultModal, setShowSaveAsDefaultModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setPrompt(data.summary_prompt);
      setSavedPrompt(data.summary_prompt);
      setDefaultPrompt(data.default_prompt || DEFAULT_SUMMARY_PROMPT);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setPrompt(DEFAULT_SUMMARY_PROMPT);
      setSavedPrompt(DEFAULT_SUMMARY_PROMPT);
      setDefaultPrompt(DEFAULT_SUMMARY_PROMPT);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_prompt: prompt }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      setSavedPrompt(prompt);
      setMessage({ type: 'success', text: 'Saved' });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_to_default' }),
      });

      if (!res.ok) throw new Error('Failed to reset settings');

      const data = await res.json();
      setPrompt(data.summary_prompt);
      setSavedPrompt(data.summary_prompt);
      setMessage({ type: 'success', text: 'Reset to default' });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsDefault = async () => {
    setIsSaving(true);
    setMessage(null);
    setShowSaveAsDefaultModal(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_prompt: prompt, action: 'save_as_default' }),
      });

      if (!res.ok) throw new Error('Failed to save as default');

      const data = await res.json();
      setSavedPrompt(data.summary_prompt);
      setDefaultPrompt(data.default_prompt);
      setMessage({ type: 'success', text: 'Saved as new default' });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save as default' });
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = prompt !== savedPrompt;
  const differsFromDefault = prompt !== defaultPrompt;

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        ← Back to articles
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure how articles are summarized.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
              Summary Prompt
            </label>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3">
            This prompt is sent to the AI when generating article summaries. Customize it to control
            the style, length, and format of your summaries.
          </p>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleResetToDefault}
            disabled={isSaving || !differsFromDefault}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset to Default
          </button>
          <button
            onClick={() => setShowSaveAsDefaultModal(true)}
            disabled={isSaving || !differsFromDefault}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Default
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showSaveAsDefaultModal}
        title="Save as Default"
        message="This will save your current changes AND replace the saved default for this prompt. Future resets will restore to this new default."
        confirmText="Save as Default"
        onConfirm={handleSaveAsDefault}
        onCancel={() => setShowSaveAsDefaultModal(false)}
        isLoading={isSaving}
      />
    </div>
  );
}
