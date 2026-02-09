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
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
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
      setTimeout(() => setMessage(null), 3000);
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
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save as default' });
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = prompt !== savedPrompt;
  const differsFromDefault = prompt !== defaultPrompt;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-200 rounded" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="h-48 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to articles
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500">Configure how articles are summarized.</p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Export Data</h3>
            <p className="text-sm text-slate-500 mt-0.5">Download all your articles as a JSON file.</p>
          </div>
          <button
            onClick={() => window.location.href = '/api/export'}
            className="h-10 px-4 text-sm font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-150 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="prompt" className="block text-sm font-semibold text-slate-900">
              Summary Prompt
            </label>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-4">
            This prompt is sent to the AI when generating article summaries. Customize it to control
            the style, length, and format of your summaries.
          </p>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="w-full p-4 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono text-sm transition-colors duration-150"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="h-11 px-5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            onClick={handleResetToDefault}
            disabled={isSaving || !differsFromDefault}
            className="h-11 px-5 bg-white text-slate-700 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            Reset to Default
          </button>
          <button
            onClick={() => setShowSaveAsDefaultModal(true)}
            disabled={isSaving || !differsFromDefault}
            className="h-11 px-5 bg-white text-slate-700 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
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
