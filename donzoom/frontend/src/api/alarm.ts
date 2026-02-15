import axiosInstance from './axios';

type Notification = {
  body: string;
  id: number;
  status: string | null;
  title: string;
  type: string | null;
};

const getMyNotification = async (): Promise<Notification[]> => {
  try {
    const response = await axiosInstance.get<Notification[]>('/alarm');
    console.log('alarmList: ', response.data);
    return response.data;
  } catch (error) {
    console.log('Error: ', error);
    return []; // 오류 시 빈 배열 반환
  }
};

export { getMyNotification };
