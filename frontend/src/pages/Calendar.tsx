import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "@css/Calendar.css";
import "react-calendar/dist/Calendar.css";
import { getPopupList } from "@api/apiPop";

type ViewType = "month" | "year" | "decade" | "century";
type Value = Date | Date[] | null | [Date | null, Date | null];

interface PopupEvent {
  popupId: number;
  startDate: Date;
  endDate: Date;
  title: string;
  content: string;
  image: string;
}

interface PopupResponse {
  popupId: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  images: string[];
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [popupEvents, setPopupEvents] = useState<PopupEvent[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    setCurrentMonth(`${month}월`);

    // 전체 팝업 데이터를 가져와서 상태에 저장
    const fetchPopupEvents = async () => {
      try {
        const data = await getPopupList(); // 전체 팝업 조회 API 호출
        const events = data.map((popup: PopupResponse) => ({
          popupId: popup.popupId,
          startDate: new Date(popup.startDate),
          endDate: new Date(popup.endDate),
          title: popup.name,
          content: popup.description,
          image: popup.images[0], // 첫 번째 이미지를 사용
        }));
        setPopupEvents(events); // 상태에 저장
      } catch (error) {
        console.error("Error fetching popup events:", error);
      }
    };

    fetchPopupEvents();
  }, []);

  const handleDateClick = (value: Value) => {
    if (Array.isArray(value)) {
      setSelectedDate(value[0] || null);
    } else {
      setSelectedDate(value);
    }
  };

  const handleBackToCalendar = () => {
    setSelectedDate(null);
  };

  const getTileClassName = ({ date, view }: { date: Date; view: ViewType }) => {
    if (view === "month") {
      const day = date.getDay();
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return "today";
      } else if (day === 0) {
        return "sunday";
      } else if (day === 6) {
        return "saturday";
      } else {
        return "";
      }
    }
    return "";
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}. ${month}. ${day}.`;
  };

  const formatDateWithDay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return date.toLocaleDateString("ko-KR", options);
  };

  const renderTileContent = ({
    date,
    view,
  }: {
    date: Date;
    view: ViewType;
  }) => {
    if (view === "month" && !selectedDate) {
      const startEvents = popupEvents.filter(
        (event) => date.toDateString() === event.startDate.toDateString()
      );
      const endEvents = popupEvents.filter(
        (event) => date.toDateString() === event.endDate.toDateString()
      );

      return (
        <div className="event-tiles">
          {startEvents.map((event, index) => (
            <div key={`start-${index}`} className="event-tile">
              <span className="event-dot"></span>
              <span className="event-title">{event.title.slice(0, 5)}</span>
            </div>
          ))}
          {endEvents.map((event, index) => (
            <div key={`end-${index}`} className="event-tile">
              <span className="event-dot end-date"></span>
              <span className="event-title">{event.title.slice(0, 5)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPopupInfo = () => {
    if (selectedDate) {
      const events = popupEvents.filter(
        (event) =>
          selectedDate >= event.startDate && selectedDate <= event.endDate
      );

      return (
        <div>
          <div className="selected-date-info">
            {formatDateWithDay(selectedDate)}
          </div>
          {events.length > 0 ? (
            <div className="popup-info">
              {events.map((event) => (
                <div
                  key={event.popupId}
                  className="popup-info-item"
                  onClick={() => navigate(`/popdetail/${event.popupId}`)}
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="popup-info-image"
                  />
                  <div className="popup-info-text">
                    <div className="popup-info-text-title">{event.title}</div>
                    <p className="popup-info-text-date">{`${formatDate(
                      event.startDate
                    )} ~ ${formatDate(event.endDate)}`}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="popup-info-text-none">
              선택한 날짜에는 팝업스토어 정보가 없어요.
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="calendar" className={selectedDate ? "small" : ""}>
      <div className="calendarpage-content-title">
        {currentMonth}의 팝업 일정
      </div>
      <div className="calendarpage-content">
        <Calendar
          onChange={(value) => handleDateClick(value)}
          value={selectedDate || new Date()}
          calendarType="gregory"
          formatDay={(_, date) => date.getDate().toString()}
          tileClassName={({ date, view }) =>
            view === "month" &&
            date.toDateString() ===
              (selectedDate && selectedDate.toDateString())
              ? "selected-date"
              : getTileClassName({ date, view })
          }
          tileContent={renderTileContent}
          prevLabel={<button>{"<"}</button>}
          nextLabel={<button>{">"}</button>}
          navigationLabel={({ label }) => (
            <div className="nav-label">{label}</div>
          )}
        />
      </div>
      {selectedDate && (
        <div className="back-to-calendar">
          <button onClick={handleBackToCalendar}>▼</button>
          {renderPopupInfo()}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
