'use client'

import { useAuth as useAuthContext } from '@/contexts/AuthContext'
import { AuthError, NetworkError } from '@/services/auth'

// Re-export the actual AuthContext hook with proper typing
export const useAuth = useAuthContext

// Optional: Export error handling utilities
export const useAuthErrorHandler = () => {
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof AuthError) {
      return error.message
    }
    if (error instanceof NetworkError) {
      return 'Network error: Please check your connection'
    }
    if (error instanceof Error) {
      return error.message
    }
    return 'An unexpected error occurred'
  }

  return { getErrorMessage }
}