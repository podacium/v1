'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

interface HealthCheckResponse {
  status: string
  service?: string
  uptime?: number
  timestamp?: string
  version?: string
}

export const BackendStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [message, setMessage] = useState('Checking backend connection...')
  const [details, setDetails] = useState<Partial<HealthCheckResponse>>({})
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkBackend = useCallback(async () => {
    try {
      setStatus('checking')
      setMessage('Checking backend connection...')
      
      const result = await api.get<HealthCheckResponse>('/health', {
        timeout: 5000,
        requireAuth: false
      })
      
      setStatus('online')
      setMessage(result.service ? `${result.service} is running` : 'Backend is running')
      setDetails(result)
      setLastChecked(new Date())
      
    } catch (error: any) {
      setStatus('offline')
      
      if (error?.status === 404) {
        setMessage('Health endpoint not found - backend may be running but misconfigured')
      } else if (error?.message?.includes('timeout')) {
        setMessage('Backend timeout - server may be overloaded or offline')
      } else if (error?.message?.includes('Network error')) {
        setMessage('Network error - check connection and CORS settings')
      } else {
        setMessage(`Connection failed: ${error?.message || 'Unknown error'}`)
      }
      
      setDetails({})
      setLastChecked(new Date())
    }
  }, [])

  useEffect(() => {
    checkBackend()
    
    // Optional: Set up periodic health checks in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(checkBackend, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [checkBackend])

  const getStatusIcon = () => {
    switch (status) {
      case 'online': return '🟢'
      case 'offline': return '🔴'
      case 'checking': return '🟡'
      default: return '⚪'
    }
  }

  const formatUptime = (uptime?: number) => {
    if (!uptime) return null
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className={`
      text-xs p-3 rounded-lg border shadow-sm max-w-xs backdrop-blur-sm
      ${status === 'online' 
        ? 'bg-green-50/80 border-green-200 text-green-800' 
        : status === 'offline' 
        ? 'bg-red-50/80 border-red-200 text-red-800' 
        : 'bg-yellow-50/80 border-yellow-200 text-yellow-800'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <strong className="font-semibold">Backend Status</strong>
        </div>
        <button
          onClick={checkBackend}
          className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/70 transition-colors"
          title="Check again"
        >
          🔄
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="font-medium">{message}</div>
        
        {status === 'online' && details && (
          <div className="text-xs opacity-75 space-y-1">
            {details.service && <div>Service: {details.service}</div>}
            {details.version && <div>Version: {details.version}</div>}
            {details.uptime && <div>Uptime: {formatUptime(details.uptime)}</div>}
          </div>
        )}
        
        {lastChecked && (
          <div className="text-xs opacity-60 mt-2">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}