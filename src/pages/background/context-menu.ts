import { addPage, getPlayingPages, getSavedPages } from '@src/common/api';

const MenuAddPageId = 'GlobalPlaylistAddPage';
const MenuAddPageQueueId = 'GlobalPlaylistAddPageQueue';
const MenuAddPageNextId = 'GlobalPlaylistAddPageNext';

const MenuAddLinkId = 'GlobalPlaylistAddLink';
const MenuAddLinkQueueId = 'GlobalPlaylistAddLinkQueue';
const MenuAddLinkNextId = 'GlobalPlaylistAddLinkNext';

const Actions = {
	GlobalPlaylistAddPageQueue,
	GlobalPlaylistAddPageNext,
	GlobalPlaylistAddLinkQueue,
	GlobalPlaylistAddLinkNext,
} as const;

type OnClickData = chrome.contextMenus.OnClickData;
type Page = chrome.tabs.Tab;

async function GlobalPlaylistAddPageQueue(info: OnClickData, page?: Page) {
	if(!page) {
		return;
	}

	await addPage(page);
}

async function GlobalPlaylistAddPageNext(info: OnClickData, page?: Page) {
	if(!page) {
		return;
	}

	const [
		pages,
		playingPages
	] = await Promise.all([
		getSavedPages(),
		getPlayingPages(),
	]);

	const itemIndex = pages.findLastIndex(p => playingPages[p.url]) + 1;

	console.log('itemIndex', itemIndex);

	await addPage(page, itemIndex);
}

async function GlobalPlaylistAddLinkQueue(info: OnClickData) {
	await addPage({
		url: info.linkUrl,
	});
}

async function GlobalPlaylistAddLinkNext(info: OnClickData) {
	const [
		pages,
		playingPages
	] = await Promise.all([
		getSavedPages(),
		getPlayingPages(),
	]);

	const itemIndex = pages.findLastIndex(p => playingPages[p.url]) + 1;

	console.log('itemIndex', itemIndex);

	await addPage({
		url: info.linkUrl,
	}, itemIndex);
}

chrome.contextMenus.removeAll(() => {
	chrome.contextMenus.create({
		id: MenuAddPageId,
		title: 'Add Page to List',
		targetUrlPatterns: [
			'http://*/*',
			'https://*/*',
		],
		contexts: [
			'page',
		],
	});

	chrome.contextMenus.create({
		id: MenuAddPageNextId,
		parentId: MenuAddPageId,
		title: 'Play Next',
		contexts: [
			'page',
		],
	});

	chrome.contextMenus.create({
		id: MenuAddPageQueueId,
		parentId: MenuAddPageId,
		title: 'Add to Queue',
		contexts: [
			'page',
		],
	});

	chrome.contextMenus.create({
		id: MenuAddLinkId,
		title: 'Add link to Queue',
		targetUrlPatterns: [
			'http://*/*',
			'https://*/*',
		],
		contexts: [
			'link',
		],
	});

	chrome.contextMenus.create({
		id: MenuAddLinkNextId,
		parentId: MenuAddLinkId,
		title: 'Play Next',
		contexts: [
			'link',
		],
	});

	chrome.contextMenus.create({
		id: MenuAddLinkQueueId,
		parentId: MenuAddLinkId,
		title: 'Add to Queue',
		contexts: [
			'link',
		],
	});
});

chrome.contextMenus.onClicked.addListener((info, page) => {
	const { menuItemId } = info;

	if(!(
		menuItemId === MenuAddPageQueueId ||
		menuItemId === MenuAddPageNextId ||
		menuItemId === MenuAddLinkQueueId ||
		menuItemId === MenuAddLinkNextId
	)) {
		return;
	}

	Actions[menuItemId](info, page);
});

