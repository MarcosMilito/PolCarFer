import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#081018',
      paper: '#0d1722'
    },
    primary: {
      main: '#ff8a3d',
      light: '#ffad73',
      dark: '#d96519',
      contrastText: '#11161b'
    },
    secondary: {
      main: '#75a7ff'
    },
    text: {
      primary: '#f5f7fa',
      secondary: '#95a5b5'
    },
    divider: 'rgba(255,255,255,.08)',
    success: { main: '#43b581' },
    warning: { main: '#f4b740' },
    info: { main: '#67a8ff' },
    error: { main: '#ef6b6b' }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: { fontWeight: 850, letterSpacing: '-.035em', fontSize: 'clamp(2rem, 5vw, 3.5rem)' },
    h4: { fontWeight: 850, letterSpacing: '-.025em', fontSize: 'clamp(1.75rem, 4vw, 2.35rem)' },
    h5: { fontWeight: 800, letterSpacing: '-.015em' },
    h6: { fontWeight: 750 },
    button: { fontWeight: 800, textTransform: 'none' },
    overline: { fontWeight: 850, letterSpacing: '.12em' }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#081018',
          backgroundImage:
            'radial-gradient(circle at 85% -10%, rgba(255,138,61,.10), transparent 28%), radial-gradient(circle at 0% 25%, rgba(74,128,255,.06), transparent 24%)'
        },
        '::selection': {
          background: 'rgba(255,138,61,.28)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        },
        outlined: {
          borderColor: 'rgba(255,255,255,.085)'
        }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 11,
          minHeight: 44,
          paddingInline: 16
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          borderRadius: 9
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#8fa0b1',
          fontWeight: 850,
          backgroundColor: '#0b141e',
          borderColor: 'rgba(255,255,255,.07)'
        },
        root: {
          borderColor: 'rgba(255,255,255,.055)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid rgba(255,255,255,.08)'
        }
      }
    }
  }
});

export default theme;
