import express from "express";
import multer from "multer";
import SockJS from "sockjs";
import StompServer from "stomp-broker-js";

const app = express();
const upload = multer({ dest: 'uploads/' }); // 파일 업로드 경로 설정

// HTTP 서버 시작
const httpServer = app.listen(3000, () => { // 포트 번호 설정
  console.log("HTTP server is running on http://localhost:3000");
});

// SockJS 서버 설정
const sockjsServer = SockJS.createServer();
sockjsServer.installHandlers(httpServer, { prefix: '/ws-stomp' });

// STOMP 서버 설정
const stompServer = new StompServer({ server: httpServer });

stompServer.on("connect", (frame, session) => {
  console.log("New client connected");

  session.on("message", (msg) => {
    console.log(`Received message: ${msg.body}`);

    // 모든 클라이언트에게 메시지 브로드캐스트
    stompServer.send(`/topic/${msg.headers.destination}`, {}, msg.body);
  });

  session.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

console.log("STOMP server is running on ws://localhost:3000/ws-stomp");

// POST 요청 처리
app.post("/api/popups", upload.array("images", 10), (req, res) => { // 파일 개수 제한
  const images = req.files;
  const popupData = JSON.parse(req.body.popupData);

  // 요청 처리 코드
  console.log(popupData);
  console.log(images);

  const { name, description, startDate, endDate, hours, content, lat, lon } =
    popupData;
  if (
    !name ||
    !description ||
    !startDate ||
    !endDate ||
    !hours ||
    !content ||
    !lat ||
    !lon
  ) {
    return res.status(400).send("Missing required fields");
  }

  res.send("Popup created");
});
