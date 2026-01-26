export interface ModelCardItem {
  id: number;
  brand: string;
  modelName: string;
  category: string;
}

const ModelCardMock: ModelCardItem[] = [
  { id: 1, brand: 'Ibanez', modelName: '850 Fuzz Mini', category: '이펙터>퍼즈' },
  { id: 2, brand: 'Ibanez', modelName: 'AD-80 Analog Delay', category: '이펙터>딜레이' },
  { id: 3, brand: 'Ibanez', modelName: 'AD-9 Analog Delay', category: '이펙터>딜레이' },
  { id: 4, brand: 'Ibanez', modelName: 'AF2 Airplane Flanger', category: '이펙터>플랜저' },
  { id: 5, brand: 'Ibanez', modelName: 'Analog Delay Mini', category: '이펙터>딜레이' },
  { id: 6, brand: 'Ibanez', modelName: 'Big Mini Tuner', category: '이펙터>튜너' },
];

export default ModelCardMock;