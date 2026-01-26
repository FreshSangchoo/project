export type TabParamList = {
  Home: undefined;
  Explore:
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
  Chat: undefined;
  My: undefined;
};
