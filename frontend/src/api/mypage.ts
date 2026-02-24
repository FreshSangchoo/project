import { ReviewProps } from "@interface/reviews";
import { axiosInstance } from "./axiosInstance"

export interface ReservationProps {
  reservationId: number;
  title: string;
  userName?: string;
  img: File;
  created_at?: string;
  reservationDate: string;
  reservationTime?: string;
  reservationCount: number;
  reservationStatement: number;
  kind: number;
  popupId: number;
}

// 내가 작성한 팝업 후기
export const getMyReviews = async (): Promise<ReviewProps[]> => {
  const resposne = await axiosInstance.get(`/users/me/popups/reviews`);
  return resposne.data;
}

// 내가 좋아요한 팝업
export const getMyLike = async () => {
  const response = await axiosInstance.get(`/users/me/popups/heart`);
  return response.data;
}

// 내가 예약한 팝업
export const getMyReservation = async () => {
  const response = await axiosInstance.get(`/users/me/popups/reservations`);
  return response.data;
}

// 사전 예약 상세 조회
export const getMyPreReservationDetail = async (prereservationId: number) => {
  const response = await axiosInstance.get(`/users/me/popups/pre-reservations/${prereservationId}`);
  return response.data;
}

// 예약이 취소된 팝업
export const getMyCancelReservation = async () => {
  const response = await axiosInstance.get(`/users/me/popups/cancelled-reservation`);
  return response.data;
}
