import { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { ReservationProps, getMyPreReservationDetail } from "@api/mypage";
import PopMedium03 from "./PopMedium03";
import { getUserData } from "@api/users";

interface PreReservationListProps {
  reservations: ReservationProps[];
}

const baseUrl = "http://localhost";

const PreReservationList: React.FC<PreReservationListProps> = ({
  reservations,
}) => {
  const [isModal, setIsModal] = useState(false);
  const [modalReservation, setModalReservation] =
    useState<ReservationProps | null>(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>("");

  const openModal = async (reservationId: number) => {
    try {
      const data = await getMyPreReservationDetail(reservationId);
      const userData = await getUserData();
      setUserPhoneNumber(userData.phoneNumber);
      setModalReservation(data);
      setIsModal(true);
      document.body.style.overflow = "hidden";
    } catch (error) {
      console.error("Failed to fetch reservation detail:", error);
    }
  };

  const closeModal = () => {
    setIsModal(false);
    setModalReservation(null);
    document.body.style.overflow = "unset";
  };

  const getImageUrl = (img: string | File | undefined) => {
    if (!img) return "no image";
      console.log("img", img);
      return `${baseUrl}${img}`;
  };

  return (
    <div id="pre-reservation-list">
      {reservations.length > 0 ? (
        reservations.map((reservation) => (
          <div
            key={reservation.reservationId}
            onClick={() => openModal(reservation.reservationId)}
          >
            <PopMedium03
              image={getImageUrl(reservation.img)}
              text={reservation.title}
              date={reservation.reservationDate}
              children={""}
            />
          </div>
        ))
      ) : (
        <div className="like-contents-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="52"
            height="52"
            viewBox="0 0 52 52"
            fill="none"
          >
            <path
              d="M26 0C20.8577 0 15.8309 1.52487 11.5552 4.38179C7.27951 7.23871 3.94702 11.2994 1.97914 16.0502C0.0112654 20.8011 -0.503621 26.0288 0.499594 31.0723C1.50281 36.1159 3.97907 40.7486 7.61524 44.3848C11.2514 48.0209 15.8842 50.4972 20.9277 51.5004C25.9712 52.5036 31.1989 51.9887 35.9498 50.0209C40.7007 48.053 44.7613 44.7205 47.6182 40.4448C50.4751 36.1691 52 31.1423 52 26C51.9927 19.1066 49.2511 12.4976 44.3767 7.62326C39.5024 2.74889 32.8934 0.00727955 26 0ZM26 48C21.6488 48 17.3953 46.7097 13.7775 44.2923C10.1596 41.8749 7.33979 38.439 5.67466 34.419C4.00953 30.3991 3.57386 25.9756 4.42274 21.708C5.27161 17.4404 7.36691 13.5204 10.4437 10.4437C13.5204 7.3669 17.4404 5.2716 21.708 4.42272C25.9756 3.57385 30.3991 4.00952 34.419 5.67465C38.439 7.33978 41.875 10.1596 44.2923 13.7775C46.7097 17.3953 48 21.6488 48 26C47.9934 31.8327 45.6734 37.4247 41.5491 41.549C37.4247 45.6734 31.8327 47.9934 26 48ZM41.415 24.585C41.6008 24.7708 41.7482 24.9914 41.8488 25.2342C41.9494 25.477 42.0011 25.7372 42.0011 26C42.0011 26.2628 41.9494 26.523 41.8488 26.7658C41.7482 27.0086 41.6008 27.2292 41.415 27.415C41.2292 27.6008 41.0086 27.7482 40.7658 27.8488C40.523 27.9494 40.2628 28.0011 40 28.0011C39.7372 28.0011 39.477 27.9494 39.2342 27.8488C38.9914 27.7482 38.7708 27.6008 38.585 27.415L36 24.8275L33.415 27.415C33.0397 27.7903 32.5307 28.0011 32 28.0011C31.4693 28.0011 30.9603 27.7903 30.585 27.415C30.2097 27.0397 29.9989 26.5307 29.9989 26C29.9989 25.4693 30.2097 24.9603 30.585 24.585L33.1725 22L30.585 19.415C30.2097 19.0397 29.9989 18.5307 29.9989 18C29.9989 17.4693 30.2097 16.9603 30.585 16.585C30.9603 16.2097 31.4693 15.9989 32 15.9989C32.5307 15.9989 33.0397 16.2097 33.415 16.585L36 19.1725L38.585 16.585C38.7708 16.3992 38.9914 16.2518 39.2342 16.1512C39.477 16.0506 39.7372 15.9989 40 15.9989C40.2628 15.9989 40.523 16.0506 40.7658 16.1512C41.0086 16.2518 41.2292 16.3992 41.415 16.585C41.6008 16.7708 41.7482 16.9914 41.8488 17.2342C41.9494 17.477 42.0011 17.7372 42.0011 18C42.0011 18.2628 41.9494 18.523 41.8488 18.7658C41.7482 19.0086 41.6008 19.2292 41.415 19.415L38.8275 22L41.415 24.585ZM21.415 19.415L18.8275 22L21.415 24.585C21.7903 24.9603 22.0011 25.4693 22.0011 26C22.0011 26.5307 21.7903 27.0397 21.415 27.415C21.0397 27.7903 20.5307 28.0011 20 28.0011C19.4693 28.0011 18.9603 27.7903 18.585 27.415L16 24.8275L13.415 27.415C13.0397 27.7903 12.5307 28.0011 12 28.0011C11.4693 28.0011 10.9603 27.7903 10.585 27.415C10.2097 27.0397 9.9989 26.5307 9.9989 26C9.9989 25.4693 10.2097 24.9603 10.585 24.585L13.1725 22L10.585 19.415C10.2097 19.0397 9.9989 18.5307 9.9989 18C9.9989 17.4693 10.2097 16.9603 10.585 16.585C10.9603 16.2097 11.4693 15.9989 12 15.9989C12.5307 15.9989 13.0397 16.2097 13.415 16.585L16 19.1725L18.585 16.585C18.9603 16.2097 19.4693 15.9989 20 15.9989C20.5307 15.9989 21.0397 16.2097 21.415 16.585C21.7903 16.9603 22.0011 17.4693 22.0011 18C22.0011 18.5307 21.7903 19.0397 21.415 19.415ZM29 39C29 39.5933 28.8241 40.1734 28.4944 40.6667C28.1648 41.1601 27.6962 41.5446 27.1481 41.7716C26.5999 41.9987 25.9967 42.0581 25.4147 41.9424C24.8328 41.8266 24.2982 41.5409 23.8787 41.1213C23.4591 40.7018 23.1734 40.1672 23.0577 39.5853C22.9419 39.0033 23.0013 38.4001 23.2284 37.852C23.4554 37.3038 23.84 36.8352 24.3333 36.5056C24.8266 36.1759 25.4067 36 26 36C26.7957 36 27.5587 36.3161 28.1213 36.8787C28.6839 37.4413 29 38.2043 29 39Z"
              fill="#8B8B8B"
            />
          </svg>
          <p>사전 예약한 팝업이 없습니다.</p>
        </div>
      )}

      {/* 모달 */}
      {modalReservation && (
        <Modal open={isModal} onClose={closeModal}>
          <Box id="reservation-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-overlay">
              <img
                src={getImageUrl(modalReservation.img)}
                alt={modalReservation.title}
              />
              <p className="title">{modalReservation.title}</p>
              <div className="reservation-info">
                <p className="name">예약자 번호: {userPhoneNumber}</p>
                <p className="date">
                  예약 확정일: {modalReservation.reservationDate}
                </p>
                <p className="time">
                  입장 시간: {modalReservation.reservationTime}
                </p>
                <p className="member">
                  입장 인원: {modalReservation.reservationCount}명
                </p>
              </div>
            </div>
          </Box>
        </Modal>
      )}
    </div>
  );
};

export default PreReservationList;
