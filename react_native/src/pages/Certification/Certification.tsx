import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import { BASE_URL } from '@/config';
import useDanalApi from '@/hooks/apis/useDanalApi';
import useAuthApi from '@/hooks/apis/useAuthApi';
import WebView from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CertificationResultType, CertificationStackParamList } from '@/navigation/types/certification-stack';
import useCertificationNavigation from '@/hooks/navigation/useCertificationNavigation';
import useAuthNavigation from '@/hooks/navigation/useAuthNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { semanticColor } from '@/styles/semantic-color';
import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticNumber } from '@/styles/semantic-number';

type CertificationProps = NativeStackScreenProps<CertificationStackParamList, 'Certification'>;

const Certification = ({ route }: CertificationProps) => {
  const { postDanalVerify, postDanalServer, postDanalConfirm } = useDanalApi();
  const { postSettingPhone } = useAuthApi();

  const [html, setHtml] = useState<string | null>(null);
  const [tid, setTid] = useState<string>('');

  const RETURN_URL = `${BASE_URL}/danal/target`;

  const authNavigation = useAuthNavigation();
  const certificationNavigation = useCertificationNavigation();

  const webRef = useRef<WebView>(null);
  const handled = useRef(false);
  const returnUrlSent = useRef(false);
  const suppressFurtherLoads = useRef(false);
  const doneTimer = useRef<NodeJS.Timeout | null>(null);
  const setDoneTimer = (ms = 1000) => {
    clearDoneTimer();
    doneTimer.current = setTimeout(() => {
      if (!handled.current) handleDone();
    }, ms);
  };
  const clearDoneTimer = () => {
    if (doneTimer.current) {
      clearTimeout(doneTimer.current);
      doneTimer.current = null;
    }
  };

  const origin = route.params.origin;

  const navigateByOrigin = (ok: CertificationResultType) => {
    // origin === 'foundEmail'인 경우 finalize에서 분기
    if (origin === 'setPassword') {
      if (ok === 'success') authNavigation.navigate('SetPassword', { isCertification: true });
      else certificationNavigation.navigate('CertificationAuth', { origin: 'setPassword' });
    } else {
      certificationNavigation.navigate('CertificationCommon', { ok });
    }
  };

  // TID 송신
  useEffect(() => {
    AvoidSoftInput.setShouldMimicIOSBehavior(false);
    AvoidSoftInput.setAdjustNothing();
    AvoidSoftInput.setEnabled(false);

    (async () => {
      try {
        const tidValue = await postDanalVerify();
        if (!tidValue) throw new Error('TID is empty');
        setTid(tidValue);
        const htmlString = await postDanalServer(String(tidValue));
        setHtml(String(htmlString));
      } catch (e) {
        if (__DEV__) console.error(e);
        setHtml('');
      }
    })();

    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(true);
      AvoidSoftInput.setAdjustResize();
      AvoidSoftInput.setEnabled(true);
      clearDoneTimer();
    };
  }, []);

  const finalize = async () => {
    try {
      // CONFIRM
      const result = await postDanalConfirm(tid);
      const ok = !!result && result.RETURNCODE === '0000';
      if (!ok) return navigateByOrigin('error');

      const name = result?.NAME!;
      const phone = result?.PHONE;
      const userId = result?.USERID;

      if (origin === 'foundEmail') {
        if (!phone) return navigateByOrigin('error');
        certificationNavigation.replace('CertificationAuth', { origin: 'foundEmail', phone });
        return;
      }

      if (!phone || !userId) return navigateByOrigin('error');

      const res = await postSettingPhone({ name, userId, phone });
      if (!res.ok) {
        if (__DEV__) console.log('[SETTING_PHONE conflict]', res.reason);
        return navigateByOrigin('fail');
      }

      navigateByOrigin('success');
    } catch (e: any) {
      if (__DEV__) console.log('[finalize error]', e?.response || e);
      navigateByOrigin('error');
    }
  };

  const injectFallback = `
    (function(){
      try {
        var txt = (document.querySelector('pre')?.innerText || document.body?.innerText || '').trim();
        if (txt && txt.length <= 100 && /^(OK|SUCCESS)$/i.test(txt)) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'OK' }));
        }
      } catch(e) {}
    })();
    true;
  `;

  const isReturnUrl = (url?: string) => !!url && url.indexOf(RETURN_URL) === 0;
  const isBlankLike = (url?: string) => url === 'about:blank' || url === '' || url === undefined;

  const handleDone = async () => {
    if (handled.current) return;
    handled.current = true;
    clearDoneTimer();
    await finalize();
  };

  if (html === null) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ButtonTitleHeader
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => certificationNavigation.goBack(),
        }}
        title=""
      />

      <WebView
        ref={webRef}
        source={{ html, baseUrl: 'https://wauth.teledit.com' }}
        originWhitelist={['*']}
        javaScriptEnabled
        keyboardDisplayRequiresUserAction={false}
        scrollEnabled={true}
        onShouldStartLoadWithRequest={req => {
          const url = req?.url || '';
          if (__DEV__) console.log('[shouldStart]', url);

          if (suppressFurtherLoads.current) {
            if (__DEV__) console.log('[shouldStart] suppressing further load:', url);
            return false;
          }

          if (isReturnUrl(url)) {
            if (!returnUrlSent.current) {
              returnUrlSent.current = true;
              webRef.current?.injectJavaScript(injectFallback);
              setDoneTimer(1000);

              return true;
            } else {
              suppressFurtherLoads.current = true;
              handleDone();
              return false;
            }
          }

          if (returnUrlSent.current && isBlankLike(url)) {
            suppressFurtherLoads.current = true;
            handleDone();
            return false;
          }

          return true;
        }}
        onLoadEnd={({ nativeEvent }) => {
          const url = nativeEvent.url || '';
          if (__DEV__) console.log('[LOAD_END]', url);

          if (isReturnUrl(url)) {
            if (!returnUrlSent.current) {
              returnUrlSent.current = true;
              webRef.current?.injectJavaScript(injectFallback);
              setDoneTimer(1000);
            } else if (!handled.current) {
              suppressFurtherLoads.current = true;
              handleDone();
            }
          } else if (returnUrlSent.current && isBlankLike(url) && !handled.current) {
            suppressFurtherLoads.current = true;
            handleDone();
          }
        }}
        onMessage={() => {
          handleDone();
        }}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="always"
        onRenderProcessGone={() => {
          webRef.current?.reload();
        }}
        onContentProcessDidTerminate={() => {
          webRef.current?.reload();
        }}
        onHttpError={e => {
          if (__DEV__) console.log('[WEBVIEW onHttpError]', e.nativeEvent);
        }}
        onError={e => {
          if (__DEV__) console.log('[WEBVIEW onError]', e.nativeEvent);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: semanticColor.surface.white },
});

export default Certification;
