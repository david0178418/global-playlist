import { Page, SavedPage } from "./types";

export
async function getCurrentTabs() {
	const [ page] = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});

	return page;
}

export
async function getSavedPages(): Promise<SavedPage[]> {
	const { pages = [] } = await chrome.storage.local.get('pages');

	return pages;
}

export
async function getPlayingPages(): Promise<Record<string, boolean>> {
	const savedPages = await getSavedPages();

	const savePagesPlaying = await Promise.all(
		savedPages.map(async p => ({
			[p.url]: await isPlaying(p.url),
		})),
	);

	return savePagesPlaying.reduce((a, b) => ({
		...a,
		...b,
	}));
}

export
async function addPage(page: Page): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const {
		url,
		title,
	} = page;

	if(!(url && title)) {
		return currentPages;
	}

	const pages = [
		{
			url,
			title,
		},
		...currentPages,
	];

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function removePage(url: string) {
	const currentPages = await getSavedPages();
	const pages = currentPages.filter(p => p.url !== url);

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function focusTab(url: string) {
	const page = await findPage(url);

	if(!page?.id) {
		window.open(url, '_blank');
		return;
	}

	if(!page.active) {
		await chrome.tabs.update(page.id, {active: true})
	}

	const parentTab = await chrome.windows.get(page.windowId);

	if(parentTab.focused || !parentTab.id) {
		return;
	}

	await chrome.windows.update(parentTab.id, { focused: true });
}

export
async function findPage(url: string): Promise<Page | null> {
	const [page] = await chrome.tabs.query({url})

	return page || null;
}

export
async function play(url: string) {
	const page = await findPage(url) || await chrome.tabs.create({
		url,
		active: false,
	});

	if(!page.id) {
		return;
	}

	await chrome.tabs.sendMessage(page.id, { action: 'play'});
}

export
async function pause(url: string) {
	const page = await findPage(url) || await chrome.tabs.create({
		url,
		active: false,
	});

	if(!page.id) {
		return;
	}

	await chrome.tabs.sendMessage(page.id, { action: 'pause'});

}

export
async function isPlaying(url: string): Promise<boolean> {
	const page = await findPage(url);

	if(!page?.id) {
		return false;
	}

	return chrome.tabs.sendMessage(page.id, { action: 'getIsPlaying'});
}
