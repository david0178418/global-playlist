import type { SavedPage } from "@src/common/types";

console.log('content loaded');

const AutoplayCancelBtnSelector = '.ytp-autonav-endscreen-upnext-cancel-button, .autoplay-countdown__timer .button--link'

type ActionType = keyof typeof Actions;

interface Message {
	action: ActionType;
	data: any
}

const Actions = {
	play,
	pause,
	getIsPlaying,
	notifyDone,
} as const;

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
	const { action, data, } = msg;

	// TODO get typing correct to ensure this is checked.
	if(!Actions[msg.action]) {
		return;
	}

	const res = Actions[action](data);

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
	({isSaved}) => {
		const fooListener = foo(isSaved);
		document.addEventListener('DOMNodeInserted', fooListener);

		sleep(10_000).then(() => document.removeEventListener('DOMNodeInserted', fooListener))
	}
);



function foo(isSaved: boolean) {
	const fooListener = () => {
		const video = document.querySelector('video');
		const spotifyPlayBtn = document.querySelector<HTMLButtonElement>('[data-testid=play-button]');

		console.log('spotifyPlayBtn', spotifyPlayBtn);

		if(video?.src) {
			video.addEventListener('ended', () => broadcastFinished(location.href));
			document.removeEventListener('DOMNodeInserted', fooListener);

			if(isSaved) {
				video.paused && video.play();
				video.muted = false;
			}

			return;
		}

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

interface NotifyDoneArg {
	finishedPage: SavedPage;
	nextPage: SavedPage;
}

async function notifyDone({finishedPage, nextPage}: NotifyDoneArg) {
	console.log('notifyDone');

	let playNextTime = 5;
	const elContainer = document.createElement('div');
	elContainer.innerHTML = `
		<div
			id="global-playlist-notification"
			style="${cssToOneLine(`
				all: revert;
				background-color: #efefef;
				border-radius: 5px;
				border: 1px solid #b9b9b9;
				box-shadow: 10px 10px 15px;
				font-family: Roboto, Arial, san-serif;
				position: fixed;
				right: 20px;
				top: 20px;
				width: 200px;
				z-index: 10001;
				padding: 30px;
				color: black;
			`)}"
		>
			<div style="text-align: right;">
				<button
					class="close"
					style="${cssToOneLine(`
						all: unset;
						float: right;
						cursor: pointer;
						font-size: 14px;
						font-weight: bold;
					`)}"
				>
					Close
				</button>
			</div>
			<p style="all: revert;">
				<a
					href="${nextPage.url}"
					style="${cssToOneLine(`
						all: reset;
						font-size: 14px;

					`)}"
				>
					<img height="12" width="12" src="${nextPage.favIconUrl}"/> ${nextPage.title}
				</a>
			</p>
			<p style="all: revert;">
				<button
					class="play-next"
					style="${cssToOneLine(`
						all: unset;
						background-color: lightblue;
						padding: 10px;
						border-radius: 5px;
						font-weight: bold;
						font-size: 14px;
						width: 100%;
						text-align: center;
						display: inline-block;
						cursor: pointer;
					`)}"
				>
					Play Next ${playNextTime ? `<span class="play-next-countdown">${playNextTime}</span>` : ''}
				</button>
			</p>
			<p style="all: revert;">
				<label style="all: revert; cursor: pointer;">
					<input style="all: revert;" class="new-tab" type="checkbox" /> Open in new tab
				</label>
			</p>
			<p style="all: revert;">
				<label style="all: revert; cursor: pointer;">
					<input style="all: revert;" class="keep-current" type="checkbox" /> Don't remove video from list
				</label>
			</p>
		</div>
	`.trim();

	const popupEl = elContainer.querySelector('#global-playlist-notification');

	if(!popupEl) {
		return;
	}

	document
		.querySelector<HTMLButtonElement>(AutoplayCancelBtnSelector)
		?.click();

	const countdownIntervalId = setInterval(() => {
		playNextTime = playNextTime - 1;

		if(playNextTime) {
			const countdownEl = popupEl.querySelector('.play-next-countdown');

			if(!countdownEl) {
				return;
			}

			countdownEl.innerHTML = playNextTime.toString();
		} else {
			popupEl.querySelector<HTMLButtonElement>('.play-next')?.click();
		}
	}, 1000);

	popupEl
		.querySelector('.close')
		?.addEventListener(
			'click',
			() => {
				clearInterval(countdownIntervalId);
				popupEl.remove();
			},
		);
	popupEl
		.querySelector('.play-next')
		?.addEventListener(
			'click',
			() => {
				broadcastPlayNext(
					finishedPage.url,
					nextPage.url,
					!!popupEl.querySelector<HTMLInputElement>('.new-tab')?.checked,
					!!popupEl.querySelector<HTMLInputElement>('.keep-current')?.checked,
				);
				popupEl.remove();
			}
		);

	popupEl.addEventListener('click', () => {
		clearInterval(countdownIntervalId);
		popupEl.querySelector('.play-next-countdown')?.remove();
		playNextTime = 0;
	});

	document.body.appendChild(popupEl);
}

async function broadcastFinished(url: string) {
	console.log('broadcastFinished');
	await chrome.runtime.sendMessage({
		action: 'done',
		data: { url },
	});
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

function keys<T extends Record<any, unknown>>(obj: T): Array<keyof T> {
	return Object.keys(obj);
}

function cssToOneLine(css: string) {
	return css.replaceAll(/\n\r\t/g,'');
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
