'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { BackendStatus } from './BackendStatus'

interface AuthClientWrapperProps {
  children: React.ReactNode
  showStatus?: boolean
}

export default function AuthClientWrapper({
  children,
  showStatus = process.env.NODE_ENV === 'development'
}: AuthClientWrapperProps) {
  return (
    <AuthProvider>
      {showStatus && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <BackendStatus />
        </div>
      )}
      {children}
    </AuthProvider>
  )
}