import axiosInstance from './axios';

// 적금 상태를 확인하는 API 호출
type ResponseSavings = {
  exists: boolean;
  status: string; // "만기 해지 가능", "중도 해지 가능", "적금 없음"
  canTerminate: boolean;
};

type ResponseSavingsDetail = {
  currentPaidAmount: number;  // 현재 납부 현황
  monthlyDeposit: number;     // 월 납입액
  expectedMaturityAmount: number; // 만기 환급액
  expectedMaturityProfit: number; // 만기 예상 수익
  nextPaymentDue: string;         // 다음 납기일
  maturityDate: string;           // 만기일
};

// 적금 상태를 확인하는 API 함수
const getMySavings = async (): Promise<ResponseSavings> => {
  const { data } = await axiosInstance.get('/savings');
  return data;
};

// 적금 상세 정보를 가져오는 API 함수
const getSavingsDetail = async (userId: number): Promise<ResponseSavingsDetail> => {
  const { data } = await axiosInstance.get(`/savings/detail?userId=${userId}`);
  return data;
};

// API 호출과 관련된 타입 및 함수 모듈화
export type {
  ResponseSavings,
  ResponseSavingsDetail,
};

export {
  getMySavings,
  getSavingsDetail,
};
