import React from 'react';

import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery
} from '@mui/material';

import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const NAV = [
  ['home', 'Inicio'],
  [
    'prices',
    'Lista de precios'
  ],
  ['orders', 'Pedido'],
  ['contact', 'Contacto']
];

export default function AppShell({
  view,
  onViewChange,
  children,
  cartCount = 0
}) {
  const mobile =
    useMediaQuery(
      '(max-width:900px)'
    );

  const [
    anchor,
    setAnchor
  ] = React.useState(null);

  const choose = (id) => {
    setAnchor(null);
    onViewChange(id);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor:
          '#0b0f14'
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor:
            'rgba(11,15,20,.96)',
          borderBottom:
            '1px solid',
          borderColor:
            'divider',
          backdropFilter:
            'blur(12px)'
        }}
      >
        <Toolbar
          sx={{
            width: '100%',
            maxWidth: 1440,
            mx: 'auto',
            gap: 2
          }}
        >
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            onClick={() =>
              choose('home')
            }
            sx={{
              mr: 'auto',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'grid',
                placeItems:
                  'center',
                bgcolor:
                  'primary.main',
                color: '#111',
                fontWeight: 900
              }}
            >
              PF
            </Box>

            <Box>
              <Typography
                fontWeight={900}
                lineHeight={1}
              >
                POLCARFER
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Sistema comercial
              </Typography>
            </Box>
          </Stack>

          {mobile ? (
            <>
              <IconButton
                onClick={(
                  event
                ) =>
                  setAnchor(
                    event.currentTarget
                  )
                }
              >
                <MenuRoundedIcon />
              </IconButton>

              <Menu
                anchorEl={anchor}
                open={
                  Boolean(anchor)
                }
                onClose={() =>
                  setAnchor(null)
                }
              >
                {NAV.map(
                  ([
                    id,
                    label
                  ]) => (
                    <MenuItem
                      key={id}
                      selected={
                        view === id
                      }
                      onClick={() =>
                        choose(id)
                      }
                    >
                      {label}

                      {id ===
                        'orders' &&
                      cartCount > 0
                        ? ` (${cartCount})`
                        : ''}
                    </MenuItem>
                  )
                )}

                <Divider />

                <MenuItem
                  selected={
                    view ===
                    'partner'
                  }
                  onClick={() =>
                    choose(
                      'partner'
                    )
                  }
                >
                  <LockOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1 }}
                  />

                  Ingresar al sistema
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              {NAV.map(
                ([
                  id,
                  label
                ]) => (
                  <Button
                    key={id}
                    color={
                      view === id
                        ? 'primary'
                        : 'inherit'
                    }
                    variant={
                      view === id
                        ? 'contained'
                        : 'text'
                    }
                    onClick={() =>
                      choose(id)
                    }
                  >
                    {label}

                    {id ===
                      'orders' &&
                    cartCount > 0
                      ? ` · ${cartCount}`
                      : ''}
                  </Button>
                )
              )}

              <Button
                startIcon={
                  <LockOutlinedIcon />
                }
                color={
                  view ===
                  'partner'
                    ? 'primary'
                    : 'inherit'
                }
                variant={
                  view ===
                  'partner'
                    ? 'contained'
                    : 'outlined'
                }
                onClick={() =>
                  choose(
                    'partner'
                  )
                }
                sx={{ ml: 1 }}
              >
                {view === 'partner'
                  ? 'Sistema de socios'
                  : 'Ingresar al sistema'}
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{
          py: {
            xs: 3,
            md: 5
          }
        }}
      >
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          borderTop:
            '1px solid',
          borderColor:
            'divider',
          py: 3,
          mt: 6
        }}
      >
        <Container maxWidth="xl">
          <Typography
            variant="body2"
            color="text.secondary"
          >
            POLCARFER ·
            Distribución ferretera
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}