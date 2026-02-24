import { axiosInstance } from "./axiosInstance";

// 후기 목록 조회
export const getReviewListData = async () => {
  const response = await axiosInstance.get("/reviews");
  return response.data;
}

// 후기 상세 조회
export const getReviewData = async (reviewId: number) => {
  const response = await axiosInstance.get(`/reviews/${reviewId}`);
  return response.data;
}

// 후기 생성
export const createReviewData = async (popupId: number, formData: FormData) => {
  const response = await axiosInstance.post(`/popups/${popupId}/reviews`, formData);
  return response.data;
}

// 후기 본문 이미지 처리
export const uploadImages = async (img: File): Promise<string> => {
  const formData = new FormData();
  formData.append('img', img);

  const response = await axiosInstance.post(`/reviews/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// 후기 수정
export const updateReviewData = async (reviewId: number, formData: FormData) => {
  const response = await axiosInstance.put(`/reviews/${reviewId}`, formData);
  return response.data;
}

// 후기 삭제
export const deleteReviewData = async (reviewId: number) => {
  const response = await axiosInstance.delete(`reviews/${reviewId}`);
  return response.data;
}

// 댓글 추가
export const createCommentData = async (reviewId: number, comment: { content: string}) => {
  const response = await axiosInstance.post(`/reviews/${reviewId}/comments`, comment);
  return response.data;
}

// 댓글 삭제
export const deleteCommentData = async (reviewId: number, commentId: number) => {
  const response = await axiosInstance.delete(`/reviews/${reviewId}/comments/${commentId}`);
  return response.data;
}