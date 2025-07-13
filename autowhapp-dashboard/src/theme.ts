import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
  palette: {
    primary: {
      main: '#2563EB',
    },
    secondary: {
      main: '#f1f5f9',
    },
    background: {
      default: '#000000',
      paper: '#f5f5f5',
    },
  },
});

export default theme;
