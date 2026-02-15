import axiosInstance from '@/api/axios';

function setHeader(key: string, value: string) {
  axiosInstance.defaults.headers.common[key] = value;
  console.log('first', axiosInstance.defaults.headers.common['Authorization']);
}

function removeHeader(key: string) {
  if (!axiosInstance.defaults.headers.common[key]) {
    return;
  }

  delete axiosInstance.defaults.headers.common[key];
}

export {setHeader, removeHeader};
