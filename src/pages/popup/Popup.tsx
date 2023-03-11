import React, { useEffect, useState } from 'react';
import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';

function Popup() {
	const [pages, setPages] = useState([]);

	useEffect(() => {
		console.log('register');
		const foo: any = ({ pages: { newValue } }) => {
			console.log(newValue);
		};
		chrome.storage.local.onChanged.addListener(foo);

		return () => {
			console.log('unregister');
			chrome.storage.local.onChanged.removeListener(foo);
		};
	}, [pages]);

	async function savePage() {
		const [page] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});

		await chrome.storage.local.set({ pages: [page] });
	}

	return (
		<div className="App">
			<p>
				<button>
					Play
				</button>
				<button>
					Stop
				</button>
			</p>

			<p>
				<button onClick={savePage}>
					Add to Queue2
				</button>
				<button>
				Remove From Queue
				</button>
			</p>

		</div>
	);
}

export default Popup;
