// src/app/api/enhance-prompt/get-suggestions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '@/utils/errorHandler';
import { handleApiError } from '@/utils/errorHandler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // For server-side API routes, we can access both prefixed and non-prefixed env vars
    // Try both approaches to ensure compatibility
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
      });
      throw new AppError('Supabase environment variables not configured', 500);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('prompts')
      .select('id, prompt_text, type')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Supabase query error:', error);
      throw new AppError('Failed to fetch suggestions from database', 500);
    }

    return NextResponse.json({ suggestions: data || [] });

  } catch (error: any) {
    const { message, status } = handleApiError(error);
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ 
      suggestions: [],
      error: message 
    }, { status });
  }
}