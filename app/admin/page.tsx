'use client'

import { useState, useEffect } from 'react'
import { supabase, type Session } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'
import { generateSessionItems } from '../../lib/generateItems'

export default function AdminPage() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // This would be an environment variable in a real app
  const ADMIN_PHRASE = "letmein"


  // Load existing sessions
  useEffect(() => {
    // Check if already authenticated
    const storedAuth = localStorage.getItem('adminAuth')
    if (storedAuth === 'true') {
      setIsAuthenticated(true)
      loadSessions()
    }
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

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PHRASE) {
      setIsAuthenticated(true)
      localStorage.setItem('adminAuth', 'true')
      loadSessions()
    } else {
      alert('Incorrect phrase')
    }
  }

  const generateSimulatedData = () => {
    const items = generateSessionItems(42, false, [200, 0, 0, 0]) // Get all items
      .filter(item => item.phase === 1) // Filter for phase 1 only
      .map(item => ({
        last_year_sales: item.last_year_sales,
        month: new Date(0, item.month - 1).toLocaleString('default', { month: 'long' }), // Convert month number to name
        temperature: item.temperature,
        actual_demand: item.actual_demand
      }));
  
    // Create Excel file
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pre-Simulation Training Data');
    
    // Save the file
    XLSX.writeFile(wb, 'simulation_historical_data.xlsx');
  };
  
  const handleSessionClick = (sessionId: number) => {
    router.push(`/admin/session/${sessionId.toString()}`);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-4 text-center">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter the secret phrase"
            className="w-full border p-2 mb-4 rounded"
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
          <button
            onClick={handlePasswordSubmit}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">Create Game Session</h1>
        <button 
          onClick={generateSimulatedData}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Generate Phase 1 Data
        </button>
      </div>
      
      {/* Create session form */}
      <div className="mb-8">
        <input 
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Session name (e.g., MBA 505 Spring 2025)"
          className="border p-2 mr-2 rounded"
        />
        <button 
          onClick={createSession}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Session
        </button>
      </div>

      {/* List of sessions */}
      <div>
        <h2 className="font-bold mb-2">Existing Sessions:</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">Status</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">{session.name}</td>
                <td className="p-2 border">{session.is_active ? 'Active' : 'Inactive'}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleSessionClick(session.id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

