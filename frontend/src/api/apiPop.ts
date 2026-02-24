import { axiosInstance } from "@api/axiosInstance";
import { PopupDetail } from "@interface/popDetail";

export interface PopupDTO {
  popupId: number;
  name: string;
  startDate: string;
  endDate: string;
  hours: string;
  address: string;
  content: string;
  images: string[];
}

export interface PopupRequestDTO {
  managerTsid: string;
  images: File[];
  name: string;
  startDate: string;
  endDate: string;
  hours: string;
  address: string;
  lat: number;
  lon: number;
  content: string;
  categories: number[];
  snsUrl?: string;
  pageUrl?: string;
  description: string;
  preReservationOpenAt?: string;
  term?: number;
  maxPeoplePerSession?: number;
  maxReservationsPerPerson?: number;
  warning?: string;
}

export interface ReviewListDto {
  reviewId: number;
  popupId: number;
  userTsid: string;
  nickname: string;
  img: string;
  rating: number;
  title: string;
  content: string;
  thumbnail?: string;
  createdAt: string;
  commentDtoList: CommentDto[];
}

export interface CommentDto {
  commentId: number;
  reviewId: number;
  userTsid: string;
  nickname: string;
  content: string;
  createdAt: string;
}

export interface HeartRequestDTO {
  userTsid: string;
  popupId: number;
}

const api = axiosInstance;

const toFormData = (popupDto: Partial<PopupRequestDTO>): FormData => {
  const formData = new FormData();
  formData.append("name", popupDto.name || "");
  formData.append("content", popupDto.content || "");
  formData.append("startDate", popupDto.startDate || "");
  formData.append("endDate", popupDto.endDate || "");
  formData.append("hours", popupDto.hours || "");
  formData.append("snsUrl", popupDto.snsUrl || "");
  formData.append("pageUrl", popupDto.pageUrl || "");
  formData.append("description", popupDto.description || "");
  formData.append("address", popupDto.address || "");
  if (popupDto.categories) {
    popupDto.categories.forEach((category) => {
      formData.append("categories", String(category));
    });
  }
  formData.append("lat", String(popupDto.lat));
  formData.append("lon", String(popupDto.lon));
  formData.append("managerTsid", String(popupDto.managerTsid));
  if (popupDto.preReservationOpenAt) {
    formData.append("preReservationOpenAt", popupDto.preReservationOpenAt);
  }
  if (popupDto.term) {
    formData.append("term", String(popupDto.term));
  }
  if (popupDto.maxPeoplePerSession) {
    formData.append(
      "maxPeoplePerSession",
      String(popupDto.maxPeoplePerSession)
    );
  }
  if (popupDto.maxReservationsPerPerson) {
    formData.append(
      "maxReservationsPerPerson",
      String(popupDto.maxReservationsPerPerson)
    );
  }
  if (popupDto.warning) {
    formData.append("warning", popupDto.warning);
  }
  if (popupDto.images) {
    popupDto.images.forEach((image) => {
      formData.append("images", image);
    });
  }

  return formData;
};

// 팝업 등록
export const createPopup = async (data: {
  url: string;
  popupDto: PopupRequestDTO;
}) => {
  const formData = toFormData(data.popupDto);
  const response = await api.post(data.url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// 팝업 업데이트
export const updatePopup = async (
  popupId: number,
  popupDto: Partial<PopupRequestDTO>
) => {
  const formData = toFormData(popupDto);
  const response = await api.put(`/popups/${popupId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// 팝업 전체 조회
export const getPopupList = async () => {
  const response = await api.get("/popups");
  return response.data;
};

// 팝업 상세 조회
export const getPopupDetail = async (popupId: number) => {
  const response = await api.get(`/popups/${popupId}`);
  console.log(response.data);
  return response.data;
};

// 해당 팝업의 리뷰 목록 조회
export const getReviews = async (popupId: number) => {
  const response = await api.get(`/popups/${popupId}/reviews`);
  return response.data;
};

// 해당 팝업의 채팅 내역 조회
export const getHistory = async (popupId: number) => {
  const response = await api.get(`/popups/chat/${popupId}`);
  return response.data;
};

// 내 주변 팝업 조회 (전체)
export const getMapPopupList = async (): Promise<PopupDetail[]> => {
  const response = await api.get("/popups/map");
  return response.data;
};

// 내 주변 팝업 조회 (좋아요)
export const getMapHeartPopupByLocation = async (): Promise<PopupDetail[]> => {
  const response = await api.get("/popups/map/like");
  return response.data;
};

// 내 주변 팝업 조회 (내 예약)
export const getMapMyReservationPopup = async (): Promise<PopupDetail[]> => {
  const response = await api.get("/popups/map/reservation");
  return response.data;
};

// 팝업 좋아요
export const insertHeart = async (data: HeartRequestDTO) => {
  const response = await api.post(`/popups/${data.popupId}/heart`, data);
  return response.data;
};

// 팝업 좋아요 해제
export const deleteHeart = async (data: HeartRequestDTO) => {
  const response = await api.delete(`/popups/${data.popupId}/heart`, { data });
  return response.data;
};

// 유사 팝업 조회
export const getSimilarPopups = async (
  popupId: number
): Promise<PopupDTO[]> => {
  const response = await api.get(`/popups/${popupId}/tag`);
  console.log(response.data);
  return response.data;
};

// 매니저가 등록한 팝업 스토어 목록 조회
export const getMyPopups = async (managerTsid: string | null) => {
  const response = await api.get(`/managers/me/popups`, {
    params: { managerTsid },
  });
  return response.data;
};
