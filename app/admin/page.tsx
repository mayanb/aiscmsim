'use client'

import { useState, useEffect } from 'react'
import { supabase, type Session } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'
import { generateSessionItems } from '../../lib/generateItems'
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"



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

    // Add the toggle function
    const toggleSessionStatus = async (sessionId: number, newStatus: boolean) => {
      const { error } = await supabase
        .from('sessions')
        .update({ is_active: newStatus })
        .eq('id', sessionId)

      if (error) {
        console.error('Error updating session:', error)
        return
      }

      loadSessions() // Refresh the list
    }

  const generateSimulatedData = () => {
    const items = generateSessionItems(42, false, [200, 0, 0, 0]) // Get all items
      .filter(item => item.phase === 1) // Filter for phase 1 only
      .map(item => ({
        'Last Year Demand': item.last_year_sales,
        'Month': new Date(0, item.month - 1).toLocaleString('default', { month: 'long' }),
        'Temperature': item.temperature,
        'Actual Demand': item.actual_demand
      }));
  
    // Create Excel file
    const ws = XLSX.utils.json_to_sheet(items);
  
    // Optional: Adjust column widths for better readability
    const colWidths = [
      { wch: 15 }, // Last Year Demand
      { wch: 12 }, // Month
      { wch: 12 }, // Temperature
      { wch: 15 }, // Actual Demand
    ];
    ws['!cols'] = colWidths;
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pre-Simulation Training Data');
    
    // Save the file
    XLSX.writeFile(wb, 'simulation_historical_training_data.xlsx');
  };
  
  const handleSessionClick = (sessionId: number) => {
    router.push(`/admin/session/${sessionId.toString()}`);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the secret phrase"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <Button 
                onClick={handlePasswordSubmit}
                className="w-full"
              >
                Enter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Game Session Management</CardTitle>
              <Button 
                onClick={generateSimulatedData}
                className="bg-green-600 hover:bg-green-700"
              >
                Generate Training Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Create session form */}
              <div className="flex gap-4">
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Session name (e.g., MBA 505 Spring 2025)"
                  className="flex-1"
                />
                <Button 
                  onClick={createSession}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Session
                </Button>
              </div>

              {/* Sessions table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(session => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={session.is_active}
                              onCheckedChange={(checked) => toggleSessionStatus(session.id, checked)}
                            />
                            <span className="text-sm text-gray-600">
                              {session.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleSessionClick(session.id)}
                            variant="outline"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
