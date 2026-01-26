import { FlatList, StyleSheet, View } from 'react-native';
import NoResultSection from '@/components/common/NoResultSection';
import BlockedUserCard, { BlockedUserCardProps } from '@/components/common/user-card/BlockedUserCard';
import CenterHeader from '@/components/common/header/CenterHeader';
import NoBlockedUserIcon from '@/assets/icons/EmojiDove.svg';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticColor } from '@/styles/semantic-color';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { semanticNumber } from '@/styles/semantic-number';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlockedUserCardSkeleton from '@/components/common/user-card/BlockedUserCardSkeleton';
import useUserApi from '@/hooks/apis/useUserApi';
import { BlockedUser, blockedUserToCard } from '@/utils/blockedUserToCard';
import { useToastStore } from '@/stores/toastStore';

function BlockedUserList() {
  const navigation = useNavigation();
  const { postBlockUser, deleteBlockedUser, getBlockedUser } = useUserApi();
  const [blockedUsersList, setBlockedUsersList] = useState<BlockedUserCardProps[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const showToast = useToastStore(s => s.show);

  const loadPage = async () => {
    try {
      const data = await getBlockedUser();
      const blockedUsers = data.map(({ userInfo, blockedAt }: BlockedUser) => blockedUserToCard(userInfo, blockedAt));
      setBlockedUsersList(blockedUsers);
    } catch (error) {
      if (__DEV__) {
        console.log('[BlockedUserList][loadPage] error: ', error);
      }
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    setBlockedUsersList([]);
    loadPage();
  }, []);

  const handleBlock = (targetId: string) => async () => {
    if (processingId) return;

    setProcessingId(targetId);

    const target = blockedUsersList.find(user => user.userId === targetId);
    if (!target) {
      setProcessingId(null);
      return;
    }

    try {
      if (target.isBlocked) {
        await deleteBlockedUser(Number(targetId));
        setBlockedUsersList(prev =>
          prev.map(user => (user.userId === targetId ? { ...user, isBlocked: false } : user)),
        );
        showToast({ message: '차단을 해제했습니다.', image: 'EmojiCheckMarkButton', duration: 1500 });
      } else {
        await postBlockUser(Number(targetId));
        setBlockedUsersList(prev => prev.map(user => (user.userId === targetId ? { ...user, isBlocked: true } : user)));
        showToast({ message: '차단되었습니다.', image: 'EmojiNoEntry', duration: 1500 });
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[BlockedUserList][handleBlock] error: ', error);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.blockedUserListContainer} edges={['top', 'right', 'left']}>
      <CenterHeader
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
        title="차단한 사용자"
      />
      {loadingInitial && blockedUsersList.length === 0 ? (
        <View>
          <BlockedUserCardSkeleton />
          <BlockedUserCardSkeleton />
          <BlockedUserCardSkeleton />
        </View>
      ) : blockedUsersList.length === 0 ? (
        <NoResultSection
          emoji={<NoBlockedUserIcon />}
          title="차단한 사용자가 없어요."
          description="앞으로도 즐거운 악기 거래 되시길 바라요."
        />
      ) : (
        <FlatList
          data={blockedUsersList}
          renderItem={({ item }) => (
            <BlockedUserCard {...item} onPress={handleBlock(item.userId)} isBlocking={processingId === item.userId} />
          )}
          contentContainerStyle={{ paddingBottom: 60 }}
          onEndReachedThreshold={0.6}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blockedUserListContainer: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
});

export default BlockedUserList;
