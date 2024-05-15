module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{html,js,css}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/.*/
	],
	globIgnores: [
		'**/node_modules/**',
		'**/slides/**'
	],

};
