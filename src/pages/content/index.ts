console.log('content loaded');

chrome.runtime.onMessage.addListener((msg) => {
	const action: string = msg.action;

	if(!(action === 'play' || action === 'pause')) {
		return;
	}

	Actions[action]();

	// Return true to expect reponse
	// return true;
});

const Actions = {
	play,
	pause,
} as const;

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
