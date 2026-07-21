import axios from 'axios';
import type {
  AppSettings,
  AuthSession,
  AuthUser,
  CityRecord,
  Staff,
  StaffApiPayload,
  StaffComment,
} from '../types';

// The documented backend domain can be overridden for another environment.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://jiusdai.eu.cc').replace(/\/$/, '');

const AUTH_TOKEN_KEY = 'meet_escort_auth_token';
const AUTH_USER_KEY = 'meet_escort_auth_user';

// Axios instance with shared BaseURL
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Attach Bearer token when present (auth endpoints + future protected APIs)
apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.set?.('Authorization', `Bearer ${token}`);
    if (!config.headers.set) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

function assertOk<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (response.data.code === 0) return response.data.data;
  throw new Error(response.data.msg || fallback);
}

function assertAuthSession(session: AuthSession | undefined, fallback: string): AuthSession {
  if (session?.token?.trim() && session.user?.email) return session;
  throw new Error(fallback);
}

/** Extract a readable API error message from axios / business errors. */
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.msg) return data.msg;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Resolve relative media paths (`/uploads/...`) against the API origin. */
export function resolveMediaUrl(path: string | undefined | null, baseUrl: string = BASE_URL): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  // Local mock assets stay on the frontend origin
  if (trimmed.startsWith('/home_files')) return trimmed;
  const base = baseUrl.replace(/\/$/, '');
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

/** Parse API languages field (comma /顿号 /顿号-style separators) into a list. */
export function parseLanguages(value: string | string[] | undefined | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return value
    .split(/[,，、;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Normalize photoUrls from list (string) or detail (array) responses. */
export function normalizePhotoUrls(raw: StaffApiPayload['photoUrls'] | undefined, legacyPhotoUrl?: string): string[] {
  const collected: string[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim()) collected.push(item.trim());
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    // Some backends may send a single path or comma-separated paths as a string
    for (const part of raw.split(/[,;]+/)) {
      const path = part.trim();
      if (path) collected.push(path);
    }
  }

  if (!collected.length && legacyPhotoUrl?.trim()) {
    collected.push(legacyPhotoUrl.trim());
  }

  return collected;
}

/** Map raw API staff payload into the UI `Staff` model. */
export function normalizeStaff(raw: StaffApiPayload): Staff {
  const photoPaths = normalizePhotoUrls(raw.photoUrls, raw.photoUrl);
  const photoUrl = photoPaths[0] ?? '';
  const languages = parseLanguages(raw.languages);
  const city = raw.city?.trim() || undefined;
  const country = raw.country?.trim() || undefined;
  const location = [city, country].filter(Boolean).join(', ') || undefined;
  const height = Number(raw.height) || undefined;
  const age = Number(raw.age) || undefined;
  const rating = Number(raw.rating) || undefined;
  const size = raw.size?.trim() || undefined;
  const bodyType = raw.bodyType?.trim() || undefined;
  const preferences = raw.preferences?.trim() || undefined;

  // Prefer API bio fields; synthesize a short description when missing
  const description =
    raw.description?.trim() ||
    raw.details?.trim() ||
    (location ? `Available in ${location}.` : undefined);

  return {
    id: raw.id,
    name: raw.name,
    price: Number(raw.price) || 0,
    isActive: Boolean(raw.isActive),
    photoUrl,
    photoUrls: photoPaths,
    country,
    city,
    location,
    age: age && age > 0 ? age : undefined,
    rating: rating && rating > 0 ? rating : undefined,
    height: height && height > 0 ? height : undefined,
    size,
    bodyType,
    languages: languages.length ? languages : undefined,
    preferences,
    createdAt: raw.createdAt,
    description,
    details: raw.details,
    phone: raw.phone,
  };
}

/**
 * Merge live API staff with matching local mock metadata.
 * API values win; mock fills gaps (verified, response time, richer bio, etc.).
 */
export function mergeStaffWithFallback(apiItem: Staff, fallback?: Staff): Staff {
  if (!fallback) return apiItem;

  const photoUrls =
    apiItem.photoUrls.length > 0
      ? apiItem.photoUrls
      : fallback.photoUrls?.length
        ? fallback.photoUrls
        : fallback.photoUrl
          ? [fallback.photoUrl]
          : [];

  return {
    ...fallback,
    ...apiItem,
    photoUrl: photoUrls[0] ?? apiItem.photoUrl ?? fallback.photoUrl ?? '',
    photoUrls,
    location: apiItem.location || fallback.location,
    city: apiItem.city || fallback.city,
    country: apiItem.country || fallback.country,
    languages: apiItem.languages?.length ? apiItem.languages : fallback.languages,
    description: apiItem.description || fallback.description,
    details: apiItem.details || fallback.details,
    height: apiItem.height ?? fallback.height,
    size: apiItem.size || fallback.size,
    bodyType: apiItem.bodyType || fallback.bodyType,
    preferences: apiItem.preferences || fallback.preferences,
    age: apiItem.age ?? fallback.age,
    rating: apiItem.rating ?? fallback.rating,
    // Keep presentation-only mock enrichments when API omits them
    reviewCount: apiItem.reviewCount ?? fallback.reviewCount,
    verified: apiItem.verified ?? fallback.verified,
    responseMinutes: apiItem.responseMinutes ?? fallback.responseMinutes,
    phone: apiItem.phone || fallback.phone,
  };
}

/** Fetch active (or all) staff listings. */
export const fetchStaffList = async (active: number = 1): Promise<Staff[]> => {
  const response = await apiClient.get<ApiResponse<StaffApiPayload[]>>(`/api/staff`, {
    params: { active },
  });
  const data = assertOk(response, 'Failed to fetch staff list.');
  return (data ?? []).map(normalizeStaff);
};

/** Fetch a single staff profile by id. */
export const fetchStaffDetail = async (id: number): Promise<Staff> => {
  const response = await apiClient.get<ApiResponse<StaffApiPayload>>(`/api/staff/${id}`);
  const data = assertOk(response, `Failed to fetch detail for staff ID ${id}.`);
  return normalizeStaff(data);
};

/** Fetch public comments for a staff profile, newest first. */
export const fetchStaffComments = async (id: number): Promise<StaffComment[]> => {
  const response = await apiClient.get<ApiResponse<StaffComment[]>>(`/api/staff/${id}/comments`);
  return assertOk(response, `Failed to fetch comments for staff ID ${id}.`) ?? [];
};

/** Fetch cities available to the meet-search flow. */
export const fetchCities = async (): Promise<CityRecord[]> => {
  const response = await apiClient.get<ApiResponse<CityRecord[]>>('/api/cities');
  return assertOk(response, 'Failed to fetch cities.') ?? [];
};

/** Fetch public settings, including the configured TRON receiving address. */
export const fetchSettings = async (): Promise<AppSettings> => {
  const response = await apiClient.get<ApiResponse<AppSettings>>('/api/settings');
  const data = assertOk(response, 'Failed to fetch settings.');
  return { tronAddress: data?.tronAddress?.trim() ?? '' };
};

// ─── Auth helpers ───────────────────────────────────────────────────────────

export function getStoredAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/** Register and immediately receive a session token. */
export const registerUser = async (email: string, password: string): Promise<AuthSession> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/api/auth/register', {
      email: email.trim(),
      password,
    });
    const data = assertAuthSession(assertOk(response, 'Registration failed.'), 'Registration returned an invalid session.');
    persistAuthSession(data);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Registration failed.'));
  }
};

/** Login and store the returned session. */
export const loginUser = async (email: string, password: string): Promise<AuthSession> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/api/auth/login', {
      email: email.trim(),
      password,
    });
    const data = assertAuthSession(assertOk(response, 'Login failed.'), 'Login returned an invalid session.');
    persistAuthSession(data);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Login failed.'));
  }
};

/** Restore the current user from a stored token. Clears session on 401. */
export const fetchCurrentUser = async (): Promise<AuthUser> => {
  try {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/api/auth/me');
    if (response.data.code === 401) {
      clearAuthSession();
      throw new Error(response.data.msg || '未登录');
    }
    const user = assertOk(response, 'Failed to load current user.');
    const token = getStoredAuthToken();
    if (token) persistAuthSession({ token, user });
    return user;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || (error.response?.data as ApiResponse<unknown>)?.code === 401)) {
      clearAuthSession();
    }
    throw new Error(getApiErrorMessage(error, 'Failed to load current user.'));
  }
};

/** Logout current token and clear local session. */
export const logoutUser = async (): Promise<void> => {
  try {
    if (getStoredAuthToken()) {
      await apiClient.post<ApiResponse<null>>('/api/auth/logout');
    }
  } catch {
    // Always clear local session even if the network call fails
  } finally {
    clearAuthSession();
  }
};

export const API_BASE_URL = BASE_URL;
