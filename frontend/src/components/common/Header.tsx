import "@css/Header.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@assets/poppin_gradiant.svg";
import getIcon from "@utils/get-header-icon";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

import backButton from "@assets/header/back_icon.svg";
import reserveIcon from "@assets/header/notificationReservation.svg";
import commentIcon from "@assets/header/notificationComment.svg";
import advertisementIcon from "@assets/header/notificationAd.svg";

interface IconProps {
  leftIcon: string;
  rightIcon: string;
  onRightClick?: () => void;
}

const notifications = [
  {
    type: "reserve",
    category: "예약 알림",
    title: "[뉴진스 How Sweet 팝업스토어] 예약이 확정되었습니다.",
    content: "일시) 24.07.18 11:00  인원) 2명",
    date: "24. 7. 29.",
    icon: reserveIcon,
  },
  {
    type: "comment",
    category: "댓글 알림",
    title: "[파핑파핑 바나나] 님이 댓글을 작성했습니다.",
    content: "“뉴진스 팝업 사람 안많음? 뭐가 제일 이쁨?”",
    date: "24. 7. 29.",
    icon: commentIcon,
  },
  {
    type: "advertisement",
    category: "광고",
    title: "관심으로 설정한 카테고리에 새로운 팝업이 등록됐어요!",
    content: "완전 럭키비키자나~🍀",
    date: "24. 7. 29.",
    icon: advertisementIcon,
  },
  {
    type: "advertisement",
    category: "광고",
    title: "관심으로 설정한 카테고리에 새로운 팝업이 등록됐어요!",
    content: "완전 럭키비키자나~🍀",
    date: "24. 7. 29.",
    icon: advertisementIcon,
  },
  {
    type: "advertisement",
    category: "광고",
    title: "관심으로 설정한 카테고리에 새로운 팝업이 등록됐어요!",
    content: "완전 럭키비키자나~🍀",
    date: "24. 7. 29.",
    icon: advertisementIcon,
  },
  {
    type: "comment",
    category: "댓글 알림",
    title: "[파핑파핑 바나나] 님이 댓글을 작성했습니다.",
    content: "“뉴진스 팝업 사람 안많음? 뭐가 제일 이쁨?”",
    date: "24. 7. 29.",
    icon: commentIcon,
  },
  {
    type: "advertisement",
    category: "광고",
    title: "관심으로 설정한 카테고리에 새로운 팝업이 등록됐어요!",
    content: "완전 럭키비키자나~🍀",
    date: "24. 7. 29.",
    icon: advertisementIcon,
  },
];

const Header = ({ leftIcon, rightIcon, onRightClick }: IconProps) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const handleBackIcon = () => {
    navigate(-1);
  };

  const handleIconClick = (icon: string) => {
    if (icon === getIcon("notification") || icon === "notification") {
      setModalOpen(true); 
    } else if (icon === "완료") {
      if (onRightClick) onRightClick();
    } else if (icon === "등록") {
      if (onRightClick) onRightClick();
    } else if (icon === getIcon("search") || icon === "search") {
      navigate("/search");
    } else if (icon === getIcon("back") || icon === "취소" || icon === "back") {
      handleBackIcon();
    }
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const isImage = (icon: string) => {
    const urlWithoutQuery = icon.split("?")[0];
    return /\.(jpg|jpeg|png|svg|gif)$/.test(urlWithoutQuery);
  };

  return (
    <div id="header">
      <div className="left-icon">
        {isImage(leftIcon) ? (
          <img
            src={leftIcon}
            alt="Left"
            onClick={() => handleIconClick(leftIcon)}
          />
        ) : (
          <span onClick={() => handleIconClick(leftIcon)}>{leftIcon}</span>
        )}
      </div>
      <div className="logo">
        <img src={logo} alt="poppin_logo" />
      </div>
      <div className="right-icon">
        {isImage(rightIcon) ? (
          <img
            src={rightIcon}
            alt="Right"
            onClick={() => handleIconClick(rightIcon)}
          />
        ) : (
          <span onClick={() => handleIconClick(rightIcon)}>{rightIcon}</span>
        )}
      </div>

      <Modal open={modalOpen} onClose={handleClose}>
        <Box className="modal-paper-notification">
          <div className="notification-header">
            <img src={backButton} alt="Back" onClick={handleClose} />
            <div className="title">알림 목록</div>
          </div>
          <div className="notification-list">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`notification-item ${notification.type}`}
              >
                <div className="header">
                  <img
                    src={notification.icon}
                    alt={notification.category}
                    className="icon"
                  />
                  <div className="category">{notification.category}</div>
                  <div className="date">{notification.date}</div>
                </div>
                <div className="title">{notification.title}</div>
                <div className="content">{notification.content}</div>
              </div>
            ))}
          </div>
          <div className="notification-footer">
            알림은 14일 후 순차적으로 지워집니다
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default Header;
