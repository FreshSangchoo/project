import CustomerService from '@/components/common/CustomerService';
import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import IconHelpCircleFilled from '@/assets/icons/IconHelpCircleFilled.svg';
import IconInfoCircleFilled from '@/assets/icons/IconInfoCircleFilled.svg';
import IconMessageCircle from '@/assets/icons/IconMessageCircle.svg';
import IconExternalLink from '@/assets/icons/IconExternalLink.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { ensureChannelBoot, openChannelTalk } from '@/libs/channel';
import { useUserStore } from '@/stores/userStore';
import { showErrorToast } from '@/utils/errorHandler';

const SupportContainer = () => {
  const profile = useUserStore(p => p.profile);

  const onPressFAQ = () => {
    Linking.openURL('https://jammering-support.notion.site/frequently-asked-questions');
  };

  const onPressInquiry = async () => {
    try {
      await ensureChannelBoot({ name: profile?.name, mobileNumber: profile?.phone });
      openChannelTalk();
    } catch (error) {
      showErrorToast(error, '고객센터 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <View style={styles.container}>
      <CustomerService
        infoIcon={<IconHelpCircleFilled width={20} height={20} fill={semanticColor.icon.secondary} />}
        title="자주 묻는 질문"
        subTitle="많은 분들이 궁금해 하시는 질문과 답변을 모았어요."
        onPress={onPressFAQ}
        buttonIcon={
          <IconExternalLink
            width={24}
            height={24}
            stroke={semanticColor.icon.lightest}
            strokeWidth={semanticNumber.stroke.bold}
          />
        }
      />
      <CustomerService
        infoIcon={<IconInfoCircleFilled width={20} height={20} fill={semanticColor.icon.secondary} />}
        title="문의하기"
        subTitle="궁금하거나 문의해야 할 내용이 있다면?"
        onPress={onPressInquiry}
        buttonIcon={
          <IconMessageCircle
            width={24}
            height={24}
            stroke={semanticColor.icon.lightest}
            strokeWidth={semanticNumber.stroke.bold}
          />
        }
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[40],
    gap: semanticNumber.spacing[12],
    alignSelf: 'stretch',
  },
});
export default SupportContainer;
