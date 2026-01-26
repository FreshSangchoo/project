import CenterHeader from '@/components/common/header/CenterHeader';
import { Dimensions, StyleSheet, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import SettingItemRow from '@/components/my-page/SettingItemRow';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { useNavigation } from '@react-navigation/native';
import { termsAndConditionsItems } from '@/constants/MyPageSectionItems';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import WebView from 'react-native-webview';
import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';

function TermsAndConditionsPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [webVisible, setWebVisible] = useState<boolean>(false);
  const [webUrl, setWebUrl] = useState<string>('');
  const [webTitle, setWebTitle] = useState<string>('');

  const openURL = (url: string) => {
    setWebUrl(url);
    setWebVisible(true);
  };

  const closeURL = () => {
    setWebVisible(false);
    setWebUrl('');
  };

  return (
    <SafeAreaView style={styles.termsAndConditionsPage}>
      <CenterHeader
        title="약관 및 정책"
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => navigation.goBack(),
        }}
      />
      {termsAndConditionsItems(openURL).map(item => (
        <SettingItemRow
          key={item.itemName}
          {...item}
          onPress={() => {
            setWebTitle(item.itemName);
            item.onPress?.();
          }}
        />
      ))}
      {webVisible && (
        <View style={[styles.webViewWrapper, { paddingTop: insets.top }]}>
          <ButtonTitleHeader
            title={webTitle}
            leftChilds={{
              icon: (
                <IconChevronLeft
                  width={28}
                  height={28}
                  stroke={semanticColor.icon.primary}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              ),
              onPress: () => closeURL(),
            }}
          />
          <WebView source={{ uri: webUrl }} startInLoadingState style={{ flex: 1 }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  termsAndConditionsPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  webViewWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: Dimensions.get('screen').height,
    backgroundColor: semanticColor.surface.white,
    overflow: 'hidden',
  },
});

export default TermsAndConditionsPage;
