declare module '@react-native-seoul/naver-login' {
  export interface NaverLoginInitParams {
    consumerKey: string;
    consumerSecret: string;
    appName: string;
    disableNaverAppAuthIOS?: boolean;
    serviceUrlSchemeIOS?: string;
  }

  export interface NaverLoginResponse {
    isSuccess: boolean;
    successResponse?: {
      accessToken: string;
      refreshToken: string;
      expiresAtUnixSecondString: string;
      tokenType: string;
    };
    failureResponse?: {
      message: string;
      isCancel: boolean;
      lastErrorCodeFromNaverSDK?: string;
      lastErrorDescriptionFromNaverSDK?: string;
    };
  }

  export interface GetProfileResponse {
    resultcode: string;
    message: string;
    response: {
      id: string;
      profile_image: string | null;
      email: string;
      name: string;
      birthday: string | null;
      age: string | null;
      birthyear: number | null;
      gender: string | null;
      mobile: string | null;
      mobile_e164: string | null;
      nickname: string | null;
    };
  }

  const NaverLogin: {
    initialize: (params: NaverLoginInitParams) => void;
    login: () => Promise<NaverLoginResponse>;
    logout: () => Promise<void>;
    deleteToken: () => Promise<void>;
    getProfile: (token: string) => Promise<GetProfileResponse>;
  };

  export default NaverLogin;
}
