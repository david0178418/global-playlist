console.log('content loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	const action: string = request.action;

	if(!(action === 'play' || action === 'pause' || action === 'getIsPlaying')) {
		return;
	}

	const res = Actions[action]();

	sendResponse(res);

	return true;
});

const Actions = {
	play,
	pause,
	getIsPlaying,
} as const;

function getIsPlaying() {
	const [video] = document.getElementsByTagName('video');

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

function play() {
	console.log('playing');
	const [video] = document.getElementsByTagName('video');

	if(!video) {
		return;
	}

	video.play();
}

async function pause() {
	console.log('pausing');
	const videos = document.getElementsByTagName('video');

	await Promise.all([...videos].map(v => v.pause()));
}

function keys<T extends Record<any, unknown>>(obj: T): Array<keyof T> {
	return Object.keys(obj);
}
