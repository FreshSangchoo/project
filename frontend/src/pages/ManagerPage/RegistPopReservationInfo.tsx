import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import DatePicker from "react-datepicker";
import usePopupStore from "store/usePopupStore";
import useAuthStore from "@store/useAuthStore";
import { createPopup } from "api/apiPop";
import "react-datepicker/dist/react-datepicker.css";
import "@css/ManagerPage/RegistPopReservationInfo.css";

import thirdStep from "@assets/registPop/thirdStep.svg";

interface HeaderProps {
  date: Date;
  changeMonth: (month: number) => void;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
}

function RegistPopReservationInfo() {
  const { userTsid: userTsid } = useAuthStore();
  const [selectedOpenTimeHour, setSelectedOpenTimeHour] = useState<string>("");
  const [selectedOpenTimeMinute, setSelectedOpenTimeMinute] =
    useState<string>("");
  const {
    storeName,
    storeContent,
    selectedImages,
    startDate,
    endDate,
    address,
    lat,
    lon,
    categories,
    snsUrl,
    pageUrl,
    timeSlots,
    description,
    preReservationOpenAt,
    term,
    maxPeoplePerSession,
    maxReservationsPerPerson,
    warning,
    setPreReservationOpenAt,
    setTerm,
    setMaxPeoplePerSession,
    setMaxReservationsPerPerson,
    setWarning,
  } = usePopupStore();
  const navigate = useNavigate();

  // 팝업 등록
  const mutation = useMutation(createPopup, {
    onSuccess: () => {
      alert("팝업이 성공적으로 등록되었습니다.");
      navigate("/regist-pop-fin");
    },
    onError: (error) => {
      console.error("Error creating popup:", error);
      alert("팝업 등록 중 오류가 발생했습니다.");
    },
  });

  const handleSubmit = async () => {
    const formattedPreReservationOpenAt = preReservationOpenAt
      ? `${preReservationOpenAt.getFullYear()}-${(
          preReservationOpenAt.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${preReservationOpenAt
          .getDate()
          .toString()
          .padStart(2, "0")}T${preReservationOpenAt
          .getHours()
          .toString()
          .padStart(2, "0")}:${preReservationOpenAt
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      : "";

    mutation.mutate({
      url: "/popups/preReservation",
      popupDto: {
        name: storeName,
        content: storeContent,
        startDate: startDate || "",
        endDate: endDate || "",
        hours: JSON.stringify(timeSlots),
        snsUrl: snsUrl || "",
        pageUrl: pageUrl || "",
        description: description || "",
        address,
        lat: lat || 0,
        lon: lon || 0,
        images: selectedImages,
        managerTsid: userTsid || "",
        preReservationOpenAt: formattedPreReservationOpenAt,
        term: term || 1,
        maxPeoplePerSession: maxPeoplePerSession || 1,
        maxReservationsPerPerson: maxReservationsPerPerson || 1,
        warning: warning || "",
        categories: categories,
      },
    });
    console.log(userTsid);
  };

  const renderCustomHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: HeaderProps) => (
    <div className="custom-header">
      <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
        {"<"}
      </button>
      <span className="custom-header__date">
        {date.toLocaleString("ko", { month: "long" })}
      </span>
      <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
        {">"}
      </button>
    </div>
  );

  // 시
  const hourOptions = Array.from({ length: 24 }, (_, i) => (
    <option key={i} value={i < 10 ? `0${i}` : i}>
      {i < 10 ? `0${i}` : i}
    </option>
  ));
  // 분
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (
    <option key={i * 5} value={i * 5 < 10 ? `0${i * 5}` : i * 5}>
      {i * 5 < 10 ? `0${i * 5}` : i * 5}
    </option>
  ));

  return (
    <div id="regist-pop-reservation">
      <div className="regist-pop-reservation-title">팝업스토어 예약 정보</div>
      <div className="step-three">
        <img src={thirdStep} />
      </div>
      <div className="setting-advance-reservation">
        <div className="advance-reservation-title">사전 예약 설정</div>
        <div className="advance-reservation-content">
          <div className="reservation-open-date">
            <div className="reservation-open-title">사전 예약 오픈일</div>
            <div className="select-open-date">
              <div className="date-term">
                <DatePicker
                  className="open-date-input"
                  selected={preReservationOpenAt}
                  onChange={(preReservationOpenAt) => {
                    setPreReservationOpenAt(preReservationOpenAt);
                  }}
                  placeholderText="연. 월. 일"
                  dateFormat="Y. M. d."
                  locale="ko"
                  renderCustomHeader={renderCustomHeader}
                />
              </div>
              <div className="reservation-open-time-input">
                <div className="time-input-group">
                  <select
                    value={selectedOpenTimeHour}
                    onChange={(e) => {
                      setSelectedOpenTimeHour(e.target.value);
                      if (preReservationOpenAt) {
                        const newDate = new Date(preReservationOpenAt);
                        newDate.setHours(parseInt(e.target.value));
                        setPreReservationOpenAt(newDate);
                      }
                    }}
                    className="time-picker"
                  >
                    <option value="">--</option>
                    {hourOptions}
                  </select>
                  <span className="time-colon">:</span>
                  <select
                    value={selectedOpenTimeMinute}
                    onChange={(e) => {
                      setSelectedOpenTimeMinute(e.target.value);
                      if (preReservationOpenAt) {
                        const newDate = new Date(preReservationOpenAt);
                        newDate.setMinutes(parseInt(e.target.value));
                        setPreReservationOpenAt(newDate);
                      }
                    }}
                    className="time-picker"
                  >
                    <option value="">--</option>
                    {minuteOptions}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="time-term">
            <div>회차 간격</div>
            <div className="interval-input">
              <input
                type="number"
                value={term}
                onChange={(e) => {
                  setTerm(parseInt(e.target.value));
                }}
              />
              분 단위
            </div>
          </div>
          <div className="max-count">
            <div className="max-count-title">회차별 최대 인원</div>
            <div>
              <input
                type="number"
                value={maxPeoplePerSession}
                onChange={(e) => {
                  setMaxPeoplePerSession(parseInt(e.target.value));
                }}
              />
              명
            </div>
          </div>
          <div className="max-reservation-per-person">
            <div>1인 최대 예약 가능 수</div>
            <div>
              <input
                type="number"
                value={maxReservationsPerPerson}
                onChange={(e) => {
                  setMaxReservationsPerPerson(parseInt(e.target.value));
                }}
              />
              명
            </div>
          </div>
          <div className="caution">
            <div>예약시 주의사항</div>
            <textarea
              placeholder="추가적으로 안내할 사항을 입력하세요."
              value={warning}
              onChange={(e) => {
                setWarning(e.target.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="regist-finish">
        <button type="button" onClick={handleSubmit}>
          예약 등록 완료
        </button>
      </div>
    </div>
  );
}

export default RegistPopReservationInfo;
