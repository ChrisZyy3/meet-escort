/**
 * TypeScript Data Models
 * 
 * Defines the interface for the Staff object, which aligns with both
 * the API documentation and our local mock data structure.
 */

export interface Staff {
  id: number;
  name: string;
  description: string;
  phone?: string;
  price: number;
  photoUrl: string;
  isActive: boolean;
  createdAt?: string;
  details?: string;
  country?: string;
  city?: string;
  address?: string;
  location?: string;
  age?: number;
  rating?: number;
  reviewCount?: number;
  languages?: string[];
  verified?: boolean;
  responseMinutes?: number;
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
