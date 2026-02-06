'use client';

import { createBrowserClient } from '@supabase/ssr';

const getSchema = () => {
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA;
  if (!schema) {
    throw new Error('NEXT_PUBLIC_SUPABASE_SCHEMA must be set');
  }
  return schema;
};

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: getSchema(),
      },
    }
  );
