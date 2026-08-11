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
  Typography
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import { exportExcel, finalConIva, finalSinIva, formatPrice, normalizeText } from '../lib/catalogUtils.js';

export default function PriceListView({ products }) {
  const [search, setSearch] = React.useState('');
  const [rubro, setRubro] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rows, setRows] = React.useState(25);

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

  const discountCount = React.useMemo(() => filtered.filter((p) => p.tieneDescuento).length, [filtered]);

  React.useEffect(() => setPage(0), [search, rubro]);

  const visible = filtered.slice(page * rows, page * rows + rows);

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
        <Box>
          <Typography variant="overline" color="primary.main">CATÁLOGO COMERCIAL</Typography>
          <Typography variant="h4" sx={{ mt: .3 }}>Lista de precios</Typography>
          <Typography color="text.secondary" sx={{ mt: .7 }}>
            Encontrá rápidamente un producto y revisá el precio vigente con y sin IVA.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => exportExcel(products)}>
          Descargar Excel
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: 2.2,
          position: 'sticky',
          top: 82,
          zIndex: 5,
          bgcolor: 'rgba(13,23,34,.94)',
          backdropFilter: 'blur(14px)'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, producto, medida o sección…"
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>
            }}
          />
          <FormControl sx={{ minWidth: { md: 280 } }}>
            <InputLabel>Rubro</InputLabel>
            <Select value={rubro} label="Rubro" onChange={(e) => setRubro(e.target.value)}>
              <MenuItem value="">Todos los rubros</MenuItem>
              {rubros.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
            </Select>
          </FormControl>
          {(search || rubro) && (
            <Button color="inherit" onClick={() => { setSearch(''); setRubro(''); }}>
              Limpiar
            </Button>
          )}
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
        <Chip icon={<Inventory2OutlinedIcon />} label={`${filtered.length.toLocaleString('es-AR')} productos`} variant="outlined" />
        <Chip icon={<FilterAltOutlinedIcon />} label={rubro || 'Todos los rubros'} variant="outlined" />
        {discountCount > 0 && <Chip icon={<SellOutlinedIcon />} label={`${discountCount} con descuento`} color="success" variant="outlined" />}
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'hidden' }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 135 }}>Código</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell sx={{ width: 210 }}>Presentación</TableCell>
              <TableCell align="right" sx={{ width: 155 }}>S/IVA</TableCell>
              <TableCell align="right" sx={{ width: 165 }}>C/IVA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((p) => (
              <TableRow
                hover
                key={p.id || `${p.codigo}-${p.nombre}-${p.presentacion}`}
                sx={{ '&:last-child td': { borderBottom: 0 } }}
              >
                <TableCell>
                  <Chip label={p.codigo} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                </TableCell>
                <TableCell>
                  <Stack spacing={.55}>
                    <Typography fontWeight={780} sx={{ lineHeight: 1.35 }}>{p.nombre}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Typography variant="caption" color="text.secondary">{p.rubro}</Typography>
                      {p.seccion && <Typography variant="caption" color="text.secondary">· {p.seccion}</Typography>}
                      {p.tieneDescuento && <Chip label={`-${Math.round(p.descuento * 100)}%`} size="small" color="success" />}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={p.presentacion ? 'text.primary' : 'text.secondary'}>
                    {p.presentacion || 'Sin especificar'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={850}>{formatPrice(finalSinIva(p))}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={900} color="primary.light">{formatPrice(finalConIva(p))}</Typography>
                </TableCell>
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
    </Stack>
  );
}
