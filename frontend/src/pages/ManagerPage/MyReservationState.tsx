import OnsitePopStateList from "@components/ManagerPage/OnsitePopStateList";
import PrePopStateList from "@components/ManagerPage/PrePopStateList";
import { useState } from "react";

import "@css/ManagerPage/MyPopList.css";

const MyReservationState = () => {
  const [activeTab, setActiveTab] = useState<string | null>("onsite");

  const onTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div id="my-pop-list">
      <h1>예약자 현황 관리</h1>
      <div className="registed-tab">
        <div
          onClick={() => onTabClick("onsite")}
          className={activeTab === "onsite" ? "active" : ""}
        >
          현장예약
        </div>
        <div
          onClick={() => onTabClick("pre")}
          className={activeTab === "pre" ? "active" : ""}
        >
          사전예약
        </div>

      </div>
      <div className="registed-popup-content">
        {activeTab === "onsite" && <OnsitePopStateList />}
        {activeTab === "pre" && <PrePopStateList />}
      </div>
    </div>
  );
}

export default MyReservationState;