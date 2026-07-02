import axios from 'axios';
import type { Staff } from '../types';

// The BaseURL for the backend services, fallback to direct domain if environment variable is not defined.
// 接口 BaseURL，默认指向 https://wofacai.vip (已从 3xrs6.com 更新为 wofacai.vip)
// The API client will use this domain to make all Axios HTTP requests.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wofacai.vip';

// Axios Instance creation
// 创建带有 BaseURL 的 Axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Timeout set to 10 seconds / 超时时间为10秒
});

// Generic API response structure
// 统一的接口响应格式接口
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * Fetch the list of active service personnel.
 * Automatically queries only active / on-shelf members (active=1).
 * 
 * 获取上架的服务人员列表
 * @param active - 1 for only active listings, empty for all / 默认传 1 获取上架人员
 */
export const fetchStaffList = async (active: number = 1): Promise<Staff[]> => {
  const response = await apiClient.get<ApiResponse<Staff[]>>(`/api/staff`, {
    params: { active },
  });

  if (response.data.code === 0) {
    return response.data.data;
  }
  
  throw new Error(response.data.msg || 'Failed to fetch staff list.');
};

/**
 * Fetch detailed profile of a single service staff member by ID.
 * 
 * 获取单个服务人员的详细档案
 * @param id - Staff member ID / 人员 ID
 */
export const fetchStaffDetail = async (id: number): Promise<Staff> => {
  const response = await apiClient.get<ApiResponse<Staff>>(`/api/staff/${id}`);

  if (response.data.code === 0) {
    return response.data.data;
  }
  
  throw new Error(response.data.msg || `Failed to fetch detail for staff ID ${id}.`);
};

// Export base URL for image path resolution inside component cards
// 导出 API 基础路径，便于前端组件内拼接图片绝对地址
export const API_BASE_URL = BASE_URL;
