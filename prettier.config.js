module.exports = {
	printWidth: 100,
	tabWidth: 2,
	singleQuote: true,
	bracketSameLine: true,
	trailingComma: 'none',
	semi: false,
	useTabs: true,
	plugins: [require.resolve('prettier-plugin-tailwindcss')],
	tailwindAttributes: ['className']
}
