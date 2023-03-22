import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import Notification, { NotificationProps } from './components/notification';

refreshOnUpdate('pages/content');

const RootId = 'global-playlist-root';

function mount(props: NotificationProps) {
	const root = document.createElement('div');
	root.id = RootId;
	document.body.append(root);

	createRoot(root).render(<Notification {...props} />);
}

chrome.runtime.onMessage.addListener(msg => {
	const { action, data, } = msg;

	if(action !== 'notifyDone') {
		return;
	}

	mount(data);
});
