import { addPage, getSavedPages } from '@src/common/api';

const Actions = {
	GlobalPlaylistAddLink,
	GlobalPlaylistAddPage,
} as const;

type OnClickData = chrome.contextMenus.OnClickData;
type Page = chrome.tabs.Tab;

async function GlobalPlaylistAddPage(info: OnClickData, page?: Page) {
	if(!page) {
		return;
	}

	await addPage(page);
}

async function GlobalPlaylistAddLink(info: OnClickData) {
	await addPage({
		url: info.linkUrl,
	});
}

chrome.contextMenus.create({
	id: 'GlobalPlaylistAddPage',
	title: 'Add page to queue',
	contexts: [
		'page',
	],
});

chrome.contextMenus.create({
	id: 'GlobalPlaylistAddLink',
	title: 'Add link to queue',
	targetUrlPatterns: [
		'http://*/*',
		'https://*/*',
	],
	contexts: [
		'link',
	],
});

chrome.contextMenus.onClicked.addListener((info, page) => {
	const {
		menuItemId
	} = info;

	if(!(menuItemId === 'GlobalPlaylistAddPage' || menuItemId === 'GlobalPlaylistAddLink')) {
		return;
	}

	Actions[menuItemId](info, page);
});

