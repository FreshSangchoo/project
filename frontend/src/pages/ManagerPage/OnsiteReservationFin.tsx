import finishCheck from "@assets/registPop/finishCheck.svg";
import { Link } from "react-router-dom";

const OnsiteReservationFin = () => {
  return (
    <div id="onsite-reservation-fin">
      <img src={finishCheck} />
      <div className="finish-text">현장 예약이 등록되었습니다.</div>
      <div className="finish-text-plus">
        카카오톡으로 전송된 링크를 통해 <br/>
        실시간 예약 상황을 확인할 수 있습니다.
      </div>
      <Link to='/onsite-reservation/{popupId}'>예약 메인으로 돌아가기</Link>
    </div>
  );
};

export default OnsiteReservationFin;
