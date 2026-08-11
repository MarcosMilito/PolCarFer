import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  exportAdminExcel,
  finalSinIva,
  formatPrice,
  normalizeDiscount,
  normalizePresentation,
  normalizeProduct,
  normalizeText,
  parseExcel,
  parseNumber,
  IVA
} from '../lib/catalogUtils.js';
import {
  createNews,
  deleteNews,
  loadAdminNews,
  setNewsActive,
  subscribeNews
} from '../lib/newsService.js';

function toDatabase(product) {
  const p = normalizeProduct(product);
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    presentacion: normalizePresentation(p.presentacion),
    rubro: p.rubro || 'General',
    seccion: p.seccion || '',
    precio_lista: Number(p.precioLista || 0),
    precio_sin_iva: Number(p.precioSinIva || 0),
    precio_con_iva: Number(p.precioConIva || 0),
    descuento: Number(p.descuento || 0),
    precio_sin_iva_descuento: Number(p.precioSinIvaDescuento || 0),
    precio_con_iva_descuento: Number(p.precioConIvaDescuento || 0),
    stock: p.stock === '' || p.stock === undefined ? null : p.stock,
    activo: true,
    origen: p.origen || 'SISTEMA SOCIOS',
    updated_at: new Date().toISOString()
  };
}

async function comprobarSocio() {
  const { data, error } = await supabase.rpc('is_socio');
  if (error) {
    console.error('Error comprobando socio:', error);
    return false;
  }
  return data === true;
}

function LoginSocio({ onSuccess }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const ingresar = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresá el email y la contraseña.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (loginError) throw loginError;
      if (!data.session) throw new Error('No se pudo iniciar la sesión.');

      const autorizado = await comprobarSocio();
      if (!autorizado) {
        await supabase.auth.signOut();
        throw new Error('El usuario existe, pero no tiene permisos de socio.');
      }
      onSuccess(data.session);
    } catch (err) {
      const mensaje = String(err?.message || '');
      if (mensaje.toLowerCase().includes('invalid login credentials')) {
        setError('El email o la contraseña son incorrectos.');
      } else {
        setError(mensaje || 'No se pudo ingresar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={2.5} alignItems="stretch" sx={{ maxWidth: 1100, mx: 'auto', py: { xs: 1, md: 4 } }}>
      <Grid size={{ xs: 12, md: 6.2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, md: 4.5 },
            height: '100%',
            minHeight: { md: 500 },
            display: 'flex',
            alignItems: 'flex-end',
            background:
              'radial-gradient(circle at 70% 20%, rgba(255,138,61,.22), transparent 27%), linear-gradient(145deg, #101c28, #09121b)'
          }}
        >
          <Stack spacing={3}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 950 }}>PF</Avatar>
            <Box>
              <Typography variant="overline" color="primary.main">ÁREA PRIVADA</Typography>
              <Typography variant="h3" sx={{ mt: .5, fontSize: { xs: '2rem', md: '3rem' } }}>
                Gestión simple del catálogo.
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 560, lineHeight: 1.7 }}>
                Actualizá precios, modificá productos o importá una nueva lista. Los cambios se reflejan en el catálogo de clientes.
              </Typography>
            </Box>
            <Stack spacing={1.3}>
              {['Una sola base de productos', 'Edición manual e importación Excel', 'Cambios publicados para clientes'].map((text) => (
                <Stack key={text} direction="row" spacing={1.2} alignItems="center">
                  <CheckCircleRoundedIcon color="success" fontSize="small" />
                  <Typography variant="body2">{text}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 5.8 }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4.5 }, height: '100%', display: 'flex', alignItems: 'center' }}>
          <Stack spacing={2.6} sx={{ width: '100%' }}>
            <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: 'rgba(255,138,61,.10)', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
              <LockOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h4">Ingresar al sistema</Typography>
              <Typography color="text.secondary" sx={{ mt: .8 }}>Acceso exclusivo para socios autorizados.</Typography>
            </Box>

            {!isSupabaseConfigured && <Alert severity="error">La conexión con Supabase todavía no está configurada.</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={ingresar}>
              <Stack spacing={2}>
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <Button type="submit" size="large" variant="contained" disabled={loading || !isSupabaseConfigured} endIcon={<ArrowForwardRoundedIcon />}>
                  {loading ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </Stack>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Las credenciales se validan de forma segura mediante Supabase Auth.
            </Typography>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

function ProductDialog({ open, product, onClose, onSaved }) {
  const mobile = useMediaQuery('(max-width:700px)');
  const [form, setForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setForm(product || {
      codigo: '', nombre: '', presentacion: '', rubro: '', seccion: '',
      precioLista: '', precioSinIva: '', precioConIva: '', descuento: 0, stock: ''
    });
    setError('');
  }, [product, open]);

  const change = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const guardar = async () => {
    if (!form.codigo?.trim() || !form.nombre?.trim()) {
      setError('Código y producto son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const precioSinIva = parseNumber(form.precioSinIva);
      const precioConIva = parseNumber(form.precioConIva) || precioSinIva * (1 + IVA);
      const descuento = normalizeDiscount(form.descuento);
      const producto = normalizeProduct({
        ...form,
        presentacion: normalizePresentation(form.presentacion),
        precioLista: parseNumber(form.precioLista) || precioSinIva,
        precioSinIva,
        precioConIva,
        descuento,
        precioSinIvaDescuento: descuento > 0 ? precioSinIva * (1 - descuento) : 0,
        precioConIvaDescuento: descuento > 0 ? precioConIva * (1 - descuento) : 0,
        stock: form.stock === '' ? null : parseNumber(form.stock)
      });

      if (product?.id) {
        const { error: updateError } = await supabase.from('products').update(toDatabase(producto)).eq('id', product.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('products').insert(toDatabase(producto));
        if (insertError) throw insertError;
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={mobile}>
      <DialogTitle>{product ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Código" value={form.codigo || ''} onChange={(e) => change('codigo', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 8 }}><TextField fullWidth label="Producto" value={form.nombre || ''} onChange={(e) => change('nombre', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Presentación" helperText="Ej.: 12 → 12 unidades" value={form.presentacion || ''} onChange={(e) => change('presentacion', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Rubro" value={form.rubro || ''} onChange={(e) => change('rubro', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Sección" value={form.seccion || ''} onChange={(e) => change('seccion', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Stock" type="number" value={form.stock ?? ''} onChange={(e) => change('stock', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Precio de lista" type="number" value={form.precioLista ?? ''} onChange={(e) => change('precioLista', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Precio S/IVA" type="number" value={form.precioSinIva ?? ''} onChange={(e) => change('precioSinIva', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Precio C/IVA" type="number" value={form.precioConIva ?? ''} onChange={(e) => change('precioConIva', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Descuento %" type="number" value={typeof form.descuento === 'number' ? Math.round(form.descuento * 100) : form.descuento || ''} onChange={(e) => change('descuento', e.target.value)} /></Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 2, md: 2 }, pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', md: 2 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
        <Button fullWidth={mobile} onClick={onClose}>Cancelar</Button>
        <Button fullWidth={mobile} variant="contained" disabled={saving} onClick={guardar}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ProductsView({ products, refresh }) {
  const mobile = useMediaQuery('(max-width:700px)');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rows, setRows] = React.useState(25);
  const [selected, setSelected] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const query = normalizeText(search);
    if (!query) return products;
    return products.filter((product) => normalizeText(`${product.codigo} ${product.nombre} ${product.presentacion} ${product.rubro} ${product.seccion}`).includes(query));
  }, [products, search]);

  const visible = filtered.slice(page * rows, page * rows + rows);

  const deactivate = async (product) => {
    if (!confirm(`¿Desactivar ${product.codigo} - ${product.nombre}?`)) return;
    const { error } = await supabase.from('products').update({ activo: false, updated_at: new Date().toISOString() }).eq('id', product.id);
    if (error) throw error;
    await refresh();
  };

  return (
    <Stack spacing={2.3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
        <Box>
          <Typography variant="h5">Gestión de productos</Typography>
          <Typography color="text.secondary" sx={{ mt: .4 }}>{filtered.length.toLocaleString('es-AR')} productos disponibles.</Typography>
        </Box>
        <Button fullWidth={mobile} variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setSelected(null); setDialogOpen(true); }} sx={{ minHeight: 46 }}>
          Nuevo producto
        </Button>
      </Stack>

      <TextField
        fullWidth
        placeholder="Buscar código, producto, presentación, rubro o sección…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
      />

      {mobile ? (
        <Stack spacing={1}>
          {visible.map((product) => (
            <Paper key={product.id} variant="outlined" sx={{ p: 1.7, bgcolor: 'rgba(255,255,255,.012)' }}>
              <Stack spacing={1.2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Chip label={product.codigo} size="small" variant="outlined" sx={{ fontFamily: 'monospace', maxWidth: '60%' }} />
                  <Stack direction="row" spacing={.4}>
                    <IconButton aria-label="Editar producto" onClick={() => { setSelected(product); setDialogOpen(true); }} sx={{ width: 40, height: 40 }}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="Desactivar producto" color="error" onClick={() => deactivate(product)} sx={{ width: 40, height: 40 }}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Box>
                  <Typography fontWeight={820} sx={{ lineHeight: 1.35 }}>{product.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: .45, lineHeight: 1.45 }}>
                    {normalizePresentation(product.presentacion) || 'Presentación a consultar'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={.65} flexWrap="wrap" useFlexGap>
                  {product.rubro && <Chip label={product.rubro} size="small" variant="outlined" />}
                  <Chip label={product.stock === null ? 'Stock: consultar' : `Stock: ${product.stock}`} size="small" variant="outlined" />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                  <Typography variant="caption" color="text.secondary">Precio S/IVA</Typography>
                  <Typography fontWeight={900} color="primary.light">{formatPrice(finalSinIva(product))}</Typography>
                </Stack>
              </Stack>
            </Paper>
          ))}
          {!visible.length && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography fontWeight={800}>No encontramos productos</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Probá con otro término.</Typography>
            </Paper>
          )}
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              rowsPerPage={rows}
              onPageChange={(_, next) => setPage(next)}
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
          <Table sx={{ minWidth: 950 }}>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell>Presentación</TableCell>
                <TableCell>Rubro</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Precio S/IVA</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell><Chip label={product.codigo} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} /></TableCell>
                  <TableCell><Typography fontWeight={780}>{product.nombre}</Typography></TableCell>
                  <TableCell>{normalizePresentation(product.presentacion) || '—'}</TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{product.rubro}</Typography></TableCell>
                  <TableCell align="right">{product.stock === null ? 'Consultar' : product.stock}</TableCell>
                  <TableCell align="right"><Typography fontWeight={850}>{formatPrice(finalSinIva(product))}</Typography></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton onClick={() => { setSelected(product); setDialogOpen(true); }}><EditRoundedIcon /></IconButton></Tooltip>
                    <Tooltip title="Desactivar"><IconButton color="error" onClick={() => deactivate(product)}><DeleteOutlineRoundedIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              rowsPerPage={rows}
              onPageChange={(_, next) => setPage(next)}
              onRowsPerPageChange={(e) => { setRows(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[25, 50, 100]}
              labelRowsPerPage="Mostrar"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Table>
        </TableContainer>
      )}

      <ProductDialog
        open={dialogOpen}
        product={selected}
        onClose={() => setDialogOpen(false)}
        onSaved={refresh}
      />
    </Stack>
  );
}

function ImportView({ products, refresh }) {
  const [file, setFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(null);

  const importar = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const incoming = await parseExcel(file, products);
      const { error: disableError } = await supabase
        .from('products')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('activo', true);
      if (disableError) throw disableError;

      for (const product of incoming) {
        const row = toDatabase(product);
        if (product.id) {
          const { error } = await supabase.from('products').update(row).eq('id', product.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('products').insert(row);
          if (error) throw error;
        }
      }

      await refresh();
      setMessage({ type: 'success', text: `Lista actualizada correctamente. ${incoming.length.toLocaleString('es-AR')} productos procesados.` });
      setFile(null);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'No se pudo importar el archivo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5">Actualizar lista de precios</Typography>
        <Typography color="text.secondary" sx={{ mt: .5 }}>
          Subí la nueva lista de POLCARFER. El sistema interpreta los productos, normaliza presentaciones y publica los cambios.
        </Typography>
      </Box>

      {message && <Alert severity={message.type}>{message.text}</Alert>}

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, md: 4 },
          borderStyle: 'dashed',
          borderWidth: 1.5,
          borderColor: file ? 'rgba(67,181,129,.45)' : 'rgba(255,255,255,.13)',
          textAlign: 'center',
          bgcolor: file ? 'rgba(67,181,129,.025)' : 'rgba(255,255,255,.01)'
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <Box sx={{ width: 64, height: 64, borderRadius: 3, bgcolor: 'rgba(255,138,61,.10)', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
            {file ? <DescriptionOutlinedIcon sx={{ fontSize: 32 }} /> : <UploadFileRoundedIcon sx={{ fontSize: 32 }} />}
          </Box>
          <Box>
            <Typography variant="h6">{file ? file.name : 'Seleccioná la nueva lista Excel'}</Typography>
            <Typography color="text.secondary" sx={{ mt: .5 }}>
              Formatos admitidos: .xlsx y .xls · Los códigos repetidos están permitidos.
            </Typography>
          </Box>
          <Button component="label" variant={file ? 'outlined' : 'contained'} startIcon={<UploadFileRoundedIcon />}>
            {file ? 'Cambiar archivo' : 'Seleccionar Excel'}
            <input hidden type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography fontWeight={800}>¿Qué va a hacer el sistema?</Typography>
            <Stack spacing={1.1} sx={{ mt: 1.7 }}>
              {[
                'Actualizar los productos que ya existen.',
                'Crear automáticamente los productos nuevos.',
                'Identificar automáticamente cada producto, incluso cuando se repite el código.',
                'Normalizar presentaciones simples como “12” → “12 unidades”.',
                'Dejar fuera de la lista pública los productos que ya no aparecen.'
              ].map((text) => (
                <Stack key={text} direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleRoundedIcon color="success" fontSize="small" sx={{ mt: .15 }} />
                  <Typography variant="body2" color="text.secondary">{text}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%', bgcolor: '#0b1621' }}>
            <Typography variant="overline" color="text.secondary">CATÁLOGO ACTUAL</Typography>
            <Typography variant="h4" sx={{ mt: .5 }}>{products.length.toLocaleString('es-AR')}</Typography>
            <Typography color="text.secondary">productos publicados</Typography>
            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={!file || loading}
              onClick={importar}
              sx={{ mt: 2.5 }}
            >
              {loading ? 'Actualizando…' : 'Publicar nueva lista'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Stack spacing={0.7} alignItems="flex-start">
        <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => exportAdminExcel(products)}>
          Descargar catálogo editable
        </Button>
        <Typography variant="caption" color="text.secondary">
          Podés agregar filas nuevas normalmente. El sistema genera sus identificadores internos al importar.
        </Typography>
      </Stack>
    </Stack>
  );
}


function NewsAdminView() {
  const [items, setItems] = React.useState([]);
  const [titulo, setTitulo] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [loadingList, setLoadingList] = React.useState(true);
  const [message, setMessage] = React.useState(null);

  const refresh = React.useCallback(async () => {
    try {
      const data = await loadAdminNews();
      setItems(data);
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err?.message || 'No se pudieron cargar las novedades.'
      });
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const stop = subscribeNews(refresh);
    return () => stop?.();
  }, [refresh]);

  React.useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const publicar = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await createNews({
        titulo,
        descripcion,
        file
      });

      setTitulo('');
      setDescripcion('');
      setFile(null);
      await refresh();

      setMessage({
        type: 'success',
        text: 'Novedad publicada. Los clientes ya pueden verla.'
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err?.message || 'No se pudo publicar la novedad.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="overline" color="primary.main">COMUNICACIÓN</Typography>
        <Typography variant="h4" sx={{ mt: .3 }}>Novedades</Typography>
        <Typography color="text.secondary" sx={{ mt: .6, maxWidth: 760 }}>
          Publicá imágenes para que aparezcan directamente en la pestaña Novedades del portal de clientes.
        </Typography>
      </Box>

      {message && <Alert severity={message.type}>{message.text}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2.2, md: 3 } }}>
            <Stack spacing={2.2}>
              <Box>
                <Typography variant="h6">Nueva publicación</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
                  JPG, PNG o WEBP. Máximo 5 MB.
                </Typography>
              </Box>

              <TextField
                label="Título"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                inputProps={{ maxLength: 140 }}
                fullWidth
              />

              <TextField
                label="Descripción"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                inputProps={{ maxLength: 1000 }}
                multiline
                minRows={3}
                fullWidth
              />

              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                sx={{ alignSelf: 'flex-start' }}
              >
                {file ? file.name : 'Seleccionar imagen'}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </Button>

              {preview && (
                <Box
                  component="img"
                  src={preview}
                  alt="Vista previa"
                  sx={{
                    width: '100%',
                    maxHeight: 330,
                    objectFit: 'cover',
                    borderRadius: 2.5,
                    border: '1px solid rgba(255,255,255,.08)'
                  }}
                />
              )}

              <Button
                size="large"
                variant="contained"
                startIcon={<CampaignRoundedIcon />}
                disabled={loading || !titulo.trim() || !file}
                onClick={publicar}
              >
                {loading ? 'Publicando…' : 'Publicar novedad'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Publicaciones</Typography>
              <Chip
                size="small"
                label={`${items.length} ${items.length === 1 ? 'novedad' : 'novedades'}`}
                variant="outlined"
              />
            </Stack>

            {loadingList ? (
              <Stack alignItems="center" sx={{ py: 7 }}>
                <CircularProgress size={30} />
              </Stack>
            ) : items.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                <CampaignRoundedIcon sx={{ color: 'primary.main', fontSize: 38, mb: 1 }} />
                <Typography fontWeight={800}>Todavía no publicaste novedades</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
                  La primera publicación va a aparecer acá y en el portal de clientes.
                </Typography>
              </Paper>
            ) : (
              items.map((item) => (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    opacity: item.activo ? 1 : .62
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ sm: 'center' }}
                  >
                    <Box
                      component="img"
                      src={item.imagenUrl}
                      alt={item.titulo}
                      sx={{
                        width: { xs: '100%', sm: 150 },
                        height: { xs: 190, sm: 100 },
                        objectFit: 'cover',
                        borderRadius: 2,
                        flexShrink: 0
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={850}>{item.titulo}</Typography>
                        <Chip
                          size="small"
                          color={item.activo ? 'success' : 'default'}
                          label={item.activo ? 'Publicada' : 'Oculta'}
                        />
                      </Stack>
                      {item.descripcion && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: .6,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {item.descripcion}
                        </Typography>
                      )}
                    </Box>

                    <Stack
                      direction={{ xs: 'row', sm: 'column' }}
                      spacing={.7}
                      sx={{ flexShrink: 0 }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          try {
                            await setNewsActive(item.id, !item.activo);
                            await refresh();
                          } catch (err) {
                            setMessage({
                              type: 'error',
                              text: err?.message || 'No se pudo cambiar la visibilidad.'
                            });
                          }
                        }}
                      >
                        {item.activo ? 'Ocultar' : 'Publicar'}
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineRoundedIcon />}
                        onClick={async () => {
                          if (!confirm(`¿Eliminar la novedad "${item.titulo}"?`)) return;
                          try {
                            await deleteNews(item);
                            await refresh();
                          } catch (err) {
                            setMessage({
                              type: 'error',
                              text: err?.message || 'No se pudo eliminar la novedad.'
                            });
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" spacing={1.6} alignItems="flex-start">
        <Box sx={{ width: 44, height: 44, borderRadius: 2.3, bgcolor: 'rgba(255,138,61,.09)', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
          <Icon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h5">{value}</Typography>
          <Typography fontWeight={750} sx={{ mt: .3 }}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">{helper}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function Dashboard({ products, onNavigate }) {
  const rubros = React.useMemo(() => new Set(products.map((p) => p.rubro).filter(Boolean)).size, [products]);
  const discounts = React.useMemo(() => products.filter((p) => p.tieneDescuento).length, [products]);
  const withStock = React.useMemo(() => products.filter((p) => p.stock !== null).length, [products]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="overline" color="primary.main">RESUMEN</Typography>
        <Typography variant="h4" sx={{ mt: .3 }}>Panel de socios</Typography>
        <Typography color="text.secondary" sx={{ mt: .6 }}>Estado actual del catálogo que utilizan los clientes.</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><StatCard icon={Inventory2OutlinedIcon} value={products.length.toLocaleString('es-AR')} label="Productos" helper="activos en el catálogo" /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><StatCard icon={CategoryOutlinedIcon} value={rubros} label="Rubros" helper="categorías disponibles" /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><StatCard icon={SellOutlinedIcon} value={discounts.toLocaleString('es-AR')} label="Con descuento" helper="ofertas activas" /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><StatCard icon={CloudDoneOutlinedIcon} value={withStock.toLocaleString('es-AR')} label="Con stock cargado" helper="productos con cantidad informada" /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%', background: 'linear-gradient(135deg, rgba(255,138,61,.07), rgba(255,255,255,.012))' }}>
            <Typography variant="h6">Actualizar lista de precios</Typography>
            <Typography color="text.secondary" sx={{ mt: .8, mb: 2.4, lineHeight: 1.6 }}>
              Importá el Excel nuevo y publicá los cambios en el catálogo de clientes.
            </Typography>
            <Button variant="contained" startIcon={<UploadFileRoundedIcon />} onClick={() => onNavigate('import')}>Actualizar lista</Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6">Modificar un producto</Typography>
            <Typography color="text.secondary" sx={{ mt: .8, mb: 2.4, lineHeight: 1.6 }}>
              Buscá por código o descripción y cambiá precio, presentación, rubro o stock.
            </Typography>
            <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => onNavigate('products')}>Gestionar productos</Button>
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="success" variant="outlined" icon={<CloudDoneOutlinedIcon />}>
        Los cambios guardados en este panel utilizan la misma base de datos que la Lista de precios y Pedidos.
      </Alert>
    </Stack>
  );
}

const NAV_ITEMS = [
  ['dashboard', 'Resumen', DashboardRoundedIcon],
  ['products', 'Productos', Inventory2OutlinedIcon],
  ['import', 'Actualizar lista', UploadFileRoundedIcon],
  ['news', 'Novedades', CampaignRoundedIcon]
];

export default function PartnerAccessView({ products, onCatalogChanged }) {
  const [checking, setChecking] = React.useState(true);
  const [session, setSession] = React.useState(null);
  const [section, setSection] = React.useState('dashboard');
  const mobile = useMediaQuery('(max-width:900px)');

  React.useEffect(() => {
    let active = true;
    async function check() {
      if (!isSupabaseConfigured) {
        if (active) setChecking(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (active) { setSession(null); setChecking(false); }
        return;
      }
      const socio = await comprobarSocio();
      if (active && socio) setSession(data.session);
      else await supabase.auth.signOut();
      if (active) setChecking(false);
    }
    check();
    return () => { active = false; };
  }, []);

  if (checking) {
    return <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 420 }}><CircularProgress /></Stack>;
  }

  if (!session) return <LoginSocio onSuccess={setSession} />;

  return (
    <Grid container spacing={{ xs: 1.4, md: 2.2 }} alignItems="flex-start">
      <Grid size={{ xs: 12, md: 3, lg: 2.35 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1, md: 1.4 },
            position: { xs: 'sticky', md: 'sticky' },
            top: { xs: 66, md: 92 },
            zIndex: 6,
            bgcolor: '#0b1621'
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ p: { xs: .8, md: 1.3 } }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(255,138,61,.14)', color: 'primary.main', fontWeight: 900 }}>S</Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={850} sx={{ fontSize: { xs: '.92rem', md: '1rem' } }}>Socio POLCARFER</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{session.user?.email}</Typography>
                </Box>
              </Stack>
            </Box>
            <Divider />
            <Stack direction={mobile ? 'row' : 'column'} spacing={.6} sx={{ overflowX: 'auto', pb: mobile ? .35 : 0, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {NAV_ITEMS.map(([id, label, Icon]) => (
                <Button
                  key={id}
                  fullWidth={!mobile}
                  color={section === id ? 'primary' : 'inherit'}
                  variant={section === id ? 'contained' : 'text'}
                  startIcon={<Icon />}
                  onClick={() => setSection(id)}
                  sx={{ justifyContent: 'flex-start', whiteSpace: 'nowrap', minHeight: 44, minWidth: mobile ? 'max-content' : undefined }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
            <Divider />
            <Button
              fullWidth
              color="inherit"
              startIcon={<LogoutRoundedIcon />}
              onClick={async () => {
                await supabase.auth.signOut();
                setSession(null);
                setSection('dashboard');
              }}
              sx={{ justifyContent: 'flex-start', color: 'text.secondary', minHeight: 44 }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 9, lg: 9.65 }}>
        {section === 'products' ? (
          <ProductsView products={products} refresh={onCatalogChanged} />
        ) : section === 'import' ? (
          <ImportView products={products} refresh={onCatalogChanged} />
        ) : section === 'news' ? (
          <NewsAdminView />
        ) : (
          <Dashboard products={products} onNavigate={setSection} />
        )}
      </Grid>
    </Grid>
  );
}
