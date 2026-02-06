import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { DEV_USER_ID, DEFAULT_SUMMARY_PROMPT } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Article text is required' }, { status: 400 });
    }

    // Get user's custom prompt or use default
    const { data: settings } = await supabase
      .from('settings')
      .select('summary_prompt')
      .eq('user_id', DEV_USER_ID)
      .single();

    const prompt = settings?.summary_prompt || DEFAULT_SUMMARY_PROMPT;
    const summary = await generateSummary(text, prompt);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
