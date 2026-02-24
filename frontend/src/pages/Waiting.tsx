import { useState, useEffect } from 'react';
import { useNavigate, useParams} from "react-router-dom";
import "@css/Waiting.css";
import { getOnsiteReservation, OnsiteReservation } from '@api/reservation';

import poppinWhite from "@assets/poppin_white.svg";
import image1 from "@assets/image1.svg";

function Waiting() {
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<OnsiteReservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { popupId, reservationId } = useParams();

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const data = await getOnsiteReservation(popupId, reservationId);
        setReservation(data);
        console.log(data);
      } catch (err) {
        setError("예약 정보를 가져오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, []);

  const onClickHome = () => {
    navigate("/");
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!reservation) return <div>예약 정보가 없습니다.</div>;

  return (
      <div id="waiting">
        <img src={poppinWhite} alt="Poppin White 로고" />

        <div className="content">
          <div className="pop-image">
            <img src={image1} alt="이벤트 이미지" />
          </div>
          <div className="pop-title">{reservation.popupName}</div>
          <div className="turn-title">현재 나의 순서</div>
          <div className="turn-info">
            <div className="turn">{reservation.rank}</div>
            <div>번째</div>
          </div>
          <div className="person-info">
            <div className="person-name">
              <div className="person-name-title">예약자 명</div>
              <div className="person-name-info">{reservation.name}</div>
            </div>
            <div className="person-number">
              <div className="person-number-title">연락처</div>
              <div className="person-number-info">{reservation.phoneNumber}</div>
            </div>
            <div className="person-count">
              <div className="person-count-title">예약인원</div>
              <div className="person-count-info">{reservation.reservationCount}</div>
            </div>
          </div>
          <button onClick={onClickHome}>
            더 많은 팝업 스토어를 보고 싶다면?
          </button>
        </div>
      </div>
  );
}

export default Waiting;