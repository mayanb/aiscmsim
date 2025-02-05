'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'


interface Session {
  id: string;
  name: string;
  is_active: boolean;
}

interface ExistingPlayer {
  id: string;
  phase: number;
  current_decision: number;
  created_at: string;
}

export default function StudentLoginPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState('')
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPlayerExists, setShowPlayerExists] = useState(false)
  const [existingPlayers, setExistingPlayers] = useState<ExistingPlayer[]>([])

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

    setSessions(data || [])
  }

  const handleExistingPlayerContinue = async (playerId: string) => {
    setLoading(true)
    try {
      // Set cookies
      document.cookie = `sessionId=${selectedSession}; path=/`
      document.cookie = `playerId=${playerId}; path=/`

      // Get player's latest progress
      const { data: progress } = await supabase
        .from('player_progress')
        .select('phase')
        .eq('player_id', playerId)
        .order('phase', { ascending: false })
        .order('current_decision', { ascending: false })
        .limit(1)
        .single()

      // Close dialog
      setShowPlayerExists(false)

      // Redirect to their current phase
      if (progress) {
        router.push(`/phase${progress.phase}`)
      } else {
        router.push('/phase1')
      }
    } catch (err) {
      console.error('Error continuing session:', err)
      setError('Failed to continue session. Please try again.')
      setLoading(false)
    }
  }

  const createNewPlayer = async () => {
    setLoading(true)
    try {
      // Create new player
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
        throw playerError
      }

      // Check for existing items
      const { count: itemsCount, error: countError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', selectedSession)

      if (countError) {
        throw countError
      }

      // If no items exist, generate them through the API
      if (!itemsCount) {
        const response = await fetch('/api/generate-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: selectedSession })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error('Failed to generate items: ' + JSON.stringify(errorData));
        }
      }

      // Create initial progress record
      const { error: progressError } = await supabase
        .from('player_progress')
        .insert([{
          player_id: player.id,
          phase: 1,
          current_decision: 1,
          performance_history: []
        }]);

      if (progressError) {
        throw progressError;
      }

      // Set cookies for the session
      document.cookie = `sessionId=${selectedSession}; path=/`
      document.cookie = `playerId=${player.id}; path=/`

      // Redirect to Phase 1
      router.push('/phase1')
    } catch (err: unknown) {
      console.error('Error creating new player:', err)
      setError('Failed to create new player. Please try again.')
      setLoading(false)
    }
  }

  // Handle join session
  const joinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
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
      // First get matching players
      const { data: matchingPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, created_at')
        .eq('name', studentName.trim())
        .eq('session_id', selectedSession)

      if (playersError) throw playersError

      if (matchingPlayers && matchingPlayers.length > 0) {
        // Then get the latest progress for each player
        const playersWithProgress = await Promise.all(
          matchingPlayers.map(async (player) => {
            const { data: progress } = await supabase
              .from('player_progress')
              .select('phase, current_decision')
              .eq('player_id', player.id)
              .order('phase', { ascending: false })
              .order('current_decision', { ascending: false })
              .limit(1)
              .single()

            return {
              id: player.id,
              created_at: player.created_at,
              phase: progress?.phase || 1,
              current_decision: progress?.current_decision || 1
            }
          })
        )

        setExistingPlayers(playersWithProgress)

        setExistingPlayers(playersWithProgress)
        setShowPlayerExists(true)
        setLoading(false)
        return
      }

      // No existing player, create new one
      await createNewPlayer()

    } catch (err: unknown) {
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
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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

      <Dialog open={showPlayerExists} onOpenChange={setShowPlayerExists}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Players Found</DialogTitle>
            <DialogDescription>
              We found {existingPlayers.length} player(s) with the name {studentName} in this session. 
              Please select your account or create a new one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {existingPlayers.map((player) => (
              <div key={player.id} className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Created: {format(new Date(player.created_at), 'MMM d, yyyy h:mm a')}</p>
                <p>Currently on: Phase {player.phase}, Decision {player.current_decision}</p>
                <Button 
                  onClick={() => handleExistingPlayerContinue(player.id)}
                  className="mt-2"
                >
                  Continue as this player
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPlayerExists(false)
                setStudentName('')
                setLoading(false)
              }}
            >
              Create New Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}