import React, { ComponentProps, useEffect, useState } from 'react';
// import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';
import Theme from '../common/theme';
import DeleteIcon from '@mui/icons-material/Delete';
import {
	Box,
	Button as RawButton,
	ButtonGroup,
	Container,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
} from '@mui/material';

type Page = chrome.tabs.Tab

interface SavedPage {
	title: string;
	url: string;
}

function Popup() {
	const [pages, setPages] = useState<SavedPage[]>([]);
	const [currentPage, setCurrentPage] = useState<Page | null>(null);
	const isWebPage = !!currentPage?.url?.startsWith('http');
	const currentPageSaved = !!pages.find(p => p.url === currentPage?.url);

	useEffect(() => {
		(async () => {
			setPages(await getSavedPages());
			setCurrentPage(await getCurrentTabs());
		})();
	}, []);

	async function handleRemovePage(url = currentPage?.url) {
		if(!url) {
			return;
		}

		const newPages = await removePage(url);

		setPages(newPages);
	}

	async function handleAddPage() {
		if(!currentPage) {
			return;
		}

		const newPages = await addPage(currentPage);

		setPages(newPages);
	}

	async function handleFocus(url: string) {
		const [page] = await chrome.tabs.query({url})

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

	return (
		<Theme>
			<Box textAlign="center">
				<p>
					<ButtonGroup>
						<Button>
							Play
						</Button>
						<Button>
							Stop
						</Button>
					</ButtonGroup>
				</p>

				<p>
					{currentPageSaved ? (
						<Button onClick={() => handleRemovePage()}>
							Remove
						</Button>
					) : (
						<Button onClick={handleAddPage} disabled={!isWebPage}>
							Add
						</Button>
					)}
				</p>
				<List>
					{pages.map(p => (
						<ListItem
							key={p.url}
							secondaryAction={
								<IconButton onClick={() => handleRemovePage(p.url)}>
									<DeleteIcon />
								</IconButton>
							}
						>
							<ListItemButton onClick={() => handleFocus(p.url)}>
								<ListItemText>
									{p.title}
								</ListItemText>
							</ListItemButton>
						</ListItem>
					))}
					{!pages.length && (
						<ListItem>
							<ListItemText>
								No saved items
							</ListItemText>
						</ListItem>
					)}
				</List>
			</Box>
		</Theme>
	);
}

export default Popup;

function Button(props: ComponentProps<typeof RawButton>) {
	return (
		<RawButton
			variant="outlined"
			{...props}
		/>
	)
}

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
