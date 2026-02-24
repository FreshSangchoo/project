import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {getMyPopups} from "@api/apiPop";
import useAuthStore from "@store/useAuthStore";

import nextButton from "@assets/mypage/nextButton.svg";
import none from "@assets/none.svg";

interface Popup {
  popupId: number;
  images: string[];
  name: string;
  startDate: string;
  endDate: string;
  managerTsId: string;
  hours: string;
}

function OnsitePopList() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const { userTsid: userTsid } = useAuthStore();
  const managerTsid = userTsid;

  useEffect(() => {
    const fetchPopups = async () => {
      try {
        const response = await getMyPopups(managerTsid)
        const currentDateTime = new Date();
        const currentDay = currentDateTime.toLocaleString("ko-KR", {
          weekday: "short",
        });
        const onsitePopups = response.filter((popup: Popup) => {
          const startDate = new Date(popup.startDate);
          const endDate = new Date(popup.endDate);
          if (
            popup.managerTsId !== managerTsid ||
            currentDateTime < startDate ||
            currentDateTime > endDate
          ) {
            return false;
          }

          if (startDate < currentDateTime && currentDateTime < endDate)
            return true;

          const hoursObject = parseHoursFromString(popup.hours);
          if (!hoursObject[currentDay])
            return currentDateTime >= startDate && currentDateTime <= endDate;

          const hours = hoursObject[currentDay];
          const [start, end] = hours.split(" ~ ");
          const [startHour, startMinute] = start.split(":").map(Number);
          const [endHour, endMinute] = end.split(":").map(Number);

          const startDateTime = new Date();
          startDateTime.setHours(startHour, startMinute, 0, 0);

          const endDateTime = new Date();
          endDateTime.setHours(endHour, endMinute, 0, 0);

          return (
            currentDateTime >= startDateTime && currentDateTime <= endDateTime
          );
        });
        setPopups(onsitePopups);
      } catch (error) {
        console.error("Error fetching popups:", error);
      }
    };
    fetchPopups();
  }, [userTsid]);

  const parseHoursFromString = (
    hoursString: string
  ): { [key: string]: string } => {
    // JSON 형식의 문자열을 객체로 파싱
    const hoursObject = JSON.parse(hoursString);
    return hoursObject;
  };

  return (
    <div id="onsite-registed-list">
      {popups.length > 0 ? (
        popups.map((popup, index) => (
          <div
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
              <p className="popup-date">{`${popup.startDate} ~ ${popup.endDate}`}</p>
              <div className="go-detail-page">
                <Link to={`/popdetail/${popup.popupId}`} className="popup-link">
                  상세 페이지로 이동
                  <img src={nextButton} alt="Next" />
                </Link>
              </div>
              <div className="go-detail-page">
                <Link to={`/onsite-reservation/${popup.popupId}`} className="popup-link">
                  현장 예약 페이지로 이동
                  <img src={nextButton} alt="Next" />
                </Link>
              </div>
            </div>
          </div>
        ))
      ) : (
          <div className="none-registed-contents">
            <img src={none}/>
            <p>아직 등록한 팝업이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

export default OnsitePopList;
