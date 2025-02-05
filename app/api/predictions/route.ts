// app/api/predictions/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface PredictionRequest {
  playerId: string;
  itemId: string;
  prediction: number;
}

interface Decision {
  player_prediction: number;
}

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { playerId, itemId, prediction }: PredictionRequest = await request.json();

    // Validate input
    if (!playerId || !itemId || prediction === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the item to calculate error
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Store the prediction
    const { error: insertError } = await supabase
      .from('decisions')
      .insert({
        player_id: playerId,
        item_id: itemId,
        player_prediction: prediction
      });

    if (insertError) {
      throw insertError;
    }

    // Get class average error for this item
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('player_prediction')
      .eq('item_id', itemId);

    if (decisionsError) {
      throw decisionsError;
    }

    let classAverageError = 0;
    if (decisions && decisions.length > 0) {
      const errors = (decisions as Decision[]).map(d => 
        Math.abs(d.player_prediction - item.actual_demand) / item.actual_demand * 100
      );
      classAverageError = errors.reduce((a, b) => a + b, 0) / errors.length;
    }

    return NextResponse.json({
      success: true,
      classAverageError
    });

  } catch (error) {
    console.error('Error submitting prediction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}