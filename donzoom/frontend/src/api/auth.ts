import {Profile} from '@/types/domain';
import axiosInstance from './axios';
import {getEncryptedStorage} from '@/utils';
import axios, {AxiosError} from 'axios';
import {useErrorStore} from '@/stores/errorMessagesStore';
import messaging from '@react-native-firebase/messaging';
import * as RNFS from 'react-native-fs';
import {Asset} from 'react-native-image-picker';
import {Platform} from 'react-native';

type User = {
  email: string;
  password: string;
};

interface RequestSignup {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  nickname: string;
  isParent: boolean;
  image?: File;
}

type ResponseToken = {
  accessToken: string;
  refreshToken: string;
};

type Response = {
  authorization: string;
};

type LoginError = {
  message: string;
};

type ResponseProfile = Profile;

const postSignup = async ({
  email,
  password,
  passwordConfirm,
  name,
  nickname,
  isParent,
}: RequestSignup): Promise<void> => {
  console.log('signup values', {
    email,
    password,
    passwordConfirm,
    name,
    nickname,
    isParent,
  });
  const {data} = await axiosInstance.post('/user', {
    email,
    password,
    passwordConfirm,
    name,
    nickname,
    isParent,
  });
  console.log(data);
  return data;
};

const postLogin = async ({email, password}: User): Promise<Response> => {
  const setErrorMessage = useErrorStore.getState().setErrorMessage;
  try {
    const deviceToken = await messaging().getToken();
    console.log('deviceToken: ', deviceToken);
    console.log('Attempting to send login request...');
    const response = await axiosInstance.post('/user/login', {
      email,
      password,
      deviceToken,
    });
    // console.log('Login request successful:', response);
    // console.log('Authorization:', response.headers['authorization']);
    return response.headers['authorization'];
  } catch (error) {
    console.error('Error during login request:', error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<LoginError>;
      if (axiosError.response?.status === 401) {
        setErrorMessage(
          '로그인 정보가 올바르지 않습니다.\n이메일과 비밀번호를 확인해주세요.',
        );
      } else {
        setErrorMessage(
          '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      }
    } else {
      setErrorMessage('알 수 없는 오류가 발생했습니다.');
    }
    throw error;
  }
};

const getProfile = async (): Promise<ResponseProfile> => {
  const {data} = await axiosInstance.get('/user');
  console.log('user data:', data);
  return data;
};

const logout = async () => {
  await axiosInstance.delete('/user/logout');
};

const postChildAdd = async (childEmails: string[]) => {
  // console.log(childEmails);
  const {data} = await axiosInstance.post('/user/child-add', {childEmails});
  // console.log('애들이메일:', response);
  return {data};
};

const postAutoLogin = async () => {
  console.log('요청');
  const response = await axiosInstance.post('/auto-login');
  console.log(response);
};

const postProfileImage = async (profileImage: Asset) => {
  try {
    const formData = new FormData();
    const fileData = {
      uri:
        Platform.OS === 'android'
          ? profileImage.uri
          : profileImage.uri?.replace('file://', ''),
      type: profileImage.type || 'image/jpeg',
      name: profileImage.fileName || 'profile.jpg',
    };
    formData.append('file', fileData as any);

    console.log('File data:', fileData);
    console.log('Form data:', formData);

    const {data} = await axiosInstance.post('/user/profileImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data, headers) => {
        return formData;
      },
    });
    console.log('Profile image uploaded successfully:', data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 이제 error는 AxiosError 타입으로 취급됩니다
      if (error.response) {
        // 서버 응답이 있는 경우
        console.error('Server responded with error:', error.response.data);
        console.error('Status code:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        console.error('No response received:', error.request);
      } else {
        // 요청 설정 중 오류가 발생한 경우
        console.error('Error setting up request:', error.message);
      }
    } else {
      // AxiosError가 아닌 경우
      console.error('An unexpected error occurred:', error);
    }
  }
};

const postSetRelation = async () => {
  console.log('연결 시도');
  const response = await axiosInstance.post('/user/set-relationship');
  console.log('부모 아이 연결:', response);
};

export {
  postSignup,
  postLogin,
  getProfile,
  logout,
  postAutoLogin,
  postProfileImage,
  postChildAdd,
  postSetRelation,
};
export type {User as RequestUser, ResponseToken, ResponseProfile};
