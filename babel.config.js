module.exports = function (api) {
	api.cache(true);
  
	return {
	  presets: [
		['babel-preset-expo', { jsxImportSource: 'nativewind' }],
		'nativewind/babel',
	  ],
	  plugins: [
		[
		  'module-resolver',
		  {
			root: ['.'],
			alias: {
			  // BOTH forms you use in imports ↓
			  '@components': './components',
			  '@screens':    './screens',
			  '@lib':        './lib',
			  'lib':         './lib',
			  '@hooks':      './hooks',
			  'hooks':       './hooks',
			  '@services':   './services',
			  '@slices':     './slices',
			  '@types':      './types',
			  'store':       './store',    // you import 'store'
			},
			extensions: ['.tsx', '.ts', '.js', '.json'],
		  },
		],
  
		'react-native-reanimated/plugin',   // ← KEEP THIS LAST
	  ],
	};
  };
  