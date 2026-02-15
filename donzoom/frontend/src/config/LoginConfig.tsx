import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';
import NaverLogin from '@react-native-seoul/naver-login'
import { login as KakaoLogin } from '@react-native-seoul/kakao-login'
import { GOOGLE_WEB_CLIENT_ID, NAVER_CONSUMER_SECRET } from '@env';
import { NAVER_WEB_CLIENT_ID, NAVER_APP_NAME } from '@env';
export const configureSocialLogins = () => {
  configureGoogleSignIn();
  configureNaverSignIn();
  configureKakaoSignIn();
};

// 구글 로그인 초기화
const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID, // 실제 웹 클라이언트 ID로 대체
    offlineAccess: true,
  });
}

// 네이버 로그인 초기화
const configureNaverSignIn = () => {
  console.log(NAVER_WEB_CLIENT_ID),
  console.log(NAVER_APP_NAME),
  NaverLogin.initialize({
    consumerKey: NAVER_WEB_CLIENT_ID,    // 네이버 클라이언트 ID
    consumerSecret: NAVER_CONSUMER_SECRET, // 네이버 클라이언트 시크릿
    appName: NAVER_APP_NAME,            // 앱 이름
  });
};

// 카카오 로그인 초기화
const configureKakaoSignIn = () => {
  // 할거 없음
};