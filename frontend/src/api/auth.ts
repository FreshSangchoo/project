
import { axiosInstance } from "./axiosInstance"

// 로그아웃
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
}
