import { QueryClient, QueryFunction, dehydrate, hydrate } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Enhanced error handling for response objects
 * Extracts detailed error messages from responses
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || res.statusText;
    } catch (e) {
      try {
        errorMessage = await res.text();
      } catch (e2) {
        errorMessage = res.statusText;
      }
    }
    
    // Create a more detailed error object with status code included
    const error = new Error(`${res.status}: ${errorMessage}`);
    (error as any).statusCode = res.status;
    (error as any).details = errorMessage;
    
    throw error;
  }
}

// Keep track of requests that are being retried to prevent infinite loops
const pendingRetryRequests = new Set<string>();
// Session refresh state management
let isRefreshingSession = false;
let sessionRefreshPromise: Promise<any> | null = null;

/**
 * Enhanced API request function with intelligent handling of:
 * - Session expiration with auto-refresh
 * - Request deduplication
 * - Standardized error handling
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: {
    retryOnUnauthorized?: boolean;
    headers?: Record<string, string>;
    cacheResponse?: boolean;
    body?: BodyInit;
    formData?: boolean;
  } = {},
): Promise<Response> {
  const { 
    retryOnUnauthorized = true, 
    headers = {}, 
    cacheResponse = false,
    body = undefined,
    formData = false
  } = options;
  const requestKey = `${method}:${url}:${formData ? 'formData' : JSON.stringify(data)}`;
  
  try {
    // Add timestamp to bust cache for GET requests if not explicitly cached
    const finalUrl = method === 'GET' && !cacheResponse 
      ? `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}` 
      : url;
    
    // Determine what to send in the body and what content-type to use
    let requestBody: BodyInit | undefined = undefined;
    let contentTypeHeader = {};
    
    if (body) {
      // If body is explicitly provided, use it directly
      requestBody = body;
    } else if (data) {
      // Otherwise, use data and format according to formData flag
      if (formData && data instanceof FormData) {
        requestBody = data;
        // Don't set Content-Type for FormData - browser will set with boundary
      } else {
        requestBody = JSON.stringify(data);
        contentTypeHeader = { "Content-Type": "application/json" };
      }
    }
    
    const res = await fetch(finalUrl, {
      method,
      headers: {
        ...(!formData && data ? contentTypeHeader : {}),
        ...headers,
      },
      body: requestBody,
      credentials: "include",
    });

    // Handle session refresh for 401 errors
    if (res.status === 401 && retryOnUnauthorized) {
      return await handleSessionRefresh(method, url, data, headers, requestKey, res);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    pendingRetryRequests.delete(requestKey);
    
    // Enhance error with request details for debugging
    if (error instanceof Error) {
      (error as any).requestDetails = {
        method,
        url,
        requestKey
      };
    }
    
    throw error;
  }
}

/**
 * Centralizes session refresh logic to prevent multiple simultaneous refresh attempts
 */
async function handleSessionRefresh(
  method: string, 
  url: string, 
  data: unknown | undefined, 
  headers: Record<string, string>,
  requestKey: string,
  originalResponse: Response
): Promise<Response> {
  // Return the original response if we're already retrying this exact request
  if (pendingRetryRequests.has(requestKey)) {
    await throwIfResNotOk(originalResponse);
    return originalResponse;
  }
  
  pendingRetryRequests.add(requestKey);
  
  try {
    // Create or reuse a session refresh promise
    if (!isRefreshingSession) {
      isRefreshingSession = true;
      sessionRefreshPromise = fetch('/api/user', { 
        credentials: 'include',
        cache: 'no-store',
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
    }
    
    // Wait for the session refresh to complete
    const refreshResponse = await sessionRefreshPromise;
    
    // Clean up after session refresh completes
    if (isRefreshingSession) {
      isRefreshingSession = false;
      sessionRefreshPromise = null;
    }
    
    if (refreshResponse.ok) {
      // For FormData requests, we can't retry them automatically since FormData can't be cloned
      // Instead, return a 401 response which will cause the UI to prompt for re-authentication
      if (requestKey.includes('formData')) {
        console.warn('Cannot retry FormData requests after session refresh');
        return originalResponse;
      }
      
      // Session is still valid, retry the original request
      const retryRes = await fetch(url, {
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      
      pendingRetryRequests.delete(requestKey);
      await throwIfResNotOk(retryRes);
      return retryRes;
    } else {
      // Session is invalid, let the 401 propagate
      pendingRetryRequests.delete(requestKey);
      await throwIfResNotOk(originalResponse);
      return originalResponse;
    }
  } catch (error) {
    pendingRetryRequests.delete(requestKey);
    
    // Reset the refresh state on error
    if (isRefreshingSession) {
      isRefreshingSession = false;
      sessionRefreshPromise = null;
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Track ongoing query requests to prevent multiple simultaneous requests to the same endpoint
const pendingQueries = new Map<string, Promise<any>>();

/**
 * Enhanced query function with optimized caching and error handling
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  customCache?: boolean;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, customCache = false }) =>
  async ({ queryKey, signal }) => {
    const url = queryKey[0] as string;
    const queryId = Array.isArray(queryKey) ? queryKey.join(':') : queryKey.toString();
    
    // Add cache busting for non-custom-cache queries
    const finalUrl = !customCache 
      ? `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}` 
      : url;
    
    // Check if this query is already in progress
    if (pendingQueries.has(queryId)) {
      try {
        return await pendingQueries.get(queryId);
      } catch (error) {
        // If existing query fails, continue with a new request
      }
    }
    
    // Create a new request promise
    const queryPromise = (async () => {
      try {
        const res = await fetch(finalUrl, {
          credentials: "include",
          cache: "no-cache",
          signal,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        
        try {
          return await res.json();
        } catch (e) {
          console.warn(`Could not parse JSON from response to ${finalUrl}`, e);
          return null; // Return null for non-JSON responses
        }
      } finally {
        pendingQueries.delete(queryId);
      }
    })();
    
    // Store the promise for potential reuse
    pendingQueries.set(queryId, queryPromise);
    
    return await queryPromise;
  };

/**
 * Save query cache to sessionStorage to persist between page refreshes
 */
const saveQueryCache = () => {
  try {
    if (typeof window !== 'undefined') {
      const dehydratedState = dehydrate(queryClient);
      sessionStorage.setItem('QUERY_CACHE', JSON.stringify(dehydratedState));
    }
  } catch (e) {
    console.warn('Failed to save query cache to sessionStorage', e);
  }
};

/**
 * Restore query cache from sessionStorage
 */
const loadQueryCache = () => {
  try {
    if (typeof window !== 'undefined') {
      const savedCache = sessionStorage.getItem('QUERY_CACHE');
      if (savedCache) {
        const dehydratedState = JSON.parse(savedCache);
        hydrate(queryClient, dehydratedState);
      }
    }
  } catch (e) {
    console.warn('Failed to load query cache from sessionStorage', e);
  }
};

/**
 * Hook to persist query cache on page unload/refresh
 */
export const usePersistQueryCache = () => {
  useEffect(() => {
    // Load cache on mount
    loadQueryCache();
    
    // Save cache on beforeunload
    window.addEventListener('beforeunload', saveQueryCache);
    return () => {
      window.removeEventListener('beforeunload', saveQueryCache);
    };
  }, []);
};

/**
 * Optimized query client with smart defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      onError: (error) => {
        // More detailed error logging
        if ((error as any).statusCode === 401) {
          console.warn('Authentication error in mutation - user may need to log in');
        } else {
          console.error('Mutation error:', error);
        }
      },
    },
  },
});
