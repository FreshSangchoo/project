import { useState, useEffect } from "react";
import "@css/OnsiteReservationRegist.css";
import poppinWhite from "@assets/poppin_white.svg";
import {Link, useNavigate, useParams} from "react-router-dom";
import { createOnsiteReservation } from "@api/reservation";
import { getPopupDetail } from "@api/apiPop";
import { PopupDetail } from "@interface/popDetail"; // PopupDetail 인터페이스를 import

const baseUrl = "http://localhost";
const OnsiteReservationRegist = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [visitedDate, setVisitedDate] = useState("");
  const [reservationCount, setReservationCount] = useState(1);

  const [popupInfo, setPopupInfo] = useState<PopupDetail | null>(null); // 타입을 명시적으로 지정
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { popupId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopupInfo = async () => {
      try {
        const data = await getPopupDetail(parseInt(popupId));
        setPopupInfo(data);
        setLoading(false);

        const today = new Date().toISOString().split("T")[0];
        setVisitedDate(today);
      } catch (err) {
        setError("팝업 정보를 불러오는데 실패했습니다.");
        setLoading(false);
      }
    };

    fetchPopupInfo();
  }, [popupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const onsiteReservationDto = {
      popupId: parseInt(popupId),
      name,
      phoneNumber,
      visitedDate,
      reservationCount,
      reservationStatementId: 1,
    };

    try {
      const response = await createOnsiteReservation(onsiteReservationDto);
      console.log("Reservation created:", response);
    } catch (error) {
      console.error("Error creating reservation:", error);
    }

    navigate(`/onsite-reservation/${popupId}`);
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  const getImageUrl = (img: string | File | undefined) => {
    if (!img) return "no image";
    console.log("img", img);
    return `${baseUrl}${img}`;
  };

  return (
    <div id="onsite-reservation-regist">
      <div className="logo">
        <img src={poppinWhite} alt="Poppin Logo" />
      </div>

      <div className="content">
        <h3>현장 예약 정보</h3>

        {popupInfo && (
          <div className="pop-up-info">
            <div className="pop-image">
              <img
                src={getImageUrl(popupInfo.images[0])}
                alt={popupInfo.name}
              />
            </div>
            <div className="pop-title">{popupInfo.name}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="content-input">
          <div className="reservation-name">
            <label htmlFor="name">예약자명</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예약자명을 입력하세요"
              required
            />
          </div>
          <div className="reservation-phone-number">
            <label htmlFor="phoneNumber">연락처</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="예약자 연락처를 입력하세요"
              required
            />
          </div>
          <div className="reservation-date">
            <label htmlFor="visitedDate">방문 날짜</label>
            <input
              type="date"
              id="visitedDate"
              value={visitedDate}
              onChange={(e) => setVisitedDate(e.target.value)}
              required
            />
          </div>
          <div className="reservation-member">
            <label htmlFor="reservationCount">방문 인원</label>
            <input
              type="number"
              id="reservationCount"
              value={reservationCount}
              onChange={(e) => setReservationCount(parseInt(e.target.value))}
              min="1"
              required
            />
          </div>
          <button type="submit">현장 예약 등록하기</button>
        </form>
        <Link to={`/onsite-reservation/${popupId}`}>뒤로가기</Link>
      </div>
    </div>
  );
};

export default OnsiteReservationRegist;
