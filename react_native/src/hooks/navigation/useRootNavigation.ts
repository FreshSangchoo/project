import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types/root';

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function useRootNavigation() {
  return useNavigation<RootNav>();
}

export type { RootStackParamList } from '@/navigation/types/root';
