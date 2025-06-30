import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { is_favorite, tags } = await request.json();
    const promptId = params.id;

    if (!promptId) {
      throw new AppError('Prompt ID is required', 400);
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
      logError(authError, 'User authentication failed in prompts PUT');
      throw new AppError('Invalid authentication token', 401);
    }

    // Build update data
    const updateData: any = {};
    if (typeof is_favorite === 'boolean') {
      updateData.is_favorite = is_favorite;
    }
    if (Array.isArray(tags)) {
      updateData.tags = tags;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    // Update prompt
    const { data: updatedPrompt, error } = await supabase
      .from('saved_prompts')
      .update(updateData)
      .eq('id', promptId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logError(error, 'Failed to update prompt');
      throw new AppError('Failed to update prompt', 500);
    }

    if (!updatedPrompt) {
      throw new AppError('Prompt not found or access denied', 404);
    }

    return NextResponse.json({ prompt: updatedPrompt });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const promptId = params.id;

    if (!promptId) {
      throw new AppError('Prompt ID is required', 400);
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
      logError(authError, 'User authentication failed in prompts DELETE');
      throw new AppError('Invalid authentication token', 401);
    }

    // Delete prompt (only if user owns it)
    const { error } = await supabase
      .from('saved_prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id);

    if (error) {
      logError(error, 'Failed to delete prompt');
      throw new AppError('Failed to delete prompt', 500);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}