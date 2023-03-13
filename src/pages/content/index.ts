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
	const [video] = document.getElementsByTagName('video');

	if(!video) {
		return;
	}

	video.play();
}

function pause() {
	const [video] = document.getElementsByTagName('video');

	if(!video) {
		return;
	}

	video.pause();
}

function keys<T extends Record<any, unknown>>(obj: T): Array<keyof T> {
	return Object.keys(obj);
}
