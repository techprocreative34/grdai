import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

export async function GET(request: Request) {
  try {
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
      logError(authError, 'User authentication failed in analytics GET');
      throw new AppError('Invalid authentication token', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logError(profileError, 'Failed to fetch user profile for analytics');
      throw new AppError('Failed to fetch user profile', 500);
    }

    // Get prompts data for analytics
    const { data: prompts, error: promptsError } = await supabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (promptsError) {
      logError(promptsError, 'Failed to fetch prompts for analytics');
      throw new AppError('Failed to fetch prompts data', 500);
    }

    // Calculate analytics
    const totalPrompts = prompts.length;
    const imagePrompts = prompts.filter(p => p.type === 'image').length;
    const textPrompts = prompts.filter(p => p.type === 'text').length;
    const favoritePrompts = prompts.filter(p => p.is_favorite).length;
    const imageAnalysisUsed = Math.max(0, 10 - (profile.image_analysis_credits || 0));
    const imageAnalysisRemaining = profile.image_analysis_credits || 0;

    // Calculate weekly activity (last 7 days)
    const weeklyActivity = Array(7).fill(0);
    const now = new Date();
    prompts.forEach(prompt => {
      const promptDate = new Date(prompt.created_at);
      const daysDiff = Math.floor((now.getTime() - promptDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        weeklyActivity[6 - daysDiff]++;
      }
    });

    // Calculate popular tags
    const tagCounts: { [key: string]: number } = {};
    prompts.forEach(prompt => {
      if (prompt.tags && Array.isArray(prompt.tags)) {
        prompt.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const lastActivity = prompts.length > 0 
      ? new Date(prompts[0].created_at).toISOString()
      : null;

    const analytics = {
      totalPrompts,
      imagePrompts,
      textPrompts,
      favoritePrompts,
      imageAnalysisUsed,
      imageAnalysisRemaining,
      joinDate: profile.created_at,
      lastActivity,
      weeklyActivity,
      popularTags
    };

    return NextResponse.json({ analytics });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}