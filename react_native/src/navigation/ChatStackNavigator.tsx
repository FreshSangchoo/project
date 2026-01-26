import ChattingRoomPage from '@/pages/chat/ChattingRoomPage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatStackParamList } from '@/navigation/types/chat-stack';
import ChattingTaggedMerchandiseList from '@/pages/chat/ChattingTaggedMerchandiseList';

const Stack = createNativeStackNavigator<ChatStackParamList>();

function ChatStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChattingRoomPage" component={ChattingRoomPage} />
      <Stack.Screen name="ChattingTaggedMerchandiseList" component={ChattingTaggedMerchandiseList} />
    </Stack.Navigator>
  );
}

export default ChatStackNavigator;
