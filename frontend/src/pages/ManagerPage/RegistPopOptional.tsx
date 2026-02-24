import { useState } from "react";
import { useNavigate } from "react-router-dom";
import usePopupStore from "store/usePopupStore";
import useAuthStore from "@store/useAuthStore";
import { createPopup } from "@api/apiPop";
import "@css/ManagerPage/RegistPopOptional.css";
import secondStep from "@assets/registPop/secondStep.svg";

type ServiceCategories = {
  parking: string;
  fee: string;
  pet: string;
  food: string;
  photo: string;
  age: string;
};

type serviceCategory = keyof ServiceCategories;

function RegistPopOptional() {
  const {
    snsUrl,
    pageUrl,
    description,
    setPopupData,
    setServiceCategory,
    storeName,
    storeContent,
    selectedImages,
    startDate,
    endDate,
    address,
    lat,
    lon,
    timeSlots,
    categories,
  } = usePopupStore();
  const { userTsid: userTsid } = useAuthStore();
  const [localSnsUrl, setLocalSnsUrl] = useState(snsUrl || "");
  const [localPageUrl, setLocalPageUrl] = useState(pageUrl || "");
  const [activeButtons, setActiveButtons] = useState<ServiceCategories>(
    JSON.parse(description)
  );
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleButtonClick = (category: serviceCategory, value: string) => {
    setActiveButtons((prev) => ({
      ...prev,
      [category]: prev[category] === value ? "" : value,
    }));
    setServiceCategory(
      category,
      activeButtons[category] === value ? "" : value
    );
  };

  const handleSubmit = () => {
    setPopupData({
      snsUrl: localSnsUrl,
      pageUrl: localPageUrl,
      description: JSON.stringify(activeButtons),
    });
    console.log({
      snsUrl: localSnsUrl,
      pageUrl: localPageUrl,
      description: JSON.stringify(activeButtons),
    });
    navigate("/regist-pop-reservation");
  };

  const goRegistFinish = async () => {
    try {
      await createPopup({
        url: "/popups",
        popupDto: {
          name: storeName,
          content: storeContent,
          startDate: startDate || "",
          endDate: endDate || "",
          hours: JSON.stringify(timeSlots),
          snsUrl: localSnsUrl,
          pageUrl: localPageUrl,
          description: JSON.stringify(activeButtons),
          address,
          lat: lat || 0,
          lon: lon || 0,
          images: selectedImages,
          categories: categories,
          managerTsid: userTsid || "",
        },
      });
      alert("팝업이 성공적으로 등록되었습니다.");
      navigate("/regist-pop-fin");
    } catch (error) {
      console.error("Error creating popup:", error);
      alert("팝업 등록 중 오류가 발생했습니다.");
    }
  };

  const handleOmitClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div id="regist-pop-optional">
      <div className="optional-info-title">팝업스토어 선택 정보</div>
      <div className="step-two">
        <img src={secondStep} />
      </div>
      <div className="sns">
        <div className="sns-title">SNS 링크</div>
        <input
          placeholder="SNS 링크를 입력하세요. (블로그, 인스타그램 등)"
          value={localSnsUrl}
          onChange={(e) => setLocalSnsUrl(e.target.value)}
        />
      </div>
      <div className="homepage">
        <div className="homepage-title">홈페이지 링크</div>
        <input
          placeholder="홈페이지 링크를 입력하세요."
          value={localPageUrl}
          onChange={(e) => setLocalPageUrl(e.target.value)}
        />
      </div>
      <div className="more-details">
        <div className="more-details-title">팝업스토어 추가 사항</div>
        <div className="parking">
          <div>주차 가능 여부</div>
          <div className="buttons">
            <button
              className={activeButtons.parking === "불가능" ? "active" : ""}
              onClick={() => handleButtonClick("parking", "불가능")}
            >
              불가능
            </button>
            <button
              className={activeButtons.parking === "가능" ? "active" : ""}
              onClick={() => handleButtonClick("parking", "가능")}
            >
              가능
            </button>
          </div>
        </div>
        <div className="fee">
          <div>입장료 유무</div>
          <div className="buttons">
            <button
              className={activeButtons.fee === "무료" ? "active" : ""}
              onClick={() => handleButtonClick("fee", "무료")}
            >
              무료
            </button>
            <button
              className={activeButtons.fee === "유료" ? "active" : ""}
              onClick={() => handleButtonClick("fee", "유료")}
            >
              유료
            </button>
          </div>
        </div>
        <div className="pet">
          <div>반려동물 출입</div>
          <div className="buttons">
            <button
              className={activeButtons.pet === "불가능" ? "active" : ""}
              onClick={() => handleButtonClick("pet", "불가능")}
            >
              불가능
            </button>
            <button
              className={activeButtons.pet === "가능" ? "active" : ""}
              onClick={() => handleButtonClick("pet", "가능")}
            >
              가능
            </button>
          </div>
        </div>
        <div className="food">
          <div>외부 음식 반입</div>
          <div className="buttons">
            <button
              className={activeButtons.food === "불가능" ? "active" : ""}
              onClick={() => handleButtonClick("food", "불가능")}
            >
              불가능
            </button>
            <button
              className={activeButtons.food === "가능" ? "active" : ""}
              onClick={() => handleButtonClick("food", "가능")}
            >
              가능
            </button>
          </div>
        </div>
        <div className="photo">
          <div>사진 촬영</div>
          <div className="buttons">
            <button
              className={activeButtons.photo === "불가능" ? "active" : ""}
              onClick={() => handleButtonClick("photo", "불가능")}
            >
              불가능
            </button>
            <button
              className={activeButtons.photo === "가능" ? "active" : ""}
              onClick={() => handleButtonClick("photo", "가능")}
            >
              가능
            </button>
          </div>
        </div>
        <div className="age">
          <div>연령 제한</div>
          <div className="buttons">
            <button
              className={activeButtons.age === "전체연령" ? "active" : ""}
              onClick={() => handleButtonClick("age", "전체연령")}
            >
              없음
            </button>
            <button
              className={activeButtons.age === "19세 이상" ? "active" : ""}
              onClick={() => handleButtonClick("age", "19세 이상")}
            >
              19세 이상
            </button>
          </div>
        </div>
      </div>
      <div className="omit-or-regist">
        <button className="omit" onClick={handleOmitClick}>
          예약 정보 없음
        </button>
        <button className="regist" onClick={handleSubmit}>
          예약 정보 등록
        </button>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              예약 정보 없이 최종 등록 하시겠습니까?
            </div>
            <div className="modal-footer">
              <button className="cancel" onClick={handleCloseModal}>
                취소
              </button>
              <button className="confirm" onClick={goRegistFinish}>
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistPopOptional;
