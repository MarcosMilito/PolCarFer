import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0b0f14', paper: '#121821' },
    primary: { main: '#6ea8fe' },
    secondary: { main: '#91a4b7' },
    text: { primary: '#f5f7fa', secondary: '#9ba9b7' },
    divider: 'rgba(255,255,255,.08)',
    success: { main: '#4fb286' }
  },
  shape: { borderRadius: 14 },
  typography: { fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', h4:{fontWeight:800}, h5:{fontWeight:750}, h6:{fontWeight:700}, button:{fontWeight:700,textTransform:'none'} },
  components: {
    MuiPaper:{styleOverrides:{root:{backgroundImage:'none'}}},
    MuiButton:{defaultProps:{disableElevation:true},styleOverrides:{root:{borderRadius:10,minHeight:42}}},
    MuiChip:{styleOverrides:{root:{fontWeight:700}}},
    MuiTableCell:{styleOverrides:{head:{color:'#9ba9b7',fontWeight:800,borderColor:'rgba(255,255,255,.08)'},root:{borderColor:'rgba(255,255,255,.06)'}}}
  }
});
export default theme;
