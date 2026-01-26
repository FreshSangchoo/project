import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import { StyleSheet, Text, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticColor } from '@/styles/semantic-color';
import { useRoute } from '@react-navigation/native';
import MerchandiseCard, { MerchandiseCardProps } from '@/components/common/merchandise-card/MerchandiseCard';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import usePostsApi from '@/hooks/apis/usePostApi';
import { useMemo, useState } from 'react';
import ToolBar from '@/components/common/button/ToolBar';
import { useToastStore } from '@/stores/toastStore';

interface RouteParams {
  postId: number;
  card?: MerchandiseCardProps;
  onDone?: () => void;
}

function minutesToText(m: number) {
  if (m <= 0) return '지금 끌어올릴 수 있어요.';
  const days = Math.floor(m / (60 * 24));
  const hours = Math.floor((m % (60 * 24)) / 60);
  const mins = m % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (mins > 0) parts.push(`${mins}분`);
  return `${parts.join(' ')} 뒤에\n끌어올릴 수 있어요.`;
}

function PullUpPage() {
  const navigation = useMyNavigation();
  const route = useRoute();
  const { postId, card, onDone } = route.params as RouteParams;
  const { postBumpPost } = usePostsApi();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const showToast = useToastStore(s => s.show);

  const canPullUp = remainingTime === null || remainingTime <= 0;

  const title = useMemo(() => {
    if (canPullUp) return '지금 끌어올리시겠어요?';
    return minutesToText(remainingTime!);
  }, [remainingTime, canPullUp]);

  const onPressBump = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await postBumpPost(postId);
      onDone?.();
      showToast({ message: '게시물을 끌어올렸어요.', image: 'EmojiWavingHand', duration: 2000 });
      navigation.goBack();
    } catch (error: any) {
      const remainingMinutes = error?.response?.data?.remainingMinutes;
      if (typeof remainingMinutes === 'number') setRemainingTime(remainingMinutes);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.pullUpPage}>
      <ButtonTitleHeader
        title="끌어올리기"
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
      <View style={styles.contentWrapper}>
        <View style={styles.titleWrapper}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        {card && <MerchandiseCard {...card} />}
      </View>
      <ToolBar
        key={`toolbar-${canPullUp}`}
        children="끌어올리기"
        onPress={onPressBump}
        disabled={!canPullUp || loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pullUpPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  contentWrapper: {
    flex: 1,
  },
  titleWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[40],
    paddingBottom: semanticNumber.spacing[12],
  },
  titleText: {
    ...semanticFont.headline.medium,
    color: semanticColor.text.primary,
  },
  buttonWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[10],
  },
});

export default PullUpPage;
