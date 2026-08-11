import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShoppingCartCheckoutRoundedIcon from '@mui/icons-material/ShoppingCartCheckoutRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';

const ACTIONS = [
  {
    id: 'prices',
    title: 'Consultar precios',
    eyebrow: 'CATÁLOGO',
    desc: 'Buscá por código, descripción o rubro y revisá los precios vigentes.',
    cta: 'Abrir lista de precios',
    Icon: SearchRoundedIcon
  },
  {
    id: 'orders',
    title: 'Preparar un pedido',
    eyebrow: 'PEDIDOS',
    desc: 'Seleccioná productos, definí cantidades y enviá la solicitud por WhatsApp.',
    cta: 'Armar pedido',
    Icon: ShoppingCartCheckoutRoundedIcon
  },
  {
    id: 'contact',
    title: 'Contactar a POLCARFER',
    eyebrow: 'ATENCIÓN',
    desc: 'Accedé al teléfono, Instagram, ubicación y correo comercial.',
    cta: 'Ver contacto',
    Icon: SupportAgentRoundedIcon
  }
];

function Metric({ icon: Icon, value, label }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.2,
        height: '100%',
        bgcolor: 'rgba(255,255,255,.018)'
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(255,138,61,.10)',
            color: 'primary.main'
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" lineHeight={1.15}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function HomeView({ onNavigate, count, source, error }) {
  return (
    <Stack spacing={{ xs: 2.5, md: 4 }}>
      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 2.25, sm: 3, md: 5 },
          minHeight: { md: 390 },
          bgcolor: '#0b1621',
          backgroundImage:
            'radial-gradient(circle at 84% 20%, rgba(255,138,61,.18), transparent 24%), linear-gradient(135deg, rgba(255,255,255,.025), transparent 45%)'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: '1px solid rgba(255,138,61,.10)',
            right: -70,
            top: -80
          }}
        />
        <Grid container spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={2.3} alignItems="flex-start">
              <Chip
                icon={<VerifiedRoundedIcon />}
                label="Catálogo comercial actualizado"
                color="success"
                variant="outlined"
              />
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    maxWidth: 760,
                    fontSize: { xs: '2rem', sm: '2.55rem', md: '3.5rem' },
                    lineHeight: 1.05
                  }}
                >
                  Productos, precios y pedidos en un solo lugar.
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 2, maxWidth: 700, fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}
                >
                  Consultá el catálogo de POLCARFER de forma rápida, filtrá lo que necesitás y prepará tu pedido sin vueltas.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  size="large"
                  variant="contained"
                  startIcon={<SearchRoundedIcon />}
                  onClick={() => onNavigate('prices')}
                  sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 48 }}
                >
                  Consultar precios
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  startIcon={<ShoppingCartCheckoutRoundedIcon />}
                  onClick={() => onNavigate('orders')}
                  sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 48 }}
                >
                  Preparar pedido
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.25, sm: 3 },
                bgcolor: 'rgba(5,12,18,.72)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="overline" color="text.secondary">ESTADO DEL CATÁLOGO</Typography>
              <Typography variant="h4" sx={{ mt: .5 }}>{count.toLocaleString('es-AR')}</Typography>
              <Typography color="text.secondary" sx={{ mt: .5 }}>productos disponibles para consultar</Typography>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{ mt: 2.5, height: 7, borderRadius: 10, bgcolor: 'rgba(255,255,255,.06)' }}
              />
              <Stack spacing={1.4} sx={{ mt: 2.5 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Fuente</Typography>
                  <Typography variant="body2" fontWeight={800}>{source || 'Catálogo en línea'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Consulta</Typography>
                  <Typography variant="body2" fontWeight={800}>Código · producto · rubro</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Pedidos</Typography>
                  <Typography variant="body2" fontWeight={800}>Confirmación por WhatsApp</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="warning">No se pudo conectar al catálogo en línea. {error}</Alert>}

      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5">¿Qué necesitás hacer?</Typography>
            <Typography color="text.secondary" sx={{ mt: .5 }}>Tres accesos simples para resolver lo habitual.</Typography>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          {ACTIONS.map(({ id, title, eyebrow, desc, cta, Icon }) => (
            <Grid key={id} size={{ xs: 12, md: 4 }}>
              <Paper
                variant="outlined"
                onClick={() => onNavigate(id)}
                sx={{
                  p: { xs: 2.25, sm: 3 },
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform .2s ease, border-color .2s ease, background-color .2s ease',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    inset: '0 auto 0 0',
                    width: 3,
                    bgcolor: 'primary.main',
                    opacity: 0,
                    transition: '.2s'
                  },
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: 'rgba(255,138,61,.34)',
                    bgcolor: 'rgba(255,138,61,.028)',
                    '&:before': { opacity: 1 }
                  }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(255,138,61,.10)',
                      color: 'primary.main',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="overline" color="text.secondary">{eyebrow}</Typography>
                </Stack>
                <Typography variant="h5" sx={{ mt: 3 }}>{title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1.1, lineHeight: 1.6, minHeight: 52 }}>{desc}</Typography>
                <Button endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 2.25, px: 0, minHeight: 44 }}>{cta}</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}><Metric icon={Inventory2OutlinedIcon} value={count.toLocaleString('es-AR')} label="productos publicados" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Metric icon={BoltRoundedIcon} value="Rápida" label="búsqueda y filtrado" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Metric icon={VerifiedRoundedIcon} value="Centralizada" label="una sola lista para clientes y socios" /></Grid>
      </Grid>
    </Stack>
  );
}
