import { supabase } from './supabase';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Make an authenticated API request with automatic token handling
 */
export async function authenticatedFetch(
  url: string, 
  options: ApiRequestOptions = {}
): Promise<Response> {
  // Get the current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('Authentication required');
  }

  const { method = 'GET', body, headers = {} } = options;

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...headers,
  };

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  return fetch(url, requestOptions);
}

/**
 * Make an authenticated API request and parse JSON response
 */
export async function authenticatedRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await authenticatedFetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, headers?: Record<string, string>) =>
    authenticatedRequest<T>(url, { method: 'GET', headers }),
    
  post: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    authenticatedRequest<T>(url, { method: 'POST', body, headers }),
    
  put: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    authenticatedRequest<T>(url, { method: 'PUT', body, headers }),
    
  patch: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    authenticatedRequest<T>(url, { method: 'PATCH', body, headers }),
    
  delete: <T = any>(url: string, headers?: Record<string, string>) =>
    authenticatedRequest<T>(url, { method: 'DELETE', headers }),
};
