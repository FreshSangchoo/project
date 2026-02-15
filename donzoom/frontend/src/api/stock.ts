import axios, {AxiosError} from 'axios';
import axiosInstance from './axios';

type Stocks = {
  stockId: number;
  stockName: string;
  stockPrice: number;
  lastCreatedAt: Date;
};

type ResponseStockList = {
  stocks: Stocks[];
};

const getStockList = async (): Promise<ResponseStockList> => {
  const {data} = await axiosInstance.get('/stock');
  console.log('stockList:', data);
  return data;
};

type stockPriceArr = {
  close: number;
  createdAt: string;
  high: number;
  low: number;
  open: number;
  stockHistoryId: number;
}[];

type ResponseStock = {
  stockHistories: stockPriceArr;
  stockId: number;
  stockName: string;
};

const getStock = async (
  stockId: number,
  interval: string,
): Promise<ResponseStock> => {
  const {data} = await axiosInstance.get(`/stock/${stockId}/${interval}`);
  // console.log(data);
  return data;
};

type MyStock = {
  stockWalletId: number;
  stockId: number;
  stockName: string;
  totalInvestedPrice: number;
  amount: number;
  averagePrice: number;
};

type ResponseMyStock = {
  myStocks: MyStock[];
};

const getMyStockId = async (
  userId: number,
  stockId: number,
): Promise<ResponseMyStock> => {
  console.log('userId:', userId);
  let response;
  try {
    response = await axiosInstance.get(`/stock/my/${userId}/${stockId}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error fetching stock:', axiosError.response?.data);
      throw error;
    } else {
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
  // console.log('data:', response.data);
  return response.data;
};

const getMyStock = async (userId: number): Promise<ResponseMyStock> => {
  console.log('userId:', userId);
  const {data} = await axiosInstance.get(`/stock/my/${userId}`);
  // console.log('data:', data);
  return data;
};

type ResponseMyHistoryList = {
  transactionHistoryId: number;
  stockId: number;
  transactionType: string;
  price: number;
  amount: number;
  total: number;
  profit: number;
  createdAt: Date;
};

const getMyHistoryList = async (): Promise<ResponseMyHistoryList> => {
  const {data} = await axiosInstance.get('/stock/myhistory');
  // console.log(data);
  return data;
};

type ResponseMyHistory = ResponseMyHistoryList;

const getMyHistory = async (stockId: number): Promise<ResponseMyHistory> => {
  const {data} = await axiosInstance.get(`/stock/myhistory/${stockId}`);
  // console.log(data);
  return data;
};

type ResponseBuyStock = ResponseMyHistoryList;

type RequestBuyStock = {
  stockId: string;
  currentValue: number;
};

type RequestSellStock = RequestBuyStock;

const postBuyStock = async ({
  stockId,
  currentValue,
}: RequestBuyStock): Promise<ResponseBuyStock> => {
  console.log('stockId:', stockId);
  console.log('currentValue:', currentValue);
  let response;
  try {
    response = await axiosInstance.post(`/stock/${stockId}/buy`, null, {
      params: {
        amount: currentValue,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error fetching stock:', axiosError.response?.data);
      throw error;
    } else {
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
  console.log('buy stock response:', response.data);
  return response.data;
};

type ResponseSellStock = ResponseMyHistoryList;

const postSellStock = async ({
  stockId,
  currentValue,
}: RequestSellStock): Promise<ResponseSellStock> => {
  console.log('stockId:', stockId);
  console.log('currentValue:', currentValue);
  let response;
  try {
    response = await await axiosInstance.post(`/stock/${stockId}/sell`, null, {
      params: {
        amount: currentValue,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error fetching stock:', axiosError.response?.data);
      throw error;
    } else {
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
  console.log('buy stock response:', response.data);
  return response.data;
};

type ResponseContents = {
  Id: number;
  title: string;
  contents: string;
  createdAt: Date;
  source: string;
}; // 뉴스리스트 배열로 설정

type AllNewsResponse = {
  type: 'all-news';
  data: ResponseContents[];
};

type TodayNewsResponse = {
  type: 'today-news';
  data: ResponseContents[];
};

const getNews = async (stockId: number): Promise<AllNewsResponse> => {
  const {data} = await axiosInstance.get(`/news/${stockId}`);
  // console.log('전체뉴스:',data)
  return data;
};

const getTodaysNews = async (stockId: number): Promise<TodayNewsResponse> => {
  try {
    const {data} = await axiosInstance.get(`/news/${stockId}/today`);
    const slicedData = data.slice(0, 3);
    // console.log('sliced오늘뉴스:', slicedData);
    return slicedData; // 3개만 반환
  } catch {
    return {
      type: 'today-news',
      data: [],
    };
  }
};

type AllReportResponse = {
  type: 'all-reports';
  data: ResponseContents[];
};

type TodayReportResponse = {
  type: 'today-reports';
  data: ResponseContents[];
};

const getReports = async (stockId: number): Promise<AllReportResponse> => {
  const {data} = await axiosInstance.get(`/report/${stockId}`);
  // console.log('리포트:',data);
  return data;
};

const getTodaysReports = async (
  stockId: number,
): Promise<TodayReportResponse> => {
  try {
    const {data} = await axiosInstance.get(`/report/${stockId}/today`);
    const slicedData = data.slice(0, 3);
    // console.log('sliced오늘리포트:', slicedData);
    return slicedData; // 3개만 반환
  } catch {
    return {
      type: 'today-reports',
      data: [],
    };
  }
};

type LatestStock = {
  lastCreatedAt: Date;
  stockId: number;
  stockName: string;
  stockPrice: number;
};

const getLatestStock = async (stockId: number): Promise<LatestStock> => {
  console.log('최신 데이터 요청');
  const {data} = await axiosInstance.get(`/stock/${stockId}/latest`);
  console.log('최신 데이터 :', data);
  return data;
};

export {
  getStockList,
  getStock,
  getMyStock,
  getMyHistoryList,
  getMyHistory,
  postBuyStock,
  postSellStock,
  getNews,
  getTodaysNews,
  getReports,
  getTodaysReports,
  getMyStockId,
  getLatestStock,
};

export type {
  ResponseStockList,
  ResponseStock,
  ResponseMyStock,
  ResponseMyHistoryList,
  ResponseMyHistory,
  ResponseBuyStock,
  ResponseSellStock,
  RequestBuyStock,
  MyStock,
  stockPriceArr,
  ResponseContents,
  AllNewsResponse,
  TodayNewsResponse,
  AllReportResponse,
  TodayReportResponse,
  LatestStock,
};
