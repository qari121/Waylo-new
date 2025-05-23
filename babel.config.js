module.exports = function (api) {
	api.cache(true);
	return {
		presets: [
			['babel-preset-expo', { jsxImportSource: 'nativewind' }]
		],
		plugins: [
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
			//'nativewind/babel',
			'react-native-reanimated/plugin'
		],
	};
};
