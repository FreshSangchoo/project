import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types/home-stack';

export type HomeNav = NativeStackNavigationProp<HomeStackParamList>;

export default function useHomeNavigation() {
  return useNavigation<HomeNav>();
}

export type { HomeStackParamList } from '@/navigation/types/home-stack';
