import React from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

const NAV = [
  ['home', 'Inicio'],
  ['prices', 'Lista de precios'],
  ['orders', 'Pedido'],
  ['contact', 'Contacto']
];

export default function AppShell({ view, onViewChange, children, cartCount = 0 }) {
  const mobile = useMediaQuery('(max-width:900px)');
  const [anchor, setAnchor] = React.useState(null);
  const choose = (id) => {
    setAnchor(null);
    onViewChange(id);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(8,16,24,.90)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,.07)'
        }}
      >
        <Toolbar sx={{ maxWidth: 1500, width: '100%', mx: 'auto', minHeight: 72, gap: 2 }}>
          <Stack
            direction="row"
            spacing={1.35}
            alignItems="center"
            sx={{ mr: 'auto', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => choose('home')}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 950,
                fontSize: 15,
                boxShadow: '0 8px 30px rgba(255,138,61,.18)'
              }}
            >
              PF
            </Avatar>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={950} lineHeight={1} letterSpacing="-.02em">
                  POLCARFER
                </Typography>
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
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Catálogo comercial
              </Typography>
            </Box>
          </Stack>

          {mobile ? (
            <>
              <Tooltip title="Menú">
                <IconButton onClick={(event) => setAnchor(event.currentTarget)}>
                  <Badge badgeContent={cartCount || null} color="primary">
                    <MenuRoundedIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                {NAV.map(([id, label]) => (
                  <MenuItem key={id} selected={view === id} onClick={() => choose(id)}>
                    {label}{id === 'orders' && cartCount > 0 ? ` (${cartCount})` : ''}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem selected={view === 'partner'} onClick={() => choose('partner')}>
                  <LockOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  Ingresar al sistema
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={.35} alignItems="center">
              {NAV.map(([id, label]) => (
                <Button
                  key={id}
                  onClick={() => choose(id)}
                  color="inherit"
                  startIcon={id === 'orders' ? <ShoppingBagOutlinedIcon fontSize="small" /> : undefined}
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

      <Container maxWidth={false} sx={{ maxWidth: 1500, py: { xs: 3, md: 4.5 } }}>
        {children}
      </Container>

      <Box sx={{ mt: 7, borderTop: '1px solid rgba(255,255,255,.06)', bgcolor: 'rgba(4,10,15,.35)' }}>
        <Container maxWidth={false} sx={{ maxWidth: 1500, py: 3.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
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
