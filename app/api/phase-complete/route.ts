// app/api/phase-complete/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { playerId, phase, performanceHistory } = await request.json();

    // You might want to store the performance history or mark the phase as complete
    // This is optional and depends on your requirements
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