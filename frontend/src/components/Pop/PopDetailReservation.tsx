import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useNavigate } from "react-router-dom";
import "@css/Pop/PopDetailReservation.css";
import "react-calendar/dist/Calendar.css";

interface Hours {
  [key: string]: string;
}

interface ReservationProps {
  title: string;
  hours: string;
  preReservationOpenAt?: string | null;
  term?: number | null;
  maxPeoplePerSession?: number | null;
  maxReservationsPerPerson?: number | null;
  warning?: string | null;
  popupId: number;
}

const Reservation = ({
  title,
  hours,
  preReservationOpenAt,
  term,
  maxReservationsPerPerson,
  warning,
  popupId
}: ReservationProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [times, setTimes] = useState<string[]>([]);
  const navigate = useNavigate();

  // 시간 버튼 생성
  useEffect(() => {
    if (preReservationOpenAt && term && hours) {
      const openAt = new Date(preReservationOpenAt);
      const currentTime = new Date();

      if (currentTime >= openAt) {
        const dayOfWeek = selectedDate.toLocaleString("ko-KR", {
          weekday: "long",
        });
        const trimmedDayOfWeek = dayOfWeek.substring(0, 1);

        let parsedHours: Hours;
        try {
          parsedHours = JSON.parse(hours.replace(/'/g, '"'));
        } catch (e) {
          console.error("hours 문자열을 파싱하는 중 오류 발생:", e);
          return;
        }

        const timeRange = parsedHours[trimmedDayOfWeek];

        if (timeRange) {
          const [startHourStr, endHourStr] = timeRange.split(" ~ ");
          const [startHour, startMinute] = startHourStr.split(":").map(Number);
          const [endHour, endMinute] = endHourStr.split(":").map(Number);

          const startTime = startHour * 60 + startMinute;
          const endTime = endHour * 60 + endMinute;
          const termInMinutes = term;

          const hoursArray = [];

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
    }
  }, [preReservationOpenAt, term, hours, selectedDate]);

  // 예약 시간 선택
  const onTimeClick = (time: string) => {
    setSelectedTime(time);
  };
  // + 버튼
  const onClickPlus = () => {
    setPeopleCount((prev) => {
      const maxPeople = maxReservationsPerPerson || 1;
      return prev < maxPeople ? prev + 1 : prev;
    });
  };
  // - 버튼
  const onClickMinus = () => {
    setPeopleCount((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const goNextStep = () => {
    if (peopleCount > 0 && selectedTime) {
      navigate("/reservation-check", {
        state: {
          title,
          selectedDate,
          selectedTime,
          peopleCount,
          popupId,
        },
      });
    } else {
      alert("예약 인원과 시간을 선택해주세요.");
    }
  };

  const handleDateChange = (value: Date | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  return (
    <div id="pop-reservation">
      <div className="pop-calendar">
        <div className="content-title">예약 날짜</div>
        <Calendar
          onChange={(value) => handleDateChange(value as Date)}
          value={selectedDate}
          calendarType="gregory"
          formatDay={(_, date) => date.getDate().toString()}
          tileClassName={({ date, view }) =>
            view === "month" &&
            date.toDateString() === selectedDate.toDateString()
              ? "selected-date"
              : ""
          }
        />
      </div>
      <div className="res-time">
        <div className="content-title">예약 시간</div>
        <div className="time-buttons">
          {times.map((time) => (
            <button
              key={time}
              onClick={() => onTimeClick(time)}
              className={selectedTime === time ? "selected-time" : ""}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="content-title">예약 인원</div>
        <div className="counter">
          <div className="people-counter">
            <button onClick={onClickMinus}>-</button>
            <span>{peopleCount}명</span>
            <button onClick={onClickPlus}>+</button>
          </div>
        </div>
      </div>
      <div>
        <div className="content-title">주의사항</div>
        <div className="caution">
          {(warning || "").split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
      <div className="next">
        <button onClick={goNextStep}>다음 단계로 이동</button>
      </div>
    </div>
  );
};

export default Reservation;
