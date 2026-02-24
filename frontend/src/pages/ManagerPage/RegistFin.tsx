import { useNavigate } from "react-router-dom";
import "@css/ManagerPage/RegistFin.css";

import finalStep from "@assets/registPop/finalStep.svg";
import finishCheck from "@assets/registPop/finishCheck.svg";

function RegistFin() {
  const navigate = useNavigate();
  const handleClickButton = () => {
    navigate("/mypage/my-popups");
  };

  return (
    <div id="pop-regist-finish">
      <div className="upside">
        <div className="title">팝업스토어 등록 완료</div>
        <img src={finalStep} />
      </div>
      <div className="contentside">
        <img src={finishCheck} />
        <div className="finish-ment">팝업스토어 등록이 완료되었습니다.</div>
        <div className="check-ment">
          등록된 팝업스토어 정보를 확인하고 채팅방을 관리하세요.
        </div>
      </div>
      <div className="regist-fin">
        <button onClick={handleClickButton}>등록한 팝업스토어 보기</button>
      </div>
    </div>
  );
}

export default RegistFin;
