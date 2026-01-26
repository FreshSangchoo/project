import CenterHeader from '@/components/common/header/CenterHeader';
import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconSettings from '@/assets/icons/IconSettings.svg';
import NotificationContent from '@/components/notification/NotificationContent';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types/root';
import { semanticColor } from '@/styles/semantic-color';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationsApi } from '@/hooks/apis/useNotificationsApi';
import NotificationSkeleton from '@/pages/notification/NotificationSkeleton';
import { NOTIFICATION_PAGE_SIZE } from '@/pages/notification/constant/notification';
import type { NotificationContentProps } from '@/hooks/apis/useNotificationsApi';

const Notification = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getNotifications, patchNotification } = useNotificationsApi();

  const [data, setData] = useState<NotificationContentProps[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (targetPage: number, mode: 'reset' | 'append') => {
    if (mode === 'append') setLoadingMore(true);
    if (mode === 'reset') setLoadingInitial(true);

    try {
      const fetchResponse = (await getNotifications({ page: targetPage, size: NOTIFICATION_PAGE_SIZE })) || {};
      const response = fetchResponse.data ?? fetchResponse;
      const notifications: NotificationContentProps[] = response.notifications ?? [];
      const hasNext: boolean | undefined = response.hasNext;

      if (mode === 'reset') {
        setData(notifications);
      } else {
        setData(prev => {
          const merged = [...prev, ...notifications];
          const seen = new Set<string>();
          return merged.filter(it => {
            const key = `${it.notificationId}-${it.sentAt}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      }

      if (typeof hasNext === 'boolean') {
        setHasMore(hasNext);
      } else {
        const totalPages = response.totalPages ?? response.pageCount;
        if (typeof totalPages === 'number' && typeof response.currentPage === 'number') {
          setHasMore(response.currentPage + 1 < totalPages);
        } else {
          setHasMore((notifications?.length ?? 0) === NOTIFICATION_PAGE_SIZE);
        }
      }

      setPage(typeof response.currentPage === 'number' ? response.currentPage : targetPage);
    } catch (error) {
      console.error('[Notification][getNotifications] error:', error);
      if (mode === 'reset') {
        setData([]);
        setHasMore(false);
      }
    } finally {
      if (mode === 'append') setLoadingMore(false);
      if (mode === 'reset') setLoadingInitial(false);
    }
  };

  useEffect(() => {
    setData([]);
    setPage(0);
    setHasMore(true);
    load(0, 'reset');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load(0, 'reset');
    } finally {
      setRefreshing(false);
    }
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore || loadingInitial || refreshing) return;
    load(page + 1, 'append');
  };

  const handlerPressGoBack = () => navigation.goBack();
  const rightChilds = [
    {
      icon: <IconSettings width={28} height={28} stroke={semanticColor.icon.primary} strokeWidth={2} />,
      onPress: () => navigation.navigate('HomeStack', { screen: 'PushSettingPage' }),
    },
  ];
  const leftChilds = {
    icon: <IconChevronLeft width={28} height={28} stroke={semanticColor.icon.primary} strokeWidth={2} />,
    onPress: handlerPressGoBack,
  };

  const handlePress = (notificationId: number) => {
    patchNotification({ notificationId }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <CenterHeader leftChilds={leftChilds} title="알림" rightChilds={rightChilds} />

      {loadingInitial && data.length === 0 ? (
        <>
          <NotificationSkeleton />
          <NotificationSkeleton />
          <NotificationSkeleton />
        </>
      ) : (
        <>
          <FlatList
            data={data}
            renderItem={({ item }) => (
              <NotificationContent
                notificationId={item.notificationId}
                category={item.category}
                title={item.title}
                body={item.body}
                readAt={item.readAt}
                sentAt={item.sentAt}
                read={item.read}
                onPress={() => handlePress(item.notificationId)}
              />
            )}
            keyExtractor={(item, index) => `${item.notificationId}-${item.sentAt}-${index}`}
            contentContainerStyle={{ paddingBottom: 60 }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListFooterComponent={loadingMore ? <NotificationSkeleton /> : <View />}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
});

export default Notification;
