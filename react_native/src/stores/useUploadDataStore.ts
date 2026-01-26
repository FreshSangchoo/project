import { create } from 'zustand';

export type UploadImageItem = {
  uri: string;
  isRemote?: boolean;
  name?: string;
  type?: string;
};

type DeliveryInfo = {
  feeIncluded: boolean;
  deliveryFee: number;
  validDeliveryFee: boolean;
};

type UploadDataState = {
  productId: number | null;
  deliveryAvailable: boolean;
  directAvailable: boolean;
  exchangeAvailable: boolean;
  validTradeOptions: boolean;
  deliveryInfo: DeliveryInfo;
  directInfo: { locations: number[] };
  directRegionNames: string[];
  partChange: boolean;
  price: number;
  customProductId: number | null;
  condition: string | null;
  description: string;
  images: UploadImageItem[];
  removedImageUrls: string[];

  setProductId: (id: number | null) => void;
  setDeliveryAvailable: (v: boolean) => void;
  setDirectAvailable: (v: boolean) => void;
  setExchangeAvailable: (v: boolean) => void;
  setValidTradeOptions: (v: boolean) => void;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  setDirectLocations: (ids: number[]) => void;
  setDirectRegionNames: (names: string[]) => void;
  clearDirectSelection: () => void;
  setPartChange: (v: boolean) => void;
  setPrice: (n: number) => void;
  setCustomProductId: (id: number | null) => void;
  setCondition: (s: string) => void;
  setDescription: (s: string) => void;
  setImages: (arr: UploadImageItem[]) => void;
  pushRemovedImageUrl: (url: string) => void;
  clearRemovedImages: () => void;
  reset: () => void;
};

const initial = {
  productId: null,
  deliveryAvailable: false,
  directAvailable: false,
  exchangeAvailable: false,
  validTradeOptions: false,
  deliveryInfo: { feeIncluded: true, deliveryFee: 0, validDeliveryFee: true },
  directInfo: { locations: [] },
  directRegionNames: [],
  partChange: false,
  price: 0,
  customProductId: null,
  condition: null,
  description: '',
  images: [] as UploadImageItem[],
  removedImageUrls: [] as string[],
};

export const useUploadDataStore = create<UploadDataState>(set => ({
  ...initial,

  setProductId: id => set({ productId: id }),
  setDeliveryAvailable: v => set({ deliveryAvailable: v }),
  setDirectAvailable: v => set({ directAvailable: v }),
  setExchangeAvailable: v => set({ exchangeAvailable: v }),
  setValidTradeOptions: v => set({ validTradeOptions: v }),
  setDeliveryInfo: info => set({ deliveryInfo: { ...info } }),
  setDirectLocations: ids => set({ directInfo: { locations: ids ?? [] } }),
  setDirectRegionNames: names => set({ directRegionNames: names ?? [] }),
  clearDirectSelection: () => set({ directInfo: { locations: [] }, directRegionNames: [] }),
  setPartChange: v => set({ partChange: v }),
  setPrice: n => set({ price: n }),
  setCustomProductId: id => set({ customProductId: id }),
  setCondition: s => set({ condition: s }),
  setDescription: s => set({ description: s }),
  setImages: arr => set({ images: Array.isArray(arr) ? arr : [] }),

  pushRemovedImageUrl: url =>
    set(state => ({
      removedImageUrls: state.removedImageUrls.includes(url)
        ? state.removedImageUrls
        : [...state.removedImageUrls, url],
    })),

  clearRemovedImages: () => set({ removedImageUrls: [] }),

  reset: () => {
    set({
      ...initial,
    });
  },
}));
