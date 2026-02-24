import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyPopups } from "@api/apiPop";
import useAuthStore from "@store/useAuthStore";

import nextButton from "@assets/mypage/nextButton.svg";
import none from "@assets/none.svg";

interface Popup {
  popupId: number;
  images: string[];
  name: string;
  checkPreReservation: boolean;
}

const PrePopStateList = () => {
  const { userTsid: userTsid } = useAuthStore();
  const [myPopups, setMyPopups] = useState<Popup[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userTsid) {
        return;
      }
      try {
        // 매니저의 팝업 스토어 정보 가져오기
        const popups: Popup[] = await getMyPopups(userTsid);
        const filteredPopups = popups.filter(
          (popup) => popup.checkPreReservation
        );
        setMyPopups(filteredPopups);
      } catch (error) {
        console.error("데이터를 불러오는 중 에러 발생:", error);
      }
    };

    fetchData();
  }, [userTsid]);

  return (
    <div id="pre-pop-list">
      {myPopups.length > 0 ? (
        myPopups.map((popup, index) => (
          <Link
            to={`/mypage/pre-reservation-management/${popup.popupId}`}
            key={index}
            className="popup-card"
          >
            <div className="popup-image">
              <img
                src={`http://localhost/${popup.images[0].replace("./", "")}`}
                alt={popup.name}
              />
            </div>
            <div className="popup-details">
              <p className="popup-name">{popup.name}</p>
              <div className="go-detail-page">
                상세 페이지로 이동
                <img src={nextButton} />
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="none-registed-contents">
          <img src={none} />
          <p>사전 예약이 등록된 팝업이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default PrePopStateList;
