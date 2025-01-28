// app/test-setup/page.tsx
'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestSetupPage() {
  const router = useRouter();

  useEffect(() => {
    async function setupTest() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        // Create a test session
        const { data: session } = await supabase
          .from('sessions')
          .insert({ name: `Test Session ${new Date().toISOString()}`, is_active: true })
          .select()
          .single();

        if (!session) {
          throw new Error('Failed to create session');
        }

        // Create a test player
        const { data: player } = await supabase
          .from('players')
          .insert({ name: 'Test Player', session_id: session.id })
          .select()
          .single();

        if (!player) {
          throw new Error('Failed to create player');
        }

        // Insert items
        const response = await fetch('/api/generate-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: session.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate items');
        }

        // Set cookies
        document.cookie = `sessionId=${session.id}; path=/`;
        document.cookie = `playerId=${player.id}; path=/`;

        // Redirect to Phase 1
        router.push('/phase1');
      } catch (error) {
        console.error('Setup error:', error);
        alert('Failed to set up test session. Check console for details.');
      }
    }

    setupTest();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Setting up test session...</h1>
        <p>Please wait while we prepare your test environment.</p>
      </div>
    </div>
  );
}