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

// 팝업 검색
export const search = async (keyword: string) => {
  const response = await axiosInstance.get<PopupProps[]>(`/popups`, {
    params: {
      keyword, // 쿼리 파라미터로 keyword 전달
    },
  });
  return response.data;
};
