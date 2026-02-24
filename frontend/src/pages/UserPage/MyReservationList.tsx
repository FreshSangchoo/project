import OnsiteReservationList from "@components/mypage/OnsiteReservationList";
import PreReservationList from "@components/mypage/PreReservationList";
import VisitCompletionList from "@components/mypage/VisitCompleltionList";
import { useState, useEffect } from "react";
import { ReservationProps, getMyReservation } from "@api/mypage";

const MyReservationList = () => {
  const [activeTab, setActiveTab] = useState<string | null>("pre");
  const [reservations, setReservations] = useState<ReservationProps[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<ReservationProps[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const data = await getMyReservation();
        setReservations(data);
        filterReservations(data, "pre");
      } catch (error) {
        console.error("Failed to fetch reservations:", error);
      }
    };

    fetchReservations();
  }, []);

  const filterReservations = (reservations: ReservationProps[], tab: string) => {
    let filtered;
    if (tab === "pre") {
      filtered = reservations.filter((res) => res.kind === 1);
    } else if (tab === "onsite") {
      filtered = reservations.filter((res) => res.kind === 2);
    } else if (tab === "visit") {
      filtered = reservations.filter((res) => res.reservationStatement === 2);
    }
    setFilteredReservations(filtered || []);
  };

  const onTabClick = (tab: string) => {
    setActiveTab(tab);
    filterReservations(reservations, tab);
  };

  return (
    <div id="my-reservation-list">
      <h1>내가 예약한 팝업</h1>
      <div className="reservation-tab">
        <div
          onClick={() => onTabClick("pre")}
          className={activeTab === "pre" ? "active" : ""}
        >
          사전예약
        </div>
        <div
          onClick={() => onTabClick("onsite")}
          className={activeTab === "onsite" ? "active" : ""}
        >
          현장예약
        </div>
        <div
          onClick={() => onTabClick("visit")}
          className={activeTab === "visit" ? "active" : ""}
        >
          방문완료
        </div>
      </div>
      <div className="reservation-content">
        {activeTab === "pre" && <PreReservationList reservations={filteredReservations} />}
        {activeTab === "onsite" && <OnsiteReservationList reservations={filteredReservations} />}
        {activeTab === "visit" && <VisitCompletionList reservations={filteredReservations} />}
      </div>
    </div>
  );
};

export default MyReservationList;
