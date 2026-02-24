import axios from "axios";
import Cookies from "js-cookie";
import { getTokenInfo } from "@utils/get-decoding";
import useAuthStore from "@store/useAuthStore";

const LOCAL_URL = "http://localhost/api";

const axiosInstance = axios.create({
  baseURL: LOCAL_URL,
  timeout: 3000,
  withCredentials: true, // CORS 요청에 자격 증명을 포함
});

// 요청 인터셉터 설정
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken, userTsid, userRole } = useAuthStore.getState();
    console.log("요청아이디: ", userTsid);
    console.log("요청역할: ", userRole);
    //console.log(accessToken)

    if (accessToken) {
      config.headers["Authorization"] = `${accessToken}`;
    }
    if (userTsid && userRole) {
      config.headers["userTsid"] = userTsid.toString();
      config.headers["role"] = userRole;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("Error in response interceptor:", error);
    const originalRequest = error.config;
      console.log(error.response.status);
      console.log(originalRequest._retry)

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      console.log("401 Unauthorized detected, attempting to reissue token...");
      originalRequest._retry = true;

      // 쿠키에서 refreshToken 읽기
      const refreshToken = Cookies.get("refresh");
      console.log("refresh : ", refreshToken);

      if (refreshToken) {
        try {
          console.log("Sending token reissue request...");
          const responseAgain = await axios.post(
            `${LOCAL_URL}/auth/reissue`,
            { refreshToken },
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          console.log(responseAgain)
          const newAccessToken = responseAgain.headers.authorization;
          console.log(newAccessToken);
          const tokenInfo = getTokenInfo(newAccessToken);

          useAuthStore.getState().setTokens(
            newAccessToken,
            tokenInfo.userTsid,
            tokenInfo.userRole
          );

          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["userTsid"] = tokenInfo.userTsid;
          originalRequest.headers["role"] = tokenInfo.userRole;

          console.log("왜 됨?" + originalRequest.headers);

          console.log("Resending original request with new access token...");
          return axiosInstance(originalRequest);
        } catch (err) {
          console.error("Error during reissuing token:", err);
          // 리이슈 실패 시 추가적인 처리 필요
          // 예: 로그아웃 처리
          return Promise.reject(err);
        }
      } else {
        console.error("No refresh token available in cookies");
        // 리프레시 토큰이 없을 경우 추가적인 처리 필요 (로그아웃, 재로그인 유도 등)
      }
    } else {
      console.error("Non-401 error occurred:", error.message);
    }
    return Promise.reject(error);
  }
);

export { axiosInstance, getTokenInfo };