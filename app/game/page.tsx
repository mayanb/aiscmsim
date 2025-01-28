'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, type Player } from '../../lib/supabase'

export default function GamePage() {
  const searchParams = useSearchParams()
  const playerId = searchParams.get('playerId')
  const [player, setPlayer] = useState<Player | null>(null)

  useEffect(() => {
    const loadPlayer = async () => {
      if (!playerId) return
      
      const { data } = await supabase
        .from('players')
        .select('*, sessions(*)')
        .eq('id', playerId)
        .single()
      
      setPlayer(data)
    }

    loadPlayer()
  }, [playerId])

  if (!player) return <div>Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        Welcome, {player.name}!
      </h1>
      <p>Game will start soon...</p>
    </div>
  )
}