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
		favIconUrl,
	} = page;

	if(!(url && title && favIconUrl)) {
		return currentPages;
	}

	const pages = [
		{
			url,
			title,
			favIconUrl,
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
async function focusTab(url: string){
	let page = await findPage(url) || await chrome.tabs.create({ url });

	if(!page?.id) {
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
	try {
		const page = await findPage(url);

		if(!page?.id) {
			return false;
		}

		return await chrome.tabs.sendMessage(page.id, { action: 'getIsPlaying'});
	} catch (e) {
		console.log('err', e);
		return false;
	}
}

export
async function pauseAll(exceptionUrl?: string) {
	const allPages = await chrome.tabs.query({});

	await allPages
		.filter(p => p.url !== exceptionUrl)
		.map(async p => p.url && await pause(p.url));
}
