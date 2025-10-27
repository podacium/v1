import { authService } from '@/services/auth'

// Define custom error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  requireAuth?: boolean
}

// Fix: Define proper headers type
interface RequestHeaders {
  [key: string]: string
}

class ApiClient {
  private baseUrl: string
  private defaultTimeout = 10000 // 10 seconds
  private defaultRetries = 2

  constructor() {
    this.baseUrl = this.getBaseUrl()
  }

  private getBaseUrl(): string {
    // Remove trailing slash if present
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return url.replace(/\/$/, '')
  }

  private async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      requireAuth = true,
      ...fetchOptions
    } = options

    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${normalizedEndpoint}`
    
    console.log('🔧 API Request:', {
      url,
      method: fetchOptions.method || 'GET',
      requireAuth,
      timestamp: new Date().toISOString()
    })

    // Fix: Create headers with proper typing
    const headers: RequestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(fetchOptions.headers as RequestHeaders),
    }

    const config: RequestInit = {
      headers,
      ...fetchOptions,
    }

    // Add auth token if available and required
    if (requireAuth) {
      // Fix: Use the public method to get access token
      const token = authService.getAccessToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else {
        console.warn('⚠️ No auth token available for authenticated request')
      }
    }

    let lastError: Error
    let attempt = 0

    while (attempt <= retries) {
      try {
        const response = await this.fetchWithTimeout(url, config, timeout)
        return await this.handleResponse(response)
      } catch (error) {
        lastError = error as Error
        attempt++

        // Don't retry on certain errors
        if (error instanceof AuthenticationError) {
          throw error
        }

        // Don't retry on client errors (4xx) except 429 (Too Many Requests)
        if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error
        }

        if (attempt <= retries) {
          console.warn(`🔄 API request failed, retrying... (${attempt}/${retries})`, error)
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000)
        }
      }
    }

    throw lastError!
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${timeout}ms`)
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network error: Unable to connect to server')
      }
      
      throw error
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    console.log('🔧 API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok
    })

    // Handle token expiration
    if (response.status === 401) {
      try {
        await authService.refreshToken()
        // In a real implementation, you might want to retry the original request
        // For now, we'll throw an authentication error
        throw new AuthenticationError('Session expired. Please log in again.')
      } catch (refreshError) {
        await authService.logout()
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        throw new AuthenticationError('Authentication failed. Please log in again.')
      }
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      throw new ApiError(
        'Too many requests. Please try again later.',
        429,
        'RATE_LIMITED',
        { retryAfter }
      )
    }

    // Handle server errors
    if (response.status >= 500) {
      throw new ApiError(
        'Server error. Please try again later.',
        response.status,
        'SERVER_ERROR'
      )
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { detail: `HTTP ${response.status}: ${response.statusText}` }
      }

      throw new ApiError(
        errorData.detail || errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData.code,
        errorData
      )
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null
    }

    try {
      return await response.json()
    } catch (error) {
      throw new ApiError('Failed to parse response as JSON', response.status, 'INVALID_JSON')
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public API methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // File upload method
  async upload<T>(
    endpoint: string, 
    formData: FormData, 
    options?: RequestOptions
  ): Promise<T> {
    // Fix: Create headers without Content-Type for FormData
    const { headers, ...otherOptions } = options || {}
    const uploadHeaders: RequestHeaders = { ...(headers as RequestHeaders) }
    
    // Remove Content-Type header for FormData
    delete uploadHeaders['Content-Type']

    const config: RequestOptions = {
      ...otherOptions,
      method: 'POST',
      body: formData,
      headers: uploadHeaders,
    }

    return this.request<T>(endpoint, config)
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000, requireAuth: false })
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
export const api = new ApiClient()

// Utility function for API error handling
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof NetworkError) {
    return 'Network error: Please check your internet connection'
  }
  
  if (error instanceof AuthenticationError) {
    return 'Authentication error: Please log in again'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

