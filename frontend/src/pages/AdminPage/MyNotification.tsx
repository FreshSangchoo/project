import React, { useState } from "react";
import "@css/AdminPage/MyNotification.css";
import deleteIcon from "@assets/deleteIcon.svg";
import { sendPush } from "@api/push";

interface Notification {
  title: string;
  content: string;
  status: string;
}

function MyNotification() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDeleteActions, setShowDeleteActions] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleAddNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const newNotification: Notification = {
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      content: (form.elements.namedItem("content") as HTMLTextAreaElement).value,
      status: "완료",
    };

    try {
      // 푸시 알림을 생성하여 서버에 전송
      await sendPush({
        title: newNotification.title,
        content: newNotification.content,
      });

      // 생성된 알림을 로컬 상태에 저장
      setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
      setShowModal(false);
    } catch (error) {
      console.error("Error scheduling push notification:", error);
      alert("알림 예약 중 오류가 발생했습니다.");
    }
  };

  const handleEditNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const updatedNotification: Notification = {
      ...selectedNotification!,
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      content: (form.elements.namedItem("content") as HTMLTextAreaElement).value,
      status: selectedNotification?.status || "완료",
    };

    try {
      // 수정된 푸시 알림을 서버에 전송
      await sendPush({
        title: updatedNotification.title,
        content: updatedNotification.content,
      });

      // 수정된 알림을 로컬 상태에 저장
      const updatedNotifications = notifications.map((notification) =>
          notification === selectedNotification ? updatedNotification : notification
      );

      setNotifications(updatedNotifications);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating notification:", error);
      alert("알림 수정 중 오류가 발생했습니다.");
    }
  };

  const handleTitleClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleRemoveNotification = (notification: Notification) => {
    setNotifications(notifications.filter((notif) => notif !== notification));
  };

  return (
      <div id="my-notification">
        <img
            src={deleteIcon}
            alt="Delete"
            onClick={() => setShowDeleteActions(!showDeleteActions)}
            className="delete-icon"
        />
        <div className="push-title">푸쉬 관리</div>
        <div className="push-content">
          <div className="content-type">
            <div className="title-column">제목</div>
            {!showDeleteActions && <div className="status-column">상태</div>}{" "}
            {showDeleteActions && <div className="action-column">제거</div>}{" "}
          </div>
          <div className="content-contents">
            {notifications.length === 0 ? (
                <div className="no-notifications">등록된 푸쉬 알림이 없습니다.</div>
            ) : (
                notifications.map((notification, index) => (
                    <div className="content-row" key={index}>
                      <div
                          className="title"
                          onClick={() => handleTitleClick(notification)}
                      >
                        {notification.title}
                      </div>
                      {!showDeleteActions && (
                          <div
                              className={`status-${
                                  notification.status === "대기"
                                      ? "waiting"
                                      : notification.status === "완료"
                                          ? "completed"
                                          : "deleted"
                              }`}
                          >
                            {notification.status}
                          </div>
                      )}
                      {showDeleteActions && (
                          <div className="actions">
                            <button
                                onClick={() => handleRemoveNotification(notification)}
                            >
                              -
                            </button>
                          </div>
                      )}
                    </div>
                ))
            )}
          </div>
        </div>
        <button className="add-notification" onClick={() => setShowModal(true)}>
          +
        </button>
        {showModal && (
            <div className="modal">
              <div className="modal-content">
                <form onSubmit={handleAddNotification}>
                  <div className="modal-header">푸쉬 등록</div>
                  <div className="modal-body">
                    <div className="modal-row">
                      <label>
                        <div>제목</div>
                        <input type="text" name="title" required />
                      </label>
                    </div>
                    <div className="modal-row">
                      <label>
                        <div>내용</div>
                        <textarea name="content" required></textarea>
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setShowModal(false)}>
                      취소
                    </button>
                    <button className="submit" type="submit">
                      등록
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
        {showDetailModal && selectedNotification && (
            <div className="modal">
              <div className="modal-content">
                <div className="modal-header">푸쉬 상세</div>
                <div className="modal-body">
                  <div className="modal-row">
                    <div className="title">제목</div>
                    <div className="content">{selectedNotification.title}</div>
                  </div>
                  <div className="modal-row">
                    <div className="title">내용</div>
                    <div className="content">{selectedNotification.content}</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowDetailModal(false)}>
                    닫기
                  </button>
                  <button
                      className="submit"
                      type="button"
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowEditModal(true);
                      }}
                  >
                    수정
                  </button>
                </div>
              </div>
            </div>
        )}
        {showEditModal && selectedNotification && (
            <div className="modal">
              <div className="modal-content">
                <form onSubmit={handleEditNotification}>
                  <div className="modal-header">푸쉬 수정</div>
                  <div className="modal-body">
                    <div className="modal-row">
                      <label>
                        <div>제목</div>
                        <input
                            type="text"
                            name="title"
                            defaultValue={selectedNotification.title}
                            required
                        />
                      </label>
                    </div>
                    <div className="modal-row">
                      <label>
                        <div>내용</div>
                        <textarea
                            name="content"
                            defaultValue={selectedNotification.content}
                            required
                        ></textarea>
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setShowEditModal(false)}>
                      취소
                    </button>
                    <button className="submit" type="submit">
                      수정
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}

export default MyNotification;


// import React, { useState, useEffect } from "react";
// import "@css/AdminPage/MyNotification.css";
// import deleteIcon from "@assets/deleteIcon.svg";
// import { sendPush } from "@api/push";
//
// interface Notification {
//   time: string;
//   title: string;
//   content: string;
//   status: string;
// }
//
// function MyNotification() {
//   const [showModal, setShowModal] = useState(false);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [showDeleteActions, setShowDeleteActions] = useState(false);
//   const [selectedDate, setSelectedDate] = useState({
//     year: "",
//     month: "",
//     day: "",
//     hour: "",
//     minute: "",
//   });
//   const [selectedNotification, setSelectedNotification] = useState<Notification|null>(null);
//
//   useEffect(() => {
//     if (showModal || showEditModal) {
//       const today = new Date();
//       setSelectedDate({
//         year: today.getFullYear().toString(),
//         month: (today.getMonth() + 1).toString().padStart(2, "0"),
//         day: today.getDate().toString().padStart(2, "0"),
//         hour: today.getHours().toString().padStart(2, "0"),
//         minute: today.getMinutes().toString().padStart(2, "0"),
//       });
//     }
//   }, [showModal, showEditModal]);
//
//   useEffect(() => {
//     if (showEditModal && selectedNotification) {
//       const [year, month, day, hour, minute] = selectedNotification.time
//         .split(/\. |:|\./)
//         .map((str: string, idx: number) =>
//           idx === 0 ? `20${str}` : str.padStart(2, "0")
//         );
//       setSelectedDate({ year, month, day, hour, minute });
//     }
//   }, [showEditModal, selectedNotification]);
//
//   const handleAddNotification = async (event: React.FormEvent) => {
//     event.preventDefault();
//     const { year, month, day, hour, minute } = selectedDate;
//     const form = event.target as HTMLFormElement;
//     const newNotification = {
//       time: `${year.slice(2)}. ${parseInt(month)}. ${parseInt(
//         day
//       )}. ${hour}:${minute}`,
//       title: (form.elements.namedItem("title") as HTMLInputElement).value,
//       content: (form.elements.namedItem("content") as HTMLTextAreaElement).value,
//       status: "대기",
//     };
//
//     const selectedDateTime = new Date(
//       parseInt(year),
//       parseInt(month) - 1,
//       parseInt(day),
//       parseInt(hour),
//       parseInt(minute)
//     ).getTime();
//     const currentDate = new Date().getTime();
//
//     if (selectedDateTime <= currentDate) {
//       alert("이미 지난 시간은 선택할 수 없습니다.");
//       return;
//     }
//
//     try {
//       // 푸시 알림을 생성하여 서버에 전송
//       await sendPush({
//         title: newNotification.title,
//         body: newNotification.content,
//         scheduledTime: selectedDateTime,
//       });
//
//       // 생성된 알림을 로컬 상태에 저장
//       const updatedNotifications = [...notifications, newNotification];
//       updatedNotifications.sort((a, b) => {
//         const aTime = new Date(
//           2000 + parseInt(a.time.split(". ")[0]),
//           parseInt(a.time.split(". ")[1]) - 1,
//           parseInt(a.time.split(". ")[2]),
//           parseInt(a.time.split(". ")[3].split(":")[0]),
//           parseInt(a.time.split(". ")[3].split(":")[1])
//         ).getTime();
//         const bTime = new Date(
//           2000 + parseInt(b.time.split(". ")[0]),
//           parseInt(b.time.split(". ")[1]) - 1,
//           parseInt(b.time.split(". ")[2]),
//           parseInt(b.time.split(". ")[3].split(":")[0]),
//           parseInt(b.time.split(". ")[3].split(":")[1])
//         ).getTime();
//         return aTime - bTime;
//       });
//       setNotifications(updatedNotifications);
//       setShowModal(false);
//     } catch (error) {
//       console.error("Error scheduling push notification:", error);
//       alert("알림 예약 중 오류가 발생했습니다.");
//     }
//   };
//
//   const handleEditNotification = async (event: React.FormEvent) => {
//     event.preventDefault();
//     const { year, month, day, hour, minute } = selectedDate;
//     const form = event.target as HTMLFormElement;
//     const updatedNotification: Notification = {
//       ...selectedNotification!,
//       time: `${year.slice(2)}. ${parseInt(month)}. ${parseInt(day)}. ${hour}:${minute}`,
//       title: (form.elements.namedItem("title") as HTMLInputElement).value,
//       content: (form.elements.namedItem("content") as HTMLTextAreaElement).value,
//       status: selectedNotification?.status || "대기",
//     };
//
//     const selectedDateTime = new Date(
//       parseInt(year),
//       parseInt(month) - 1,
//       parseInt(day),
//       parseInt(hour),
//       parseInt(minute)
//     ).getTime();
//     const currentDate = new Date().getTime();
//
//     if (selectedDateTime <= currentDate) {
//       alert("이미 지난 시간은 선택할 수 없습니다.");
//       return;
//     }
//
//     try {
//       // 수정된 푸시 알림을 서버에 전송
//       await sendPush({
//         title: updatedNotification.title,
//         body: updatedNotification.content,
//         scheduledTime: selectedDateTime,
//       });
//
//       // 수정된 알림을 로컬 상태에 저장
//       const updatedNotifications = notifications.map((notification) =>
//         notification === selectedNotification ? updatedNotification : notification
//       );
//
//       setNotifications(updatedNotifications);
//       setShowEditModal(false);
//     } catch (error) {
//       console.error("Error updating notification:", error);
//       alert("알림 수정 중 오류가 발생했습니다.");
//     }
//   };
//
//
//   const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setSelectedDate((prevDate) => ({ ...prevDate, [name]: value }));
//   };
//
//   const handleTitleClick = (notification:Notification) => {
//     setSelectedNotification(notification);
//     setShowDetailModal(true);
//   };
//
//   const handleRemoveNotification = (notification:Notification) => {
//     setNotifications(notifications.filter((notif) => notif !== notification));
//   };
//
//   const getYearOptions = () => {
//     const currentYear = new Date().getFullYear();
//     const options = [];
//     for (let year = currentYear; year <= currentYear + 3; year++) {
//       options.push(
//         <option key={year} value={year.toString()}>
//           {year}
//         </option>
//       );
//     }
//     return options;
//   };
//
//   const getMonthOptions = () => {
//     const options = [];
//     for (let month = 1; month <= 12; month++) {
//       options.push(
//         <option key={month} value={month.toString().padStart(2, "0")}>
//           {month}
//         </option>
//       );
//     }
//     return options;
//   };
//
//   const getDayOptions = () => {
//     const options = [];
//     for (let day = 1; day <= 31; day++) {
//       options.push(
//         <option key={day} value={day.toString().padStart(2, "0")}>
//           {day}
//         </option>
//       );
//     }
//     return options;
//   };
//
//   const getHourOptions = () => {
//     const options = [];
//     for (let hour = 0; hour <= 23; hour++) {
//       options.push(
//         <option key={hour} value={hour.toString().padStart(2, "0")}>
//           {hour.toString().padStart(2, "0")}
//         </option>
//       );
//     }
//     return options;
//   };
//
//   const getMinuteOptions = () => {
//     const options = [];
//     for (let minute = 0; minute <= 59; minute++) {
//       options.push(
//         <option key={minute} value={minute.toString().padStart(2, "0")}>
//           {minute.toString().padStart(2, "0")}
//         </option>
//       );
//     }
//     return options;
//   };
//
//   return (
//     <div id="my-notification">
//       <img
//         src={deleteIcon}
//         alt="Delete"
//         onClick={() => setShowDeleteActions(!showDeleteActions)}
//         className="delete-icon"
//       />
//       <div className="push-title">푸쉬 관리</div>
//       <div className="push-content">
//         <div className="content-type">
//           <div className="time-column">시간</div>
//           <div className="title-column">제목</div>
//           {!showDeleteActions && <div className="status-column">상태</div>}{" "}
//           {showDeleteActions && <div className="action-column">제거</div>}{" "}
//         </div>
//         <div className="content-contents">
//           {notifications.length === 0 ? (
//             <div className="no-notifications">등록된 푸쉬 알림이 없습니다.</div>
//           ) : (
//             notifications.map((notification, index) => (
//               <div className="content-row" key={index}>
//                 <div className="time">
//                   <div>
//                     {notification.time.split(". ")[0]}.{" "}
//                     {notification.time.split(". ")[1]}.{" "}
//                     {notification.time.split(". ")[2]}
//                   </div>
//                   <div>{notification.time.split(". ")[3]}</div>
//                 </div>
//                 <div
//                   className="title"
//                   onClick={() => handleTitleClick(notification)}
//                 >
//                   {notification.title}
//                 </div>
//                 {!showDeleteActions && (
//                   <div
//                     className={`status-${
//                       notification.status === "대기"
//                         ? "waiting"
//                         : notification.status === "완료"
//                         ? "completed"
//                         : "deleted"
//                     }`}
//                   >
//                     {notification.status}
//                   </div>
//                 )}
//                 {showDeleteActions && (
//                   <div className="actions">
//                     <button
//                       onClick={() => handleRemoveNotification(notification)}
//                     >
//                       -
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//       <button className="add-notification" onClick={() => setShowModal(true)}>
//         +
//       </button>
//       {showModal && (
//         <div className="modal">
//           <div className="modal-content">
//             <form onSubmit={handleAddNotification}>
//               <div className="modal-header">푸쉬 등록</div>
//               <div className="modal-body">
//                 <div className="modal-row">
//                   <label className="time-row">
//                     <div>시간</div>
//                     <div className="time-inputs">
//                       <select
//                         name="year"
//                         onChange={handleDateChange}
//                         value={selectedDate.year}
//                         required
//                       >
//                         {getYearOptions()}
//                       </select>
//                       .
//                       <select
//                         name="month"
//                         onChange={handleDateChange}
//                         value={selectedDate.month}
//                         required
//                       >
//                         {getMonthOptions()}
//                       </select>
//                       .
//                       <select
//                         name="day"
//                         onChange={handleDateChange}
//                         value={selectedDate.day}
//                         required
//                       >
//                         {getDayOptions()}
//                       </select>
//                       .
//                       <select
//                         name="hour"
//                         onChange={handleDateChange}
//                         value={selectedDate.hour}
//                         required
//                       >
//                         {getHourOptions()}
//                       </select>
//                       :
//                       <select
//                         name="minute"
//                         onChange={handleDateChange}
//                         value={selectedDate.minute}
//                         required
//                       >
//                         {getMinuteOptions()}
//                       </select>
//                     </div>
//                   </label>
//                 </div>
//                 <div className="modal-row">
//                   <label>
//                     <div>제목</div>
//                     <input type="text" name="title" required />
//                   </label>
//                 </div>
//                 <div className="modal-row">
//                   <label>
//                     <div>내용</div>
//                     <textarea name="content" required></textarea>
//                   </label>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" onClick={() => setShowModal(false)}>
//                   취소
//                 </button>
//                 <button className="submit" type="submit">
//                   등록
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//       {showDetailModal && selectedNotification && (
//         <div className="modal">
//           <div className="modal-content">
//             <div className="modal-header">푸쉬 상세</div>
//             <div className="modal-body">
//               <div className="modal-row">
//                 <div className="title">시간</div>
//                 <div className="content">{selectedNotification.time}</div>
//               </div>
//               <div className="modal-row">
//                 <div className="title">제목</div>
//                 <div className="content">{selectedNotification.title}</div>
//               </div>
//               <div className="modal-row">
//                 <div className="title">내용</div>
//                 <div className="content">{selectedNotification.content}</div>
//               </div>
//             </div>
//             <div className="modal-footer">
//               <button type="button" onClick={() => setShowDetailModal(false)}>
//                 닫기
//               </button>
//               <button
//                 className="submit"
//                 type="button"
//                 onClick={() => {
//                   setShowDetailModal(false);
//                   setShowEditModal(true);
//                 }}
//               >
//                 수정
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {showEditModal && selectedNotification && (
//         <div className="modal">
//           <div className="modal-content">
//             <form onSubmit={handleEditNotification}>
//               <div className="modal-header">푸쉬 수정</div>
//               <div className="modal-body">
//                 <div className="modal-row">
//                   <label className="time-row">
//                     <div>시간</div>
//                     <div className="time-inputs">
//                       <select
//                         name="year"
//                         onChange={handleDateChange}
//                         value={selectedDate.year}
//                         required
//                       >
//                         {getYearOptions()}
//                       </select>
//                       .
//                       <select
//                         name="month"
//                         onChange={handleDateChange}
//                         value={selectedDate.month}
//                         required
//                       >
//                         {getMonthOptions()}
//                       </select>
//                       .
//                       <select
//                         name="day"
//                         onChange={handleDateChange}
//                         value={selectedDate.day}
//                         required
//                       >
//                         {getDayOptions()}
//                       </select>
//                       .
//                       <select
//                         name="hour"
//                         onChange={handleDateChange}
//                         value={selectedDate.hour}
//                         required
//                       >
//                         {getHourOptions()}
//                       </select>
//                       :
//                       <select
//                         name="minute"
//                         onChange={handleDateChange}
//                         value={selectedDate.minute}
//                         required
//                       >
//                         {getMinuteOptions()}
//                       </select>
//                     </div>
//                   </label>
//                 </div>
//                 <div className="modal-row">
//                   <label>
//                     <div>제목</div>
//                     <input
//                       type="text"
//                       name="title"
//                       defaultValue={selectedNotification.title}
//                       required
//                     />
//                   </label>
//                 </div>
//                 <div className="modal-row">
//                   <label>
//                     <div>내용</div>
//                     <textarea
//                       name="content"
//                       defaultValue={selectedNotification.content}
//                       required
//                     ></textarea>
//                   </label>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" onClick={() => setShowEditModal(false)}>
//                   취소
//                 </button>
//                 <button className="submit" type="submit">
//                   수정
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
//
// export default MyNotification;
