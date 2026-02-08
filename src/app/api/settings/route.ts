import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { DEFAULT_SUMMARY_PROMPT } from '@/lib/constants';

// GET settings (includes both current and default prompt)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current settings
    const { data: current, error: currentError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (currentError && currentError.code !== 'PGRST116') throw currentError;

    // Get default settings
    const { data: defaults, error: defaultsError } = await supabase
      .from('settings_defaults')
      .select('default_prompt')
      .eq('user_id', user.id)
      .single();

    if (defaultsError && defaultsError.code !== 'PGRST116') throw defaultsError;

    const currentPrompt = current?.summary_prompt || DEFAULT_SUMMARY_PROMPT;
    const defaultPrompt = defaults?.default_prompt || DEFAULT_SUMMARY_PROMPT;

    return NextResponse.json({
      id: current?.id || null,
      user_id: user.id,
      summary_prompt: currentPrompt,
      default_prompt: defaultPrompt,
      updated_at: current?.updated_at || null,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH update settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { summary_prompt, action } = body;

    if (action === 'reset_to_default') {
      // Get default prompt
      const { data: defaults, error: defaultsError } = await supabase
        .from('settings_defaults')
        .select('default_prompt')
        .eq('user_id', user.id)
        .single();

      if (defaultsError && defaultsError.code !== 'PGRST116') throw defaultsError;

      const defaultPrompt = defaults?.default_prompt || DEFAULT_SUMMARY_PROMPT;

      // Update current settings to default
      await upsertSettings(supabase, user.id, defaultPrompt);

      return NextResponse.json({ summary_prompt: defaultPrompt });
    }

    if (action === 'save_as_default') {
      if (!summary_prompt) {
        return NextResponse.json({ error: 'Summary prompt is required' }, { status: 400 });
      }

      // Update both current and default
      await upsertSettings(supabase, user.id, summary_prompt);
      await upsertDefaults(supabase, user.id, summary_prompt);

      return NextResponse.json({ summary_prompt, default_prompt: summary_prompt });
    }

    // Default action: just save current
    if (!summary_prompt) {
      return NextResponse.json({ error: 'Summary prompt is required' }, { status: 400 });
    }

    await upsertSettings(supabase, user.id, summary_prompt);

    return NextResponse.json({ summary_prompt });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSettings(supabase: any, userId: string, summary_prompt: string) {
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('settings')
      .update({ summary_prompt, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('settings')
      .insert({ user_id: userId, summary_prompt });
    if (error) throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertDefaults(supabase: any, userId: string, prompt: string) {
  const { data: existing } = await supabase
    .from('settings_defaults')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('settings_defaults')
      .update({ default_prompt: prompt, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('settings_defaults')
      .insert({ user_id: userId, default_prompt: prompt });
    if (error) throw error;
  }
}
