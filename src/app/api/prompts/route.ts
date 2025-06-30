import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new AppError('Database configuration error', 500);
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logError(authError, 'User authentication failed in prompts GET');
      throw new AppError('Invalid authentication token', 401);
    }

    // Build query
    let query = supabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100)); // Cap at 100 for performance

    // Apply filters
    if (type && type !== 'all') {
      if (type === 'favorites') {
        query = query.eq('is_favorite', true);
      } else {
        query = query.eq('type', type);
      }
    }

    if (search) {
      query = query.ilike('prompt_text', `%${search}%`);
    }

    const { data: prompts, error } = await query;

    if (error) {
      logError(error, 'Failed to fetch saved prompts');
      throw new AppError('Failed to fetch prompts', 500);
    }

    return NextResponse.json({ prompts: prompts || [] });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: Request) {
  try {
    const { prompt_text, type, tags = [] } = await request.json();

    if (!prompt_text || !type) {
      throw new AppError('Prompt text and type are required', 400);
    }

    if (!['image', 'text'].includes(type)) {
      throw new AppError('Invalid prompt type', 400);
    }

    if (prompt_text.length > 5000) {
      throw new AppError('Prompt text too long (max 5000 characters)', 400);
    }

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new AppError('Database configuration error', 500);
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logError(authError, 'User authentication failed in prompts POST');
      throw new AppError('Invalid authentication token', 401);
    }

    // Check if user already has too many prompts (limit to prevent abuse)
    const { count, error: countError } = await supabase
      .from('saved_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      logError(countError, 'Failed to count user prompts');
    } else if (count && count >= 1000) { // Reasonable limit
      throw new AppError('Maximum number of saved prompts reached (1000)', 400);
    }

    // Save prompt
    const { data: savedPrompt, error } = await supabase
      .from('saved_prompts')
      .insert({
        user_id: user.id,
        prompt_text: prompt_text.trim(),
        type,
        tags: Array.isArray(tags) ? tags : []
      })
      .select()
      .single();

    if (error) {
      logError(error, 'Failed to save prompt');
      throw new AppError('Failed to save prompt', 500);
    }

    return NextResponse.json({ prompt: savedPrompt });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}