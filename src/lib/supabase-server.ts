import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const getSchema = () => {
  const schema = process.env.SUPABASE_SCHEMA;
  if (!schema) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_SCHEMA must be set in production');
    }
    throw new Error('SUPABASE_SCHEMA must be set in .env.local');
  }
  return schema;
};

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: getSchema(),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
};
