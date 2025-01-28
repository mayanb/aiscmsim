'use client'

import { useState, useEffect } from 'react'
import { supabase, type Session } from '../../lib/supabase'

export default function AdminPage() {
  const [sessionName, setSessionName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])  // Add type here


  // Load existing sessions
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
    setSessions(data || [])
  }

  // Create new session
  const createSession = async () => {
    if (!sessionName.trim()) return
    
    await supabase
      .from('sessions')
      .insert([{ name: sessionName }])
    
    setSessionName('')
    loadSessions()
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create Game Session</h1>
      
      {/* Create session form */}
      <div className="mb-8">
        <input 
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Session name (e.g., MBA 505 Spring 2025)"
          className="border p-2 mr-2"
        />
        <button 
          onClick={createSession}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Session
        </button>
      </div>

      {/* List of sessions */}
      <div>
        <h2 className="font-bold mb-2">Existing Sessions:</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td className="py-2">{session.name}</td>
                <td>{session.is_active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}