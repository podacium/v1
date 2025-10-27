// AuthService with enhanced error handling, TypeScript types, and better architecture

export interface SignupData {
  fullName: string
  email: string
  password: string
  provider?: 'EMAIL' | 'GOOGLE' | 'GITHUB' | 'LINKEDIN' | 'PHONE'
  acceptedTerms: boolean
  subscribeNewsletter: boolean
  phoneNumber?: string
  role?: 'STUDENT' | 'BUSINESS' | 'FREELANCER' | 'ADMIN' | 'INSTRUCTOR'
}

export interface LoginData {
  email?: string
  phoneNumber?: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in?: number
}

export interface User {
  id: number
  fullName: string
  email: string | null
  emailVerified: boolean
  phoneNumber: string | null
  phoneVerified: boolean
  role: string
  profilePictureUrl: string | null
  bio: string | null
  country: string | null
  city: string | null
  skills: string[]
  createdAt: string
  updatedAt: string
}

export interface SignupResponse {
  message: string
  user_id: number
  verification_sent: boolean
}

export interface EmailAvailabilityResponse {
  available: boolean
}

// Custom error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string = 'Token has expired') {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

// Constants
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRES_AT: 'access_token_expires_at',
  USER_DATA: 'user'
} as const

const DEFAULT_TIMEOUT = 10000
const REFRESH_TIMEOUT = 15000

class AuthService {
  private baseUrl: string

  constructor() {
    this.baseUrl = this.getBaseUrl()
  }

  // ========== URL Helpers ==========
  private getBaseUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    // Remove trailing slash if present
    return baseUrl.replace(/\/$/, '')
  }

  private getApiUrl(path: string): string {
    // Ensure path starts with /api
    const normalizedPath = path.startsWith('/api') ? path : `/api${path}`
    const fullUrl = `${this.baseUrl}${normalizedPath}`
    
    return fullUrl
  }

  // ========== Enhanced Fetch Wrapper ==========
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}, 
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError(`Request timeout after ${timeout}ms`)
        }
        if (error.message.includes('Failed to fetch')) {
          throw new NetworkError('Cannot connect to server. Please check your network connection.')
        }
      }
      
      throw error
    }
  }

  // ========== Error Handling ==========
  private async handleErrorResponse(response: Response, context: string): Promise<never> {
    // Fix: Initialize errorText with a default value
    let errorText = `HTTP ${response.status}: ${response.statusText}`
    let errorData: any

    try {
      const responseText = await response.text()
      errorText = responseText
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { 
        detail: errorText,
        status: response.status
      }
    }

    // Extract error message
    let errorMessage = `${context} failed`
    if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail
    } else if (Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail
        .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
        .join(', ')
    } else if (errorData.message) {
      errorMessage = errorData.message
    } else if (errorData.error) {
      errorMessage = errorData.error
    }

    // Add status context
    if (response.status >= 500) {
      errorMessage = `Server error (${response.status}): ${errorMessage}`
    } else if (response.status >= 400) {
      errorMessage = `Client error (${response.status}): ${errorMessage}`
    }

    throw new AuthError(errorMessage, errorData.code, response.status, errorData)
  }

  private handleNetworkError(error: unknown, context: string): never {
    if (error instanceof AuthError || error instanceof NetworkError) {
      throw error
    }

    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        throw new NetworkError(`Network error: Cannot connect to server. Please check:\n• Backend server is running\n• CORS is configured\n• Network connectivity`)
      }
      if (error.message.includes('aborted')) {
        throw new NetworkError('Request timeout: Server took too long to respond. Please try again.')
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        throw new NetworkError('CORS error: Backend is not configured to accept requests from this origin.')
      }
      throw new AuthError(`${context}: ${error.message}`)
    }

    throw new AuthError(`An unexpected error occurred during ${context.toLowerCase()}`)
  }

  // ========== Token & Storage Utilities ==========
  private setTokens(authData: AuthResponse): void {
    if (!this.isBrowser()) return
    
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.access_token)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refresh_token)
      
      if (authData.expires_in) {
        const expiresAt = Date.now() + (authData.expires_in * 1000)
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString())
      }
    } catch (error) {
      console.warn('Failed to persist tokens to localStorage:', error)
    }
  }
  
  private clearTokens(): void {
    if (!this.isBrowser()) return
    
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.USER_DATA) {
        localStorage.removeItem(key)
      }
    })
  }

  private setUserData(user: User): void {
    if (!this.isBrowser()) return
    
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
    } catch (error) {
      console.warn('Failed to persist user data to localStorage:', error)
    }
  }

  private clearUserData(): void {
    if (!this.isBrowser()) return
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  }

  public getAccessToken(): string | null {
    if (!this.isBrowser()) return null
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }

  public getRefreshToken(): string | null {
    if (!this.isBrowser()) return null
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  public isTokenExpired(): boolean {
    if (!this.isBrowser()) return true
    
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT)
    if (!expiresAt) return true
    
    return Date.now() > (parseInt(expiresAt, 10) - 5 * 60 * 1000)
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage
  }

  // ========== Public API ==========
  public getStoredUser(): User | null {
    if (!this.isBrowser()) return null
    
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired()
  }

  public async refreshToken(): Promise<AuthResponse> {
    return this.refreshTokenInternal()
  }

  // ========== Signup ==========
  async signup(data: SignupData): Promise<SignupResponse> {
    const url = this.getApiUrl('/auth/register')
    const payload = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      provider: data.provider || 'EMAIL',
      acceptedTerms: data.acceptedTerms,
      subscribeNewsletter: data.subscribeNewsletter,
      phoneNumber: data.phoneNumber,
      role: data.role || 'STUDENT',
    }

    console.log('🚀 Signup request:', {
      url,
      payload: { ...payload, password: '[REDACTED]' },
      timestamp: new Date().toISOString()
    })

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, 15000)

      console.log('📡 Signup response:', {
        status: response.status,
        ok: response.ok
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Registration')
      }

      const result: SignupResponse = await response.json()
      console.log('✅ Signup successful:', result)
      return result

    } catch (error) {
      console.error('💥 Signup error:', error)
      this.handleNetworkError(error, 'Registration')
    }
  }

  // ========== Login ==========
  async login(credentials: LoginData): Promise<AuthResponse> {
    const url = this.getApiUrl('/auth/login')
    
    console.log('🔐 Login request:', {
      url,
      credentials: { ...credentials, password: '[REDACTED]' },
      timestamp: new Date().toISOString()
    })

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      console.log('🔐 Login response:', {
        status: response.status,
        ok: response.ok
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Login')
      }

      const authData: AuthResponse = await response.json()
      console.log('🔐 Login successful:', { 
        access_token: authData.access_token ? '***' : 'missing',
        refresh_token: authData.refresh_token ? '***' : 'missing',
        token_type: authData.token_type 
      })
      
      this.setTokens(authData)
      return authData

    } catch (error) {
      console.error('🔐 Login error:', error)
      this.handleNetworkError(error, 'Login')
    }
  }

  // ========== Logout ==========
  async logout(): Promise<void> {
    if (!this.isBrowser()) return
    
    try {
      // Call logout endpoint if available
      const token = this.getAccessToken()
      if (token) {
        try {
          await this.fetchWithTimeout(this.getApiUrl('/auth/logout'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }, 5000)
        } catch (error) {
          console.warn('Logout endpoint call failed, clearing local storage only:', error)
        }
      }
    } catch (error) {
      console.warn('Logout error:', error)
    } finally {
      this.clearTokens()
      this.clearUserData()
    }
  }

  // ========== Current User ==========
  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken()
    const url = this.getApiUrl('/auth/me')

    if (!token) {
      throw new AuthError('No authentication token available')
    }

    try {
      const response = await this.fetchWithTimeout(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Fetch user data')
      }

      const userData: User = await response.json()
      
      // Cache user data
      this.setUserData(userData)
      
      return userData

    } catch (error) {
      console.error('Get current user error:', error)
      
      // If it's an auth error, clear tokens
      if (error instanceof AuthError && error.status === 401) {
        this.clearTokens()
      }
      
      throw error
    }
  }

  // ========== Token Refresh ==========
  private async refreshTokenInternal(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken()
    const url = this.getApiUrl('/auth/refresh-token')

    if (!refreshToken) {
      throw new TokenExpiredError('No refresh token available')
    }

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }, REFRESH_TIMEOUT)

      if (!response.ok) {
        this.clearTokens()
        await this.handleErrorResponse(response, 'Token refresh')
      }

      const authData: AuthResponse = await response.json()
      this.setTokens(authData)
      return authData

    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearTokens()
      throw error
    }
  }

  // ========== Email Availability ==========
  async checkEmailAvailability(email: string): Promise<EmailAvailabilityResponse> {
    const url = this.getApiUrl('/auth/check-email')

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Email availability check')
      }

      return response.json()
    } catch (error) {
      console.error('Check email availability error:', error)
      this.handleNetworkError(error, 'Email availability check')
    }
  }

  // ========== Password Reset ==========
  async requestPasswordReset(email: string): Promise<void> {
    const url = this.getApiUrl('/auth/forgot-password')

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Password reset request')
      }
    } catch (error) {
      console.error('Password reset request error:', error)
      this.handleNetworkError(error, 'Password reset request')
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const url = this.getApiUrl('/auth/reset-password')

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Password reset')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      this.handleNetworkError(error, 'Password reset')
    }
  }

  // ========== Email Verification ==========
  async verifyEmail(token: string): Promise<void> {
    const url = this.getApiUrl('/auth/verify-email')

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Email verification')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      this.handleNetworkError(error, 'Email verification')
    }
  }

  async resendVerification(email: string): Promise<void> {
    const url = this.getApiUrl('/auth/resend-verification')

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        await this.handleErrorResponse(response, 'Resend verification')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      this.handleNetworkError(error, 'Resend verification')
    }
  }

  // ========== Health Check ==========
  async healthCheck(): Promise<boolean> {
    try {
      const url = this.getApiUrl('/health')
      const response = await this.fetchWithTimeout(url, { method: 'GET' }, 5000)
      return response.ok
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()