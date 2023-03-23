import React, { ComponentProps, MouseEvent, useEffect, useState } from 'react';
// import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';
import Theme from '../common/theme';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import UpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownIcon from '@mui/icons-material/KeyboardArrowDown';
import ToTopIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import ToBottomIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import OpenIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import NextIcon from '@mui/icons-material/Redo';
import PauseIcon from '@mui/icons-material/Pause';
import { Page, SavedPage } from '@src/common/types';
import {
	addPage,
	findPage,
	focusTab,
	getFocusedTab,
	getPlayingPages,
	getSavedPages,
	movePageDown,
	movePageToBottom,
	movePageToTop,
	movePageUp,
	openPage,
	pause,
	pauseAll,
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
	const currentPageIsPlaying = !!playingMap[currentPage?.url || ''];
	const currentSavedPage = pages.find(p => p.url === currentPage?.url);
	const playingPages = pages.filter(p => playingMap[p.url]);
	const otherPlayingPages = playingPages.filter(p => p.url !== currentSavedPage?.url);

	useEffect(() => {
		(async () => {
			setPages(await getSavedPages());
			setCurrentPage(await getFocusedTab());
			refreshPlayingPages();
		})();
	}, []);

	async function refreshPlayingPages() {
		console.log('refreshPlayingPages');
		setPlayingMap(await getPlayingPages());
	}

	async function handleRemovePage(url = currentPage?.url) {
		if(!url) {
			return;
		}

		const newPages = await removePage(url);

		setPages(newPages);
	}

	async function handleAddPage(next = false) {
		if(!currentPage) {
			return;
		}

		const itemIndex = next ?
			pages.findLastIndex(p => !!playingMap[p.url]) + 1:
			pages.length;

		setPages(await addPage(currentPage, itemIndex));
	}

	async function handleMainClick(url: string) {
		if(playingMap[url]) {
			await handlePause(url);
			return;
		}

		await handlePlay(url);
	}

	async function handleFocusTab(url: string) {
		console.log('handleFocusTab', url);
	}

	async function handlePlay(url: string) {
		console.log('handlePlay', url);

		await pauseAll(url);

		if(!await findPage(url)) {
			await openPage(url);
		}

		await play(url);

		await focusTab(url);
		await refreshPlayingPages();
	}

	async function handlePause(url: string) {
		console.log('handlePause', url);
		await pause(url);
		await refreshPlayingPages();
	}

	async function handleOnMoveToTop(page: SavedPage) {
		setPages(
			await movePageToTop(page)
		);
	}
	async function handleOnMoveUp(page: SavedPage) {
		setPages(
			await movePageUp(page)
		);
	}
	async function handleOnMoveDown(page: SavedPage) {
		setPages(
			await movePageDown(page)
		);
	}
	async function handleOnMoveToBottom(page: SavedPage) {
		setPages(
			await movePageToBottom(page)
		);
	}

	return (
		<Theme>
			<Box textAlign="center" paddingTop={2}>
				{!currentPageSaved && (
					<ButtonGroup>
						<Button
							size="small"
							onClick={() => handleAddPage()}
							disabled={!isWebPage}
							endIcon={<AddIcon/>}
						>
							Add to List
						</Button>
						<Button
							size="small"
							onClick={() => handleAddPage(true)}
							disabled={!isWebPage}
							endIcon={<NextIcon/>}
						>
							Play Next
						</Button>
					</ButtonGroup>
				)}
				<List>
					{currentSavedPage && (
						<ListItem
							disablePadding
							secondaryAction={
								<IconButton
									edge="end"
									onClick={() => handleRemovePage()}
								>
									<DeleteIcon />
								</IconButton>
							}
						>
							<ListItemButton
								onClick={
									() => currentPageIsPlaying ?
										handlePause(currentSavedPage.url):
										handlePlay(currentSavedPage.url)
								}
							>
								<ListItemIcon>
									{currentPageIsPlaying ? (
										<PauseIcon/>
									) : (
										<PlayIcon/>
									)}
								</ListItemIcon>
								<ListItemText primary={
									<>
										{currentSavedPage.favIconUrl && (
											<Box
												component="img"
												src={currentSavedPage.favIconUrl}
												width={12}
												height={12}
												paddingRight={1}
											/>
										)}
										{currentSavedPage.title.substring(0, 100) || currentSavedPage.url}
									</>
								} />
							</ListItemButton>
						</ListItem>
					)}
					{!!otherPlayingPages.length && (
						<>
							<Divider />
							{otherPlayingPages.map(p => (
								<ListItem
									key={p.url}
									disablePadding
									secondaryAction={
										<IconButton
											edge="end"
											onClick={() => handleRemovePage()}
										>
											<DeleteIcon />
										</IconButton>
									}
								>
									<ListItemButton
										onClick={
											() => playingMap[p.url] ?
												handlePause(p.url):
												handlePlay(p.url)
										}
									>
										<ListItemIcon>
											{playingMap[p.url] ? (
												<PauseIcon/>
											) : (
												<PlayIcon/>
											)}
										</ListItemIcon>
										<ListItemText primary={
											<>
												{p.favIconUrl && (
													<Box
														component="img"
														src={p.favIconUrl}
														width={12}
														height={12}
														paddingRight={1}
													/>
												)}
												{p.title.substring(0, 100) || p.url}
											</>
										} />
									</ListItemButton>
								</ListItem>
							))}
						</>
					)}
				</List>
				{playingPages.filter(p => p.url !== currentSavedPage?.url).map(p => (
					<Button onClick={() => currentPage?.url && handlePlay(currentPage.url)}>
						Play
					</Button>
				))}
				<List dense>
					{pages.map(p => (
						<ListItem
							disablePadding
							disableGutters
							key={p.url}
							secondaryAction={
								<Dropdown
									isPlaying={playingMap[p.url]}
									onDelete={() => handleRemovePage(p.url)}
									onOpen={() => handleFocusTab(p.url)}
									onPlay={() => handlePlay(p.url)}
									onStop={() => handlePause(p.url)}
									onMoveToTop={() => handleOnMoveToTop(p)}
									onMoveUp={() => handleOnMoveUp(p)}
									onMoveDown={() => handleOnMoveDown(p)}
									onMoveToBottom={() => handleOnMoveToBottom(p)}
								/>
							}
						>
							<ListItemButton onClick={() => handleMainClick(p.url)}>
								<ListItemText
									primaryTypographyProps={{
										display: 'inline',
										component: 'span',
									}}
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
									{p.favIconUrl && (
										<Box
											component="img"
											src={p.favIconUrl}
											width={12}
											height={12}
											paddingRight={1}
										/>
									)}
									{p.title.substring(0, 100) || p.url}
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
	onMoveToTop(): void;
	onMoveUp(): void;
	onMoveDown(): void;
	onMoveToBottom(): void;
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
		onMoveToTop,
		onMoveUp,
		onMoveDown,
		onMoveToBottom,
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
				<MenuItem onClick={onMoveToTop}>
					<ListItemIcon>
						<ToTopIcon />
					</ListItemIcon>
					<ListItemText>
						Move to Top
					</ListItemText>
				</MenuItem>
				<MenuItem onClick={onMoveUp}>
					<ListItemIcon>
						<UpIcon />
					</ListItemIcon>
					<ListItemText>
						Move Up
					</ListItemText>
				</MenuItem>
				<MenuItem onClick={onMoveDown}>
					<ListItemIcon>
						<DownIcon />
					</ListItemIcon>
					<ListItemText>
						Move Down
					</ListItemText>
				</MenuItem>
				<MenuItem onClick={onMoveToBottom}>
					<ListItemIcon>
						<ToBottomIcon />
					</ListItemIcon>
					<ListItemText>
						Move to Bottom
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

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
