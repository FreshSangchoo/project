const queryKeys = {
  AUTH: {
    '': 'auth',
    GET_ACCESS_TOKEN: 'getAccessToken',
    GET_PROFILE: 'getProfile',
  },
  ACCOUNT: {
    '': 'account',
    ACCOUNTNO: 'accountNo',
    ACCOUNTHOLDER: 'accountHolder',
  },
  STOCK: {
    '': 'stock',
  },
} as const;

const storageKeys = {
  REFRESH_TOKEN: 'refreshToken',
} as const;

export {queryKeys, storageKeys};
