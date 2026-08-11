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

import MenuRoundedIcon
  from '@mui/icons-material/MenuRounded';

import LockOutlinedIcon
  from '@mui/icons-material/LockOutlined';

const nav = [
  [
    'home',
    'Inicio'
  ],
  [
    'prices',
    'Lista de precios'
  ],
  [
    'orders',
    'Pedido'
  ],
  [
    'contact',
    'Contacto'
  ]
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

  const navigate = (
    event,
    id
  ) => {
    event.preventDefault();

    onViewChange(id);

    setAnchor(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          '#0b0f14'
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom:
            '1px solid',
          borderColor:
            'divider',
          backdropFilter:
            'blur(14px)',
          backgroundColor:
            'rgba(11,15,20,.94)'
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1440,
            width: '100%',
            mx: 'auto',
            gap: 2
          }}
        >
          <Stack
            component="a"
            href="#home"
            onClick={(event) =>
              navigate(
                event,
                'home'
              )
            }
            direction="row"
            spacing={1.2}
            alignItems="center"
            sx={{
              mr: 'auto',
              cursor: 'pointer',
              color: 'inherit',
              textDecoration:
                'none'
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
                {nav.map(
                  ([
                    id,
                    label
                  ]) => (
                    <MenuItem
                      key={id}
                      component="a"
                      href={`#${id}`}
                      selected={
                        view === id
                      }
                      onClick={(
                        event
                      ) =>
                        navigate(
                          event,
                          id
                        )
                      }
                    >
                      {label}

                      {id ===
                        'orders' &&
                      cartCount >
                        0
                        ? ` (${cartCount})`
                        : ''}
                    </MenuItem>
                  )
                )}

                <Divider />

                <MenuItem
                  component="a"
                  href="#partner"
                  selected={
                    view ===
                    'partner'
                  }
                  onClick={(
                    event
                  ) =>
                    navigate(
                      event,
                      'partner'
                    )
                  }
                >
                  <LockOutlinedIcon
                    fontSize="small"
                    sx={{
                      mr: 1
                    }}
                  />

                  Ingresar al
                  sistema
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              {nav.map(
                ([
                  id,
                  label
                ]) => (
                  <Button
                    key={id}
                    component="a"
                    href={`#${id}`}
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
                    onClick={(
                      event
                    ) =>
                      navigate(
                        event,
                        id
                      )
                    }
                    sx={{
                      textDecoration:
                        'none'
                    }}
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
                component="a"
                href="#partner"
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
                onClick={(
                  event
                ) =>
                  navigate(
                    event,
                    'partner'
                  )
                }
                sx={{
                  ml: 1,
                  textDecoration:
                    'none'
                }}
              >
                Ingresar al
                sistema
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