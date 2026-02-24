import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useParams } from "react-router-dom";
import { getPopupDetail } from "@api/apiPop";
import { getPreReservations } from "@api/reservation";
import { PopupWithPreReservationDTO } from "@interface/popDetail";

import "@css/ManagerPage/MyPreReservationState.css";
import search from "@assets/search.svg";

interface PreReservationResponseDTO {
  preReservationId: number;
  userTsid: string;
  popupId: number;
  reservationDate: string;
  reservationTime: string;
  reservationCount: number;
  createdAt: string;
  reservationStatementId: number;
}

interface Hours {
  [key: string]: string;
}

const MyPreReservationState = () => {
  const { popupId } = useParams<{ popupId: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reservationData, setReservationData] = useState<
    PreReservationResponseDTO[]
  >([]);
  const [times, setTimes] = useState<string[]>([]);
  const [popupDetails, setPopupDetails] =
    useState<PopupWithPreReservationDTO | null>(null);
  const [modalData, setModalData] = useState<{
    name: string;
    date: Date;
    time: string;
  } | null>(null);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const fetchPopupDetails = async () => {
      if (!popupId) return;
      try {
        const data = await getPopupDetail(parseInt(popupId, 10));
        setPopupDetails(data);
      } catch (error) {
        console.error("Failed to fetch popup details:", error);
      }
    };

    fetchPopupDetails();
  }, [popupId]);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!selectedDate || !popupId) return;
      try {
        const formattedDate = selectedDate.toISOString().split("T")[0];
        const response = await getPreReservations(parseInt(popupId, 10), formattedDate);
        setReservationData(response);
      } catch (error) {
        console.error("Failed to fetch reservation data:", error);
      }
    };
  
    fetchReservations();
  }, [selectedDate, popupId]);
  
  // 시간 생성 로직
  useEffect(() => {
    if (!popupDetails || !selectedDate) return;

    const { term, hours } = popupDetails;

    if (term && hours) {
      const dayOfWeek = selectedDate.toLocaleString("ko-KR", {
        weekday: "long",
      });
      const trimmedDayOfWeek = dayOfWeek.substring(0, 1);

      const parsedHours: Hours = JSON.parse(hours.replace(/'/g, '"'));
      const timeRange = parsedHours[trimmedDayOfWeek];

      if (timeRange) {
        const [startHourStr, endHourStr] = timeRange.split(" ~ ");
        const [startHour, startMinute] = startHourStr.split(":").map(Number);
        const [endHour, endMinute] = endHourStr.split(":").map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        const termInMinutes = term;

        const hoursArray: string[] = [];

        for (let i = startTime; i < endTime; i += termInMinutes) {
          const hourString = Math.floor(i / 60)
            .toString()
            .padStart(2, "0");
          const minuteString = (i % 60).toString().padStart(2, "0");
          const time = `${hourString}:${minuteString}`;
          hoursArray.push(time);
        }

        setTimes(hoursArray);
      }
    }
  }, [popupDetails, selectedDate]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCheckboxClick = (name: string, date: Date, time: string) => {
    setModalData({ name, date, time });
  };

  const handleModalConfirm = () => {
    if (modalData) {
      const key = `${modalData.name}-${modalData.date.toDateString()}-${
        modalData.time
      }`;
      setCheckedItems((prev) => ({ ...prev, [key]: true }));
      setModalData(null);
    }
  };

  const handleModalCancel = () => {
    setModalData(null);
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/-/g, "");
  };

  const filteredData = reservationData.filter((item) => {
    const isDateMatch =
      selectedDate &&
      new Date(item.reservationDate).toDateString() ===
        selectedDate.toDateString();
    const isTimeMatch = !selectedTime || item.reservationTime === selectedTime;
    const isSearchMatch =
      item.userTsid.includes(searchTerm) ||
      formatPhone(item.userTsid).includes(searchTerm.replace(/-/g, ""));
    return isDateMatch && isTimeMatch && isSearchMatch;
  });

  return (
    <div id="my-pre-reservation-state">
      <div className="title">{popupDetails?.name} 예약자 목록</div>
      <div className="reservation-calendar">
        <Calendar
          onChange={() => handleDateClick}
          value={selectedDate}
          calendarType="gregory"
          formatDay={(_, date) => date.getDate().toString()}
          tileClassName={({ date, view }) =>
            view === "month" &&
            date.toDateString() ===
              (selectedDate && selectedDate.toDateString())
              ? "selected-date"
              : ""
          }
          prevLabel={<button>{"<"}</button>}
          nextLabel={<button>{">"}</button>}
          navigationLabel={({ label }) => (
            <div className="nav-label">{label}</div>
          )}
        />
      </div>
      <div className="search">
        <input
          placeholder="사용자 이름 혹은 연락처를 검색해주세요."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <img src={search} alt="검색" />
      </div>
      <div className="list">
        <div className="list-title">
          <div className="name">예약자</div>
          <div className="number">예약 수</div>
          <div className="time">
            <select onChange={handleTimeChange} value={selectedTime || ""}>
              <option value="">시간</option>
              {times.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div className="is-enter">입장여부</div>
        </div>
        {filteredData.map((item, index) => {
          const key = `${item.userTsid}-${item.reservationDate}-${item.reservationTime}`;
          return (
            <div key={index} className="list-content">
              <div className="name">{item.userTsid}</div>
              <div className="number">{item.reservationCount}</div>
              <div className="time">{item.reservationTime}</div>
              <div className="is-enter">
                <input
                  type="checkbox"
                  checked={checkedItems[key] || false}
                  onChange={() =>
                    handleCheckboxClick(
                      item.userTsid,
                      new Date(item.reservationDate),
                      item.reservationTime
                    )
                  }
                  disabled={checkedItems[key] || false} // 체크 후 상태 변경 불가
                />
              </div>
            </div>
          );
        })}
      </div>
      {modalData && (
        <div className="modal">
          <div className="modal-content">
            <p>{modalData.name}님을 입장 처리 하시겠습니까?</p>
            <div>(처리 이후에는 수정이 불가능합니다.)</div>
            <div className="buttons">
              <button className="cancel" onClick={handleModalCancel}>
                취소
              </button>
              <button className="ok" onClick={handleModalConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPreReservationState;
