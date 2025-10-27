'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/services/auth'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link. Please request a new verification email.')
        return
      }

      try {
        console.log('🔐 Verifying email with token:', token)
        await authService.verifyEmail(token)
        
        setStatus('success')
        setMessage('Email verified successfully! You can now log in to your account.')
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
        
      } catch (error: any) {
        console.error('Email verification error:', error)
        setStatus('error')
        setMessage(error.message || 'Failed to verify email. The link may have expired.')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-green-800 mb-2">Success!</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Verification Failed</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="space-y-2">
                <Link
                  href="/auth/resend-verification"
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Resend Verification Email
                </Link>
                <Link
                  href="/auth/login"
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}