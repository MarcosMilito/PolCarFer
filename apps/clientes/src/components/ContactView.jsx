import React from 'react';
import { Box, Button, Grid, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { CONTACT } from '../lib/catalogUtils.js';

const ITEMS = [
  {
    title: 'Teléfono',
    value: CONTACT.phone,
    desc: 'Consultas comerciales y pedidos.',
    url: `https://wa.me/${CONTACT.whatsapp}`,
    cta: 'Abrir WhatsApp',
    Icon: PhoneRoundedIcon
  },
  {
    title: 'Instagram',
    value: CONTACT.instagram,
    desc: 'Novedades, productos e información de la distribuidora.',
    url: CONTACT.instagramUrl,
    cta: 'Ver Instagram',
    Icon: InstagramIcon
  },
  {
    title: 'Ubicación',
    value: 'Federico Chopin 458',
    desc: 'Lomas de Zamora, Buenos Aires.',
    url: CONTACT.mapUrl,
    cta: 'Abrir ubicación',
    Icon: LocationOnRoundedIcon
  },
  {
    title: 'Correo comercial',
    value: CONTACT.email,
    desc: 'Documentación y consultas administrativas.',
    url: `mailto:${CONTACT.email}`,
    cta: 'Enviar correo',
    Icon: MailOutlineRoundedIcon
  }
];

export default function ContactView() {
  const mobile = useMediaQuery('(max-width:700px)');

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.25, sm: 3, md: 4 },
          background: 'linear-gradient(135deg, rgba(255,138,61,.08), rgba(255,255,255,.015))'
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="overline" color="primary.main">CONTACTO DIRECTO</Typography>
            <Typography variant="h4" sx={{ mt: .35, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.35rem' } }}>
              ¿Necesitás hablar con POLCARFER?
            </Typography>
            <Typography color="text.secondary" sx={{ mt: .8, maxWidth: 680, lineHeight: 1.55 }}>
              Elegí el canal que te resulte más cómodo. Para pedidos y disponibilidad, WhatsApp es la vía más rápida.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              component="a"
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener"
              startIcon={<WhatsAppIcon />}
              sx={{ minHeight: 50 }}
            >
              Hablar por WhatsApp
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={{ xs: 1.25, sm: 2 }}>
        {ITEMS.map(({ title, value, desc, url, cta, Icon }) => (
          <Grid key={title} size={{ xs: 12, sm: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                height: '100%',
                transition: '.2s',
                '&:hover': { borderColor: 'rgba(255,138,61,.3)', transform: mobile ? 'none' : 'translateY(-2px)' }
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: { xs: 44, md: 48 },
                    height: { xs: 44, md: 48 },
                    borderRadius: 2.25,
                    bgcolor: 'rgba(255,138,61,.10)',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">{title}</Typography>
                  <Typography variant="h6" sx={{ mt: .05, wordBreak: 'break-word', fontSize: { xs: '1rem', md: '1.1rem' } }}>{value}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: .55, lineHeight: 1.5 }}>{desc}</Typography>
                  <Button
                    fullWidth={mobile}
                    component="a"
                    href={url}
                    target={url.startsWith('http') ? '_blank' : undefined}
                    rel="noopener"
                    endIcon={<ArrowOutwardRoundedIcon />}
                    sx={{ mt: 1.4, px: mobile ? 1.5 : 0, justifyContent: mobile ? 'space-between' : 'flex-start', minHeight: 44 }}
                  >
                    {cta}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
