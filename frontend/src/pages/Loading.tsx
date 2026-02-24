import { axiosInstance, getTokenInfo } from "@api/axiosInstance";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@store/useAuthStore";

const Loading = () => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);

  console.log("로딩");

  useEffect(() => {
    const refreshToken = Cookies.get("refresh");

    const reissueToken = async () => {
      if (refreshToken) {
        try {
          const response = await axiosInstance.post(
            `/auth/reissue`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          const accessToken = response.headers.authorization;
          console.log("토큰 ", accessToken)

          // 토큰 디코딩하여 userTsId와 role을 헤더에 추가
          const tokenInfo = getTokenInfo(accessToken);
          if (tokenInfo.userTsid && tokenInfo.userRole) {
            axiosInstance.defaults.headers.common["userTsid"] =
              tokenInfo.userTsid.toString();
            axiosInstance.defaults.headers.common["role"] = tokenInfo.userRole;
          }

          setTokens(accessToken, tokenInfo.userTsid ?? "", tokenInfo.userRole ?? "");

          // reissueToken이 성공적으로 실행되었으므로, _retry 플래그를 설정
          axiosInstance.defaults.headers.common["_retry"] = true;

          // 원하는 페이지로 리디렉션
          navigate("/");
        } catch (error) {
          console.error("Error during reissuing token:", error);
          // 오류가 발생하면 로그인 페이지로 리디렉션
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    reissueToken();
  }, [navigate]);

  return null;
};

export default Loading;
