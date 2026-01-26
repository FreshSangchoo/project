import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '@/navigation/types/chat-stack';

export type ChatNav = NativeStackNavigationProp<ChatStackParamList>;

export default function useChatNavigation() {
  return useNavigation<ChatNav>();
}

export type { ChatStackParamList } from '@/navigation/types/chat-stack';
