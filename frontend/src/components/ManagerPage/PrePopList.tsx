import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {getMyPopups} from "@api/apiPop";

import nextButton from "@assets/mypage/nextButton.svg";
import none from "@assets/none.svg";
import useAuthStore from "@store/useAuthStore.ts";

interface Popup {
  popupId: number;
  images: string[];
  name: string;
  startDate: string;
  endDate: string;
  managerTsId: string;
  hours: string;
}

const PrePopList = () => {
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

        const prePopups = response.filter((popup: Popup) => {
          const startDate = new Date(popup.startDate);
          if (
            popup.managerTsId !== managerTsid ||
            currentDateTime >= startDate
          ) {
            return false;
          }

          const hoursObject = parseHoursFromString(popup.hours);
          if (!hoursObject[currentDay]) return currentDateTime < startDate;

          const hours = hoursObject[currentDay];
          const [start] = hours.split(" ~ ");
          const [startHour, startMinute] = start.split(":").map(Number);

          const startDateTime = new Date(startDate);
          startDateTime.setHours(startHour, startMinute, 0, 0);
          return currentDateTime < startDateTime;
        });
        setPopups(prePopups);
      } catch (error) {
        console.error("Error fetching popups:", error);
      }
    };
    fetchPopups();
  }, []);

  const parseHoursFromString = (
    hoursString: string
  ): { [key: string]: string } => {
    // JSON 형식의 문자열을 객체로 파싱
    const hoursObject = JSON.parse(hoursString);
    return hoursObject;
  };

  return (
    <div id="pre-pop-list">
      {popups.length > 0 ? (
        popups.map((popup, index) => (
          <Link
            to={`/popdetail/${popup.popupId}`}
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
                상세 페이지로 이동
                <img src={nextButton} />
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="none-registed-contents">
          <img src={none} />
          <p>아직 등록한 팝업이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default PrePopList;
