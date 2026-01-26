import { useState } from 'react';
import usePostLikeApi from '@/hooks/apis/usePostLikeApi';
import { useFilterToastStore } from '@/stores/useFilterToastStore';

type ToastImage = 'EmojiCheckMarkButton' | 'EmojiCrossmark';

export const useLikeHandler = (useGlobalToast = false) => {
  const { postPostLike, deletePostLike } = usePostLikeApi();
  const showGlobalToast = useFilterToastStore(state => state.showToast);

  const [toastMessage, setToastMessage] = useState('');
  const [toastImage, setToastImage] = useState<'EmojiCheckMarkButton' | 'EmojiCrossmark'>('EmojiCheckMarkButton');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  const showToast = (message: string, image: 'EmojiCheckMarkButton' | 'EmojiCrossmark') => {
    if (useGlobalToast) {
      showGlobalToast(message, image);
    } else {
      setToastKey(prev => prev + 1);
      setToastMessage(message);
      setToastImage(image);
      setToastVisible(true);
    }
  };

  const toggleLike = async (id: number, isLiked: boolean, updateFn: (id: number, newIsLiked: boolean) => void, profile?: any, setLoginModal?: (state: boolean) => void) => {
    if (!profile?.userId && setLoginModal) {
      setLoginModal(true);
      return;
    }

    try {
      if (isLiked) {
        await deletePostLike(String(id));
        updateFn(id, false);
        showToast('내가 찜한 악기에서 삭제', 'EmojiCrossmark');
      } else {
        await postPostLike(String(id));
        updateFn(id, true);
        showToast('내가 찜한 악기에 추가 완료!', 'EmojiCheckMarkButton');
      }
    } catch {
      showToast('에러가 발생했습니다.', 'EmojiCrossmark');
    }
  };

  return {
    toggleLike,
    toastMessage,
    toastImage,
    toastVisible,
    toastKey,
    setToastVisible,
  };
};
