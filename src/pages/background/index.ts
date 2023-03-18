import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import {
	findPage,
	focusTab,
	getFocusedTab,
	getSavedPages,
	play,
	removePage,
	updatePage,
} from '@src/common/api';
import './context-menu';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

interface Message {
	action: keyof typeof Actions;
	data: any;
}

chrome.runtime.onMessage.addListener((msg: Message, sender, response) => {
	const {
		action,
		data,
	} = msg;

	if(!Actions[action]) {
		return;
	}

	Actions[action](data).then(response);

	return true;
});

const Actions = {
	done,
	checkPageData,
	// notifyUser,
	playNext,
} as const;

// async function done(doneUrl: string) {
// 	console.log('done');
// 	const currentPages = await getSavedPages();

// 	const donePageIndex = currentPages.findIndex(p => p.url === doneUrl);
// 	const nextPage = currentPages.find((_, i) => i === (donePageIndex + 1));

// 	if(!nextPage) {
// 		return;
// 	}

// 	await play(nextPage.url);
// }

async function playNext(data: any) {
	const {
		currentUrl,
		nextUrl,
		newTab,
		doNotDeleteFinished,
	} = data;

	if(!doNotDeleteFinished) {
		await removePage(currentUrl);
	}

	if(newTab) {
		await play(nextUrl);
		await focusTab(nextUrl);
	} else {
		await play(nextUrl, currentUrl);
	}
}

async function done({url: doneUrl}: any) {
	const currentTab = await getFocusedTab();
	const activeTabs = currentTab ? [currentTab] : await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});

	const savedPages = await getSavedPages();
	const finishedPageIndex = savedPages.findIndex(p => p.url === doneUrl);

	if(finishedPageIndex === -1) {
		return;
	}

	const nextPage = savedPages[finishedPageIndex + 1];

	if(!nextPage) {
		return;
	}

	activeTabs.forEach(t => {
		if(!t.id) {
			return;
		}

		chrome.tabs.sendMessage(t.id, {
			action: 'notifyDone',
			data: {
				nextPage,
				finishedPage: savedPages[finishedPageIndex],
			},
		});
	});
}

async function checkPageData({ url }: any) {
	const savedPages = await getSavedPages();
	const currentPage = await findPage(url);

	if(!currentPage?.url) {
		return { isSaved: false };
	}

	const currentSavedPage = savedPages.find(p => p. url === currentPage.url);

	if(!currentSavedPage) {
		// Page isn't saved, so nothing to update
		return { isSaved: false };
	}

	if(currentSavedPage.title && currentSavedPage.favIconUrl) {
		// If proper data is preseent, then do nothing
		return { isSaved: true };
	}

	const {
		title = '',
		favIconUrl = '',
	} = currentPage;

	await updatePage({
		url: currentPage.url,
		title,
		favIconUrl,
	});

	return { isSaved: true };
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
