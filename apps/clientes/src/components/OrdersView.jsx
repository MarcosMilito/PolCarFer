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
  Drawer,
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
  Typography,
  useMediaQuery
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { CONTACT, formatPrice, normalizeText } from '../lib/catalogUtils.js';

function commercialPrice(value) {
  return Number(value || 0) > 0 ? formatPrice(value) : 'A consultar';
}

function CartContent({ cart, setCart, units, total, onCheckout, mobile = false, onClose }) {
  return (
    <Stack spacing={2.1} sx={{ height: '100%' }}>
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
        <Stack direction="row" spacing={.5} alignItems="center">
          {cart.length > 0 && <Chip label={cart.length} size="small" color="primary" />}
          {mobile && (
            <IconButton aria-label="Cerrar pedido" onClick={onClose} sx={{ width: 44, height: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          )}
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, maxHeight: mobile ? '58vh' : 430, overflowY: 'auto', pr: .3 }}>
        {cart.length ? (
          <Stack spacing={1}>
            {cart.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,.012)' }}>
                <Typography fontWeight={750} sx={{ lineHeight: 1.3 }}>{item.nombre}</Typography>
                <Typography variant="caption" color="text.secondary">{item.codigo} · {commercialPrice(item.precio)} c/u</Typography>
                {item.ofertasDisponibles > 0 && <Chip label={`${item.ofertasDisponibles} oferta${item.ofertasDisponibles === 1 ? '' : 's'} disponible${item.ofertasDisponibles === 1 ? '' : 's'}`} size="small" color="success" sx={{ mt: .7 }} />}
                <Stack direction="row" alignItems="center" spacing={.4} sx={{ mt: 1.1 }}>
                  <IconButton
                    aria-label="Restar unidad"
                    onClick={() => setCart((current) => current.map((x) => x.id === item.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x))}
                    sx={{ width: 38, height: 38 }}
                  >
                    <RemoveRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography fontWeight={800} sx={{ minWidth: 28, textAlign: 'center' }}>{item.cantidad}</Typography>
                  <IconButton
                    aria-label="Sumar unidad"
                    onClick={() => setCart((current) => current.map((x) => x.id === item.id ? { ...x, cantidad: x.cantidad + 1 } : x))}
                    sx={{ width: 38, height: 38 }}
                  >
                    <AddRoundedIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ flex: 1 }} />
                  <Typography fontWeight={850}>{item.precio > 0 ? formatPrice(item.precio * item.cantidad) : 'A consultar'}</Typography>
                  <IconButton
                    aria-label="Quitar producto"
                    color="error"
                    onClick={() => setCart((current) => current.filter((x) => x.id !== item.id))}
                    sx={{ width: 38, height: 38 }}
                  >
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

      <Box sx={{ pt: 1.7, borderTop: '1px solid', borderColor: 'divider' }}>
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
          onClick={onCheckout}
          sx={{ mt: 1.6, minHeight: 48 }}
        >
          Continuar pedido
        </Button>
      </Box>
    </Stack>
  );
}

export default function OrdersView({ products, cart, setCart }) {
  const mobile = useMediaQuery('(max-width:900px)');
  const [search, setSearch] = React.useState('');
  const [rubro, setRubro] = React.useState('');
  const [checkout, setCheckout] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
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
      .slice(0, mobile ? 80 : 120),
    [products, search, rubro, mobile]
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
          precio: Number(p.precioConIva || 0)
        }];
  });

  const productMap = React.useMemo(
    () => new Map(products.map((product) => [product.id || `${product.codigo}|${product.nombre}|${product.presentacion}`, product])),
    [products]
  );

  const pricedCart = React.useMemo(
    () => cart.map((item) => {
      const product = productMap.get(item.id);
      if (!product) return item;
      return {
        ...item,
        precio: Number(product.precioConIva || 0),
        ofertasDisponibles: (product.offers || []).length
      };
    }),
    [cart, productMap]
  );

  const units = pricedCart.reduce((sum, item) => sum + item.cantidad, 0);
  const total = pricedCart.reduce((sum, item) => sum + (Number(item.precio || 0) * item.cantidad), 0);

  const send = () => {
    const lines = pricedCart
      .map((item) => `${item.codigo} - ${item.nombre} | Cant: ${item.cantidad} | ${item.precio > 0 ? formatPrice(item.precio * item.cantidad) : 'Precio a consultar'}${item.ofertasDisponibles > 0 ? ` | ${item.ofertasDisponibles} oferta(s) disponible(s), confirmar condición` : ''}`)
      .join('\n');

    const msg = `Hola POLCARFER, quiero solicitar este pedido.\n\nCliente: ${customer.nombre}\nTeléfono: ${customer.telefono}\nLocalidad: ${customer.localidad}\n\nPRODUCTOS\n${lines}\n\nTotal estimado c/IVA: ${formatPrice(total)}\n\nPor favor confirmar disponibilidad, precio vigente y entrega.`;

    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    setCheckout(false);
    setCartOpen(false);
  };

  const openCheckout = () => {
    setCartOpen(false);
    setCheckout(true);
  };

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ pb: { xs: cart.length ? 10 : 0, md: 0 } }}>
      <Box>
        <Typography variant="overline" color="primary.main">SOLICITUD COMERCIAL</Typography>
        <Typography variant="h4" sx={{ mt: .25, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.35rem' } }}>
          Preparar pedido
        </Typography>
        <Typography color="text.secondary" sx={{ mt: .65, maxWidth: 760, lineHeight: 1.55 }}>
          Buscá productos, agregá cantidades y enviá la solicitud. POLCARFER confirma disponibilidad y condiciones comerciales.
        </Typography>
      </Box>

      <Alert severity="info" variant="outlined" icon={<CheckCircleOutlineRoundedIcon />}>
        El total es estimativo y queda sujeto a confirmación.
      </Alert>

      <Grid container spacing={2.2} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 8.3 }}>
          <Stack spacing={1.8}>
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.1 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={1.2}>
                <TextField
                  fullWidth
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Código, producto o presentación…"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>
                  }}
                />
                <FormControl fullWidth={mobile} sx={{ minWidth: { md: 260 } }}>
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

            <Stack spacing={1}>
              {filtered.map((p) => {
                const productId = p.id || `${p.codigo}|${p.nombre}|${p.presentacion}`;
                const inCart = cart.find((item) => item.id === productId);
                const noStock = p.stock !== null && p.stock <= 0;
                return (
                  <Paper
                    key={productId}
                    variant="outlined"
                    sx={{
                      p: { xs: 1.6, sm: 2 },
                      transition: '.18s',
                      '&:hover': { borderColor: 'rgba(255,138,61,.24)', bgcolor: 'rgba(255,255,255,.012)' }
                    }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={{ xs: 1.35, sm: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={.7} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip label={p.codigo} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                          {inCart && <Chip label={`${inCart.cantidad} en pedido`} size="small" color="primary" />}
                          {noStock && <Chip label="Sin stock" size="small" color="error" variant="outlined" />}
                          {(p.offers || []).length > 0 && <Chip label={`${p.offers.length} oferta${p.offers.length === 1 ? '' : 's'} por cantidad`} size="small" color="success" variant="outlined" />}
                        </Stack>
                        <Typography fontWeight={820} sx={{ mt: .75, lineHeight: 1.35 }}>{p.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: .35, lineHeight: 1.45 }}>
                          {p.presentacion || 'Presentación a consultar'}{p.rubro ? ` · ${p.rubro}` : ''}
                        </Typography>
                      </Box>

                      <Stack
                        direction={{ xs: 'row', sm: 'column' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'center', sm: 'flex-start' }}
                        gap={1}
                        sx={{ minWidth: { sm: 165 } }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">Precio c/IVA</Typography>
                          <Typography variant="h6" color="primary.light">{commercialPrice(p.precioConIva)}</Typography>
                        </Box>
                        {mobile && (
                          <Button
                            variant={inCart ? 'contained' : 'outlined'}
                            startIcon={<AddRoundedIcon />}
                            onClick={() => add(p)}
                            disabled={noStock}
                            sx={{ minWidth: 112, minHeight: 44 }}
                          >
                            {inCart ? 'Sumar' : 'Agregar'}
                          </Button>
                        )}
                      </Stack>

                      {!mobile && (
                        <Button
                          variant={inCart ? 'contained' : 'outlined'}
                          startIcon={<AddRoundedIcon />}
                          onClick={() => add(p)}
                          disabled={noStock}
                          sx={{ minWidth: 120 }}
                        >
                          {inCart ? 'Sumar' : 'Agregar'}
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        </Grid>

        {!mobile && (
          <Grid size={{ xs: 12, lg: 3.7 }}>
            <Paper variant="outlined" sx={{ p: 2.5, position: { lg: 'sticky' }, top: { lg: 92 }, bgcolor: '#0b1621' }}>
              <CartContent cart={pricedCart} setCart={setCart} units={units} total={total} onCheckout={openCheckout} />
            </Paper>
          </Grid>
        )}
      </Grid>

      {mobile && cart.length > 0 && (
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(12px + env(safe-area-inset-bottom))',
            zIndex: 1200,
            p: 1.1,
            border: '1px solid rgba(255,138,61,.25)',
            bgcolor: 'rgba(11,22,33,.97)',
            backdropFilter: 'blur(16px)',
            borderRadius: 3
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">{units} unidades · {cart.length} productos</Typography>
              <Typography fontWeight={900} color="primary.light">{formatPrice(total)}</Typography>
            </Box>
            <Button variant="contained" startIcon={<ShoppingCartRoundedIcon />} onClick={() => setCartOpen(true)} sx={{ minHeight: 46 }}>
              Ver pedido
            </Button>
          </Stack>
        </Paper>
      )}

      <Drawer
        anchor="bottom"
        open={mobile && cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: {
            maxHeight: '88vh',
            borderRadius: '22px 22px 0 0',
            bgcolor: '#0b1621',
            backgroundImage: 'none',
            p: 2,
            pb: 'calc(18px + env(safe-area-inset-bottom))'
          }
        }}
      >
        <CartContent
          cart={pricedCart}
          setCart={setCart}
          units={units}
          total={total}
          onCheckout={openCheckout}
          mobile
          onClose={() => setCartOpen(false)}
        />
      </Drawer>

      <Dialog
        open={checkout}
        onClose={() => setCheckout(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={mobile}
      >
        <DialogTitle>Datos del cliente</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Estos datos se incluyen en el mensaje que se enviará a POLCARFER.
          </Typography>
          <Stack spacing={2}>
            <TextField label="Nombre / Razón social" value={customer.nombre} onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })} />
            <TextField label="Teléfono" inputMode="tel" value={customer.telefono} onChange={(e) => setCustomer({ ...customer, telefono: e.target.value })} />
            <TextField label="Localidad" value={customer.localidad} onChange={(e) => setCustomer({ ...customer, localidad: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 2 }, pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', md: 2 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
          <Button fullWidth={mobile} onClick={() => setCheckout(false)}>Cancelar</Button>
          <Button fullWidth={mobile} variant="contained" startIcon={<WhatsAppIcon />} disabled={!customer.nombre || !customer.telefono} onClick={send}>
            Enviar por WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
