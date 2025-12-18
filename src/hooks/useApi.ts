import { useCallback } from 'react';

// Use environment variable for API URL, fallback to localhost only in development
// In production, VITE_API_URL must be set, otherwise throw an error
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : (() => {
  if (import.meta.env.PROD) {
    console.error('VITE_API_URL is not set in production environment');
  }
  return '';
})());

export default function useApi(auth = false) {
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
  });

  const fetchWithRetry = async (url: string, options: RequestInit, retries = 2, delay = 2000) => {
    // Check if BASE_URL is empty in production
    if (!BASE_URL && import.meta.env.PROD) {
      throw new Error('API URL is not configured. Please contact the administrator.');
    }
    
    const fullUrl = `${BASE_URL}${url}`;
    
    // Log the request in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${options.method || 'GET'} ${fullUrl}`);
    }
    
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        // Increase timeout to 60 seconds for sync operations, 20 seconds for others
        const isSyncOperation = url.includes('/sync');
        const timeoutDuration = isSyncOperation ? 60000 : 20000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
        const response = await fetch(fullUrl, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        const text = await response.text();
        
        if (!response.ok) {
          let errorMsg = 'API error';
          try {
            const errJson = JSON.parse(text);
            errorMsg = errJson.error || errorMsg;
          } catch {
            // If JSON parsing fails, use the text or status text
            errorMsg = text || response.statusText || `HTTP ${response.status}`;
          }
          
          // Log errors for debugging
          console.error(`API error for ${fullUrl}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorMsg,
            responseText: text
          });
          
          if (response.status === 401) {
            // Don't redirect if we're already on the login page
            if (!window.location.pathname.includes('/admin/login')) {
              window.location.href = '/admin/login';
            }
            throw new Error(errorMsg || 'Invalid credentials');
          }
          if (response.status === 429) {
            if (import.meta.env.DEV) {
              console.warn(`Rate limit hit for ${fullUrl}, delaying retry`);
            }
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
          throw new Error(errorMsg);
        }
        return text ? JSON.parse(text) : {};
      } catch (error: any) {
        // Handle network errors
        if (error?.name === 'AbortError') {
          if (i === retries - 1) {
            throw new Error('Request timeout. Please try again.');
          }
          if (import.meta.env.DEV) {
            console.warn(`Timeout reached for ${fullUrl}, retrying...`);
          }
        } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
          if (i === retries - 1) {
            throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend is running.');
          }
          if (import.meta.env.DEV) {
            console.warn(`Network error for ${fullUrl}, retrying...`);
          }
        } else if (i === retries - 1) {
          // Last retry, throw the error
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected error in fetchWithRetry');
  };

  const get = useCallback(async (endpoint: string) => {
    return fetchWithRetry(endpoint, { headers: getHeaders() });
  }, [auth]);

  const post = useCallback(async (endpoint: string, body: any) => {
    return fetchWithRetry(endpoint, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  }, [auth]);

  const put = useCallback(async (endpoint: string, body: any) => {
    return fetchWithRetry(endpoint, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  }, [auth]);

  const del = useCallback(async (endpoint: string) => {
    return fetchWithRetry(endpoint, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  }, [auth]);

  return { get, post, put, del };
}