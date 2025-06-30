import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  try {
    console.log('=== Image Analysis API Called ===');
    
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

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new AppError('Admin access configuration error', 500);
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new AppError('AI service configuration error', 500);
    }

    // Initialize Supabase clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logError(authError, 'User authentication failed');
      throw new AppError('Invalid authentication token', 401);
    }

    console.log('User authenticated:', user.id);

    // Get or create user profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('image_analysis_credits')
      .eq('id', user.id)
      .single();

    // Create profile if it doesn't exist
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          image_analysis_credits: 10
        })
        .select('image_analysis_credits')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          // Profile already exists, fetch it
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('image_analysis_credits')
            .eq('id', user.id)
            .single();

          if (fetchError) {
            logError(fetchError, 'Failed to fetch existing profile');
            throw new AppError('Profile access error', 500);
          }
          profile = existingProfile;
        } else {
          logError(insertError, 'Failed to create user profile');
          throw new AppError('Profile creation error', 500);
        }
      } else {
        profile = newProfile;
      }
    } else if (profileError) {
      logError(profileError, 'Profile fetch error');
      throw new AppError('Profile access error', 500);
    }

    // Check credits
    if (!profile || profile.image_analysis_credits <= 0) {
      throw new AppError('Insufficient credits. Please upgrade to continue.', 402);
    }

    // Process the image
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      throw new AppError('Image file is required', 400);
    }

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new AppError('Invalid file type. Please upload JPEG, PNG, or WebP images.', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('File too large. Maximum size is 10MB.', 400);
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64ImageData = buffer.toString('base64');

    const prompt = "Describe this image in extreme detail for a text-to-image prompt. Focus on subject, setting, composition, lighting, colors, mood, and artistic style. Use descriptive keywords and separate them with commas. Start with the main subject. Be specific about any cultural elements if you recognize them, especially Indonesian culture.";

    const payload = {
      contents: [{ parts: [
        { text: prompt },
        { inline_data: { mime_type: file.type, data: base64ImageData } }
      ]}]
    };

    // Call Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError({ status: response.status, error: errorText }, 'Gemini API error');
      throw new AppError('AI analysis service temporarily unavailable', 503);
    }

    const result = await response.json();
    const generatedPrompt = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!generatedPrompt) {
      logError(result, 'No prompt generated from Gemini');
      throw new AppError('Failed to analyze image. Please try again.', 500);
    }

    // Update credits
    const newCredits = profile.image_analysis_credits - 1;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ image_analysis_credits: newCredits })
      .eq('id', user.id);

    if (updateError) {
      logError(updateError, 'Failed to update credits');
      // Don't fail the request, just log the error
    }

    console.log('=== Image Analysis Completed Successfully ===');
    return NextResponse.json({ 
      generatedPrompt,
      creditsRemaining: newCredits
    });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}