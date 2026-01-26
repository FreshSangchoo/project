import { Settings } from 'react-native-fbsdk-next';
import Config from 'react-native-config';
import { Platform } from 'react-native';

/**
 * Facebook SDK 초기화
 * App.tsx의 useEffect에서 호출
 */
export const initializeFacebook = async () => {
  try {
    if (!Config.FACEBOOK_APP_ID) {
      console.warn('Facebook App ID가 설정되지 않았습니다.');
      return;
    }

    // Facebook SDK 설정
    Settings.setAppID(Config.FACEBOOK_APP_ID);

    // iOS ATT 권한 요청 (iOS 14.5 이상)
    if (Platform.OS === 'ios') {
      try {
        const { AppTrackingTransparency } = require('react-native');
        if (AppTrackingTransparency) {
          const trackingStatus = await AppTrackingTransparency.requestTrackingPermission();
          console.log('ATT 권한 상태:', trackingStatus);
        }
      } catch (error) {
        console.log('ATT 권한 요청 처리 중 에러:', error);
      }
    }

    console.log('Facebook SDK 초기화 완료');
  } catch (error) {
    console.error('Facebook SDK 초기화 실패:', error);
  }
};

/**
 * Facebook 광고 이벤트 추적
 * Purchase, ViewContent, InitiateCheckout 등의 이벤트를 추적합니다.
 */
export const logFacebookEvent = (eventName: string, eventData?: Record<string, any>) => {
  try {
    const { AppEventsLogger } = require('react-native-fbsdk-next');
    if (AppEventsLogger) {
      AppEventsLogger.logEvent(eventName, null, eventData);
      console.log(`Facebook 이벤트 추적: ${eventName}`, eventData);
    }
  } catch (error) {
    console.error('Facebook 이벤트 추적 실패:', error);
  }
};

/**
 * 구매 이벤트 로깅
 */
export const logPurchaseEvent = (
  amount: number,
  currency: string = 'KRW',
  productId?: string,
  productName?: string
) => {
  logFacebookEvent('Purchase', {
    _valueToSum: amount,
    _currency: currency,
    content_id: productId,
    content_name: productName,
    content_type: 'product',
  });
};

/**
 * 상품 조회 이벤트 로깅
 */
export const logViewContentEvent = (
  productId: string,
  productName: string,
  price?: number,
  currency: string = 'KRW'
) => {
  logFacebookEvent('ViewContent', {
    content_id: productId,
    content_name: productName,
    content_type: 'product',
    value: price,
    currency: currency,
  });
};

/**
 * 결제 시작 이벤트 로깅
 */
export const logInitiateCheckoutEvent = (
  totalAmount: number,
  currency: string = 'KRW',
  itemCount?: number
) => {
  logFacebookEvent('InitiateCheckout', {
    value: totalAmount,
    currency: currency,
    num_items: itemCount,
  });
};

/**
 * 회원가입/리드 이벤트 로깅
 */
export const logLeadEvent = (leadType?: string) => {
  logFacebookEvent('Lead', {
    content_name: leadType || '회원가입',
  });
};
