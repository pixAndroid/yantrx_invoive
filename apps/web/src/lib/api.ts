export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Returns true if the given string is a safe image URL (data URI or HTTPS).
 * Used to prevent XSS from arbitrary logo/image values stored in the database.
 */
export function isSafeImageUrl(url: string): boolean {
  return /^(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,|https:\/\/)/.test(url);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getUserData(): { name?: string; email?: string; role?: string; businessId?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return {};
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return {};
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}
