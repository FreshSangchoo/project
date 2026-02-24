import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPopupDetail,
  updatePopup,
  PopupRequestDTO,
  getReviews,
  insertHeart,
  deleteHeart,
} from "@api/apiPop";
import { PopupDetail } from "@interface/popDetail";
import Slider from "react-slick";
import PopDetailInfo from "@components/Pop/PopDetailInfo";
import PopDetailReservation from "@components/Pop/PopDetailReservation";
import PopDetailReview from "@components/Pop/PopDetailReview";
import PopDetailChat from "@components/Pop/PopDetailChat";
import useAuthStore from "@store/useAuthStore";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "@css/Pop/PopDetail.css";

import scoreIcon from "@assets/scoreIcon.svg";
import likeIcon from "@assets/likeIcon.svg";
import noneLike from "@assets/noneLike.svg";
import fillLike from "@assets/fillLike.svg";
import editIcon from "@assets/editIcon.svg";

export interface ReviewListDto {
  reviewId: number;
  popupId: number;
  userTsid: string;
  nickname: string;
  img: string;
  rating: number;
  title: string;
  content: string;
  thumbnail?: string;
  createdAt: string;
  commentDtoList: CommentDto[];
}

export interface CommentDto {
  commentId: number;
  reviewId: number;
  userTsid: string;
  nickname: string;
  content: string;
  createdAt: string;
}

const PopDetail = () => {
  const { popupId } = useParams<{ popupId: string }>();
  useEffect(() => {
    console.log("Received popupId in PopDetail:", popupId);
  }, [popupId]);

  const [popupDetail, setPopupDetail] = useState<PopupDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewListDto[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>("info");
  const [liked, setLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [hours, setHours] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [instagram, setInstagram] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [description, setDescription] = useState<string>("");


  const { userTsid: currentUserTsid, userRole } = useAuthStore();

  // 페이지 로드 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [popupId]);
  
  // 팝업 정보 설정
  useEffect(() => {
    if (popupDetail) {
      setLocation(popupDetail.address);
      setHours(popupDetail.hours);
      setWebsite(popupDetail.pageUrl);
      setInstagram(popupDetail.snsUrl);
      setContent(popupDetail.content);
      setDescription(popupDetail.description);
      setLiked(popupDetail.heart > 0);
    }
  }, [popupDetail]);

  // 팝업 정보 가져오기 API
  useEffect(() => {
    const fetchPopupDetail = async () => {
      if (!popupId) {
        console.error("popupId is missing");
        return;
      }
      try {
        const data = await getPopupDetail(parseInt(popupId, 10));
        const uniqueImages = Array.from(new Set(data.images));
        setPopupDetail({ ...data, images: uniqueImages });
      } catch (error) {
        console.error("Error fetching popup detail:", error);
      }
    };
    fetchPopupDetail();

    const fetchReviews = async () => {
      if (!popupId) return;
      try {
        const reviewData = await getReviews(parseInt(popupId, 10));
        setReviews(reviewData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };
    fetchReviews();
  }, [popupId]);
  // 이미지 슬라이더 세팅
  const settings = useMemo(
    () => ({
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 5000,
    }),
    []
  );
  // 좋아요 버튼
  const toggleLike = useCallback(async () => {
    if (!popupDetail) return;

    if (!currentUserTsid) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      if (liked) {
        await deleteHeart({
          userTsid: currentUserTsid,
          popupId: popupDetail.popupId,
        });
        setLiked(false);
        setPopupDetail((prev) => prev && { ...prev, heart: prev.heart - 1 });
      } else {
        await insertHeart({
          userTsid: currentUserTsid,
          popupId: popupDetail.popupId,
        });
        setLiked(true);
        setPopupDetail((prev) => prev && { ...prev, heart: prev.heart + 1 });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  }, [liked, popupDetail, currentUserTsid]);

  // 탭 컴포넌트
  const onTabClick = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // 팝업 수정 버튼
  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  // 팝업 수정 저장 버튼
  const handleSave = async () => {
    if (!popupDetail) return;

    const updatedData: Partial<PopupRequestDTO> = {
      name: popupDetail?.name,
      description: description,
      startDate: popupDetail?.startDate,
      endDate: popupDetail?.endDate,
      hours: hours,
      snsUrl: instagram,
      pageUrl: website,
      content: content,
      address: location,
      lat: popupDetail?.lat,
      lon: popupDetail?.lon,
      managerTsid: popupDetail?.managerTsId,
    };

    try {
      await updatePopup(popupDetail.popupId, updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating popup:", error);
    }
  };

  // 팝업 수정 취소 버튼
  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!popupDetail) {
    return <div>팝업 정보를 불러오지 못했습니다.</div>;
  }

  return (
    <div id="pop-detail">
      <div className="slider-container">
        <Slider {...settings}>
          {popupDetail.images.map((image: string, index: number) => (
            <div className="slider-slide" key={index}>
              <img
                src={`http://localhost/${image.replace("./", "")}`}
                alt={`팝업스토어 이미지 ${index + 1}`}
              />
            </div>
          ))}
        </Slider>
        <button
          onClick={toggleLike}
          className="like-button"
          aria-label="좋아요"
        >
          <img src={liked ? fillLike : noneLike} alt="좋아요" />
        </button>
        {userRole === "ROLE_MANAGER" && ( // 매니저 일 때만
          <>
            {!isEditing && (
              <button
                className="edit-button"
                onClick={handleEditToggle}
                aria-label="수정"
              >
                <img src={editIcon} alt="수정" />
              </button>
            )}
            {isEditing && (
              <div className="edit-buttons">
                <button
                  className="cancel-button"
                  onClick={handleCancel}
                  aria-label="취소"
                >
                  취소
                </button>
                <button
                  className="save-button"
                  onClick={handleSave}
                  aria-label="저장"
                >
                  저장
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="main-info">
        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={popupDetail.name}
              onChange={(e) =>
                setPopupDetail({ ...popupDetail, name: e.target.value })
              }
              className="edit-input"
            />
            <div className="edit-date">
              <input
                type="text"
                value={popupDetail.startDate}
                onChange={(e) =>
                  setPopupDetail({ ...popupDetail, startDate: e.target.value })
                }
                className="edit-input"
              />
              ~
              <input
                type="text"
                value={popupDetail.endDate}
                onChange={(e) =>
                  setPopupDetail({ ...popupDetail, endDate: e.target.value })
                }
                className="edit-input"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="title">{popupDetail.name}</div>
            <div className="date">
              <h5>{`${popupDetail.startDate} ~ ${popupDetail.endDate}`}</h5>
            </div>
          </>
        )}
        <div className="score-like">
          <div className="score">
            <img src={scoreIcon} alt="점수 아이콘" />
            {popupDetail.rating}
          </div>
          <div className="like">
            <img src={likeIcon} alt="좋아요 아이콘" />
            {popupDetail.heart}
          </div>
        </div>
      </div>
      <div className="tab">
        <div
          onClick={() => onTabClick("info")}
          className={activeTab === "info" ? "active" : ""}
        >
          정보
        </div>
        {popupDetail.checkPreReservation && (
          <div
            onClick={() => onTabClick("reservation")}
            className={activeTab === "reservation" ? "active" : ""}
          >
            예약
          </div>
        )}
        <div
          onClick={() => onTabClick("review")}
          className={activeTab === "review" ? "active" : ""}
        >
          리뷰
        </div>
        <div
          onClick={() => onTabClick("chat")}
          className={activeTab === "chat" ? "active" : ""}
        >
          채팅
        </div>
      </div>
      <div className="tab-content">
        {activeTab === "info" && (
          <PopDetailInfo
            isEditing={isEditing}
            location={location}
            hours={hours}
            website={website}
            instagram={instagram}
            content={content}
            description={description}
            lat={popupDetail.lat}
            lon={popupDetail.lon}
            popupId={popupId}
            onLocationChange={setLocation}
            onHoursChange={setHours}
            onWebsiteChange={setWebsite}
            onInstagramChange={setInstagram}
            onContentChange={setContent}
            onDescriptionChange={setDescription}
            onSave={handleSave}
          />
        )}
        {popupDetail.checkPreReservation && activeTab === "reservation" && (
          <PopDetailReservation
            title={popupDetail.name}
            hours={popupDetail.hours}
            preReservationOpenAt={popupDetail.preReservationOpenAt}
            term={popupDetail.term}
            maxPeoplePerSession={popupDetail.maxPeoplePerSession}
            maxReservationsPerPerson={popupDetail.maxReservationsPerPerson}
            warning={popupDetail.warning}
            popupId={popupDetail.popupId}
          />
        )}
        {activeTab === "review" && <PopDetailReview reviewsData={reviews} />}
        {activeTab === "chat" && <PopDetailChat />}
      </div>
    </div>
  );
};

export default PopDetail;
