import "@css/Category.css";
import { useParams, useNavigate } from "react-router-dom";
import categories from "@utils/get-category-image";
import PopupSmall from "@components/Home/PopupSmall";
import { useEffect, useState } from "react";
import { getPopupByCategory, PopupProps } from "@api/category";

const baseUrl = "http://localhost";
const Category = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate(); // navigate 훅을 사용
  const numericCategoryId = categoryId ? parseInt(categoryId, 10) : null;
  const category = numericCategoryId
    ? categories.find((c) => c.id === numericCategoryId)
    : null;

  const [popups, setPopups] = useState<PopupProps[]>([]);

  useEffect(() => {
    if (numericCategoryId) {
      getPopupByCategory(numericCategoryId)
        .then((data) => {
          console.log("Fetched data:", data);
          setPopups(data);
        })
        .catch((error) => {
          console.error("Error fetching popups:", error);
        });
    }
  }, [numericCategoryId]);

  // 팝업 클릭 시 상세 페이지로 이동하는 함수
  const handlePopupClick = (popupId: number) => {
    navigate(`/popdetail/${popupId}`);
  };

  const getImageUrl = (img: string | File | undefined) => {
      if (!img) return "no image";
      console.log("img", img);
      return `${baseUrl}${img}`;
  };

  return (
    <div id="category">
      <div className="category-title">
        <img src={category?.image} alt={category?.text} />
        <h1>{category?.text}</h1>
      </div>
      {/* 카테고리별 팝업 목록 데이터 받아서 띄우기 */}
      <div className="category-contents">
        {popups.map((popup) => (
          <div
            key={popup.popupId}
            onClick={() => handlePopupClick(popup.popupId)}
            className="pop-up-small" // 클릭 시 navigate 호출
          >
            <PopupSmall
              image={getImageUrl(popup.images[0])} // 첫 번째 이미지만 표시, 필요에 따라 수정 가능
              text={popup.name}
              date={`${popup.startDate} - ${popup.endDate}`}
            />
          </div>
        ))}
      </div>

      {/* 팝업 받으면 페이징 처리 하기 */}
      <div className="page"></div>
    </div>
  );
};

export default Category;
