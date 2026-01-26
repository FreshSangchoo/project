import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';

type ProductPost = {
  name: string;
  brandId?: number;
  customBrand?: string;
  effectTypeId: number;
  isUnbrandedOrCustom: boolean;
};

const useProductApi = () => {
  const { productApi } = useApi();

  const postProduct = (product: ProductPost) => {
    if (__DEV__) {
      console.log('커스텀 모델 등록 요청: ', product);
    }
    return productApi
      .post(ENDPOINTS.PRODUCT.POST, product)
      .then(response => {
        return response.data;
      })
      .catch(error => {
        if (__DEV__) {
          console.log('커스텀 모델 등록 오류: ', error);
        }
        throw error;
      });
  };

  return {
    postProduct,
  };
};

export default useProductApi;
