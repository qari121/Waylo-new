module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@components': './components',
            '@screens': './screens',
            '@lib': './@lib',
            '@assets': './assets',
            '@types': './types',
            '@slices': './slices',
            '@services': './services',
            '@hooks': './hooks',
            '@store': './store.ts',
          },
        },
      ],
    ],
  };
};
