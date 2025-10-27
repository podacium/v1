'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { authService, User, AuthError, NetworkError, TokenExpiredError } from '@/services/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  verifying: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Constants for localStorage keys
const STORAGE_KEYS = {
  USER: 'user',
  AUTH_INITIALIZED: 'auth_initialized'
} as const

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ Instant session restoration — hydrate state from localStorage on load
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.USER)
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token')
    }
    return false
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // === Utility: Clear errors ===
  const clearError = useCallback(() => setError(null), [])

  // === Utility: Store user safely ===
  const storeUser = useCallback((userData: User | null) => {
    if (typeof window === 'undefined') return
    try {
      if (userData) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER)
      }
    } catch (error) {
      console.warn('Failed to store user data:', error)
    }
  }, [])

  // === Handle authentication failure ===
  const handleAuthFailure = useCallback(async () => {
    try {
      await authService.logout()
    } catch (logoutError) {
      console.warn('Logout during auth failure:', logoutError)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      storeUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem(STORAGE_KEYS.AUTH_INITIALIZED)
    }
  }, [storeUser])

  const [verifying, setVerifying] = useState(false)

  const initializeAuth = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')
    
    if (!accessToken) {
      setLoading(false)
      return
    }
    
    // Start background verification
    setVerifying(true)
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      console.log('Background verification failed')
      await handleAuthFailure()
    } finally {
      setVerifying(false)
      setLoading(false)
    }
  }, [handleAuthFailure])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // === Login ===
  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const authData = await authService.login({ email, password })
      
      // Store tokens immediately
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('refresh_token', authData.refresh_token)
      
      // Get user data
      const userData = await authService.getCurrentUser()
      
      // Store user data in localStorage for instant access
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Update state
      setUser(userData)
      setIsAuthenticated(true)
      
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // === Logout ===
  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🚪 Logging out...')
      await authService.logout()
    } catch (error) {
      console.warn('Logout error:', error)
    } finally {
      // Clear all tokens and user data
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem(STORAGE_KEYS.USER)
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
      console.log('✅ Logout successful')
    }
  }

  // === Refresh user data ===
  const refreshUser = useCallback(async () => {
    setError(null)
    try {
      console.log('🔄 Refreshing user data...')
      const userData = await authService.getCurrentUser()
      setUser(userData)
      storeUser(userData)
      console.log('✅ User data refreshed')
    } catch (error) {
      console.error('Refresh user error:', error)
      if (error instanceof AuthError && error.status === 401) {
        await handleAuthFailure()
        setError('Session expired. Please log in again.')
      } else {
        setError('Failed to refresh user data')
      }
      throw error
    }
  }, [handleAuthFailure, storeUser])

  // === Auto-refresh token ===
  useEffect(() => {
    if (!isAuthenticated) return
    const refreshBeforeExpiry = async () => {
      try {
        console.log('🔄 Auto-refreshing access token...')
        await authService.refreshToken()
        await refreshUser()
        console.log('✅ Token refreshed automatically')
      } catch (error) {
        console.error('Auto-refresh failed:', error)
        logout()
      }
    }
    // Refresh every 25 minutes (adjust if needed)
    const interval = setInterval(refreshBeforeExpiry, 25 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, refreshUser, logout])

  // === Context value ===
  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    verifying,
    login,
    logout,
    refreshUser,
    error,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for components that need auth but don't want to handle the undefined case
export const useOptionalAuth = (): AuthContextType | undefined => {
  return useContext(AuthContext)
}