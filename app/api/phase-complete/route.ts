// app/api/phase-complete/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define allowed HTTP methods
export const dynamic = 'force-dynamic'; // Prevents static optimization
export const runtime = 'edge'; // Optional: Use Edge runtime

export async function POST(request: Request) {
  // Ensure environment variables are properly typed
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { playerId, phase, performanceHistory } = await request.json();

    if (!playerId || !phase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('player_progress')
      .insert([
        {
          player_id: playerId,
          phase: phase,
          completed_at: new Date().toISOString(),
          performance_data: performanceHistory
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing phase:', error);
    return NextResponse.json(
      { error: 'Failed to complete phase' },
      { status: 500 }
    );
  }
}