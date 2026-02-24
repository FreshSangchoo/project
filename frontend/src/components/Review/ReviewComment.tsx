import { useState } from "react";
import { CommentProps } from "@interface/reviews";
import { deleteCommentData, createCommentData } from "@api/reviews";
import useAuthStore from "@store/useAuthStore"; // Zustand 스토어 가져오기

interface CommentListProps {
  reviewId: number;
  commentList: CommentProps[];
  onDelete: (commentId: number) => void; // 댓글 삭제를 처리할 콜백 함수
}

const baseUrl = "http://localhost";
const ReviewComment: React.FC<CommentListProps> = ({ reviewId, commentList, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { accessToken, userTsid, userRole } = useAuthStore((state) => ({
    accessToken: state.accessToken,
    userTsid: state.userTsid,
    userRole: state.userRole,
  }));

  // 댓글 열기/닫기 토글
  const toggleComment = () => {
    setIsOpen(!isOpen);
  };

  // 댓글 삭제 처리
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteCommentData(reviewId, commentId);
      onDelete(commentId); // 삭제 성공 시 부모 컴포넌트에게 알림
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  // 댓글 작성 처리
  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createCommentData(reviewId, { content: newComment });
      setNewComment(""); // 댓글 작성 후 입력 필드 초기화
      // 여기서 댓글 리스트를 새로고침하거나 추가하는 로직을 구현해야 합니다.
      window.location.href = window.location.href;
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  const getImageUrl = (img: string | File | undefined) => {
    if (!img) return "no image";
    console.log("img", img);
    return `${baseUrl}${img}`;
  };

  return (
    <>
      <div
        id="overlay"
        className={isOpen ? "show" : ""}
        onClick={toggleComment}
      ></div>
      <div id="review-comment" className={isOpen ? "open-comment" : ""}>
        <hr onClick={toggleComment} />
        <div className="comment-count">댓글 {commentList.length}개</div>
        <div className="comment-list">
          {commentList.map((comment) => (
            <div
              key={comment.commentId}
              className={`comment-section ${
                comment.parent ? "re-comment-section" : ""
              }`}
            >
              <div className="comment-writer">
                <div className="comment-profile">
                  <div className="comment-image">
                    <img
                      src={getImageUrl(comment.img)}
                      alt="댓글 작성자 프로필 사진"
                    />
                  </div>
                  <div className="comment-info">
                    <p className="comment-name">{comment.nickname}</p>
                    <p className="comment-date">{comment.createdAt}</p>
                  </div>
                </div>
                {userTsid && userTsid === comment.userTsid && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    onClick={() => handleDeleteComment(comment.commentId)}
                    style={{ cursor: 'pointer' }} // 클릭 가능한 느낌을 주기 위해
                  >
                    <path
                      d="M8.75 8C8.75 8.14834 8.70601 8.29334 8.6236 8.41668C8.54119 8.54001 8.42406 8.63614 8.28701 8.69291C8.14997 8.74968 7.99917 8.76453 7.85368 8.73559C7.7082 8.70665 7.57456 8.63522 7.46967 8.53033C7.36478 8.42544 7.29335 8.2918 7.26441 8.14632C7.23547 8.00083 7.25032 7.85003 7.30709 7.71299C7.36386 7.57594 7.45999 7.45881 7.58332 7.3764C7.70666 7.29399 7.85166 7.25 8 7.25C8.19891 7.25 8.38968 7.32902 8.53033 7.46967C8.67098 7.61032 8.75 7.80109 8.75 8ZM8 4.5C8.14834 4.5 8.29334 4.45601 8.41668 4.3736C8.54001 4.29119 8.63614 4.17406 8.69291 4.03701C8.74968 3.89997 8.76453 3.74917 8.73559 3.60368C8.70665 3.4582 8.63522 3.32456 8.53033 3.21967C8.42544 3.11478 8.2918 3.04335 8.14632 3.01441C8.00083 2.98547 7.85003 3.00032 7.71299 3.05709C7.57594 3.11386 7.45881 3.20999 7.3764 3.33332C7.29399 3.45666 7.25 3.60166 7.25 3.75C7.25 3.94891 7.32902 4.13968 7.46967 4.28033C7.61032 4.42098 7.80109 4.5 8 4.5ZM8 11.5C7.85166 11.5 7.70666 11.544 7.58332 11.6264C7.45999 11.7088 7.36386 11.8259 7.30709 11.963C7.25032 12.1 7.23547 12.2508 7.26441 12.3963C7.29335 12.5418 7.36478 12.6754 7.46967 12.7803C7.57456 12.8852 7.7082 12.9566 7.85368 12.9856C7.99917 13.0145 8.14997 12.9997 8.28701 12.9429C8.42406 12.8861 8.54119 12.79 8.6236 12.6667C8.70601 12.5433 8.75 12.3983 8.75 12.25C8.75 12.0511 8.67098 11.8603 8.53033 11.7197C8.38968 11.579 8.19891 11.5 8 11.5Z"
                      fill="#888"
                    />
                  </svg>
                )}
              </div>
              <div className="comment-detail">{comment.content}</div>
            </div>
          ))}
        </div>
        <div id="comment-create">
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button onClick={handleCreateComment}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="14"
              viewBox="0 0 15 14"
              fill="none"
            >
              <path
                d="M14.4624 1.26852C14.4624 1.26852 14.4624 1.27477 14.4624 1.2779L10.8249 13.2741C10.7699 13.469 10.6566 13.6423 10.5002 13.7709C10.3438 13.8995 10.1518 13.9772 9.94995 13.9935C9.9212 13.996 9.89245 13.9973 9.8637 13.9973C9.67457 13.9979 9.48922 13.9443 9.32953 13.843C9.16984 13.7417 9.04246 13.5968 8.96245 13.4254L6.68745 8.75665C6.66468 8.70986 6.65709 8.65714 6.66571 8.60582C6.67434 8.55451 6.69876 8.50717 6.73557 8.4704L10.3556 4.8504C10.4454 4.75587 10.4947 4.62999 10.493 4.49961C10.4914 4.36923 10.4388 4.24466 10.3466 4.15246C10.2544 4.06026 10.1299 4.00772 9.99949 4.00605C9.8691 4.00438 9.74323 4.05371 9.6487 4.14352L6.02682 7.76352C5.99005 7.80034 5.94271 7.82476 5.8914 7.83339C5.84009 7.84201 5.78736 7.83441 5.74057 7.81165L1.06745 5.53727C0.884711 5.4496 0.732927 5.30848 0.632209 5.13259C0.531492 4.95671 0.486597 4.75437 0.503473 4.5524C0.52035 4.35042 0.598201 4.15834 0.726711 4.00161C0.85522 3.84488 1.02832 3.7309 1.22307 3.67477L13.2193 0.0372735H13.2287C13.3995 -0.0107131 13.58 -0.0123953 13.7517 0.0323993C13.9233 0.0771939 14.08 0.166853 14.2056 0.292176C14.3311 0.4175 14.4211 0.573977 14.4663 0.745553C14.5114 0.917128 14.5101 1.09762 14.4624 1.26852Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default ReviewComment;
