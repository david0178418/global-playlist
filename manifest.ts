import packageJson from './package.json';

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
	manifest_version: 3,
	name: packageJson.name,
	version: packageJson.version,
	description: packageJson.description,
	options_page: 'src/pages/options/index.html',
	background: { service_worker: 'src/pages/background/index.js' },
	action: {
		default_popup: 'src/pages/popup/index.html',
		default_icon: 'icon-34.png',
	},
	permissions: [
		'activeTab',
		'scripting',
		'storage',
		'tabs',
		'tts',
	],
	icons: { 128: 'icon-128.png'	},
	content_scripts: [
		{
			matches: [
				'http://*/*',
				'https://*/*',
			],
			js: ['src/pages/content/index.js'],
			// KEY for cache invalidation
			css: ['assets/css/contentStyle<KEY>.chunk.css'],
		},
	],
	web_accessible_resources: [
		{
			resources: [
				'assets/js/*.js',
				'assets/css/*.css',
				'icon-128.png',
				'icon-34.png',
			],
			matches: ['*://*/*'],
		},
	],
};

export default manifest;
