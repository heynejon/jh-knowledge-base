import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEV_USER_ID } from '@/lib/constants';

// GET all articles
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', DEV_USER_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

// POST new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, publication_name, source_url, full_text, summary } = body;

    if (!title || !source_url || !full_text || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({
        user_id: DEV_USER_ID,
        title,
        publication_name,
        source_url,
        full_text,
        summary,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
  }
}
