import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSimilarPopups, PopupDTO } from "@api/apiPop";
import "@css/Pop/PopDetailInfo.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import locateIcon from "@assets/locate.svg";
import clock from "@assets/clock.svg";
import scheduleOpen from "@assets/schedule_open.svg";
import scheduleClose from "@assets/schedule_close.svg";
import homepageIcon from "@assets/homepageIcon.svg";
import insta from "@assets/insta.svg";
import parkingIcon from "@assets/popService/parkingIcon.svg";
import feeIcon from "@assets/popService/noFeeIcon.svg";
import petIcon from "@assets/popService/petIcon.svg";
import foodIcon from "@assets/popService/foodIcon.svg";
import photoIcon from "@assets/popService/photoIcon.svg";
import ageLimitIcon from "@assets/popService/noAgeLimitIcon.svg";
import noParkingIcon from "@assets/popService/noParkingIcon.svg";
import noFeeIcon from "@assets/popService/feeIcon.svg";
import noPetIcon from "@assets/popService/noPetIcon.svg";
import noFoodIcon from "@assets/popService/noFoodIcon.svg";
import noPhotoIcon from "@assets/popService/noPhotoIcon.svg";
import noAgeLimitIcon from "@assets/popService/ageLimitIcon.svg";
import { getPopupByNew, PopupProps } from "@api/home";

type Category = "parking" | "fee" | "pet" | "food" | "photo" | "age";

interface InfoProps {
  isEditing: boolean;
  location: string;
  hours: string;
  website: string;
  instagram: string;
  content: string;
  description: string;
  lat: number;
  lon: number;
  popupId: string | undefined;
  onLocationChange: (location: string) => void;
  onHoursChange: (hours: string) => void;
  onWebsiteChange: (website: string) => void;
  onInstagramChange: (instagram: string) => void;
  onContentChange: (content: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
}

const serviceIcons: Record<Category, { true: string; false: string }> = {
  parking: { true: parkingIcon, false: noParkingIcon },
  fee: { true: feeIcon, false: noFeeIcon },
  pet: { true: petIcon, false: noPetIcon },
  food: { true: foodIcon, false: noFoodIcon },
  photo: { true: photoIcon, false: noPhotoIcon },
  age: { true: ageLimitIcon, false: noAgeLimitIcon },
};

const Info: React.FC<InfoProps> = ({
  isEditing,
  location,
  hours,
  website,
  instagram,
  content,
  description,
  lat,
  lon,
  popupId,
  onLocationChange,
  onWebsiteChange,
  onInstagramChange,
  onContentChange,
  onDescriptionChange,
}) => {
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState("");
  const [parsedHours, setParsedHours] = useState<Record<string, string>>({});
  const [parsedDescription, setParsedDescription] = useState<
    Record<string, string>
  >({});
  const [similarPopups, setSimilarPopups] = useState<PopupProps[]>([]);
  const navigate = useNavigate();

  // 운영 시간
  useEffect(() => {
    try {
      const now = new Date();
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const currentDayName = dayNames[now.getDay()];
      setCurrentDay(currentDayName);

      if (hours) {
        const hoursObj = JSON.parse(hours);
        setParsedHours(hoursObj);

        const businessHours = hoursObj[currentDayName]?.split("~");
        if (businessHours && businessHours.length === 2) {
          const openTime = new Date();
          const closeTime = new Date();

          openTime.setHours(
            parseInt(businessHours[0].split(":")[0]),
            parseInt(businessHours[0].split(":")[1])
          );
          closeTime.setHours(
            parseInt(businessHours[1].split(":")[0]),
            parseInt(businessHours[1].split(":")[1])
          );

          if (now >= openTime && now <= closeTime) {
            setIsBusinessOpen(true);
          } else {
            setIsBusinessOpen(false);
          }
        }
      }
    } catch (error) {
      console.error("Error parsing hours:", error);
    }
  }, [hours]);

  // 지도 불러오기
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//dapi.kakao.com/v2/maps/sdk.js?appkey=c306f7459b9ef7c16b36d8fea7076bb1&autoload=false";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      kakao.maps.load(() => {
        const mapContainer = document.getElementById("map");
        if (mapContainer) {
          const mapOption = {
            center: new kakao.maps.LatLng(lat, lon),
            level: 3,
          };
          const map = new kakao.maps.Map(mapContainer, mapOption);

          const markerPosition = new kakao.maps.LatLng(lat, lon);
          const marker = new kakao.maps.Marker({
            position: markerPosition,
          });
          marker.setMap(map);
        } else {
          console.error("Map container element not found");
        }
      });
    };
  }, [lat, lon]);

  // 서비스(description) 설정
  useEffect(() => {
    try {
      if (description) {
        const parsedDescription = (description: string) => {
          const pairs = description.slice(1, -1).split(",");
          const result: Record<string, string> = {};
          pairs.forEach((pair) => {
            const [key, value] = pair.split(":");
            if (key && value) {
              result[key.trim().replace(/"/g, "")] = value
                .trim()
                .replace(/"/g, "");
            }
          });
          return result;
        };

        setParsedDescription(parsedDescription(description));
      }
    } catch (error) {
      console.error("Error parsing desrciption:", error);
    }
  }, [description]);

  // 서비스(description) 목록들 확인
  const isChecked = (key: string, value: string): boolean => {
    if (key === "age") {
      return value === "19세 이상";
    }
    if (key === "fee") {
      return value === "무료";
    }
    return value === "가능";
  };
  // 유사 팝업스토어 불러오기
  useEffect(() => {
    if (!popupId) {
      console.log("popupId가 없어");
      return;
    }
    const fetchSimilarPopups = async () => {
      try {

        const data = await getPopupByNew();
        // const data = await getSimilarPopups(Number(popupId));
        setSimilarPopups(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching similar popups:", error);
      }
    };
    fetchSimilarPopups();
  }, [popupId]);

  // 영업 시간 토글 버튼
  const toggleSchedule = () => {
    setIsToggleOpen(!isToggleOpen);
  };

  return (
    <div id="pop-detail-info">
      <div className="locate">
        <img src={locateIcon} alt="위치 아이콘" />
        {isEditing ? (
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="edit-input"
          />
        ) : (
          location
        )}
      </div>
      <div className="schedule">
        <div className="schedule-isToggleOpen">
          <img src={clock} />
          {isBusinessOpen ? "영업 중" : "영업 종료"}
          <button onClick={toggleSchedule}>
            {isToggleOpen ? (
              <img src={scheduleClose} />
            ) : (
              <img src={scheduleOpen} />
            )}
          </button>
        </div>
        {isToggleOpen ? (
          <div className="schedule-detail">
            {Object.entries(parsedHours).map(([day, time]) => (
              <div
                key={day}
                className={day === currentDay ? "current-day" : ""}
              >
                {day}: {time}
              </div>
            ))}
          </div>
        ) : (
          <div className="schedule-detail">
            {currentDay}: {parsedHours[currentDay]}
          </div>
        )}
      </div>
      <div className="homepage">
        <img src={homepageIcon} />
        {isEditing ? (
          <input
            type="text"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
            className="edit-input"
          />
        ) : (
          <a href={website} target="_blank" rel="noopener noreferrer">
            {website}
          </a>
        )}
      </div>
      <div className="insta">
        <img src={insta} />
        {isEditing ? (
          <input
            type="text"
            value={instagram}
            onChange={(e) => onInstagramChange(e.target.value)}
            className="edit-input"
          />
        ) : (
          <a href={instagram} target="_blank" rel="noopener noreferrer">
            {instagram}
          </a>
        )}
      </div>
      <div className="service">
        <div className="service-icons">
          {Object.entries(parsedDescription).map(
            ([key, value]) =>
              value && (
                <div key={key} className="service-icon">
                  <img
                    src={
                      serviceIcons[key as Category][
                        isChecked(key, value) ? "true" : "false"
                      ]
                    }
                  />
                  {value}
                  {isEditing && (
                    <input
                      type="checkbox"
                      checked={isChecked(key, value)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? key === "age"
                            ? "19세 이상"
                            : key === "fee"
                            ? "무료"
                            : "가능"
                          : key === "age"
                          ? "전체연령"
                          : key === "fee"
                          ? "유료"
                          : "불가능";
                        onDescriptionChange(
                          JSON.stringify({
                            ...parsedDescription,
                            [key]: newValue,
                          })
                        );
                      }}
                      className="edit-checkbox"
                    />
                  )}
                </div>
              )
          )}
        </div>
      </div>
      <div className="introduce">
        <div className="introduce-title">팝업 스토어 소개</div>
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="edit-textarea"
          />
        ) : (
          content.split("\n").map((line, index) => (
            <p key={index} className="introduce-content">
              {line.trim() === "" ? <br /> : line}
            </p>
          ))
        )}
      </div>
      <div className="map-location">
        <div className="map-title">팝업 스토어 위치</div>
        <div
          id="map"
          style={{ width: "100%", height: "250px", marginBottom: "30px" }}
        ></div>
      </div>
      <div className="rel-pop-title">유사 팝업스토어</div>
      <div className="related-popups">
        {similarPopups.map((popup) => (
          <div
            key={popup.popupId}
            className="popup-item"
            onClick={() => navigate(`/popdetail/${popup.popupId}`)}
          >
            <img src={`http://localhost/${popup.images[0]}`} alt={popup.name} />
            <div className="rel-pop-info">
              <div className="popup-title">{popup.name}</div>
              <div className="popup-dates">{`${popup.startDate} ~ ${popup.endDate}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Info;
