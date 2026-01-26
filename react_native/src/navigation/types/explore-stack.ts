export type ExploreStackParamList = {
  ExplorePage:
    | {
        searchType?: 'keyword' | 'brand' | 'model';
        keyword?: string;
        brandId?: number;
        brandName?: string;
        brandKorName?: string;
        modelId?: number;
        modelName?: string;
      }
    | undefined;
  ExploreSearchPage: undefined;
  MerchandiseDetailPage: { id: number };
  ModelPage: {
    id: number;
    modelName?: string;
    brandId?: number;
    brandName?: string;
    brandKorName?: string;
    category?: string;
  };
  BrandPage: { id: number; brandName?: string; brandKorName?: string };
  SellerPage: { id: number };
};
