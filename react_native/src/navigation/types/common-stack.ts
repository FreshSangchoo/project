export type CommonStackParamList = {
  AosBottomSheet: {
    title: '이펙터 타입' | '브랜드 선택' | '지역 선택' | '필터';
    onSelectBrand?: (brand: { id: number; name: string }) => void;
    onSelectEffects?: (names: string[]) => void;
    onSkip?: () => void;
  };
};
