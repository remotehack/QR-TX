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
	runtimeCaching: [{
		urlPattern: /^https:\/\/cdn\.skypack\.dev\//,
		handler: 'StaleWhileRevalidate'
	},
	{
		urlPattern: /^https:\/\/unpkg\.com\//,
		handler: 'StaleWhileRevalidate'
	}]

};
