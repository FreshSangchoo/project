import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenInfo } from "@utils/get-decoding";
import useAuthStore from "@store/useAuthStore";

import logo from "@assets/poppin_gradiant.svg";
import "@css/ManagerPage/ManagerLogin.css";

const ManagerLogin = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch("/login/manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          id: id,
          password: password,
        }),
      });

      if (response.ok) {
        const token = response.headers.get("Authorization")?.split(" ")[1];
        if (token) {
          const { userTsid, userRole } = getTokenInfo(`Bearer ${token}`);

          if (userTsid && userRole) {
            useAuthStore.getState().setTokens(token, userTsid, userRole);
            navigate("/");
          } else {
            throw new Error("토큰 디코딩 중 오류 발생");
          }
        }
      } else {
        console.log(response);
        alert("로그인 실패: 아이디 또는 비밀번호를 확인하세요.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div id="manager-login">
      <img className="logo" src={logo} alt="logo" />
      <div className="manager-input">
        <input
          type="text"
          placeholder="아이디를 입력하세요"
          value={id}
          onChange={(e) => setId(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          type="password"
          placeholder="패스워드를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button onClick={handleLogin}>매니저 로그인</button>
      <div className="login-etc">
        <a href="/">그냥 둘러볼래요</a>
      </div>
    </div>
  );
};

export default ManagerLogin;
