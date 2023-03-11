import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { ThemeProvider } from '@mui/material';
import { ReactNode } from 'react';
import { createTheme } from '@mui/material';

const theme = createTheme({
	palette: {
		primary: {
			main: '#5271ff',
			light: 'rgb(116, 141, 255)',
			dark: 'rgb(57, 79, 178)',
			contrastText: '#fff',
		},
	},
	typography: { allVariants: { color: '#2B3445' } },
});

interface Props {
	children: ReactNode;
}

export default
function Theme(props: Props) {
	return (
		<ThemeProvider theme={theme}>
			{props.children}
		</ThemeProvider>
	);
}
