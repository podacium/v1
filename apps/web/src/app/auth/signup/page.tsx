/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from "next-auth/react";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface BenefitCard {
  id: string
  title: string
  description: string
  icon: string
  color: string
  features: string[]
}

// =============================================================================
// MOCK DATA
// =============================================================================


const BENEFITS: BenefitCard[] = [
  {
    id: '1',
    title: 'Learning & Certification',
    description: 'Personalized learning with AI and industry-recognized certifications to validate your skills and boost your career.',
    icon: '🎯',
    color: 'blue',
    features: [
      'Smart course recommendations',
      'Adaptive difficulty',
      'Personalized feedback',
      'Progress tracking',
      'Industry recognition',
      'Digital badges'
    ]
  },
  {
    id: '2',
    title: 'Data & Infrastructure',
    description: 'Powerful analytics tools and scalable infrastructure to handle complex data workloads effortlessly.',
    icon: '📊',
    color: 'green',
    features: [
      'Interactive dashboards',
      'Real-time data',
      'Predictive analytics',
      'Custom reporting',
      'Auto-scaling',
      '99.9% uptime'
    ]
  },
  {
    id: '3',
    title: 'Talent & Community',
    description: 'Connect with top talent and a thriving expert community to share knowledge and grow together.',
    icon: '🤝',
    color: 'purple',
    features: [
      'AI-powered matching',
      'Skill verification',
      'Community forums',
      'Expert Q&A',
      'Networking events'
    ]
  },
  {
    id: '4',
    title: 'Collaboration & Integration',
    description: 'Work seamlessly with your team and integrate with your existing tools and workflows.',
    icon: '👥',
    color: 'orange',
    features: [
      'Real-time collaboration',
      'Version control',
      'Team permissions',
      'Commenting system',
      '100+ integrations',
      'REST API'
    ]
  },
  {
    id: '5',
    title: 'Enterprise Security',
    description: 'Bank-level security with full compliance and robust data protection measures.',
    icon: '🔒',
    color: 'red',
    features: [
      'SOC 2 compliant',
      'End-to-end encryption',
      'Access controls',
      'Audit logs'
    ]
  },
  {
    id: '6',
    title: 'Continuous Updates',
    description: 'Monthly updates with new features, courses, and community-driven improvements.',
    icon: '🔄',
    color: 'indigo',
    features: [
      'Monthly feature releases',
      'Platform enhancements',
      'New course content',
      'Community feedback'
    ]
  },
  {
    id: '7',
    title: 'Dedicated Support',
    description: 'Reliable support and comprehensive resources to help you every step of the way.',
    icon: '💬',
    color: 'amber',
    features: [
      '24/7 support',
      'Dedicated managers',
      'Comprehensive docs',
      'Video tutorials'
    ]
  },
  {
    id: '8',
    title: 'Customizable Platform',
    description: 'Tailor the platform to your needs with flexible APIs, webhooks, and custom connectors.',
    icon: '🔌',
    color: 'yellow',
    features: [
      'Custom connectors',
      'Webhooks',
      'Extensive API access',
      'Flexible workflows'
    ]
  }
]


// =============================================================================
// CUSTOM HOOKS
// =============================================================================

const useNewsletter = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const subscribe = async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess(true)
      setEmail('')
    } catch (err) {
      setError('Subscription failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return {
    email,
    setEmail,
    loading,
    success,
    error,
    subscribe
  }
}

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  href,
  type
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-4'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-300',
    ghost: 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:ring-blue-300'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`
  
  if (href) {
    return (
      <Link href={href} className={classes}>
        {loading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </Link>
    )
  }
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      type={type || 'button'}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const baseClasses = 'bg-white rounded-xl shadow-lg border border-gray-100'
  const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer' : ''
  
  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface InputProps {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  tooltip?: string
  autoComplete?: string
}

const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  tooltip,
  autoComplete
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
            {showTooltip && (
              <div className="absolute z-10 w-64 p-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg shadow-lg -top-2 left-6">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
          error 
            ? 'border-red-300 focus:ring-red-200' 
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

interface CheckboxProps {
  label: React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  required?: boolean
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  error,
  required = false
}) => {
  return (
    <div className="space-y-2">
      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">{label} {required && <span className="text-red-500">*</span>}</span>
      </label>
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'

const SignupHero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden pt-40">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-50 blur-xl"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full opacity-30 blur-2xl"></div>
      <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-indigo-200 rounded-full opacity-40 blur-xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          <motion.h1 
            className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Start Your <span className="text-blue-600 mt-2">Data Journey</span>
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Join professionals, teams, and organizations using Podacium to master data skills.
            Build intelligent solutions, and accelerate careers.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                14-day free trial
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authService, type SignupData } from '@/services/auth'

const useSignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    newsletter: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // Check email availability when user stops typing
  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
        setCheckingEmail(true)
        try {
          const result = await authService.checkEmailAvailability(formData.email)
          if (!result.available) {
            setErrors(prev => ({ ...prev, email: 'This email is already registered' }))
          }
        } catch (error) {
          // Silently fail; server-side will catch it again
        } finally {
          setCheckingEmail(false)
        }
      }
    }

    const timeoutId = setTimeout(checkEmailAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.email])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateForm()) {
    return
  }

  setLoading(true)

  try {
    console.log('Starting signup process...', {
      email: formData.email,
      backendUrl: process.env.NEXT_PUBLIC_API_URL, // Add this line
      fullUrl: `${process.env.NEXT_PUBLIC_API_URL}/auth/register` // And this line
    })

    const signupData: SignupData = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      provider: 'EMAIL',
      acceptedTerms: formData.acceptTerms,
      subscribeNewsletter: formData.newsletter
    }

    console.log('Sending signup data:', signupData)

    const result = await authService.signup(signupData)

    console.log('Signup successful:', result)

    setSuccess(true)
    setVerificationSent(result.verification_sent)

  } catch (error) {
    console.error('Registration error:', error)
    // ... rest of error handling
  } finally {
    setLoading(false)
  }
}

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }))
    }
  }

  return {
    formData,
    errors,
    loading,
    success,
    verificationSent,
    checkingEmail,
    handleChange,
    handleSubmit
  }
}

const useSocialAuth = () => {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSocialSignup = async (provider: 'google' | 'github' | 'linkedin') => {
    setLoading(provider)
    setError(null)

    try {
      // For OAuth, you'll typically redirect to the provider
      // or use a popup window. This is a simplified version.
      
      // If using redirect:
      window.location.href = `/api/auth/${provider}`
      
      // If using popup or direct API call:
      // const response = await fetch(`/api/auth/${provider}`, {
      //   method: 'POST',
      //   credentials: 'include'
      // })
      
    } catch (err) {
      setError(`Failed to sign in with ${provider}`)
    } finally {
      setLoading(null)
    }
  }

  return {
    loading,
    error,
    handleSocialSignup
  }
}


interface SuccessMessageProps {
  email: string
  verificationSent: boolean
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ email, verificationSent }) => {
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResendVerification = async () => {
    setResending(true)
    setResendError(null)
    try {
      await authService.resendVerification(email)
      setResendSuccess(true)
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Failed to resend verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <Card className="p-8">
          <div className="text-green-500 text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Created Successfully!</h2>

          {verificationSent ? (
            <>
              <p className="text-gray-600 mb-4">
                We've sent a verification email to <strong>{email}</strong>.
              </p>
              <p className="text-gray-600 mb-6">
                Please check your inbox and click the verification link to activate your account.
              </p>

              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800 font-medium">Verification email sent successfully!</p>
                </div>
              )}

              {resendError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800 font-medium">{resendError}</p>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <p className="text-blue-700 text-sm mb-2">
                  <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
                  <button
                    onClick={handleResendVerification}
                    disabled={resending || resendSuccess}
                    className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Sending...' : resendSuccess ? 'Email sent!' : 'resend verification email'}
                  </button>
                  .
                </p>
              </div>

              <Button
                onClick={() => (window.location.href = '/auth/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Your account has been created successfully! You can now sign in and start using Podacium.
              </p>
              <Button
                onClick={() => (window.location.href = '/auth/login')}
                className="w-full"
              >
                Continue to Login
              </Button>
            </>
          )}
        </Card>
      </div>
    </section>
  )
}

interface SignupFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  newsletter: boolean
}

interface SignupErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  acceptTerms?: string
  submit?: string
}

export const SignupFormSection: React.FC = () => {
  const { loading: socialLoading, error: socialError, handleSocialSignup } = useSocialAuth()
  const [activeTab, setActiveTab] = useState<'email' | 'social'>('email')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    newsletter: false
  })
  const [errors, setErrors] = useState<SignupErrors>({})

  const handleChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors[field as keyof SignupErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: SignupErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await authService.signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        acceptedTerms: formData.acceptTerms,
        subscribeNewsletter: formData.newsletter,
        role: 'STUDENT'
      })

      setVerificationSent(result.verification_sent)
      setSuccess(true)
    } catch (error: any) {
      console.error('Signup error:', error)
      
      // Handle specific error cases
      if (error.message?.includes('already exists') || error.message?.includes('registered')) {
        setErrors({ submit: 'An account with this email already exists.' })
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        setErrors({ submit: 'Network error. Please check your connection.' })
      } else {
        setErrors({ submit: error.message || 'Registration failed. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <SuccessMessage email={formData.email} verificationSent={verificationSent} />
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Account</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join Podacium today and unlock your learning potential in Data Science, AI, and Business Intelligence.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto p-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'email'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Email Signup
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'social'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Social Signup
            </button>
          </div>

          {/* Social Auth Error */}
          {socialError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{socialError}</p>
            </div>
          )}

          {activeTab === 'email' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={(value) => handleChange('fullName', value)}
                  error={errors.fullName}
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleChange('email', value)}
                  error={errors.email}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password and Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(value) => handleChange('password', value)}
                  error={errors.password}
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
                  tooltip="Must be at least 6 characters"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(value) => handleChange('confirmPassword', value)}
                  error={errors.confirmPassword}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <Checkbox
                  label={
                    <span>
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:underline" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                    </span>
                  }
                  checked={formData.acceptTerms}
                  onChange={(value) => handleChange('acceptTerms', value)}
                  error={errors.acceptTerms}
                  required
                />

                <Checkbox
                  label="Subscribe to our newsletter for product updates, tips, and special offers"
                  checked={formData.newsletter}
                  onChange={(value) => handleChange('newsletter', value)}
                />
              </div>

              {/* Submission error */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                className="w-full py-3"
              >
                Create Account
              </Button>

              {/* Redirect line */}
              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Social Buttons */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleSocialSignup('google')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm text-gray-800 font-medium">
                    {socialLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignup('linkedin')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span className="text-sm text-gray-800 font-medium">
                    {socialLoading === 'linkedin' ? 'Connecting...' : 'Continue with LinkedIn'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignup('github')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm text-gray-800 font-medium">
                    {socialLoading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Or sign up with email</span>
                </div>
              </div>

              {/* Fallback Email Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setActiveTab('email')}
              >
                Use Email Instead
              </Button>

              {/* Sign Up Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}

const BenefitsSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Why Choose Podacium?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover the powerful features and benefits that make Podacium the preferred choice for data professionals worldwide.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card hover className="h-full p-6 flex flex-col justify-between">
                <div className="text-center">
                  
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-${benefit.color}-100 text-${benefit.color}-600 text-2xl flex items-center justify-center mx-auto mb-4`}
                  >
                    {benefit.icon}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{benefit.description}</p>

                  {/* Feature List */}
                  <ul className="space-y-2 text-left">
                    {benefit.features.slice(0, 3).map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm text-gray-700"
                      >
                        <svg
                          className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FinalCTASection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Transform Your Data Journey?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of data professionals who have already discovered the power of Podacium. 
          Start your 14-day free trial today and experience the difference.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button href="../demo" size="xl" className="bg-transparent border border-white text-white hover:bg-white hover:text-blue-600 transition-colors duration-200">
              Schedule a Demo
          </Button>
        </div>
        
        <div className="mt-8 text-blue-200 text-sm">
          No credit card required • Free for 14 days • Cancel anytime
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function SignupPage() {
  return (
    <>
      <Head>
        <title>Sign Up | Podacium - Data Learning Platform</title>
        <meta name="description" content="Join Podacium to master data skills, build intelligent solutions, and accelerate your career. Start your 14-day free trial today." />
      </Head>

      <div className="min-h-screen bg-white">
        <Navbar />
        
        <main>
          <SignupHero />
          <SignupFormSection />
          <BenefitsSection />
          <FinalCTASection />
        </main>
        
        <Footer />
      </div>
    </>
  )
}