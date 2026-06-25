/**
 * TypeScript Data Models
 * 
 * Defines the interface for the Staff object, which aligns with both
 * the API documentation and our local mock data structure.
 */

export interface Staff {
  id: number;             // Unique identifier / 唯一识别ID
  name: string;           // Name / 姓名
  description: string;    // Description / 简介
  phone: string;          // Phone number / 电话
  price: number;          // Price in local currency / 价格（元）
  photoUrl: string;       // Image URL (relative path) / 照片相对路径
  isActive: boolean;      // Listing status / 上架状态
  createdAt?: string;     // Creation date string / 创建时间
}
