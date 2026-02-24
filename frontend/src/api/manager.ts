import { axiosInstance } from "./axiosInstance";

export interface ManagerListProps {
  managerTsid: string;
  nickname: string;
  img: string;
}

export interface ManagerProps {
  managerTsid: string;
  nickname: string;
  id: string;
  password: string;
  role: string;
  img: string;
}

// 매니저 정보 조회
export const getManagerData = async () => {
  const response = await axiosInstance.get(`/managers/me`);
  return response.data;
};

// 매니저 코드 전체 조회
export const getManagersData = async (): Promise<ManagerListProps[]> => {
  const response = await axiosInstance.get<ManagerListProps[]>('/managers');
  return response.data;
}

// 매니저 코드 상세 조회
export const getManagerDataById = async (managerTsid: string): Promise<ManagerProps> => {
  const response = await axiosInstance.get<ManagerProps>(`/managers/${managerTsid}`);
  console.log(response.data)
  return response.data;
}

// 매니저 코드 생성
export const createManagerData = async (managerData: Omit<ManagerProps, 'managerTsid'>): Promise<ManagerProps> => {
  const response = await axiosInstance.post<ManagerProps>('/managers', managerData);
  return response.data;
}

// 매니저 코드 삭제
export const deleteManagerData = async (managerTsid: string): Promise<void> => {
  const response = await axiosInstance.delete(`/managers/${managerTsid}`);
  return response.data;
};