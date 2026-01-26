module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@apis': './src/apis',
          '@assets': './src/assets',
          '@components': './src/components',
          '@costants': './src/costants',
          '@hooks': './src/hooks',
          '@interfaces': './src/interfaces',
          '@pages': './src/pages',
          '@stores': './src/stores',
          '@styles': './src/styles',
          '@types': './src/types',
          '@utils': './src/utils',
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    ],
  ],
};
