import React from 'react';
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { CONTACT } from '../lib/catalogUtils.js';

const items=[
 ['Teléfono',CONTACT.phone,'Llamar o escribir por WhatsApp',`https://wa.me/${CONTACT.whatsapp}`,PhoneRoundedIcon],
 ['Instagram',CONTACT.instagram,'Novedades y productos',CONTACT.instagramUrl,InstagramIcon],
 ['Ubicación','Federico Chopin 458','Lomas de Zamora, Buenos Aires',CONTACT.mapUrl,LocationOnRoundedIcon],
 ['Correo',CONTACT.email,'Consultas y documentación',`mailto:${CONTACT.email}`,MailOutlineRoundedIcon]
];
export default function ContactView(){return <Stack spacing={3}><Box><Typography variant="h4">Contacto</Typography><Typography color="text.secondary" sx={{mt:.7}}>Elegí el canal que te resulte más cómodo.</Typography></Box><Grid container spacing={2}>{items.map(([title,value,desc,url,Icon])=><Grid key={title} size={{xs:12,sm:6}}><Paper variant="outlined" sx={{p:3,height:'100%'}}><Box sx={{width:46,height:46,borderRadius:2,bgcolor:'rgba(255,138,61,.10)',display:'grid',placeItems:'center',mb:2.5}}><Icon color="primary"/></Box><Typography variant="overline" color="text.secondary" fontWeight={800}>{title}</Typography><Typography variant="h6" sx={{mt:.4}}>{value}</Typography><Typography color="text.secondary" sx={{mt:.7}}>{desc}</Typography><Button component="a" href={url} target={url.startsWith('http')?'_blank':undefined} rel="noopener" endIcon={<OpenInNewRoundedIcon/>} sx={{mt:2,px:0}}>Abrir</Button></Paper></Grid>)}</Grid></Stack>}
