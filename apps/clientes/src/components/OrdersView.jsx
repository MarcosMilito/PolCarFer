import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { CONTACT, finalConIva, formatPrice, normalizeText } from '../lib/catalogUtils.js';

export default function OrdersView({ products, cart, setCart }) {
  const [search, setSearch] = React.useState('');
  const [rubro, setRubro] = React.useState('');
  const [checkout, setCheckout] = React.useState(false);
  const [customer, setCustomer] = React.useState({ nombre: '', telefono: '', localidad: '' });

  const rubros = React.useMemo(
    () => [...new Set(products.map((p) => p.rubro).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [products]
  );

  const filtered = React.useMemo(
    () => products
      .filter((p) =>
        (!rubro || p.rubro === rubro) &&
        (!search || normalizeText(`${p.codigo} ${p.nombre} ${p.presentacion} ${p.rubro}`).includes(normalizeText(search)))
      )
      .slice(0, 120),
    [products, search, rubro]
  );

  const add = (p) => setCart((prev) => {
    const productId = p.id || `${p.codigo}|${p.nombre}|${p.presentacion}`;
    const existing = prev.find((item) => item.id === productId);
    return existing
      ? prev.map((item) => item.id === productId ? { ...item, cantidad: item.cantidad + 1 } : item)
      : [...prev, {
          id: productId,
          codigo: p.codigo,
          nombre: p.nombre,
          presentacion: p.presentacion,
          cantidad: 1,
          precio: finalConIva(p)
        }];
  });

  const units = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const send = () => {
    const lines = cart
      .map((item) => `${item.codigo} - ${item.nombre} | Cant: ${item.cantidad} | ${formatPrice(item.precio * item.cantidad)}`)
      .join('\n');

    const msg = `Hola POLCARFER, quiero solicitar este pedido.\n\nCliente: ${customer.nombre}\nTeléfono: ${customer.telefono}\nLocalidad: ${customer.localidad}\n\nPRODUCTOS\n${lines}\n\nTotal estimado c/IVA: ${formatPrice(total)}\n\nPor favor confirmar disponibilidad, precio vigente y entrega.`;

    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    setCheckout(false);
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="overline" color="primary.main">SOLICITUD COMERCIAL</Typography>
        <Typography variant="h4" sx={{ mt: .3 }}>Preparar pedido</Typography>
        <Typography color="text.secondary" sx={{ mt: .7, maxWidth: 760 }}>
          Buscá los productos, agregá las cantidades y enviá la solicitud. POLCARFER confirma disponibilidad y condiciones comerciales.
        </Typography>
      </Box>

      <Alert severity="info" variant="outlined" icon={<CheckCircleOutlineRoundedIcon />}>
        El total es estimativo. El pedido queda sujeto a confirmación de stock, precio vigente y entrega.
      </Alert>

      <Grid container spacing={2.2} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 8.3 }}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2.1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={1.4}>
                <TextField
                  fullWidth
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por código, producto o presentación…"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>
                  }}
                />
                <FormControl sx={{ minWidth: { md: 260 } }}>
                  <InputLabel>Rubro</InputLabel>
                  <Select value={rubro} label="Rubro" onChange={(e) => setRubro(e.target.value)}>
                    <MenuItem value="">Todos los rubros</MenuItem>
                    {rubros.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            </Paper>

            <Typography variant="body2" color="text.secondary">
              Mostrando {filtered.length.toLocaleString('es-AR')} productos
            </Typography>

            <Stack spacing={1.1}>
              {filtered.map((p) => {
                const inCart = cart.find((item) => item.id === (p.id || `${p.codigo}|${p.nombre}|${p.presentacion}`));
                const noStock = p.stock !== null && p.stock <= 0;
                return (
                  <Paper
                    key={p.id || `${p.codigo}-${p.nombre}-${p.presentacion}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      transition: '.18s',
                      '&:hover': { borderColor: 'rgba(255,138,61,.24)', bgcolor: 'rgba(255,255,255,.012)' }
                    }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip label={p.codigo} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                          {inCart && <Chip label={`${inCart.cantidad} en pedido`} size="small" color="primary" />}
                          {noStock && <Chip label="Sin stock" size="small" color="error" variant="outlined" />}
                        </Stack>
                        <Typography fontWeight={820} sx={{ mt: .8, lineHeight: 1.35 }}>{p.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: .35 }}>
                          {p.presentacion || 'Presentación a consultar'} · {p.rubro}
                        </Typography>
                      </Box>

                      <Box sx={{ minWidth: 165 }}>
                        <Typography variant="caption" color="text.secondary">Precio estimado c/IVA</Typography>
                        <Typography variant="h6" color="primary.light">{formatPrice(finalConIva(p))}</Typography>
                      </Box>

                      <Button
                        variant={inCart ? 'contained' : 'outlined'}
                        startIcon={<AddRoundedIcon />}
                        onClick={() => add(p)}
                        disabled={noStock}
                        sx={{ minWidth: 120 }}
                      >
                        {inCart ? 'Sumar' : 'Agregar'}
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 3.7 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              position: { lg: 'sticky' },
              top: { lg: 92 },
              bgcolor: '#0b1621'
            }}
          >
            <Stack spacing={2.2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.1} alignItems="center">
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(255,138,61,.10)', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <ShoppingCartRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography fontWeight={850}>Tu pedido</Typography>
                    <Typography variant="caption" color="text.secondary">{units} unidades</Typography>
                  </Box>
                </Stack>
                {cart.length > 0 && <Chip label={cart.length} size="small" color="primary" />}
              </Stack>

              <Box sx={{ maxHeight: 430, overflowY: 'auto', pr: .5 }}>
                {cart.length ? (
                  <Stack spacing={1}>
                    {cart.map((item) => (
                      <Paper key={item.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,.012)' }}>
                        <Typography fontWeight={750} sx={{ lineHeight: 1.3 }}>{item.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.codigo} · {formatPrice(item.precio)} c/u</Typography>
                        <Stack direction="row" alignItems="center" spacing={.5} sx={{ mt: 1 }}>
                          <IconButton size="small" onClick={() => setCart((current) => current.map((x) => x.id === item.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x))}>
                            <RemoveRoundedIcon fontSize="small" />
                          </IconButton>
                          <Typography fontWeight={800} sx={{ minWidth: 25, textAlign: 'center' }}>{item.cantidad}</Typography>
                          <IconButton size="small" onClick={() => setCart((current) => current.map((x) => x.id === item.id ? { ...x, cantidad: x.cantidad + 1 } : x))}>
                            <AddRoundedIcon fontSize="small" />
                          </IconButton>
                          <Box sx={{ flex: 1 }} />
                          <Typography fontWeight={850}>{formatPrice(item.precio * item.cantidad)}</Typography>
                          <IconButton size="small" color="error" onClick={() => setCart((current) => current.filter((x) => x.id !== item.id))}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Inventory2OutlinedIcon sx={{ fontSize: 42, color: 'text.secondary', opacity: .45 }} />
                    <Typography fontWeight={800} sx={{ mt: 1.5 }}>Tu pedido está vacío</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Agregá productos desde el catálogo.</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ pt: 1.8, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                  <Typography color="text.secondary">Total estimado</Typography>
                  <Typography variant="h5">{formatPrice(total)}</Typography>
                </Stack>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  disabled={!cart.length}
                  onClick={() => setCheckout(true)}
                  sx={{ mt: 2 }}
                >
                  Continuar pedido
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={checkout} onClose={() => setCheckout(false)} fullWidth maxWidth="sm">
        <DialogTitle>Datos del cliente</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Estos datos se incluyen en el mensaje que se enviará a POLCARFER.
          </Typography>
          <Stack spacing={2}>
            <TextField label="Nombre / Razón social" value={customer.nombre} onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })} />
            <TextField label="Teléfono" value={customer.telefono} onChange={(e) => setCustomer({ ...customer, telefono: e.target.value })} />
            <TextField label="Localidad" value={customer.localidad} onChange={(e) => setCustomer({ ...customer, localidad: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckout(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<WhatsAppIcon />} disabled={!customer.nombre || !customer.telefono} onClick={send}>
            Enviar por WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
