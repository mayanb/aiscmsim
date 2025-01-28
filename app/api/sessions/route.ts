// app/api/sessions/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateSessionItems } from '@/lib/generateItems'

export async function POST(request: Request) {
    try {
        const { name } = await request.json()

        // Create session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({ name })
            .select()
            .single()

        if (sessionError) throw sessionError

        // Generate items
        const items = generateSessionItems(session.id)

        // Insert items
        const { error: itemsError } = await supabase
            .from('items')
            .insert(items)

        if (itemsError) throw itemsError

        return NextResponse.json({ success: true, sessionId: session.id })
    } catch (error) {
        console.error('Error creating session:', error)
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        )
    }
}