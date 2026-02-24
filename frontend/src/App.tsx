import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from 'react-query';
import { onMessageListener } from './firebase';
import { useCallback } from 'react';
import Layout01 from "@components/common/Layout01";
import Layout02 from "@components/common/Layout02";
import Layout04 from "@components/common/Layout04";

import Splash from "@pages/Splash";
import Login from "@pages/Login";
import Loading from "@pages/Loading";
import MyLoading from "@pages/UserPage/MyLoading";
import Home from "@pages/Home";
import CalendarPage from "@pages/Calendar";
import Map from "@pages/Map";
import ReviewList from "@pages/Review/ReviewList";
import Mypage from "@pages/Mypage";
import Category from "@pages/Category";
import Rank from "@pages/Rank";
import Open from "@pages/Open";
import ReviewWrite from "@pages/Review/ReviewWrite";
import ReviewDetail from "@pages/Review/ReviewDetail";
import PopDetail from "@pages/Pop/PopDetail";
import PopReservationCheck from "@pages/Pop/PopReservationCheck";
import PopReservationFin from "@pages/Pop/PopReservationFin";
import Waiting from "@pages/Waiting";
import RegistPop from "@pages/ManagerPage/RegistPop";
import RegistPopOptional from "@pages/ManagerPage/RegistPopOptional";
import RegistFin from "@pages/ManagerPage/RegistFin";
import RegistPopReservationInfo from "@pages/ManagerPage/RegistPopReservationInfo";
import UserUpdate from "@pages/UserPage/UserUpdate";
import MyReviewList from "@pages/UserPage/MyReviewList";
import MyLikeList from "@pages/UserPage/MyLikeList";
import MyCodeManagement from "@pages/AdminPage/MyCodeManagement";
import MyNotification from "@pages/AdminPage/MyNotification";
import MyReservationList from "@pages/UserPage/MyReservationList";
import MyCancelList from "@pages/UserPage/MyCancelList";
import MyPopList from "@pages/ManagerPage/MyPopList";
import Search from "@components/Search";
import MyReservationState from "@pages/ManagerPage/MyReservationState";
import MyOnsiteReservationState from "@pages/ManagerPage/MyOnsiteReservationState";
import MyPreReservationState from "@pages/ManagerPage/MyPreReservationState";
import ManagerLogin from "@pages/ManagerPage/ManagerLogin";
import SearchList from "@pages/SearchList";
import OnsiteReservationRegist from "@pages/ManagerPage/OnsiteReservationRegist";
import Error from "@pages/Error";
import OnsiteReservationMain from "@pages/ManagerPage/OnsiteReservationMain";
import OnsiteReservationFin from "@pages/ManagerPage/OnsiteReservationFin";

interface PayloadNotification {
  title: string;
  body: string;
}

interface MessagePayload {
  notification: PayloadNotification;
}

const queryClient = new QueryClient();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({title: '', body: ''});

  const showNotification = useCallback((title: string, body: string) => {
    console.log('Showing notification:', title, body);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/firebase-logo.png'
      });
    }
    console.log(1);
    setNotification({ title, body });
  }, []);

  onMessageListener()
      .then((payload: MessagePayload) => {
        console.log('Message received. ', payload);
        showNotification(payload.notification.title, payload.notification.body);
      })
      .catch((err: Error) => console.log('Failed to receive message: ', err));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {isLoading ? <Splash /> : ''}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/manager/login" element={<ManagerLogin />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/mypage/loading" element={<MyLoading />} />
          <Route path="/" element={<Layout01><Home /></Layout01>} />
          <Route path="/calendar" element={<Layout01><CalendarPage /></Layout01>} />
          <Route path="/map" element={<Layout01><Map /></Layout01>} />
          <Route path="/review" element={<Layout01><ReviewList /></Layout01>} />
          <Route path="/review/write" element={<ReviewWrite />} />
          <Route path="/review/:reviewId" element={<Layout02><ReviewDetail /></Layout02>} />
          <Route path="/mypage" element={<Layout01><Mypage /></Layout01>} />
          <Route path="/category/:categoryId" element={<Layout02><Category /></Layout02>} />
          <Route path="/rank" element={<Layout02><Rank /></Layout02>} />
          <Route path="/open" element={<Layout02><Open /></Layout02>} />
          <Route path="/popdetail/:popupId" element={<Layout02><PopDetail /></Layout02>} />
          <Route path="/reservation-check" element={<Layout04><PopReservationCheck /></Layout04>} />
          <Route path="/reservation-check/finish" element={<Layout04><PopReservationFin /></Layout04>} />
          <Route path="/waiting/:popupId/reservations/:reservationId" element={<Waiting />} />
          <Route path="/regist-pop" element={<Layout04><RegistPop /></Layout04>} />
          <Route path="/regist-pop-optional" element={<Layout04><RegistPopOptional /></Layout04>} />
          <Route path="/regist-pop-fin" element={<Layout04><RegistFin /></Layout04>} />
          <Route path="/regist-pop-reservation" element={<Layout04><RegistPopReservationInfo /></Layout04>} />
          <Route path="/mypage/update" element={<UserUpdate />} />
          <Route path="/mypage/review" element={<Layout04><MyReviewList /></Layout04>} />
          <Route path="/mypage/like" element={<Layout04><MyLikeList /></Layout04>} />
          <Route path="/admin/manage-code" element={<Layout04><MyCodeManagement /></Layout04>} />
          <Route path="/admin/notification" element={<Layout04><MyNotification /></Layout04>} />
          <Route path="/mypage/reservation" element={<Layout04><MyReservationList /></Layout04>} />
          <Route path="/mypage/cancel" element={<Layout04><MyCancelList /></Layout04>} />
          <Route path="/mypage/my-popups" element={<Layout04><MyPopList /></Layout04>} />
          <Route path="/mypage/reservation-management" element={<Layout04><MyReservationState /></Layout04>} />
          <Route path="/mypage/onsite-reservation-management" element={<Layout04><MyOnsiteReservationState /></Layout04>} />
          <Route path="/mypage/pre-reservation-management/:popupId" element={<Layout04><MyPreReservationState /></Layout04>} />
          <Route path="/search" element={<Search />} />
          <Route path="/search-list" element={<Layout02><SearchList /></Layout02>} />
          <Route path="/onsite-reservation/:popupId" element={<OnsiteReservationMain />} />
          <Route path="/onsite-reservation/regist/:popupId" element={<OnsiteReservationRegist />} />
          <Route path="/onsite-reservation/finish/:popupId" element={<OnsiteReservationFin />} />
          <Route path="*" element={<Layout02><Error /></Layout02>} />
        </Routes>
      </div>
    </QueryClientProvider>
  )
}

export default App;
