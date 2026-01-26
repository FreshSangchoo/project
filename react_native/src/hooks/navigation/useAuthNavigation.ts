import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types/auth-stack';

export type AuthStackNavProp = NativeStackNavigationProp<AuthStackParamList>;

export default function useAuthNavigation() {
  return useNavigation<AuthStackNavProp>();
}

export type { AuthStackParamList } from '@/navigation/types/auth-stack';
