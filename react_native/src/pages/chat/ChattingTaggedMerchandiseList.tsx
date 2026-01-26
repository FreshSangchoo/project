import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import useChatNavigation, { ChatStackParamList } from '@/hooks/navigation/useChatNavigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import MerchandiseCardSkeleton from '@/components/common/merchandise-card/MerchandiseCardSkeleton';
import MerchandiseCard, { MerchandiseCardProps } from '@/components/common/merchandise-card/MerchandiseCard';
import usePostLikeApi from '@/hooks/apis/usePostLikeApi';
import { merchandiseToCard } from '@/utils/merchandiseToCard';
import useChatApi from '@/hooks/apis/useChatApi';
import SectionSeparator from '@/components/common/SectionSeparator';
import { MerchandiseData } from '@/types/merchandise.types';
import { formatDateLabel } from '@/utils/formatDate';

type ChattingTaggedMerchandiseListRouteProps = RouteProp<ChatStackParamList, 'ChattingTaggedMerchandiseList'>;

type Item =
  | { type: 'date'; date: string }
  | { type: 'card'; item: MerchandiseCardProps }
  | { type: 'divider' }
  | { type: 'spacer'; height: number };

type TaggedCard = { card: MerchandiseCardProps; sentAtMs: number };

interface ChannelPostItem {
  post: MerchandiseData;
  sentAt?: number;
  sentAtFormatted?: string;
}

interface ChannelPostsResponse {
  channelId: string;
  totalCount: number;
  posts: ChannelPostItem[];
}

function ChattingTaggedMerchandiseList() {
  const navigation = useChatNavigation();
  const route = useRoute<ChattingTaggedMerchandiseListRouteProps>();
  const { channelId } = route.params;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [merchandiseList, setMerchandiseList] = useState<TaggedCard[]>([]);
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set());
  const { postPostLike, deletePostLike } = usePostLikeApi();
  const { getPostsInChannel } = useChatApi();

  const SkeletonList = () => (
    <View style={{ paddingBottom: 60 }}>
      <View>
        <MerchandiseCardSkeleton />
        <MerchandiseCardSkeleton />
        <MerchandiseCardSkeleton />
      </View>
    </View>
  );

  // 좋아요 누르기
  const pressLike = async (id: number, nextLiked: boolean) => {
    if (pendingLikeIds.has(id)) return;
    setPendingLikeIds(prev => new Set(prev).add(id));

    const prevList = merchandiseList;
    setMerchandiseList(current =>
      current.map(it =>
        it.card.id === id
          ? {
              ...it,
              card: {
                ...it.card,
                isLiked: nextLiked,
                likeNum: Math.max(0, it.card.likeNum + (nextLiked ? 1 : -1)),
              },
            }
          : it,
      ),
    );
    try {
      if (nextLiked) {
        await postPostLike(String(id));
      } else {
        await deletePostLike(String(id));
      }
    } catch (error) {
      setMerchandiseList(prevList);
    } finally {
      setPendingLikeIds(prev => {
        const set = new Set(prev);
        set.delete(id);
        return set;
      });
    }
  };

  const load = async () => {
    setLoadingInitial(true);
    try {
      const resp = (await getPostsInChannel(channelId)) as ChannelPostsResponse;

      const mapped: TaggedCard[] = (resp.posts ?? [])
        .map(({ post, sentAt, sentAtFormatted }) => {
          const card = merchandiseToCard(post);

          const sentMs =
            typeof sentAt === 'number'
              ? sentAt
              : sentAtFormatted
              ? new Date(sentAtFormatted).getTime()
              : new Date(card.createdAt as any).getTime();

          return { card, sentAtMs: sentMs };
        })
        .sort((a, b) => b.sentAtMs - a.sentAtMs);

      setMerchandiseList(mapped);
    } catch (error) {
      console.error('[ChattingTaggedMerchandiseList][load]', error);
      setMerchandiseList([]);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    setMerchandiseList([]);
    void load();
  }, [channelId]);

  const items: Item[] = useMemo(() => {
    const byDate = new Map<string, TaggedCard[]>();
    for (const item of merchandiseList) {
      const key = formatDateLabel(item.sentAtMs as any);
      if (!byDate.has(String(key))) byDate.set(String(key), []);
      byDate.get(String(key))!.push(item);
    }

    const entries = Array.from(byDate.entries());
    const out: Item[] = [];

    entries.forEach(([date, items], sectionIdx) => {
      out.push({ type: 'date', date });
      out.push({ type: 'spacer', height: semanticNumber.spacing[12] });

      items.forEach((it, idx) => {
        out.push({ type: 'card', item: it.card });
        out.push({ type: 'spacer', height: semanticNumber.spacing[12] });
        if (idx < items.length - 1) out.push({ type: 'divider' });
        out.push({ type: 'spacer', height: semanticNumber.spacing[12] });
      });

      if (sectionIdx < entries.length - 1) {
        out.push({ type: 'spacer', height: semanticNumber.spacing[12] });
      }
    });

    return out;
  }, [merchandiseList]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: Item }) => {
    switch (item.type) {
      case 'date':
        return <SectionSeparator type="date" date={item.date} />;
      case 'divider':
        return <SectionSeparator type="line-with-padding" />;
      case 'spacer':
        return <View style={{ height: item.height }} />;
      case 'card':
      default:
        return (
          <MerchandiseCard
            {...item.item}
            onPressCard={() => {
              const rootNav = navigation.getParent();
              rootNav!.navigate('ExploreStack', {
                screen: 'MerchandiseDetailPage',
                params: { id: item.item.id },
              });
            }}
            onPressHeart={() => {
              if (!item.item.id) return;
              pressLike(item.item.id, !item.item.isLiked);
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: semanticColor.surface.white }} edges={['top', 'left', 'right']}>
      <ButtonTitleHeader
        title="문의 매물 내역"
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
      {loadingInitial && merchandiseList.length === 0 ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      )}
    </SafeAreaView>
  );
}

export default ChattingTaggedMerchandiseList;
