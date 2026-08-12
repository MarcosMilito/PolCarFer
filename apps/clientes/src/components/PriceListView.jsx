import React from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import { exportExcel, formatPrice, normalizeText } from '../lib/catalogUtils.js';

function commercialPrice(value) {
  return Number(value || 0) > 0 ? formatPrice(value) : 'Consultar';
}

function OfferSummary({ product, compact = false }) {
  const offers = product.offers || [];
  if (!offers.length) return null;

  return (
    <Stack spacing={.6} sx={{ mt: compact ? .6 : .8 }}>
      {offers.map((offer, index) => (
        <Box
          key={offer.id || `${offer.condicion}-${offer.descuento}-${index}`}
          sx={{
            px: 1,
            py: .7,
            borderRadius: 1.5,
            bgcolor: 'rgba(67,181,129,.055)',
            border: '1px solid rgba(67,181,129,.14)'
          }}
        >
          <Typography variant="caption" color="success.light" fontWeight={800}>
            {offer.condicion || 'Oferta general'}
            {offer.descuento > 0 ? ` · -${Number(offer.descuento * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%` : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .15 }}>
            {Number(offer.precioSinIva || 0) > 0 ? `${formatPrice(offer.precioSinIva)} S/IVA` : 'Precio de oferta a consultar'}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function MobileProductCard({ product }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255,255,255,.012)' }}>
      <Stack spacing={1.35}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.25}>
          <Chip
            label={product.codigo}
            size="small"
            variant="outlined"
            sx={{ fontFamily: 'monospace', maxWidth: '55%' }}
          />
          {(product.offers || []).length > 0 && (
            <Chip label={`${product.offers.length} oferta${product.offers.length === 1 ? '' : 's'}`} size="small" color="success" />
          )}
        </Stack>

        <Box>
          <Typography fontWeight={850} sx={{ lineHeight: 1.35, fontSize: '1rem' }}>
            {product.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5, lineHeight: 1.45 }}>
            {product.presentacion || 'Presentación a consultar'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={.75} flexWrap="wrap" useFlexGap>
          {product.rubro && <Chip label={product.rubro} size="small" variant="outlined" />}
          {product.seccion && <Chip label={product.seccion} size="small" variant="outlined" />}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            pt: 1.2,
            borderTop: '1px solid rgba(255,255,255,.06)'
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">Precio S/IVA</Typography>
            <Typography fontWeight={850} sx={{ mt: .2, fontSize: '.98rem' }}>
              {commercialPrice(product.precioSinIva)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Precio C/IVA</Typography>
            <Typography fontWeight={950} color="primary.light" sx={{ mt: .2, fontSize: '1.06rem' }}>
              {commercialPrice(product.precioConIva)}
            </Typography>
          </Box>
        </Box>

        <OfferSummary product={product} compact />
      </Stack>
    </Paper>
  );
}

export default function PriceListView({ products }) {
  const mobile = useMediaQuery('(max-width:700px)');
  const [search, setSearch] = React.useState('');
  const [rubro, setRubro] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rows, setRows] = React.useState(mobile ? 15 : 25);

  React.useEffect(() => {
    setRows((current) => (mobile && current > 25 ? 15 : current));
  }, [mobile]);

  const rubros = React.useMemo(
    () => [...new Set(products.map((p) => p.rubro).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [products]
  );

  const filtered = React.useMemo(
    () => products.filter((p) =>
      (!rubro || p.rubro === rubro) &&
      (!search || normalizeText(`${p.codigo} ${p.nombre} ${p.presentacion} ${p.seccion} ${p.rubro}`).includes(normalizeText(search)))
    ),
    [products, search, rubro]
  );

  const discountCount = React.useMemo(() => filtered.filter((p) => (p.offers || []).length > 0).length, [filtered]);
  React.useEffect(() => setPage(0), [search, rubro]);
  const visible = filtered.slice(page * rows, page * rows + rows);

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={1.75}>
        <Box>
          <Typography variant="overline" color="primary.main">CATÁLOGO COMERCIAL</Typography>
          <Typography variant="h4" sx={{ mt: .25, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.35rem' } }}>
            Lista de precios
          </Typography>
          <Typography color="text.secondary" sx={{ mt: .65, maxWidth: 720, lineHeight: 1.55 }}>
            Buscá por código o descripción y consultá el precio vigente con y sin IVA.
          </Typography>
        </Box>
        <Button
          fullWidth={mobile}
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          onClick={() => exportExcel(products)}
          sx={{ minHeight: 46, width: { md: 'auto' } }}
        >
          Descargar Excel
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.2 },
          position: { sm: 'sticky' },
          top: { sm: 72, md: 82 },
          zIndex: 5,
          bgcolor: 'rgba(13,23,34,.96)',
          backdropFilter: 'blur(14px)'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.2}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, producto, medida…"
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>
            }}
          />
          <FormControl fullWidth={mobile} sx={{ minWidth: { md: 280 } }}>
            <InputLabel>Rubro</InputLabel>
            <Select value={rubro} label="Rubro" onChange={(e) => setRubro(e.target.value)}>
              <MenuItem value="">Todos los rubros</MenuItem>
              {rubros.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
            </Select>
          </FormControl>
          {(search || rubro) && (
            <Button fullWidth={mobile} color="inherit" onClick={() => { setSearch(''); setRubro(''); }}>
              Limpiar filtros
            </Button>
          )}
        </Stack>
      </Paper>

      <Stack direction="row" spacing={.8} sx={{ overflowX: 'auto', pb: .4 }}>
        <Chip icon={<Inventory2OutlinedIcon />} label={`${filtered.length.toLocaleString('es-AR')} productos`} variant="outlined" sx={{ flexShrink: 0 }} />
        <Chip icon={<FilterAltOutlinedIcon />} label={rubro || 'Todos los rubros'} variant="outlined" sx={{ flexShrink: 0 }} />
        {discountCount > 0 && (
          <Chip icon={<SellOutlinedIcon />} label={`${discountCount} con ofertas`} color="success" variant="outlined" sx={{ flexShrink: 0 }} />
        )}
      </Stack>

      {mobile ? (
        <Stack spacing={1.1}>
          {visible.map((p) => (
            <MobileProductCard key={p.id || `${p.codigo}-${p.nombre}-${p.presentacion}`} product={p} />
          ))}
          {!visible.length && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <SearchRoundedIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: .5 }} />
              <Typography fontWeight={800} sx={{ mt: 1 }}>No encontramos productos</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
                Probá con otro término o quitá los filtros.
              </Typography>
            </Paper>
          )}
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rows}
              onRowsPerPageChange={(e) => { setRows(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[15, 25, 50]}
              labelRowsPerPage="Por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{ '.MuiTablePagination-toolbar': { px: 1, flexWrap: 'wrap', justifyContent: 'center' } }}
            />
          </Paper>
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 135 }}>Código</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell sx={{ width: 210 }}>Presentación</TableCell>
                <TableCell align="right" sx={{ width: 155 }}>Base S/IVA</TableCell>
                <TableCell align="right" sx={{ width: 165 }}>Base C/IVA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((p) => (
                <TableRow hover key={p.id || `${p.codigo}-${p.nombre}-${p.presentacion}`} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Chip label={p.codigo} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={.55}>
                      <Typography fontWeight={780} sx={{ lineHeight: 1.35 }}>{p.nombre}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography variant="caption" color="text.secondary">{p.rubro}</Typography>
                        {p.seccion && <Typography variant="caption" color="text.secondary">· {p.seccion}</Typography>}
                        {(p.offers || []).length > 0 && <Chip label={`${p.offers.length} oferta${p.offers.length === 1 ? '' : 's'}`} size="small" color="success" />}
                      </Stack>
                      <OfferSummary product={p} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={p.presentacion ? 'text.primary' : 'text.secondary'}>
                      {p.presentacion || 'Sin especificar'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right"><Typography fontWeight={850}>{commercialPrice(p.precioSinIva)}</Typography></TableCell>
                  <TableCell align="right"><Typography fontWeight={900} color="primary.light">{commercialPrice(p.precioConIva)}</Typography></TableCell>
                </TableRow>
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 9, textAlign: 'center' }}>
                      <SearchRoundedIcon sx={{ fontSize: 44, color: 'text.secondary', opacity: .5 }} />
                      <Typography fontWeight={800} sx={{ mt: 1.5 }}>No encontramos productos</Typography>
                      <Typography color="text.secondary" sx={{ mt: .5 }}>Probá con otro término o quitá los filtros.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rows}
              onRowsPerPageChange={(e) => { setRows(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[25, 50, 100]}
              labelRowsPerPage="Mostrar"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
