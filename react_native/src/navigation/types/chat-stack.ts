export type ChatStackParamList = {
  ChattingRoomPage: {
    channelId: string;
    nickname: string;
    post?: {
      id: number;
      brandName: string;
      modelName: string;
      price: number;
      thumbnail: string;
      writer?: { userId: number };
    };
    targetUserId?: number;
    withdrawn?: boolean;
  };
  ChattingTaggedMerchandiseList: { channelId: string };
};
