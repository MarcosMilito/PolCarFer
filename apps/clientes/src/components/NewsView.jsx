import React from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import {
  loadPublicNews,
  subscribeNews
} from '../lib/newsService.js';

function formatNewsDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
}

function NewsCard({ item, featured = false }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: featured ? { xs: 'column', md: 'row' } : 'column',
        background: featured
          ? 'linear-gradient(135deg, rgba(255,138,61,.055), rgba(255,255,255,.012))'
          : undefined
      }}
    >
      <Box
        component="img"
        src={item.imagenUrl}
        alt={item.titulo}
        loading="lazy"
        sx={{
          width: featured ? { xs: '100%', md: '52%' } : '100%',
          height: featured ? { xs: 230, md: 390 } : { xs: 210, sm: 240 },
          objectFit: 'cover',
          bgcolor: '#071019',
          flexShrink: 0
        }}
      />

      <Stack
        spacing={1.5}
        sx={{
          p: { xs: 2.2, sm: 2.6, md: featured ? 3.5 : 2.6 },
          justifyContent: featured ? 'center' : 'flex-start',
          flex: 1
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            icon={<CampaignRoundedIcon />}
            label={featured ? 'Última novedad' : 'Novedad'}
            color="primary"
            variant={featured ? 'filled' : 'outlined'}
          />
          <Stack direction="row" spacing={.6} alignItems="center">
            <CalendarTodayRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {formatNewsDate(item.createdAt)}
            </Typography>
          </Stack>
        </Stack>

        <Typography
          variant={featured ? 'h3' : 'h5'}
          sx={{
            fontSize: featured
              ? { xs: '1.8rem', md: '2.6rem' }
              : { xs: '1.2rem', md: '1.35rem' }
          }}
        >
          {item.titulo}
        </Typography>

        {item.descripcion && (
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {item.descripcion}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

export default function NewsView() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const refresh = React.useCallback(async () => {
    try {
      const data = await loadPublicNews();
      setItems(data);
      setError('');
    } catch (err) {
      console.error('Error cargando novedades:', err);
      setError(
        err?.message ||
          'No se pudieron cargar las novedades.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const stop = subscribeNews(refresh);
    return () => stop?.();
  }, [refresh]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 360 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2.5, md: 3.5 }}>
      <Box>
        <Typography variant="overline" color="primary.main">
          ACTUALIDAD POLCARFER
        </Typography>
        <Typography variant="h3" sx={{ mt: .4, fontSize: { xs: '2rem', md: '3rem' } }}>
          Novedades
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720, lineHeight: 1.7 }}>
          Lanzamientos, promociones, nuevos ingresos y comunicaciones de la distribuidora.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {!error && items.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, md: 5 },
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255,138,61,.045), rgba(255,255,255,.01))'
          }}
        >
          <CampaignRoundedIcon sx={{ fontSize: 46, color: 'primary.main', mb: 1.5 }} />
          <Typography variant="h5">Todavía no hay novedades publicadas</Typography>
          <Typography color="text.secondary" sx={{ mt: .8 }}>
            Cuando POLCARFER publique una novedad, va a aparecer automáticamente acá.
          </Typography>
        </Paper>
      )}

      {items.length > 0 && (
        <>
          <NewsCard item={items[0]} featured />

          {items.length > 1 && (
            <Grid container spacing={2}>
              {items.slice(1).map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <NewsCard item={item} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Stack>
  );
}
