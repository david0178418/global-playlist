import React, { ComponentProps, MouseEvent, useEffect, useState } from 'react';
// import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';
import Theme from '../common/theme';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import OpenIcon from '@mui/icons-material/OpenInNew';
import {
	Box,
	Button as RawButton,
	ButtonGroup,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
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
								<Dropdown
									isPlaying={false}
									onDelete={() => handleRemovePage(p.url)}
									onOpen={() => focusTab(p.url)}
									onPlay={() => play(p.url)}
									onStop={() => null}
								/>
							}
						>
							<ListItemButton onClick={() => focusTab(p.url)}>
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

interface DropdownProps {
	isPlaying: boolean;
	onDelete(): void;
	onOpen(): void;
	onPlay(): void;
	onStop(): void;
}

function Dropdown(props: DropdownProps) {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const isOpen = !!anchorEl;
	const{
		isPlaying,
		onDelete,
		onOpen,
		onPlay,
		onStop,
	} = props;

	return (
		<>
			<IconButton onClick={e => setAnchorEl(e.currentTarget)}>
				<MoreVertIcon />
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				open={isOpen}
				onClose={() => setAnchorEl(null)}
				onClick={() => setAnchorEl(null)}
			>
				{isPlaying ? (
					<MenuItem onClick={onStop}>
						<ListItemIcon>
							<StopIcon />
						</ListItemIcon>
						<ListItemText>
							Stop
						</ListItemText>
					</MenuItem>
				) : (
					<MenuItem onClick={onPlay}>
						<ListItemIcon>
							<PlayIcon />
						</ListItemIcon>
						<ListItemText>
							Play
						</ListItemText>
					</MenuItem>
				)}
				<MenuItem onClick={onOpen}>
					<ListItemIcon>
						<OpenIcon />
					</ListItemIcon>
					<ListItemText>
						Open
					</ListItemText>
				</MenuItem>
				<Divider />
				<MenuItem onClick={onDelete}>
					<ListItemIcon>
						<DeleteIcon />
					</ListItemIcon>
					<ListItemText>
						Remove
					</ListItemText>
				</MenuItem>
			</Menu>
		</>
	)
}

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

async function findPage(url: string): Promise<Page | null> {
	const [page] = await chrome.tabs.query({url})

	return page || null;
}

async function play(url: string) {
	const page = await findPage(url) || await chrome.tabs.create({
		url,
		active: false,
	});

	if(!page.id) {
		return;
	}

	console.log('sending');

	chrome.tabs.sendMessage(page.id, { action: 'play', foo: 'bar'})
}
