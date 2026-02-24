import { axiosInstance } from "./axiosInstance";

// 사용자 정보 조회
export const getUserData = async () => {
  const response = await axiosInstance.get(`/users/me`);
  return response.data;
};

// 사용자 정보 수정
export const updateUserData = async (formData: FormData) => {
  const response = await axiosInstance.put("/users/me", formData);
  return response.data;
}

// 닉네임 중복 확인
export const checkNickname = async (nickname: string) => {
  const response = await axiosInstance.get(`/users/${nickname}/check`);
  return response.status !== 409;
}

// 사용자 정보 탈퇴
export const deleteUserData = async () => {
  await axiosInstance.delete("/users/me");
}