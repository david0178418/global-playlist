import { Page, SavedPage } from "./types";

export
async function getFocusedTab() {
	const [ page ] = await chrome.tabs.query({
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

type PageSavePartial = Pick<chrome.tabs.Tab, 'title' | 'url' | 'favIconUrl'>;

export
async function addPage(page: PageSavePartial, index?: number): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const {
		url,
		title = '',
		favIconUrl = '',
	} = page;

	if(!url) {
		return currentPages;
	}

	index = index === undefined ?
		currentPages.length:
		index;

	const newPage = {
		url,
		title,
		favIconUrl,
	};

	const pages = addItem(currentPages, newPage, index);

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function addPageAfter(page: PageSavePartial, afterUrl: string): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const {
		url,
		title = '',
		favIconUrl = '',
	} = page;

	if(!url) {
		return currentPages;
	}

	const pages = [
		...currentPages,
		{
			url,
			title,
			favIconUrl,
		},
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
async function updatePage(page: SavedPage) {
	const currentPages = await getSavedPages();
	const pages = currentPages.map(p => {
		if(p.url !== page.url) {
			return p;
		}

		return {
			url: p.url,
			title: page.title,
			favIconUrl: page.favIconUrl,
		};
	});

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function movePageToTop(page: SavedPage): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const filteredPages = currentPages.filter(p => p.url !== page.url);
	const pages = [
		page,
		...filteredPages
	];

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function movePageUp(page: SavedPage): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const pageIndex = currentPages.findIndex(p => p.url === page.url);
	const pages = moveItemLeft(currentPages, pageIndex);

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function movePageDown(page: SavedPage): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const pageIndex = currentPages.findIndex(p => p.url === page.url);
	const pages = moveItemRight(currentPages, pageIndex);

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function movePageToBottom(page: SavedPage): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const filteredPages = currentPages.filter(p => p.url !== page.url);
	const pages = [
		...filteredPages,
		page,
	];

	await chrome.storage.local.set({ pages });

	return pages;
}

export
async function focusTab(url: string){
	try {
		let page = await findPage(url);

		if(!page?.id) {
			return;
		}

		if(!page.active) {
			await chrome.tabs.update(page.id, { active: true })
		}

		const parentWindow = await chrome.windows.get(page.windowId);

		if(parentWindow.focused || !parentWindow.id) {
			return;
		}

		await chrome.windows.update(parentWindow.id, { focused: true });
	} catch(e) {
		console.log('err:focusTab', e);
	}
}

export
async function openPage(url: string, active = false) {
	try {
		await chrome.tabs.create({
			url,
			active,
		});
	} catch(e) {
		console.log('err:openPage', e);
	}
}

export
async function findPage(url: string): Promise<Page | null> {
	const [page] = await chrome.tabs.query({url})

	return page || null;
}

export
async function play(url: string, replaceUrl = '') {
	try {
		let page = await findPage(replaceUrl || url) || await chrome.tabs.create({
			url,
			active: false,
		});

		if(!page.id) {
			return;
		}

		if(replaceUrl) {
			page = await chrome.tabs.update(page.id, {
				url,
			});

			if(!page.id) {
				return
			}
		}

		await chrome.tabs.sendMessage(page.id, { action: 'play'});
	} catch(e) {
		console.log('err:play', e);
	}
}

export
async function pause(url: string) {
	try {
		const page = await findPage(url);

		if(!page?.id) {
			return;
		}

		await chrome.tabs.sendMessage(page.id, { action: 'pause'});
	} catch(e) {
		console.log('err:pause', e);
	}
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
		console.log('err:isPlaying', e);
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

// Util fns

export
function swapItems<T>(arr: T[], indexA: number, indexB: number): T[] {
	// TODO Cover edge cases
	const newArr = arr.slice(0);

	[newArr[indexB], newArr[indexA]] = [arr[indexA], arr[indexB]];

	return newArr;
}

export
function moveItemRight<T>(arr: T[], itemIndex: number): T[] {
	if(itemIndex >= arr.length) {
		return arr;
	}

	return swapItems(arr, itemIndex, itemIndex + 1);
}

export
function moveItemLeft<T>(arr: T[], itemIndex: number): T[] {
	if(itemIndex <= 0) {
		return arr;
	}

	return swapItems(arr, itemIndex, itemIndex - 1);
}

export
function addItem<T>(arr: T[], item: T, index = arr.length) {
	const newArr = [...arr];

	newArr.splice(index, 0, item);

	return newArr;
}
