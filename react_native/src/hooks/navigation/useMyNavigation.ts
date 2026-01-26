import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyStackParamList } from '@/navigation/types/my-stack';

export type MyNav = NativeStackNavigationProp<MyStackParamList>;

export default function useMyNavigation() {
  return useNavigation<MyNav>();
}

export type { MyStackParamList } from '@/navigation/types/my-stack';
