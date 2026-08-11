import React from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

const NAV = [
  ['home', 'Inicio', HomeRoundedIcon],
  ['prices', 'Lista de precios', ListAltRoundedIcon],
  ['orders', 'Pedido', ShoppingBagOutlinedIcon],
  ['news', 'Novedades', CampaignRoundedIcon],
  ['contact', 'Contacto', SupportAgentRoundedIcon]
];

export default function AppShell({ view, onViewChange, children, cartCount = 0 }) {
  const mobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = React.useState(false);

  const choose = (id) => {
    setOpen(false);
    onViewChange(id);
  };

  return (
    <Box sx={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(8,16,24,.94)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,.07)'
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1500,
            width: '100%',
            mx: 'auto',
            minHeight: { xs: 64, md: 72 },
            px: { xs: 1.5, sm: 2.5, md: 3 },
            gap: 1.5
          }}
        >
          <Stack
            direction="row"
            spacing={1.15}
            alignItems="center"
            sx={{ mr: 'auto', cursor: 'pointer', userSelect: 'none', minWidth: 0 }}
            onClick={() => choose('home')}
          >
            <Avatar
              sx={{
                width: { xs: 38, md: 42 },
                height: { xs: 38, md: 42 },
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 950,
                fontSize: { xs: 13, md: 15 },
                boxShadow: '0 8px 30px rgba(255,138,61,.18)',
                flexShrink: 0
              }}
            >
              PF
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={.8} alignItems="center">
                <Typography fontWeight={950} lineHeight={1} letterSpacing="-.02em" noWrap>
                  POLCARFER
                </Typography>
                {!mobile && (
                  <Box
                    sx={{
                      px: .8,
                      py: .25,
                      borderRadius: 1,
                      bgcolor: 'rgba(255,138,61,.10)',
                      border: '1px solid rgba(255,138,61,.18)'
                    }}
                  >
                    <Typography variant="caption" color="primary.main" fontWeight={900}>
                      B2B
                    </Typography>
                  </Box>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" noWrap>
                Catálogo comercial
              </Typography>
            </Box>
          </Stack>

          {mobile ? (
            <IconButton
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
              sx={{ width: 44, height: 44 }}
            >
              <Badge badgeContent={cartCount || null} color="primary">
                <MenuRoundedIcon />
              </Badge>
            </IconButton>
          ) : (
            <Stack direction="row" spacing={.35} alignItems="center">
              {NAV.map(([id, label, Icon]) => (
                <Button
                  key={id}
                  onClick={() => choose(id)}
                  color="inherit"
                  startIcon={id === 'orders' ? <Icon fontSize="small" /> : undefined}
                  sx={{
                    color: view === id ? 'text.primary' : 'text.secondary',
                    bgcolor: view === id ? 'rgba(255,255,255,.055)' : 'transparent',
                    border: view === id ? '1px solid rgba(255,255,255,.06)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,.055)' }
                  }}
                >
                  {label}{id === 'orders' && cartCount > 0 ? ` · ${cartCount}` : ''}
                </Button>
              ))}
              <Button
                onClick={() => choose('partner')}
                variant={view === 'partner' ? 'contained' : 'outlined'}
                startIcon={view === 'partner' ? <Inventory2OutlinedIcon /> : <LockOutlinedIcon />}
                sx={{
                  ml: 1.2,
                  borderColor: view === 'partner' ? undefined : 'rgba(255,138,61,.40)',
                  color: view === 'partner' ? undefined : 'primary.main',
                  bgcolor: view === 'partner' ? undefined : 'rgba(255,138,61,.035)'
                }}
              >
                {view === 'partner' ? 'Sistema de socios' : 'Ingresar al sistema'}
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 'min(88vw, 360px)',
            bgcolor: '#0b1621',
            backgroundImage: 'none',
            borderLeft: '1px solid rgba(255,255,255,.08)'
          }
        }}
      >
        <Stack sx={{ minHeight: '100%' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 900, fontSize: 13 }}>
                PF
              </Avatar>
              <Box>
                <Typography fontWeight={900}>POLCARFER</Typography>
                <Typography variant="caption" color="text.secondary">Menú</Typography>
              </Box>
            </Stack>
            <IconButton aria-label="Cerrar menú" onClick={() => setOpen(false)} sx={{ width: 44, height: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Divider />

          <List sx={{ px: 1.25, py: 1.5 }}>
            {NAV.map(([id, label, Icon]) => (
              <ListItemButton
                key={id}
                selected={view === id}
                onClick={() => choose(id)}
                sx={{ borderRadius: 2, mb: .5, minHeight: 52 }}
              >
                <ListItemIcon sx={{ minWidth: 42 }}><Icon /></ListItemIcon>
                <ListItemText
                  primary={label}
                  secondary={id === 'orders' && cartCount > 0 ? `${cartCount} unidades en el pedido` : undefined}
                  primaryTypographyProps={{ fontWeight: 800 }}
                />
                {id === 'orders' && cartCount > 0 && <Badge badgeContent={cartCount} color="primary" />}
              </ListItemButton>
            ))}
          </List>

          <Box sx={{ mt: 'auto', p: 1.5 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Button
              fullWidth
              size="large"
              variant={view === 'partner' ? 'contained' : 'outlined'}
              startIcon={view === 'partner' ? <Inventory2OutlinedIcon /> : <LockOutlinedIcon />}
              onClick={() => choose('partner')}
              sx={{ justifyContent: 'flex-start', minHeight: 50 }}
            >
              {view === 'partner' ? 'Sistema de socios' : 'Ingresar al sistema'}
            </Button>
          </Box>
        </Stack>
      </Drawer>

      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1500,
          py: { xs: 2.25, sm: 3, md: 4.5 },
          px: { xs: 1.5, sm: 2.5, md: 3 }
        }}
      >
        {children}
      </Container>

      <Box sx={{ mt: { xs: 4, md: 7 }, borderTop: '1px solid rgba(255,255,255,.06)', bgcolor: 'rgba(4,10,15,.35)' }}>
        <Container maxWidth={false} sx={{ maxWidth: 1500, py: { xs: 2.5, md: 3.5 }, px: { xs: 1.5, sm: 2.5, md: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.25}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary">
                POLCARFER · Distribución ferretera
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Precios y disponibilidad sujetos a confirmación comercial
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
