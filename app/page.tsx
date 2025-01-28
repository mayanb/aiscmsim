'use client'

import { useState, useEffect } from 'react'
import { supabase, type Session } from '../lib/supabase'

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState('')
  const [playerName, setPlayerName] = useState('')

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
      setSessions(data || [])
    }
    loadSessions()
  }, [])

  const joinGame = async () => {
    if (!playerName.trim() || !selectedSession) return
    
    // Create player record
    const { data: player } = await supabase
      .from('players')
      .insert([
        { name: playerName, session_id: selectedSession }
      ])
      .select()
      .single()

    if (player) {
      // Redirect to game page
      window.location.href = `/game?playerId=${player.id}`
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-96 p-4">
        <h1 className="text-xl font-bold mb-4">Join Game Session</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Select Session:</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full border p-2"
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
            <label className="block mb-1">Your Name:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full border p-2"
            />
          </div>

          <button
            onClick={joinGame}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  )
}