import "react-quill/dist/quill.snow.css";
import ReactQuill from "react-quill";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Header from "@components/common/Header";
import Menu from "@components/common/Menu";
import { ReviewUpdateProps } from "@interface/reviews";
import { UserProps } from "@interface/users";
import axiosInstance from "@api/axiosInstance";
import { getUserData } from "@api/users";
import { updateReviewData } from "@api/reviews";

const ReviewUpdate = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProps | null>(null);
  const [title, setTitle] = useState("");
  const [store, setStore] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [rating, setRating] = useState(0);
  const { reviewId } = useParams<{ reviewId: string }>();

  const quillRef = useRef<ReactQuill | null>(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const token = axiosInstance.defaults.headers.common["Authorization"];

    if (token) {
      (async () => {
        try {
          const userData = await getUserData();
          setUser({
            nickname: userData.nickname,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            categoryList: userData.categoryList,
            agreementDto: userData.agreementDto,
            img: userData.img,
            role: userData.role,
          });
        } catch (error) {
          console.error(error);
        }
      })();
    } else {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
    }
  }, [navigate]);

  // 후기 썸네일
  const handleThumbnailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      setThumbnail(event.target.files[0]);
    }
  };

  // 후기 내용
  const handleWriteContent = (content: string) => {
    setEditorContent(content);
  };

  // 후기 별점
  const handleRatingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRating(Number(event.target.value));
  };

  // 후기 작성 완료
  const handleSubmit = async () => {
    if (!title || !editorContent || !thumbnail || !store) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    // 파일을 Base64로 변환
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
    
    try {
      const base64Thumbnail = await toBase64(thumbnail);

      const review: ReviewUpdateProps = {
        rating: rating,
        title: title,
        content: editorContent,
        thumbnail: base64Thumbnail,
      };

      await updateReviewData(Number(reviewId), review);
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header leftIcon="취소" rightIcon="등록" onRightClick={handleSubmit} />

      <div id="review-write">
        <div className="review-input-title">
          <input
            type="text"
            placeholder="제목을 입력하세요 (최대 40자)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="review-input-search">
          <input
            type="text"
            placeholder="다녀온 팝업 스토어"
            value={store}
            onChange={(e) => setStore(e.target.value)}
          />
        </div>
        <div className="review-input-thumbnail">
          <input
            type="text"
            placeholder="썸네일 이미지"
            readOnly
            value={thumbnail ? thumbnail.name : ""}
          />
          <label htmlFor="file">썸네일 찾기</label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
          />
        </div>
        <div className="review-input-rating">
          <span>별점</span>
          <div className="review-star">
            <input
              type="radio"
              name="rating"
              value="5"
              id="rate5"
              onChange={handleRatingChange}
            />
            <label htmlFor="rate5">⭐</label>
            <input
              type="radio"
              name="rating"
              value="4"
              id="rate4"
              onChange={handleRatingChange}
            />
            <label htmlFor="rate4">⭐</label>
            <input
              type="radio"
              name="rating"
              value="3"
              id="rate3"
              onChange={handleRatingChange}
            />
            <label htmlFor="rate3">⭐</label>
            <input
              type="radio"
              name="rating"
              value="2"
              id="rate2"
              onChange={handleRatingChange}
            />
            <label htmlFor="rate2">⭐</label>
            <input
              type="radio"
              name="rating"
              value="1"
              id="rate1"
              onChange={handleRatingChange}
            />
            <label htmlFor="rate1">⭐</label>
          </div>
        </div>
        <ReactQuill
          ref={quillRef}
          value={editorContent}
          onChange={handleWriteContent}
          modules={modules}
          formats={formats}
        />
      </div>

      <Menu />
    </>
  );
};

const modules = {
  toolbar: [
    [{ font: [] }],
    [{ size: [] }],
    [{ color: [] }, { background: [] }, { align: [] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link", "image"],
  ],
};

const formats = [
  "font",
  "size",
  "color",
  "background",
  "align",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "code-block",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
];

export default ReviewUpdate;
