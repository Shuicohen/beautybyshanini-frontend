import { useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL;

export default function useApi(auth = false) {
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
  });

  const fetchWithRetry = async (url: string, options: RequestInit, retries = 2, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        // Increase timeout to 20 seconds
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        const text = await response.text();
        if (!response.ok) {
          let errorMsg = 'API error';
          try {
            const errJson = JSON.parse(text);
            errorMsg = errJson.error || errorMsg;
          } catch {}
          console.error(`API error for ${url}:`, errorMsg, text);
          if (response.status === 401) {
            // Redirect to login if unauthorized
            window.location.href = '/admin/login';
            throw new Error('Unauthorized: Redirecting to login');
          }
          if (response.status === 429) {
            console.warn(`Rate limit hit for ${url}, delaying retry`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
          throw new Error(errorMsg);
        }
        return text ? JSON.parse(text) : {};
      } catch (error) {
        // Only abort if the error is not an AbortError or if it's the last retry
        if (
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name?: string }).name === 'AbortError' &&
          i < retries - 1
        ) {
          console.warn(`Timeout reached for ${url}, retrying...`);
        } else if (i === retries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  };

  const get = useCallback(async (endpoint: string) => {
    return fetchWithRetry(`${BASE_URL}${endpoint}`, { headers: getHeaders() });
  }, [auth]);

  const post = useCallback(async (endpoint: string, body: any) => {
    return fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  }, [auth]);

  const put = useCallback(async (endpoint: string, body: any) => {
    return fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
  }, [auth]);

  const del = useCallback(async (endpoint: string) => {
    return fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  }, [auth]);

  return { get, post, put, del };
}