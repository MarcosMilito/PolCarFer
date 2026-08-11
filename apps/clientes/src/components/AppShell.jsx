import React from 'react';
import { AppBar, Box, Button, Container, IconButton, Stack, Toolbar, Typography, useMediaQuery, Menu, MenuItem } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

const nav=[['home','Inicio'],['prices','Lista de precios'],['orders','Pedido'],['contact','Contacto']];
export default function AppShell({view,onViewChange,children,cartCount=0}){
 const mobile=useMediaQuery('(max-width:760px)'); const [anchor,setAnchor]=React.useState(null);
 return <Box sx={{minHeight:'100vh',background:'radial-gradient(circle at top right, rgba(255,138,61,.08), transparent 30%), #0b0f14'}}>
  <AppBar position="sticky" color="transparent" elevation={0} sx={{backdropFilter:'blur(14px)',borderBottom:'1px solid',borderColor:'divider',backgroundColor:'rgba(11,15,20,.88)'}}>
   <Toolbar sx={{maxWidth:1440,width:'100%',mx:'auto',gap:2}}>
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{mr:'auto',cursor:'pointer'}} onClick={()=>onViewChange('home')}>
     <Box sx={{width:36,height:36,borderRadius:2,display:'grid',placeItems:'center',bgcolor:'primary.main',color:'#121212',fontWeight:900}}>PF</Box>
     <Box><Typography fontWeight={900} lineHeight={1}>POLCARFER</Typography><Typography variant="caption" color="text.secondary">Portal de clientes</Typography></Box>
    </Stack>
    {mobile?<><IconButton onClick={e=>setAnchor(e.currentTarget)}><MenuRoundedIcon/></IconButton><Menu anchorEl={anchor} open={Boolean(anchor)} onClose={()=>setAnchor(null)}>{nav.map(([id,label])=><MenuItem key={id} selected={view===id} onClick={()=>{onViewChange(id);setAnchor(null)}}>{label}{id==='orders'&&cartCount>0?` (${cartCount})`:''}</MenuItem>)}</Menu></>:
    <Stack direction="row" spacing={.5}>{nav.map(([id,label])=><Button key={id} color={view===id?'primary':'inherit'} variant={view===id?'contained':'text'} onClick={()=>onViewChange(id)}>{label}{id==='orders'&&cartCount>0?` · ${cartCount}`:''}</Button>)}</Stack>}
   </Toolbar>
  </AppBar>
  <Container maxWidth="xl" sx={{py:{xs:3,md:5}}}>{children}</Container>
  <Box component="footer" sx={{borderTop:'1px solid',borderColor:'divider',py:3,mt:6}}><Container maxWidth="xl"><Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" gap={1}><Typography variant="body2" color="text.secondary">POLCARFER · Distribución ferretera</Typography><Typography variant="body2" color="text.secondary">Precios sujetos a confirmación comercial</Typography></Stack></Container></Box>
 </Box>;
}
