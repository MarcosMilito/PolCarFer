import React from 'react';
import { Alert, Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShoppingCartCheckoutRoundedIcon from '@mui/icons-material/ShoppingCartCheckoutRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

const actions=[
 ['prices','Consultar precios','Buscá por código o producto y revisá el precio actualizado.','Buscar productos',SearchRoundedIcon],
 ['orders','Armar un pedido','Elegí productos y cantidades. Al finalizar, enviás la solicitud por WhatsApp.','Empezar pedido',ShoppingCartCheckoutRoundedIcon],
 ['contact','Hablar con POLCARFER','Accedé rápido al teléfono, Instagram, ubicación y correo comercial.','Ver contacto',SupportAgentRoundedIcon]
];
export default function HomeView({onNavigate,count,source,error}){return <Stack spacing={4}>
 <Box sx={{maxWidth:820}}><Typography variant="overline" color="primary.main" fontWeight={900}>DISTRIBUIDORA FERRETERA</Typography><Typography variant="h3" sx={{fontWeight:900,fontSize:{xs:'2.2rem',md:'3.4rem'},mt:1}}>Todo lo importante, sin complicaciones.</Typography><Typography color="text.secondary" sx={{fontSize:{xs:17,md:19},mt:2,maxWidth:720}}>Consultá precios, armá tu pedido o contactate con la distribuidora. Elegí qué necesitás hacer y el sistema te guía.</Typography></Box>
 {error&&<Alert severity="warning">No se pudo conectar al catálogo en línea. {error}</Alert>}
 <Grid container spacing={2.5}>{actions.map(([id,title,desc,cta,Icon])=><Grid key={id} size={{xs:12,md:4}}><Paper variant="outlined" onClick={()=>onNavigate(id)} sx={{p:3.2,height:'100%',cursor:'pointer',transition:'.2s',borderColor:'divider','&:hover':{transform:'translateY(-3px)',borderColor:'primary.main',backgroundColor:'rgba(255,138,61,.035)'}}}><Box sx={{width:48,height:48,borderRadius:2.5,bgcolor:'rgba(255,138,61,.12)',display:'grid',placeItems:'center',mb:3}}><Icon color="primary"/></Box><Typography variant="h5">{title}</Typography><Typography color="text.secondary" sx={{mt:1.2,minHeight:58}}>{desc}</Typography><Button endIcon={<ArrowForwardRoundedIcon/>} sx={{mt:2.5,px:0}}>{cta}</Button></Paper></Grid>)}</Grid>
 <Paper variant="outlined" sx={{p:2.2}}><Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" gap={1}><Typography><strong>{count.toLocaleString('es-AR')}</strong> productos disponibles para consultar</Typography><Typography color="text.secondary">Fuente: {source}</Typography></Stack></Paper>
 </Stack>}
