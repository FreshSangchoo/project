import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CertificationStackParamList } from '@/navigation/types/certification-stack';

export type CertificationStackNavProp = NativeStackNavigationProp<CertificationStackParamList>;

export default function useCertificationNavigation() {
  return useNavigation<CertificationStackNavProp>();
}

export type { CertificationStackParamList } from '@/navigation/types/certification-stack';
