'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
  requiredRole?: string | string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  fallback,
  requiredRole
}) => {
  const { isAuthenticated, loading, verifying, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Check if user has the required role
  const hasRequiredRole = useCallback(() => {
    if (!requiredRole || !user) return true
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(user.role)
  }, [requiredRole, user])

  useEffect(() => {
    if (!loading) {
      // Redirect if not authenticated but auth required
      if (requireAuth && !isAuthenticated) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      // Redirect if authenticated but should not access guest-only pages
      if (!requireAuth && isAuthenticated) {
        router.push('/')
        return
      }

      // Redirect if authenticated but lacks required role
      if (requireAuth && isAuthenticated && !hasRequiredRole()) {
        router.push('/unauthorized')
        return
      }

      setIsAuthorized(true)
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, pathname, hasRequiredRole])

  // Show nothing while checking initial auth (very brief)
  if (loading) return null

  // During verification (background), allow showing content optimistically
  if (verifying) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Not authorized (redirect will happen)
  if (!isAuthorized) return fallback || null

  // Role restriction UI (extra safeguard)
  if (requireAuth && isAuthenticated && !hasRequiredRole()) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience wrappers

export const AuthRequired: React.FC<{ children: React.ReactNode; role?: string | string[] }> = ({
  children,
  role
}) => (
  <ProtectedRoute requireAuth={true} requiredRole={role}>
    {children}
  </ProtectedRoute>
)

export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
)

export default ProtectedRoute
