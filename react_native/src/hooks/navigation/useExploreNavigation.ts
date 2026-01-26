import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '@/navigation/types/explore-stack';

export type ExploreNav = NativeStackNavigationProp<ExploreStackParamList>;

export default function useExploreNavigation() {
  return useNavigation<ExploreNav>();
}

export type { ExploreStackParamList } from '@/navigation/types/explore-stack';
