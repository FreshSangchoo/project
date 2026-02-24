import { axiosInstance } from "./axiosInstance";

export interface PopupProps {
  popupId: number;
  name: string;
  startDate: string;
  endDate: string;
  content: string;
  heart: number;
  hit: number;
  rating: number;
  deleted: boolean;
  images: string[];
}

// 카테고리별 팝업 조회
export const getPopupByCategory = async (category: number) => {
  const response = await axiosInstance.get<PopupProps[]>(`/popups/category/${category}`);
  return response.data;
}