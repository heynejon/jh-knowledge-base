import { NextRequest, NextResponse } from 'next/server';
import { extractArticle } from '@/lib/extractor';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const article = await extractArticle(url);
    return NextResponse.json(article);
  } catch (error) {
    console.error('Extraction error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
