import { useState } from "react";
import { ReviewListDto } from "@api/apiPop";
import "@css/Pop/PopDetailReview.css";

import none from "@assets/none.svg";

interface ReviewProps {
  reviewsData: ReviewListDto[];
}

const baseUrl = "http://localhost"
const Review: React.FC<ReviewProps> = ({ reviewsData }) => {
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const loadMore = () => {
    setVisibleCount((prevCount) => prevCount + 10);
  };

  const getImageUrl = (img: string | File | undefined) => {
    if (!img) return "no image";
    console.log("img", img);
    return `${baseUrl}${img}`;
  };

  return (
    <div id="pop-detail-reviews">
      {reviewsData.length > 0 ? (
        reviewsData.slice(0, visibleCount).map((review, index) => (
          <div className="pop-review" key={index}>
            <div className="profile">
              <img src={getImageUrl(review.img)} alt="프로필" />
              <div>
                <div className="nickname">{review.nickname}</div>
                <div className="review-date">{review.createdAt}</div>
              </div>
            </div>
            <div className="review-images">
              {review.thumbnail && (
                <img src={getImageUrl(review.thumbnail)} alt="리뷰 이미지" />
              )}
            </div>
            <div className="review-title">{review.title}</div>
          </div>
        ))
      ) : (
        <div className="no-reviews">
          <img src={none} />
          <p>아직 등록된 리뷰가 없습니다.</p>
        </div>
      )}
      {visibleCount < reviewsData.length && (
        <button className="load-more" onClick={loadMore}>
          더보기 ∨
        </button>
      )}
    </div>
  );
};

export default Review;
