import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "@css/Pop/PopDetailChat.css";

import noticePin from "@assets/noticePin.svg";
import sendButton from "@assets/sendButton.svg";
import { getHistory } from "@api/apiPop";
import { getUserData } from "@api/users";
import useAuthStore from "@store/useAuthStore";

interface ChatMessage {
  type: "me" | "other";
  profile?: string;
  sender: string;
  message: string;
  sendTime: string;
}

const noticeContent =
  "이것은 공지사항입니다. 과연 어디까지 공지사항 처음에 표시될지 너무나 궁금한데요. 일단 세 줄이 될 때까지 적어보겠습니다.";

const convertNewlinesToBreaks = (text: string) => {
  // text가 undefined일 경우 빈 문자열로 대체
  return (text || "").split("\n").map((line, index) => (
    <span key={index}>
      {line}
      <br />
    </span>
  ));
};

const Chat = () => {
  const { popupId } = useParams<{ popupId: string }>();
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [notice] = useState<string>(noticeContent);
  const [noticeOpen, setNoticeOpen] = useState<boolean>(false);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [userNickname, setUserNickname] = useState<string>("");
  const [userProfileImg, setUserProfileImg] = useState<string>("");

  const chatMessageRef = useRef<HTMLDivElement>(null);
  const ws = useRef<Client | null>(null);

  const currentUserTsid = useAuthStore((state) => state.userTsid);
  const isLoggedIn = !!currentUserTsid;

  // 유저 정보(닉네임, 사진 등) 불러오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await getUserData();
        setUserNickname(userInfo.nickname);
        setUserProfileImg(userInfo.profileImg);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };
    if (isLoggedIn) {
      fetchUserInfo();
    }
  }, [isLoggedIn]);

  // 채팅 내역 불러오기
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await getHistory(Number(popupId));
        if (Array.isArray(response)) {
          const formattedChats = response.map((chat) => ({
            ...chat,
            type: chat.sender === userNickname ? "me" : "other",
            nickName: chat.sender,
            profile: chat.senderImg,
            sendTime: chat.sendTime.slice(0, 5),
          }));
          console.log(formattedChats);
          setChats(formattedChats);
        } else {
          console.error("Invalid chat history format:", response);
          setChats([]);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setChats([]);
      }
    };

    fetchChatHistory();
  }, [popupId, userNickname]);

  useEffect(() => {
    const socket = new SockJS("http://localhost/ws-stomp");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    stompClient.onConnect = (frame) => {
      console.log("Connected to STOMP:", frame);
      // 메세지 받는 부분
      if (popupId) {
        stompClient.subscribe(`/sub/popup/${popupId}`, (message) => {
          const receivedMessage: ChatMessage = JSON.parse(message.body);
          console.log(receivedMessage);

          // 현재 사용자의 닉네임과 메시지의 닉네임(sender) 비교
          const newMessage: ChatMessage = {
            ...receivedMessage,
            type: receivedMessage.sender === userNickname ? "me" : "other",
            sendTime: receivedMessage.sendTime.slice(0, 5),
          };
          console.log(receivedMessage.sender);
          setChats((prevChats) => {
            const updatedChats = [...prevChats, newMessage];
            console.log("Updated chats:", updatedChats);
            return updatedChats;
          });
        });
      }
    };

    stompClient.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers["message"]);
    };

    stompClient.activate();
    ws.current = stompClient;

    return () => {
      if (ws.current) {
        ws.current.deactivate();
        console.log("Disconnected from STOMP");
      }
    };
  }, [popupId, userNickname]);

  useEffect(() => {
    if (isAutoScroll && chatMessageRef.current) {
      chatMessageRef.current.scrollTop = chatMessageRef.current.scrollHeight;
    }
  }, [chats, isAutoScroll]);

  // 메시지 전송
  const sendMessage = () => {
    console.log(message.trim() === "");
    if (message.trim() === "") return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    const newMessage = {
      popupId: Number(popupId),
      userTsid: currentUserTsid,
      message: message,
      sendTime: formattedTime,
      sender: userNickname,
      profile: userProfileImg,
    };

    if (ws.current && ws.current.connected) {
      console.log("Message:", JSON.stringify(newMessage));
      ws.current.publish({
        destination: "/pub/message",
        body: JSON.stringify(newMessage),
      });
    } else {
      console.error("STOMP connection is not open");
    }

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleScroll = () => {
    if (!chatMessageRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatMessageRef.current;

    if (scrollHeight - scrollTop === clientHeight) {
      setIsAutoScroll(true);
    } else {
      setIsAutoScroll(false);
    }
  };

  return (
    <div className="chat-container">
      {notice && (
        <div className="notice">
          <div className="notice-title">
            <div className="notice-title-pin">
              <img src={noticePin} />
              <div>공지사항</div>
            </div>
            <button onClick={() => setNoticeOpen(!noticeOpen)}>
              {noticeOpen ? "▲" : "▼"}
            </button>
          </div>
          <div className={`notice-content ${noticeOpen ? "" : "collapsed"}`}>
            {noticeContent}
          </div>
        </div>
      )}
      <div
        className="chat-messages"
        ref={chatMessageRef}
        onScroll={handleScroll}
      >
        {chats.map((chat, index) => (
          <div key={index} className={`chat-message ${chat.type}`}>
            {chat.type === "other" && (
              <>
                <div className="chat-info">
                  <div className="chat-header">
                    <img src={chat.profile} className="profile-img" />
                    <div className="chat-name">
                      <span className="nickname">{chat.sender}</span>
                      {/* <button className="report-button">신고하기</button> */}
                    </div>
                  </div>
                  <div className="chat-info-other">
                    <div className="chat-content">
                      {convertNewlinesToBreaks(chat.message)}
                    </div>
                    <div className="chat-time">{chat.sendTime}</div>
                  </div>
                </div>
              </>
            )}
            {chat.type === "me" && (
              <>
                <div className="chat-time">{chat.sendTime}</div>
                <div className="chat-content me">
                  {convertNewlinesToBreaks(chat.message)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="chat-input">
        {isLoggedIn ? (
          <>
            <textarea
              placeholder="실시간 채팅하기"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />
            <button onClick={sendMessage}>
              <img src={sendButton} />
            </button>
          </>
        ) : (
          <div className="login-required">로그인이 필요합니다</div>
        )}
      </div>
    </div>
  );
};

export default Chat;
