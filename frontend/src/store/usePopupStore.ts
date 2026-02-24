import create from "zustand";

interface PopupState {
  storeName: string;
  storeContent: string;
  selectedImages: File[];
  startDate: string | null;
  endDate: string | null;
  selectedDays: string[];
  timeSlots: { [key: string]: string };
  hours: string;
  address: string;
  lat: number | null;
  lon: number | null;
  snsUrl?: string;
  pageUrl?: string;
  description: string;
  preReservationOpenAt: Date | null;
  term: number;
  maxPeoplePerSession: number;
  maxReservationsPerPerson: number;
  warning: string;
  categories: number[];
  setStoreName: (name: string) => void;
  setStoreContent: (content: string) => void;
  setSelectedImages: (images: File[]) => void;
  setStartDate: (date: string | null) => void;
  setEndDate: (date: string | null) => void;
  setAddress: (address: string) => void;
  setLat: (lat: number) => void;
  setLon: (lon: number) => void;
  setPopupData: (data: Partial<PopupState>) => void;
  setServiceCategory: (category: string, value: string) => void;
  setSelectedDays: (days: string[]) => void;
  setTimeSlots: (slots: { [key: string]: string }) => void;
  setHours: (hours: string) => void;
  setPreReservationOpenAt: (date: Date | null) => void;
  setTerm: (term: number) => void;
  setMaxPeoplePerSession: (maxPeople: number) => void;
  setMaxReservationsPerPerson: (maxReservations: number) => void;
  setWarning: (warning: string) => void;
  setCategories: (categories: number[]) => void;
}

const usePopupStore = create<PopupState>((set) => ({
  storeName: "",
  storeContent: "",
  selectedImages: [],
  startDate: null,
  endDate: null,
  selectedDays: [],
  timeSlots: {},
  hours: "",
  address: "",
  lat: null,
  lon: null,
  snsUrl: "",
  pageUrl: "",
  description: "{}",
  preReservationOpenAt: null,
  term: 0,
  maxPeoplePerSession: 0,
  maxReservationsPerPerson: 0,
  warning: "",
  categories: [],
  setStoreName: (name) => set(() => ({ storeName: name })),
  setStoreContent: (content) => set(() => ({ storeContent: content })),
  setStartDate: (date) => set(() => ({ startDate: date })),
  setEndDate: (date) => set(() => ({ endDate: date })),
  setAddress: (address) => set(() => ({ address: address })),
  setLat: (lat) => set(() => ({ lat: lat })),
  setLon: (lon) => set(() => ({ lon: lon })),
  setPopupData: (data) => set((state) => ({ ...state, ...data })),
  setServiceCategory: (category, value) =>
    set((state) => {
      const updatedCategories = {
        ...JSON.parse(state.description || "{}"),
        [category]: value,
      };
      const updatedCategoriesString = JSON.stringify(updatedCategories);
      return {
        description: updatedCategoriesString,
      };
    }),
  setSelectedDays: (days) => set(() => ({ selectedDays: days })),
  setTimeSlots: (slots) => set(() => ({ timeSlots: slots })),
  setSelectedImages: (images) => set(() => ({ selectedImages: images })),
  setHours: (hours) => set(() => ({ hours })),
  setPreReservationOpenAt: (date) =>
    set(() => ({ preReservationOpenAt: date })),
  setTerm: (term) => set(() => ({ term })),
  setMaxPeoplePerSession: (maxPeople) =>
    set(() => ({ maxPeoplePerSession: maxPeople })),
  setMaxReservationsPerPerson: (maxReservations) =>
    set(() => ({ maxReservationsPerPerson: maxReservations })),
  setWarning: (warning) => set(() => ({ warning })),
  setCategories: (categories) => set(() => ({ categories })),
}));

export default usePopupStore;
