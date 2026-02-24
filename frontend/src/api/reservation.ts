import { axiosInstance } from "./axiosInstance";

export interface ReservationRequestDTO {
  popupId: number;
  userTsid: string;
  date: string;
  time: string;
  peopleCount: number;
}

export interface PreReservationResponseDTO {
  preReservationId: number;
  userTsid: string;
  popupId: number;
  reservationDate: string;
  reservationTime: string;
  reservationCount: number;
  createdAt: string;
  reservationStatementId: number;
}

// 날짜별 사전 예약 정보 조회
export const getPreReservations = async (popupId: number, reservationDate: string) => {
  const response = await axiosInstance.get<PreReservationResponseDTO[]>(
    `/popups/${popupId}/pre-reservations`,
    {
      params: {
        reservationDate: reservationDate,
      },
    }
  );
  return response.data;
};

// 사전 예약 생성
export interface PreReservationRequestDTO {
  userTsid: string;
  popupId: number;
  reservationDate: string;
  reservationTime: string;
  reservationCount: number;
  reservationStatementId?: number;
}

// 사전 예약 하기
export const createPreReservation = async (popupId: number, data: PreReservationRequestDTO) => {
  const response = await axiosInstance.post<PreReservationResponseDTO>(
    `/popups/${popupId}/pre-reservations`,
    data
  );
  return response.data;
};

// 현장 예약 생성
export interface OnsiteReservationRequestDTO {
  popupId: number;
  name: string;
  phoneNumber : string;
  reservationCount: number;
  reservationStatementId : number;
}

// 현장 예약 하기
export const createOnsiteReservation = async (data: OnsiteReservationRequestDTO) => {
  const response = await axiosInstance.post<OnsiteReservationRequestDTO>(
      `/onsite-reservations`,
      data
  );
  return response.data;
}

// 현장 예약 조회
export interface OnsiteReservation {
  onsiteReservationId: number;
  popupId: number;
  name: string;
  popupName: string;
  phoneNumber : string;
  visitedDate : string;
  reservationCount: number;
  reservationStatementId : number;
  waitNumber : number;
  rank : number;
}

// 현장 예약 조회
export const getOnsiteReservation = async (popupId : string | undefined, reservationId : string | undefined) => {
  const response = await axiosInstance.get<OnsiteReservation>(
      `/onsite-reservations/${reservationId}/popups/${popupId}`,
  );
  return response.data;
}