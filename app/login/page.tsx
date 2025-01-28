'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface Session {
  id: string;
  name: string;
  is_active: boolean;
}

export default function StudentLoginPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState('')
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Load active sessions
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error loading sessions:', error)
      setError('Failed to load sessions')
      return
    }

    console.log('Sessions loaded:', data)
    setSessions(data || [])
  }

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => `${prev}\n${info}`)
    console.log(info)
  }

  // Handle join session
  const joinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDebugInfo('')
    
    if (!selectedSession) {
      setError('Please select a session')
      return
    }

    if (!studentName.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)

    try {
      addDebugInfo('Creating player...')
      // First, create the player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert([
          { 
            name: studentName.trim(), 
            session_id: selectedSession 
          }
        ])
        .select()
        .single()

      if (playerError) {
        addDebugInfo('Error creating player: ' + playerError.message)
        throw playerError;
      }
      addDebugInfo('Player created successfully')

      // Check for existing items
      addDebugInfo('Checking for existing items...')
      const { count: itemsCount, error: countError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', selectedSession)

      if (countError) {
        addDebugInfo('Error checking items: ' + countError.message)
        throw countError;
      }

      // If no items exist, generate them through the API
      if (!itemsCount) {
        addDebugInfo('No items found, generating items...')
        const response = await fetch('/api/generate-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: selectedSession })
        });

        if (!response.ok) {
          const errorData = await response.json();
          addDebugInfo('Error generating items: ' + JSON.stringify(errorData))
          throw new Error('Failed to generate items: ' + JSON.stringify(errorData));
        }
        addDebugInfo('Items generated successfully')
      }

      // Create initial progress record
      addDebugInfo('Creating progress record...')
      const { error: progressError } = await supabase
        .from('player_progress')
        .insert([{
          player_id: player.id,
          phase: 1,
          current_decision: 1,
          performance_history: []
        }]);

      if (progressError) {
        addDebugInfo('Error creating progress: ' + progressError.message)
        throw progressError;
      }
      addDebugInfo('Progress record created')

      // Set cookies for the session
      document.cookie = `sessionId=${selectedSession}; path=/`
      document.cookie = `playerId=${player.id}; path=/`
      addDebugInfo('Cookies set, redirecting...')

      // Redirect to Phase 1
      router.push('/phase1')
    } catch (err: any) {
      console.error('Error joining session:', err)
      setError('Failed to join session. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Join Game Session</h1>
      
      <form onSubmit={joinSession} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Session
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Choose a session...</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full border rounded p-2"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        {debugInfo && (
          <div className="text-xs font-mono whitespace-pre-wrap bg-gray-100 p-2 rounded">
            {debugInfo}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white px-4 py-2 rounded
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}
          `}
        >
          {loading ? 'Joining...' : 'Join Session'}
        </button>
      </form>
    </div>
  );
}