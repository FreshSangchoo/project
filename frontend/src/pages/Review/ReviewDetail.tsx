  import "@css/Review.css";
  import { getReviewData } from "@api/reviews";
  import ReviewComment from "@components/Review/ReviewComment";
  import { ReviewProps } from "@interface/reviews";
  import { useEffect, useState } from "react";
  import { useParams } from "react-router-dom";

  const baseUrl = "http://localhost";
  const ReviewDetail = () => {
    const { reviewId } = useParams<{ reviewId: string }>();
    const [review, setReview] = useState<ReviewProps | null>(null);

    useEffect(() => {
      (async () => {
        try {
          if (reviewId) {
            const reviewData = await getReviewData(parseInt(reviewId));
            // Convert image URL strings to File objects

            setReview({
              ...reviewData,
            });
          }
        } catch (error) {
          console.error("Error fetching review data:", error);
        }
      })();
    }, [reviewId]);

    const getImageUrl = (img: string | File | undefined) => {
      if (!img) return "no image";
      console.log("img", img);
      return `${baseUrl}${img}`;
    };

    return (
      <div id="review-detail">
        <div className="review-detail-title">
          {review?.thumbnail && (
            <img
              src={getImageUrl(review.thumbnail)}
              alt="리뷰 게시물 썸네일"
            />
          )}
          <div className="thumbnail-black"></div>
          <h1>{review?.title}</h1>
          <div className="review-writer">
            <div className="writer-image">
              {review?.img && (
                <img
                  src={getImageUrl(review.img)}
                  alt="작성자 프로필 사진"
                />
              )}
            </div>
            <div className="writer-info">
              <p className="writer-name">{review?.nickname}</p>
              <p className="writer-date">{review?.createdAt}</p>
            </div>
          </div>
        </div>
        <div className="review-detail-content">
          <div dangerouslySetInnerHTML={{ __html: review?.content || "" }} />
        </div>
        {reviewId && (
            <ReviewComment
                reviewId={parseInt(reviewId)}
                commentList={review?.commentDtoList || []}
                onDelete={() => {/* 댓글 삭제 후 처리 로직 */}}
            />
        )}
      </div>
    );
  };

  export default ReviewDetail;