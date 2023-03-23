import('./app');

type ActionType = keyof typeof Actions;

interface Message {
	action: ActionType;
	data: any
}

const Actions = {
	play,
	pause,
	getIsPlaying,
} as const;

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
	const { action } = msg;

	// TODO get typing correct to ensure this is checked.
	if(!Actions[msg.action]) {
		return;
	}

	const res = Actions[action]();

	sendResponse(res);

	return true;
});

chrome.runtime.sendMessage(
	{
		action: 'checkPageData',
		data: {
			url: location.href,
		},
	},
	(response = {}) => {
		const {isSaved = false} = response;
		const fooListener = foo(isSaved);
		document.addEventListener('DOMNodeInserted', fooListener);

		sleep(10_000).then(() => document.removeEventListener('DOMNodeInserted', fooListener))
	}
);

function foo(isSaved: boolean) {
	const fooListener = () => {
		const video = document.querySelector('video');
		if(video?.src) {
			video.addEventListener('ended', () => broadcastFinished(location.href));
			document.removeEventListener('DOMNodeInserted', fooListener);

			if(isSaved) {
				video.paused && video.play();
				video.muted = false;
			}

			return;
		}

		const spotifyPlayBtn = document.querySelector<HTMLButtonElement>('[data-testid=play-button]');

		if(spotifyPlayBtn) {
			document.removeEventListener('DOMNodeInserted', fooListener);

			if(isSaved) {
				console.log('click!');
				setTimeout(() => {
					spotifyPlayBtn.click();
				}, 750);
			}
		}
	};

	return fooListener;
}

function getIsPlaying() {
	// Grab only the first for now.
	const video = document.querySelector('video');

	if(!video) {
		return false;
	}

	return !!(
		video.currentTime > 0 &&
		!video.paused &&
		!video.ended &&
		video.readyState > 2
	);
}

async function play() {
	// Grab only the first for now.
	const video = document.querySelector('video');

	if(!video) {
		return;
	}

	await video.play();
}

async function pause() {
	console.log('pausing');
	const videos = document.querySelectorAll('video');

	await Promise.all([...videos].map(v => v.pause()));
}

async function broadcastFinished(url: string) {
	console.log('broadcastFinished');
	await chrome.runtime.sendMessage({
		action: 'done',
		data: { url },
	});
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
