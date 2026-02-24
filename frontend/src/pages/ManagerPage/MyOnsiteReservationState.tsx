import React, { useState } from "react";
import "@css/ManagerPage/MyOnsiteReservationState.css";

interface Reservation {
  id: number;
  name: string;
  personnel: number;
  time: string;
  isEnter: boolean | null;
}

const dummyData: Reservation[] = [
  { id: 1, name: "김김김", personnel: 2, time: "9:00", isEnter: null },
  { id: 2, name: "박박박", personnel: 3, time: "10:00", isEnter: null },
  { id: 3, name: "이이이", personnel: 1, time: "11:00", isEnter: null },
  { id: 4, name: "최최최", personnel: 1, time: "9:00", isEnter: null },
  { id: 5, name: "이이이", personnel: 5, time: "9:00", isEnter: null },
  { id: 6, name: "이이이", personnel: 5, time: "9:00", isEnter: null },
];

const times = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

function MyOnsiteReservationState() {
  const [selectedTime, setSelectedTime] = useState<string>(times[0]);
  const [modalData, setModalData] = useState<{
    id: number;
    name: string;
    action: string;
  } | null>(null);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(event.target.value);
  };

  const handleButtonClick = (id: number, name: string, action: string) => {
    setModalData({ id, name, action });
  };

  const handleModalConfirm = () => {
    if (modalData) {
      const index = dummyData.findIndex((item) => item.id === modalData.id);
      if (index !== -1) {
        dummyData[index].isEnter = modalData.action === "enter" ? true : false;
      }
      setModalData(null);
    }
  };

  const handleModalCancel = () => {
    setModalData(null);
  };

  const filteredData = dummyData.filter((item) => item.time === selectedTime);

  return (
    <div id="my-onsite-reservation-state">
      <div className="title">뉴진스 How Sweet 팝업스토어</div>
      <div className="tab">
        <select onChange={handleSelectChange} value={selectedTime}>
          {times.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
      <div className="list">
        <div className="list-title">
          <div className="order">번호</div>
          <div className="name">이름</div>
          <div className="personnel">인원</div>
          <div className="is-enter">입장여부</div>
        </div>
        {filteredData.map((item, index) => (
          <div key={item.id} className="list-content">
            <div className="order">{index + 1}</div>
            <div className="name">{item.name}</div>
            <div className="personnel">{item.personnel}</div>
            <div className="is-enter-buttons">
              <button
                className={`enter-button ${
                  item.isEnter === true ? "entered" : ""
                }`}
                onClick={() => handleButtonClick(item.id, item.name, "enter")}
                disabled={item.isEnter !== null}
              >
                입장
              </button>
              <button
                className={`no-enter-button ${
                  item.isEnter === false ? "no-entered" : ""
                }`}
                onClick={() =>
                  handleButtonClick(item.id, item.name, "no-enter")
                }
                disabled={item.isEnter !== null}
              >
                미입장
              </button>
            </div>
          </div>
        ))}
      </div>
      {modalData && (
        <div className="modal">
          <div className="modal-content">
            <p>
              {modalData.name}님을{" "}
              {modalData.action === "enter" ? "입장" : "미입장"} 처리
              하시겠습니까?
            </p>
            <div>(처리 이후에는 수정할 수 없습니다.)</div>
            <div className="buttons">
              <button onClick={handleModalCancel}>취소</button>
              <button className="ok" onClick={handleModalConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOnsiteReservationState;
