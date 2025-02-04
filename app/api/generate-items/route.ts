// app/api/generate-items/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateSessionItems } from '../../../lib/generateItems';

export async function POST(request: Request) {
  console.log('Starting item generation...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { sessionId } = await request.json();
    console.log('Received sessionId:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Generate items for this session
    const items = generateSessionItems(parseInt(sessionId), true);
    console.log(`Generated ${items.length} items`);

    // Insert items in batches to avoid potential payload size limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE).map(item => ({
        ...item,
        session_id: parseInt(sessionId)
      }));

      const { error: insertError } = await supabase
        .from('items')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        throw insertError;
      }
    }

    console.log('Successfully inserted all items');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in item generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate items', details: error },
      { status: 500 }
    );
  }
}