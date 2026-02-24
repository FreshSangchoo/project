import '@css/OnsiteReservationRegist.css';
import poppin_white from '@assets/poppin_white.svg';
import { useParams } from "react-router-dom";
import { Link } from 'react-router-dom';

const OnsiteReservationMain = () => {

    const { popupId } = useParams();

  return (
    <div id="onsite-reservation-main">
      <div className="logo">
        <img src={poppin_white} alt="popping_white" />
      </div>
      <Link to={`/onsite-reservation/regist/${popupId}`}>현장 예약 시작하기 &gt;</Link>
    </div>
  );
}

export default OnsiteReservationMain;