import banners from "@utils/get-banner-image";
import PopMedium03 from "../mypage/PopMedium03";
import { Link } from "react-router-dom";

import nextButton from "@assets/mypage/nextButton.svg";
import none from "@assets/none.svg";

function OnsitePopStateList() {
  return (
    <div id="onsite-registed-list">
      {banners.length > 0 ? (
        banners.map((banner, index) => (
          <Link to="/mypage/onsite-reservation-management" key={index}>
            <PopMedium03
              image={banner.image}
              text={banner.text}
              date={banner.date}
            >
              <div className="go-detail-page">
                상세 페이지로 이동
                <img src={nextButton}/>
              </div>
            </PopMedium03>
          </Link>
        ))
      ) : (
        <div className="none-registed-contents">
          <img src={none} />
          <p>아직 등록한 팝업이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

export default OnsitePopStateList;
