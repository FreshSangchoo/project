import OnsitePopList from "@components/ManagerPage/OnsitePopList";
import PrePopList from "@components/ManagerPage/PrePopList";
import FinishedPopList from "@components/ManagerPage/FinishedPopList";
import { useState } from "react";

import "@css/ManagerPage/MyPopList.css";

const MyPopList = () => {
  const [activeTab, setActiveTab] = useState<string | null>("onsite");

  const onTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div id="my-pop-list">
      <h1>내가 등록한 팝업</h1>
      <div className="registed-tab">
        <div
          onClick={() => onTabClick("onsite")}
          className={activeTab === "onsite" ? "active" : ""}
        >
          진행중
        </div>
        <div
          onClick={() => onTabClick("pre")}
          className={activeTab === "pre" ? "active" : ""}
        >
          진행예정
        </div>
        <div
          onClick={() => onTabClick("finished")}
          className={activeTab === "finished" ? "active" : ""}
        >
          진행완료
        </div>
      </div>
      <div className="registed-popup-content">
        {activeTab === "onsite" && <OnsitePopList />}
        {activeTab === "pre" && <PrePopList />}
        {activeTab === "finished" && <FinishedPopList />}
      </div>
    </div>
  );
}

export default MyPopList;