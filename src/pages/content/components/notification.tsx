import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { SavedPage } from '@src/common/types';
import {
	useEffect,
	useLayoutEffect,
	useState,
	useRef,
} from 'react';

refreshOnUpdate('pages/content');

const RootId = 'global-playlist-root';

interface Foo {
	favIconUrl: string;
	title: string;
	url: string;
}

interface Props {
	finishedPage: SavedPage;
	nextPage: SavedPage;
}

export { Props as NotificationProps };

const AutoplayCancelBtnSelector = '.ytp-autonav-endscreen-upnext-cancel-button, .autoplay-countdown__timer .button--link'

export default
function Notification(props: Props) {
	const [playNextTime, setPlayNextTime] = useState(5);
	const [countdownCanceled, setCountdownCanceled] = useState(false);
	const [newTab, setNewTab] = useState(false);
	const [keepPlayedVideo, setKeepPlayedVideo] = useState(false);
	const {
		finishedPage,
		nextPage,
	} = props;

	useInterval(() => {
		(playNextTime > 0) ?
			setPlayNextTime(playNextTime - 1) :
			playNext();
	}, countdownCanceled ? null : 1000);

	useLayoutEffect(() => {
		document
			.querySelector<HTMLButtonElement>(AutoplayCancelBtnSelector)
			?.click();
	}, []);

	function handleClose() {
		setCountdownCanceled(true);
		document.querySelector(`#${RootId}`)?.remove()
	}

	function playNext() {
		broadcastPlayNext(
			finishedPage.url,
			nextPage.url,
			newTab,
			keepPlayedVideo,
		);
		handleClose();
	}

	return (
		<div
			id="global-playlist-notification"
			style={{
				all: 'revert',
				backgroundColor: '#efefef',
				borderRadius: 5,
				border: '1px solid #b9b9b9',
				boxShadow: '10px 10px 15px',
				fontFamily: 'Roboto, Arial, san-serif',
				position: 'fixed',
				right: 20,
				top: 20,
				width: 200,
				zIndex: 10001,
				padding: 30,
				color: 'black',
			}}
			onClick={() => setCountdownCanceled(true)}
		>
			<div style={{textAlign: 'right'}}>
				<button
					onClick={handleClose}
					style={{
						all: 'unset',
						float: 'right',
						cursor: 'pointer',
						fontSize: 14,
						fontWeight: 'bold',
					}}
				>
					Close
				</button>
			</div>
			<p style={{all: 'revert'}}>
				<img
					height="12"
					width="12"
					src={nextPage.favIconUrl}
				/>&nbsp;
				<a
					href={nextPage.url}
					style={{
						all: 'revert',
						fontSize: 14,
					}}
				>
					{nextPage.title || nextPage.url}
				</a>
			</p>
			<p style={{all: 'revert'}}>
				<button
					className="play-next"
					onClick={playNext}
					style={{
						all: 'unset',
						backgroundColor: 'lightblue',
						padding: 10,
						borderRadius: 5,
						fontWeight: 'bold',
						fontSize: 14,
						width: '100%',
						textAlign: 'center',
						display: 'inline-block',
						cursor: 'pointer',
					}}
				>
					Play Next {!countdownCanceled && !!playNextTime && (
						<span className="play-next-countdown">
							{playNextTime}
						</span>
					)}
				</button>
			</p>
			<p style={{all: 'revert'}}>
				<label style={{all: 'revert', cursor: 'pointer',}}>
					<input
						className="new-tab"
						type="checkbox"
						style={{all: 'revert'}}
						onChange={e => setNewTab(e.target.checked)}
					/>
					Open in new tab
				</label>
			</p>
			<p style={{all: 'revert'}}>
				<label style={{all: 'revert', cursor: 'pointer',}}>
					<input
						className="keep-current"
						type="checkbox"
						style={{all: 'revert'}}
						onChange={e => setKeepPlayedVideo(e.target.checked)}
					/>
					Don't remove video from list
				</label>
			</p>
		</div>
	);
}

function useInterval(callback: () => void, delay: number | null) {
	const savedCallback = useRef(callback)

	useLayoutEffect(() => {
		savedCallback.current = callback
	}, [callback])

	useEffect(() => {
		if (!delay && delay !== 0) {
			return;
		}

		const id = setInterval(() => savedCallback.current(), delay)

		return () => clearInterval(id);
	}, [delay])
}

async function broadcastPlayNext(currentUrl: string, nextUrl: string, newTab: boolean, doNotDeleteFinished: boolean) {
	console.log('broadcastPlayNext');

	await chrome.runtime.sendMessage({
		action: 'playNext',
		data: {
			currentUrl,
			nextUrl,
			newTab,
			doNotDeleteFinished,
		},
	});
}
