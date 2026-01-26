export type Origin = 'Home' | 'Explore' | 'My';

export type HomeStackParamList = {
  UploadIndexPage: { origin?: Origin; productId?: number; startFresh?: boolean } | undefined;
  ModelSearchPage: { origin?: Origin } | undefined;
  UploadModelPage:
    | {
        brand?: string;
        modelName?: string;
        category?: string;
        onPress?: () => void;
        origin?: 'Home' | 'Explore' | 'My' | 'Detail';
        mode?: 'create' | 'edit';
        postId?: number;
      }
    | undefined;
  UploadModelManual: { origin?: Origin } | undefined;
  Notification: undefined;
  Article: { id: number };
  PushSettingPage: undefined;
};
