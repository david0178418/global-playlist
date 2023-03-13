import React, { ComponentProps, MouseEvent, useEffect, useState } from 'react';
// import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';
import Theme from '../common/theme';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import OpenIcon from '@mui/icons-material/OpenInNew';
import { Page, SavedPage } from '@src/common/types';
import {
	addPage,
	focusTab,
	getCurrentTabs,
	getPlayingPages,
	getSavedPages,
	pause,
	play,
	removePage,
} from '@src/common/api';
import {
	Box,
	Button as RawButton,
	ButtonGroup,
	Chip,
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


function Popup() {
	const [pages, setPages] = useState<SavedPage[]>([]);
	const [currentPage, setCurrentPage] = useState<Page | null>(null);
	const [playingMap, setPlayingMap] = useState<Record<string, boolean>>({});
	const isWebPage = !!currentPage?.url?.startsWith('http');
	const currentPageSaved = !!pages.find(p => p.url === currentPage?.url);

	useEffect(() => {
		(async () => {
			setPages(await getSavedPages());
			setCurrentPage(await getCurrentTabs());
			refreshPlayingPages();

		})();
	}, []);

	async function refreshPlayingPages() {
		setPlayingMap(await getPlayingPages());
	}

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

	async function handleMainClick(url: string) {
		if(playingMap[url]) {
			await pause(url);
		} else {
			currentPage?.url === url ?
				await play(url) :
				await focusTab(url);
		}

		await refreshPlayingPages();
	}

	async function handleFocusTab(url: string) {
		await focusTab(url);
		await refreshPlayingPages();
	}

	async function handlePlay(url: string) {
		await play(url);
		await refreshPlayingPages();
	}

	async function handlePause(url: string) {
		await pause(url);
		await refreshPlayingPages();
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
							disableGutters
							key={p.url}
							secondaryAction={
								<Dropdown
									isPlaying={playingMap[p.url]}
									onDelete={() => handleRemovePage(p.url)}
									onOpen={() => handleFocusTab(p.url)}
									onPlay={() => handlePlay(p.url)}
									onStop={() => handlePause(p.url)}
								/>
							}
						>
							<ListItemButton onClick={() => handleMainClick(p.url)}>
								<ListItemText
									secondary={(
										playingMap[p.url] && (
											<Chip
												label="Playing"
												variant="outlined"
												size="small"
												icon={<PlayIcon />}
											/>
										)
									)}
								>
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

interface PageListItemProps {
	page: SavedPage;
	isPlaying: boolean;
}

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
