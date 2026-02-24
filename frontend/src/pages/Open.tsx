import "@css/Open.css";
import PopMedium02 from "@components/Home/PopMedium02";
import { useEffect, useState } from "react";
import { getPopupByOpen, PopupProps } from "@api/home";
import { differenceInDays, parse, isValid } from "date-fns";
import { Link } from "react-router-dom";

// ExtendedPopupProps 타입 정의
interface ExtendedPopupProps extends Omit<PopupProps, 'startDate' | 'endDate'> {
  startDate: Date;
  endDate: Date;
  daysDiff: number; // 오늘 날짜 기준 startDate까지 남은 일수
}

const Open = () => {
  const [openPopups, setOpenPopups] = useState<ExtendedPopupProps[]>([]);

  useEffect(() => {
    getPopupByOpen()
      .then((data) => {
        const today = new Date();
        const processedData = data.map((popup) => {
          // startDate와 endDate를 Date 객체로 변환
          const startDate = parse(popup.startDate, 'yyyy-MM-dd', new Date());
          const endDate = parse(popup.endDate, 'yyyy-MM-dd', new Date());

          // 날짜가 유효한지 확인
          if (!isValid(startDate) || !isValid(endDate)) {
            console.error("Invalid date format", popup.startDate, popup.endDate);
            return null; // 유효하지 않은 날짜는 무시
          }

          // 오늘 날짜 기준 startDate까지 남은 일수 계산
          const daysDiff = differenceInDays(startDate, today) + 1;

          return {
            ...popup,
            startDate,
            endDate,
            daysDiff,
          };
        }).filter(popup => popup !== null) as ExtendedPopupProps[]; // null 제거
        setOpenPopups(processedData);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div id="open">
      <div className="open-title">
        <h1>곧 오픈 예정인 팝업</h1>
        <p>오픈 예정인 팝업의 예약 일정을 확인하세요.</p>
      </div>
      <div className="open-contents">
        {openPopups.map((popup) => (
          <Link to={`/popdetail/${popup.popupId}`}>
            <PopMedium02
              key={popup.popupId}
              image={popup.images[0]} // 첫 번째 이미지만 표시, 필요에 따라 수정 가능
              text={popup.name}
              date={`${popup.startDate.toLocaleDateString()} ~ ${popup.endDate.toLocaleDateString()}`}
              daysDiff={popup.daysDiff} // 날짜 차이를 직접 전달
            />
          </Link>
        ))}
      </div>
      <div id="page"></div>
    </div>
  );
};

export default Open;
