// app/api/items/[sessionId]/phase/[phase]/decision/[decision]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  props: { params: Promise<{ sessionId: string; phase: string; decision: string }> }
) {
  const params = await props.params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    console.log('Fetching item with params:', params);
    
    // Fetch the item for this decision
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('session_id', params.sessionId)
      .eq('phase', parseInt(params.phase))
      .eq('decision_number', parseInt(params.decision));

    if (itemError) {
      console.error('Database error:', itemError);
      throw itemError;
    }

    console.log('Found items:', items);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = items[0];

    return NextResponse.json({
      item,
      classAverage: 0 // We'll implement this later
    });

  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}