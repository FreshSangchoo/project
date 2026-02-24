import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "@css/Pop/PopReservationCheck.css";
import useAuthStore from "@store/useAuthStore";
import { getUserData } from "@api/users";
import { createPreReservation } from "@api/reservation";

import edit from "@assets/edit.svg";
import nextButton from "@assets/nextButton.svg";

function PopReservationCheck() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userTsid } = useAuthStore();

  const {
    title,
    selectedDate,
    selectedTime,
    peopleCount,
    popupId,
  } = location.state || {};

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");

  // 유저 정보 불러오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        setName(userData.name || "");
        setContact(userData.contact || "");
        setEmail(userData.email || "");
      } catch (error) {
        console.error("유저 정보를 불러오는 중 에러 발생:", error);
      }
    };

    if (userTsid) {
      fetchUserData();
    }
  }, [userTsid]);

  // 예약 완료 버튼 클릭 시 호출
  const reservationFin = async () => {
    if(!userTsid){
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      // 서버로 예약 정보 전송
      await createPreReservation(popupId, {
        userTsid,
        popupId,
        reservationDate: selectedDate.toISOString().split('T')[0],
        reservationTime: selectedTime,
        reservationCount: peopleCount,
        reservationStatementId: 1
      });
      navigate("/reservation-check/finish");
    } catch (error) {
      console.error("예약을 완료하는 중 에러 발생:", error);
      alert("예약을 완료하는 데 문제가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div id="pop-reservation-check">
      <div className="check-content">
        <div>아래 내용이 맞는지 확인해주세요.</div>
      </div>
      <div className="pop-content-check">
        <div className="pop-title-check">{title}</div>
        <div className="pop-date-check">
          <div className="title">일정</div>
          <div>
            {selectedDate.toLocaleDateString("ko-KR")} {selectedTime}
          </div>
        </div>
        <div className="pop-people-check">
          <div className="title">인원</div>
          <div>{peopleCount}명</div>
        </div>
      </div>
      <div className="person-content-check">
        <div className="person-content-title">예약자 정보</div>
        <div className="person-name-check">
          <div className="title">예약자</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <img src={edit} />
        </div>
        <div className="person-number-check">
          <div className="title">연락처</div>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <img src={edit} />
        </div>
        <div className="person-email-check">
          <div className="title">이메일</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <img src={edit} />
        </div>
      </div>
      <div className="agree">
        <div className="agree-title">개인정보 수집, 제공 동의</div>
        <div className="agree-collect">
          <div>개인정보 수집 동의</div>
          <img src={nextButton} />
        </div>
        <div className="agree-offer">
          <div>개인정보 제공 동의</div>
          <img src={nextButton} />
        </div>
      </div>
      <div className="content-check-agree">
        예약 서비스 이용을 위한 개인정보 수집 및 제3자 제공 규정을 확인하였으며
        이에 동의합니다.
      </div>
      <div className="reservation-fin">
        <button onClick={reservationFin}>예약하기</button>
      </div>
    </div>
  );
}

export default PopReservationCheck;
