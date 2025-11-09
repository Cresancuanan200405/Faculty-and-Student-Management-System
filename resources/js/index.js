import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Apply saved theme preference (or respect OS preference on first load)
if (typeof window !== 'undefined') {
	try {
		const savedTheme = window.localStorage.getItem('theme');
		const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;
		if (typeof document !== 'undefined') {
			document.body.classList.toggle('theme-dark', shouldUseDark);
		}
	} catch (_) {
		if (typeof document !== 'undefined') {
			document.body.classList.remove('theme-dark');
		}
	}
}

ReactDOM.render(<App />, document.getElementById('root'));