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

export function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  fallback,
  requiredRole
}: ProtectedRouteProps): JSX.Element | null {
  const { isAuthenticated, loading, verifying, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  const hasRequiredRole = useCallback(() => {
    if (!requiredRole || !user) return true
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(user.role)
  }, [requiredRole, user])

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      if (!requireAuth && isAuthenticated) {
        router.push('/')
        return
      }

      if (requireAuth && isAuthenticated && !hasRequiredRole()) {
        router.push('/unauthorized')
        return
      }

      setIsAuthorized(true)
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, pathname, hasRequiredRole])

  if (loading) return null

  if (verifying) {
    return (
      (fallback as JSX.Element) || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Verifying authentication...</p>
          </div>
        </div>
      )
    )
  }

  if (!isAuthorized) return (fallback as JSX.Element) || null

  if (requireAuth && isAuthenticated && !hasRequiredRole()) {
    return (
      (fallback as JSX.Element) || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⛔</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}

// Convenience wrappers
export const AuthRequired = ({
  children,
  role
}: {
  children: React.ReactNode
  role?: string | string[]
}): JSX.Element => (
  <ProtectedRoute requireAuth={true} requiredRole={role}>
    {children}
  </ProtectedRoute>
)

export const GuestOnly = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => (
  <ProtectedRoute requireAuth={false}>{children}</ProtectedRoute>
)

export default ProtectedRoute
