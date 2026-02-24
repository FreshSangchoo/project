import "@css/Rank.css";
import { useEffect, useState } from "react";
import PopMedium01 from "@components/Home/PopMedium01";
import { getPopupByRank, RankProps } from "@api/home"; // 랭킹 조회 API 함수 임포트
import { Link } from "react-router-dom";

const Rank = () => {
  const [rankedPopups, setRankedPopups] = useState<RankProps[]>([]);

  useEffect(() => {
    const fetchRankedPopups = async () => {
      try {
        const data = await getPopupByRank();
        setRankedPopups(data);
      } catch (error) {
        console.error("Failed to fetch ranked popups:", error);
      }
    };
    fetchRankedPopups();
  }, []);

  return (
    <div id="rank">
      <div className="rank-title">
        <h1>오늘 가장 인기있는 팝업</h1>
        <p>순위는 매일 오후 12시에 갱신됩니다.</p>
      </div>
      <div className="rank-contents">
        {rankedPopups.map((popup, index) => (
          <Link to={`/popdetail/${popup.popupId}`}>
            <PopMedium01
              key={popup.popupId}
              rank={index + 1}
              image={popup.image} // 첫 번째 이미지를 표시
              text={popup.name}
              date={`${popup.startDate} ~ ${popup.endDate}`}
            />
          </Link>
        ))}
      </div>
      <div id="page">
        {/* 페이지네이션 로직이 있다면 여기에 추가 */}
      </div>
    </div>
  );
};

export default Rank;
