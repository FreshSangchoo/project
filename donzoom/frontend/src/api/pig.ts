import axiosInstance from './axios';

type Pig = {
  pigId: number;
  imageUrl: string;
  pigName: string;
  probability: number;
  description: string;
  silhouetteImageUrl: string;
  createdAt: string | null;
};

type MyCoin = {
  coin: number;
};

type MyTicket = {
  ticket: number;
};

// 전체 돼지 가져오기
const getAllPig = async (): Promise<Pig[]> => {
  const response = await axiosInstance.get('/pig');
  // console.log('돼지 다 내놔! ', response.data);
  return response.data;
};

// 보유한 돼지 가저오기
const getMyPig = async (): Promise<Pig[]> => {
  const response = await axiosInstance.get('/pig/owned');
  // console.log('내 돼지 내놔!: ', response.data);
  return response.data;
};

// 돼지 뽑기
const drawPig = async (amount: number): Promise<Pig[]> => {
  const response = await axiosInstance.post('/pig', null, {
    params: {amount},
  });
  // console.log('돼지 뽑기! ', response.data);
  return response.data;
};

// 가지고 있는 코인 개수 가져오기
const getMyCoin = async (): Promise<MyCoin> => {
  const response = await axiosInstance.get('/coin');
  console.log("GET  AXIOS GETMYCOIN ",response.data);
  return response.data;
};

// 가지고 있는 티켓 개수 가져오기
const getMyTicket = async (): Promise<MyTicket> => {
  const response = await axiosInstance.get('/ticket');
  console.log('내 티켓은 이만큼있어: ', response.data);
  return response.data;
};

// 티켓 구매하기
const changeCoinToTicket = async (amount: number): Promise<any> => {
  try {
    const response = await axiosInstance.post('/pig/ticket', null, {
      params: {amount},
    });
    console.log('샀어 ', response.data);
    return response.data;
  } catch (error) {
    console.log('여기도 안오니');
    console.log('Error in CTT: ', error);
  }
};

export {
  getAllPig,
  getMyPig,
  drawPig,
  getMyCoin,
  getMyTicket,
  changeCoinToTicket,
};

export type {MyCoin};
