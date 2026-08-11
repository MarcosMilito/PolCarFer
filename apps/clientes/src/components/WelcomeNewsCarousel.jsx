import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  Fade,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { loadPublicNews } from '../lib/newsService.js';

const AUTOPLAY_MS = 5500;

export default function WelcomeNewsCarousel({ onViewAll }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    loadPublicNews()
      .then((data) => {
        if (!active || !data?.length) return;
        setItems(data);
        setIndex(0);
        setOpen(true);
      })
      .catch((error) => {
        // Las novedades no deben impedir el acceso al sistema si fallan.
        console.warn('No se pudo cargar el carrusel de novedades:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!open || items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [open, items.length]);

  React.useEffect(() => {
    if (!open || items.length <= 1) return;
    const next = items[(index + 1) % items.length];
    if (!next?.imagenUrl) return;
    const img = new Image();
    img.src = next.imagenUrl;
  }, [open, index, items]);

  if (!items.length) return null;

  const item = items[index];

  const previous = () => {
    setIndex((current) => (current - 1 + items.length) % items.length);
  };

  const next = () => {
    setIndex((current) => (current + 1) % items.length);
  };

  const viewAll = () => {
    setOpen(false);
    onViewAll?.();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        sx: {
          bgcolor: '#05080c',
          backgroundImage: 'none'
        }
      }}
    >
      <Box
        sx={{
          minHeight: '100dvh',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#05080c'
        }}
      >
        {/* Fondo ambiental de la misma imagen. */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: -28,
            backgroundImage: `linear-gradient(180deg, rgba(5,8,12,.18), rgba(5,8,12,.92)), url("${item.imagenUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(24px)',
            transform: 'scale(1.08)',
            opacity: .58
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            position: 'relative',
            zIndex: 4,
            px: { xs: 2, sm: 3.5, md: 5 },
            pt: { xs: 2, sm: 2.5 },
            pb: 1.5
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: '#111',
                fontWeight: 950,
                letterSpacing: '-.04em'
              }}
            >
              PF
            </Box>
            <Box>
              <Typography fontWeight={900} lineHeight={1.05}>
                POLCARFER
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Novedades destacadas
              </Typography>
            </Box>
          </Stack>

          <Button
            color="inherit"
            variant="outlined"
            startIcon={!mobile ? <CloseRoundedIcon /> : undefined}
            onClick={() => setOpen(false)}
            sx={{
              minWidth: mobile ? 44 : undefined,
              px: mobile ? 0 : 2,
              borderColor: 'rgba(255,255,255,.28)',
              bgcolor: 'rgba(5,8,12,.35)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {mobile ? <CloseRoundedIcon /> : 'Entrar al sistema'}
          </Button>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateRows: { xs: '1fr auto', md: 'minmax(0,1fr) auto' },
            px: { xs: 1.5, sm: 3, md: 6 },
            pb: { xs: 2, sm: 3, md: 4 }
          }}
        >
          <Box
            sx={{
              position: 'relative',
              minHeight: { xs: '48dvh', sm: '56dvh', md: '58dvh' },
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              borderRadius: { xs: 3, md: 4 },
              border: '1px solid rgba(255,255,255,.12)',
              bgcolor: 'rgba(0,0,0,.28)',
              boxShadow: '0 24px 80px rgba(0,0,0,.34)'
            }}
          >
            <Fade key={item.id} in timeout={500}>
              <Box
                component="img"
                src={item.imagenUrl}
                alt={item.titulo}
                loading="eager"
                sx={{
                  width: '100%',
                  height: '100%',
                  maxHeight: { xs: '60dvh', md: '64dvh' },
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </Fade>

            {items.length > 1 && (
              <>
                <IconButton
                  aria-label="Novedad anterior"
                  onClick={previous}
                  sx={{
                    position: 'absolute',
                    left: { xs: 8, md: 18 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(5,8,12,.66)',
                    border: '1px solid rgba(255,255,255,.18)',
                    backdropFilter: 'blur(8px)',
                    '&:hover': { bgcolor: 'rgba(5,8,12,.82)' }
                  }}
                >
                  <ChevronLeftRoundedIcon fontSize="large" />
                </IconButton>

                <IconButton
                  aria-label="Novedad siguiente"
                  onClick={next}
                  sx={{
                    position: 'absolute',
                    right: { xs: 8, md: 18 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(5,8,12,.66)',
                    border: '1px solid rgba(255,255,255,.18)',
                    backdropFilter: 'blur(8px)',
                    '&:hover': { bgcolor: 'rgba(5,8,12,.82)' }
                  }}
                >
                  <ChevronRightRoundedIcon fontSize="large" />
                </IconButton>
              </>
            )}
          </Box>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            gap={2}
            sx={{
              pt: { xs: 2, md: 2.5 },
              px: { xs: .5, md: 1 }
            }}
          >
            <Box sx={{ minWidth: 0, maxWidth: 860 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: .9 }}>
                <Chip
                  icon={<CampaignRoundedIcon />}
                  label="NOVEDAD"
                  color="primary"
                  size="small"
                />
                {items.length > 1 && (
                  <Typography variant="caption" color="text.secondary">
                    {index + 1} de {items.length}
                  </Typography>
                )}
              </Stack>

              <Typography
                variant="h3"
                sx={{
                  fontSize: { xs: '1.65rem', sm: '2.1rem', md: '2.65rem' },
                  lineHeight: 1.08
                }}
              >
                {item.titulo}
              </Typography>

              {item.descripcion && (
                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    maxWidth: 760,
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: { xs: 2, md: 3 },
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {item.descripcion}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={viewAll}
              sx={{
                flexShrink: 0,
                minHeight: 48,
                px: 2.6
              }}
            >
              Ver todas las novedades
            </Button>
          </Stack>

          {items.length > 1 && (
            <Stack
              direction="row"
              spacing={.8}
              justifyContent="center"
              sx={{ pt: 2 }}
            >
              {items.map((news, position) => (
                <Box
                  key={news.id}
                  component="button"
                  aria-label={`Ir a novedad ${position + 1}`}
                  onClick={() => setIndex(position)}
                  sx={{
                    width: position === index ? 28 : 8,
                    height: 8,
                    p: 0,
                    border: 0,
                    borderRadius: 999,
                    cursor: 'pointer',
                    bgcolor: position === index ? 'primary.main' : 'rgba(255,255,255,.24)',
                    transition: 'width .25s ease, background-color .25s ease'
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
