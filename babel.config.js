module.exports = function (api) {
	api.cache(true);
	return {
	  presets: ['babel-preset-expo'],
	  plugins: [
		/* ----------  ADD THIS BLOCK  ---------- */
		[
		  'module-resolver',
		  {
			extensions: [
			  '.ios.js',
			  '.android.js',
			  '.js',
			  '.ts',
			  '.tsx',
			  '.json',
			],
			alias: {
			  '@components': './components',
			  '@screens': './screens',
			  '@hooks': './hooks',
			  '@lib': './lib',
			},
		  },
		],
		/* ----------  KEEP THIS LAST  ---------- */
		'react-native-reanimated/plugin',
	  ],
	};
  };
  