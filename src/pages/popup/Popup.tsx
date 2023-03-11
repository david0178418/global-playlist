import React, { useEffect, useState } from 'react';
import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';

type Page = chrome.tabs.Tab

interface SavedPage {
	title: string;
	url: string;
}

function Popup() {
	const [pages, setPages] = useState<SavedPage[]>([]);
	const [currentPage, setCurrentPage] = useState<Page | null>(null);
	const currentPageSaved = !!pages.find(p => p.url === currentPage?.url);

	useEffect(() => {
		(async () => {
			setPages(await getSavedPages());
			setCurrentPage(await getCurrentTabs());
		})();
	}, []);

	async function handleRemovePage() {
		if(!currentPage?.url) {
			return;
		}

		const newPages = await removePage(currentPage.url);

		setPages(newPages);
	}

	async function handleAddPage() {
		if(!currentPage) {
			return;
		}

		const newPages = await addPage(currentPage);

		setPages(newPages);
	}

	return (
		<div className="App">
			<p>
				<button>
					Play
				</button>
				<button>
					Stop
				</button>
			</p>

			<p>
				{currentPageSaved ? (
					<button onClick={handleRemovePage}>
						Remove From Queue
					</button>
				) : (
					<button onClick={handleAddPage}>
						Add to Queue2
					</button>
				)}
			</p>
			<ul>
				{pages.map(p => (
					<li key={p.url}>
						<a href={p.url}>{p.title}</a>
					</li>
				))}
			</ul>
		</div>
	);
}

export default Popup;

async function getCurrentTabs() {
	const [ page] = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});

	return page;
}

async function getSavedPages(): Promise<SavedPage[]> {
	const { pages = [] } = await chrome.storage.local.get('pages');

	return pages;
}

async function addPage(page: Page): Promise<SavedPage[]> {
	const currentPages = await getSavedPages();
	const {
		url,
		title,
	} = page;

	if(!(url && title)) {
		console.log(url, title);
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

async function removePage(url: string) {
	const currentPages = await getSavedPages();
	const pages = currentPages.filter(p => p.url !== url);

	await chrome.storage.local.set({ pages });

	return pages;
}
