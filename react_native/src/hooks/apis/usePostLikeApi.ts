import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';

const usePostLikeApi = () => {
  const { postLikeApi } = useApi();

  const getPostLike = (postId: string) => {
    return postLikeApi
      .get(ENDPOINTS.POST_LIKE.GET(postId))
      .then(response => {
        return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };
  const postPostLike = (postId: string) => {
    return postLikeApi
      .post(ENDPOINTS.POST_LIKE.POST(postId))
      .then(response => {
        return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };
  const deletePostLike = (postId: string) => {
    return postLikeApi
      .delete(ENDPOINTS.POST_LIKE.DELETE(postId))
      .then(response => {
        return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };
  return { getPostLike, postPostLike, deletePostLike };
};

export default usePostLikeApi;
