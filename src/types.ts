/**
 * TypeScript Data Models
 *
 * Normalized data models for the public REST API and presentation layers.
 */

/** Normalized staff profile used across the UI. */
export interface Staff {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
  /** Primary photo (absolute or site-relative). Empty when none. */
  photoUrl: string;
  /** Full gallery (absolute or site-relative paths). */
  photoUrls: string[];
  country?: string;
  city?: string;
  /** Convenience display location derived from API city and country fields. */
  location?: string;
  age?: number;
  rating?: number;
  height?: number;
  size?: string;
  bodyType?: string;
  /** Parsed language list from the API languages field. */
  languages?: string[];
  preferences?: string;
  createdAt?: string;
  // Optional fields supported by extended API responses.
  description?: string;
  details?: string;
  phone?: string;
  address?: string;
  reviewCount?: number;
  verified?: boolean;
  responseMinutes?: number;
}

/** Raw staff payload shape from the backend (before normalization). */
export interface StaffApiPayload {
  id: number;
  name: string;
  country?: string;
  city?: string;
  price?: number;
  rating?: number;
  age?: number;
  height?: number;
  size?: string;
  bodyType?: string;
  languages?: string | string[];
  preferences?: string;
  /** List endpoint may return string; detail returns string[]. */
  photoUrls?: string | string[] | null;
  /** Legacy / alternate field some environments may still send. */
  photoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  description?: string;
  details?: string;
  phone?: string;
}

export interface StaffComment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface CityRecord {
  id: number;
  continent: string;
  country: string;
  city: string;
  createdAt: string;
}

export interface AppSettings {
  tronAddress: string;
}

export interface AuthUser {
  id: number;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'admin' | string;
  content: string;
  fileUrl: string;
  adminName: string;
  createdAt: string;
}

export interface SearchCriteria {
  city: string;
  date: string;
  time: string;
  duration: string;
  availableNow: boolean;
}

export interface BookingDraft {
  staffId: number;
  staffName: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  contact: string;
}
