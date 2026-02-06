import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEV_USER_ID } from '@/lib/constants';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', DEV_USER_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const exportData = {
      exported_at: new Date().toISOString(),
      articles: data,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jh-knowledge-base-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting articles:', error);
    return NextResponse.json({ error: 'Failed to export articles' }, { status: 500 });
  }
}
