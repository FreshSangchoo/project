import { numbers } from './numbers';

const semanticNumber = {
  borderRadius: {
    none: numbers[0],
    sm: numbers[4],
    md: numbers[8],
    lg: numbers[12],
    xl: numbers[16],
    xl2: numbers[24],
    full: numbers.max,
  },

  stroke: {
    none: numbers[0],
    hairline: numbers.decimal['033'],
    xlight: numbers[1],
    light: numbers.decimal[133],
    medium: numbers.decimal[150],
    bold: numbers[2],
    xbold: numbers[4],
  },

  spacing: {
    none: numbers[0],
    4: numbers[4],
    8: numbers[8],
    12: numbers[12],
    16: numbers[16],
    18: numbers[18],
    20: numbers[20],
    22: numbers[22],
    24: numbers[24],
    32: numbers[32],
    34: numbers[34],
    36: numbers[36],
    40: numbers[40],
    44: numbers[44],
    48: numbers[48],

    1: numbers[1],
    2: numbers[2],
    3: numbers[3],
    5: numbers[5],
    6: numbers[6],
    7: numbers[7],
    10: numbers[10],
    14: numbers[14],
    28: numbers[28],
    56: numbers[56],
    64: numbers[64],
    120: numbers[120],
    156: numbers[156],
  },
};

export { semanticNumber };
