import React from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

import {
  supabase,
  isSupabaseConfigured
} from '../lib/supabase.js';

import {
  exportExcel,
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


/* =========================================================
   UTILIDADES
========================================================= */

function toDatabase(product) {
  const p = normalizeProduct(product);

  return {
    codigo: p.codigo,
    nombre: p.nombre,

    presentacion:
      normalizePresentation(
        p.presentacion
      ),

    rubro:
      p.rubro || 'General',

    seccion:
      p.seccion || '',

    precio_lista:
      Number(
        p.precioLista || 0
      ),

    precio_sin_iva:
      Number(
        p.precioSinIva || 0
      ),

    precio_con_iva:
      Number(
        p.precioConIva || 0
      ),

    descuento:
      Number(
        p.descuento || 0
      ),

    precio_sin_iva_descuento:
      Number(
        p.precioSinIvaDescuento || 0
      ),

    precio_con_iva_descuento:
      Number(
        p.precioConIvaDescuento || 0
      ),

    stock:
      p.stock === '' ||
      p.stock === undefined
        ? null
        : p.stock,

    activo: true,

    origen:
      p.origen ||
      'SISTEMA SOCIOS',

    updated_at:
      new Date().toISOString()
  };
}


async function comprobarSocio() {
  const {
    data,
    error
  } = await supabase.rpc(
    'is_socio'
  );

  if (error) {
    console.error(
      'Error comprobando socio:',
      error
    );

    return false;
  }

  return data === true;
}


/* =========================================================
   LOGIN
========================================================= */

function LoginSocio({
  onSuccess
}) {
  const [email, setEmail] =
    React.useState('');

  const [
    password,
    setPassword
  ] = React.useState('');

  const [loading, setLoading] =
    React.useState(false);

  const [error, setError] =
    React.useState('');

  const ingresar = async (
    event
  ) => {
    event.preventDefault();

    setError('');

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        'Ingresá el email y la contraseña.'
      );

      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error:
          loginError
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              email
                .trim()
                .toLowerCase(),

            password
          });

      if (loginError) {
        throw loginError;
      }

      if (!data.session) {
        throw new Error(
          'No se pudo iniciar la sesión.'
        );
      }

      const autorizado =
        await comprobarSocio();

      if (!autorizado) {
        await supabase.auth.signOut();

        throw new Error(
          'El usuario existe, pero no tiene permisos de socio.'
        );
      }

      onSuccess(
        data.session
      );
    } catch (err) {
      console.error(err);

      const mensaje =
        String(
          err?.message || ''
        );

      if (
        mensaje
          .toLowerCase()
          .includes(
            'invalid login credentials'
          )
      ) {
        setError(
          'El email o la contraseña son incorrectos.'
        );
      } else {
        setError(
          mensaje ||
            'No se pudo ingresar.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: 'auto',
        py: {
          xs: 2,
          md: 6
        }
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: 3,
            md: 4
          }
        }}
      >
        <Stack spacing={2.5}>

          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor:
                'rgba(255,138,61,.12)'
            }}
          >
            <LockOutlinedIcon
              color="primary"
            />
          </Box>

          <Box>
            <Typography
              variant="h4"
              fontWeight={900}
            >
              Acceso de socios
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Ingresá con las
              credenciales de
              POLCARFER.
            </Typography>
          </Box>

          {!isSupabaseConfigured && (
            <Alert severity="error">
              La conexión con
              Supabase todavía no
              está configurada.
            </Alert>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={ingresar}
          >
            <Stack spacing={2}>

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
              />

              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={
                  loading ||
                  !isSupabaseConfigured
                }
              >
                {loading
                  ? 'Ingresando...'
                  : 'Ingresar'}
              </Button>

            </Stack>
          </Box>

        </Stack>
      </Paper>
    </Box>
  );
}


/* =========================================================
   EDICIÓN DE PRODUCTO
========================================================= */

function ProductDialog({
  open,
  product,
  onClose,
  onSaved
}) {
  const [form, setForm] =
    React.useState({});

  const [saving, setSaving] =
    React.useState(false);

  const [error, setError] =
    React.useState('');

  React.useEffect(() => {
    if (product) {
      setForm(product);
    } else {
      setForm({
        codigo: '',
        nombre: '',
        presentacion: '',
        rubro: '',
        seccion: '',
        precioLista: '',
        precioSinIva: '',
        precioConIva: '',
        descuento: 0,
        stock: ''
      });
    }

    setError('');
  }, [product, open]);

  const change = (
    field,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value
      })
    );
  };

  const guardar = async () => {
    if (
      !form.codigo?.trim() ||
      !form.nombre?.trim()
    ) {
      setError(
        'Código y producto son obligatorios.'
      );

      return;
    }

    setSaving(true);
    setError('');

    try {
      const precioSinIva =
        parseNumber(
          form.precioSinIva
        );

      const precioConIva =
        parseNumber(
          form.precioConIva
        ) ||
        precioSinIva *
          (1 + IVA);

      const descuento =
        normalizeDiscount(
          form.descuento
        );

      const producto =
        normalizeProduct({
          ...form,

          presentacion:
            normalizePresentation(
              form.presentacion
            ),

          precioLista:
            parseNumber(
              form.precioLista
            ) ||
            precioSinIva,

          precioSinIva,

          precioConIva,

          descuento,

          precioSinIvaDescuento:
            descuento > 0
              ? precioSinIva *
                (1 -
                  descuento)
              : 0,

          precioConIvaDescuento:
            descuento > 0
              ? precioConIva *
                (1 -
                  descuento)
              : 0,

          stock:
            form.stock === ''
              ? null
              : parseNumber(
                  form.stock
                )
        });

      if (product?.id) {
        const {
          error:
            updateError
        } =
          await supabase
            .from(
              'products'
            )
            .update(
              toDatabase(
                producto
              )
            )
            .eq(
              'id',
              product.id
            );

        if (updateError) {
          throw updateError;
        }
      } else {
        const {
          error:
            insertError
        } =
          await supabase
            .from(
              'products'
            )
            .insert(
              toDatabase(
                producto
              )
            );

        if (insertError) {
          throw insertError;
        }
      }

      await onSaved();

      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          'No se pudo guardar el producto.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {product
          ? 'Editar producto'
          : 'Nuevo producto'}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          sx={{ pt: 1 }}
        >

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Stack
            direction={{
              xs: 'column',
              md: 'row'
            }}
            spacing={2}
          >
            <TextField
              fullWidth
              label="Código"
              value={
                form.codigo || ''
              }
              onChange={(
                event
              ) =>
                change(
                  'codigo',
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              label="Producto"
              value={
                form.nombre || ''
              }
              onChange={(
                event
              ) =>
                change(
                  'nombre',
                  event.target.value
                )
              }
            />
          </Stack>

          <TextField
            fullWidth
            label="Presentación"
            value={
              form.presentacion ||
              ''
            }
            helperText="Ejemplo: 12 → 12 unidades · UNIDAD → 1 unidad"
            onChange={(
              event
            ) =>
              change(
                'presentacion',
                event.target.value
              )
            }
          />

          <Stack
            direction={{
              xs: 'column',
              md: 'row'
            }}
            spacing={2}
          >
            <TextField
              fullWidth
              label="Rubro"
              value={
                form.rubro || ''
              }
              onChange={(
                event
              ) =>
                change(
                  'rubro',
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              label="Sección"
              value={
                form.seccion || ''
              }
              onChange={(
                event
              ) =>
                change(
                  'seccion',
                  event.target.value
                )
              }
            />
          </Stack>

          <Stack
            direction={{
              xs: 'column',
              md: 'row'
            }}
            spacing={2}
          >
            <TextField
              fullWidth
              label="Precio S/IVA"
              type="number"
              value={
                form.precioSinIva ??
                ''
              }
              onChange={(
                event
              ) =>
                change(
                  'precioSinIva',
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              label="Precio C/IVA"
              type="number"
              value={
                form.precioConIva ??
                ''
              }
              onChange={(
                event
              ) =>
                change(
                  'precioConIva',
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              label="Stock"
              type="number"
              value={
                form.stock ?? ''
              }
              onChange={(
                event
              ) =>
                change(
                  'stock',
                  event.target.value
                )
              }
            />
          </Stack>

        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          disabled={saving}
          onClick={guardar}
        >
          {saving
            ? 'Guardando...'
            : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


/* =========================================================
   PRODUCTOS
========================================================= */

function ProductsView({
  products,
  refresh
}) {
  const [search, setSearch] =
    React.useState('');

  const [page, setPage] =
    React.useState(0);

  const [rows, setRows] =
    React.useState(25);

  const [
    selected,
    setSelected
  ] = React.useState(null);

  const [
    dialogOpen,
    setDialogOpen
  ] = React.useState(false);

  const filtered =
    React.useMemo(() => {
      const query =
        normalizeText(search);

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          normalizeText(
            `${product.codigo} ${product.nombre} ${product.presentacion} ${product.rubro}`
          ).includes(query)
      );
    }, [products, search]);

  const visible =
    filtered.slice(
      page * rows,
      page * rows + rows
    );

  return (
    <Stack spacing={2.5}>

      <Stack
        direction={{
          xs: 'column',
          md: 'row'
        }}
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={900}
          >
            Productos
          </Typography>

          <Typography
            color="text.secondary"
          >
            Buscá y modificá
            productos individualmente.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            <AddRoundedIcon />
          }
          onClick={() => {
            setSelected(null);
            setDialogOpen(true);
          }}
        >
          Nuevo producto
        </Button>
      </Stack>

      <TextField
        fullWidth
        placeholder="Buscar código, producto, presentación o rubro..."
        value={search}
        onChange={(event) => {
          setSearch(
            event.target.value
          );

          setPage(0);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon />
            </InputAdornment>
          )
        }}
      />

      <TableContainer
        component={Paper}
        variant="outlined"
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Código
              </TableCell>

              <TableCell>
                Producto
              </TableCell>

              <TableCell>
                Presentación
              </TableCell>

              <TableCell>
                Rubro
              </TableCell>

              <TableCell align="right">
                Precio S/IVA
              </TableCell>

              <TableCell align="right">
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visible.map(
              (product) => (
                <TableRow
                  key={product.id}
                  hover
                >
                  <TableCell>
                    <Chip
                      label={
                        product.codigo
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                    >
                      {
                        product.nombre
                      }
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {normalizePresentation(
                      product.presentacion
                    ) || '—'}
                  </TableCell>

                  <TableCell>
                    {product.rubro}
                  </TableCell>

                  <TableCell align="right">
                    <Typography
                      fontWeight={800}
                    >
                      {formatPrice(
                        finalSinIva(
                          product
                        )
                      )}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={
                        <EditRoundedIcon />
                      }
                      onClick={() => {
                        setSelected(
                          product
                        );

                        setDialogOpen(
                          true
                        );
                      }}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rows}
            onPageChange={(
              _,
              next
            ) =>
              setPage(next)
            }
            onRowsPerPageChange={(
              event
            ) => {
              setRows(
                Number(
                  event.target.value
                )
              );

              setPage(0);
            }}
            rowsPerPageOptions={[
              25,
              50,
              100
            ]}
          />
        </Table>
      </TableContainer>

      <ProductDialog
        open={dialogOpen}
        product={selected}
        onClose={() =>
          setDialogOpen(false)
        }
        onSaved={refresh}
      />

    </Stack>
  );
}


/* =========================================================
   IMPORTAR EXCEL
========================================================= */

function ImportView({
  products,
  refresh
}) {
  const [file, setFile] =
    React.useState(null);

  const [loading, setLoading] =
    React.useState(false);

  const [message, setMessage] =
    React.useState(null);

  const importar = async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const incoming =
        await parseExcel(
          file,
          products
        );

      /*
       * Lista nueva completa:
       * primero desactivamos
       * productos anteriores.
       */
      const {
        error:
          disableError
      } =
        await supabase
          .from('products')
          .update({
            activo: false,
            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'activo',
            true
          );

      if (disableError) {
        throw disableError;
      }

      for (
        const product of
        incoming
      ) {
        const row =
          toDatabase(
            product
          );

        if (product.id) {
          const {
            error
          } =
            await supabase
              .from(
                'products'
              )
              .update(row)
              .eq(
                'id',
                product.id
              );

          if (error) {
            throw error;
          }
        } else {
          const {
            error
          } =
            await supabase
              .from(
                'products'
              )
              .insert(row);

          if (error) {
            throw error;
          }
        }
      }

      await refresh();

      setMessage({
        type: 'success',

        text:
          `Lista actualizada correctamente. ` +
          `${incoming.length} productos procesados.`
      });

      setFile(null);
    } catch (err) {
      console.error(err);

      setMessage({
        type: 'error',

        text:
          err?.message ||
          'No se pudo importar el archivo.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          variant="h5"
          fontWeight={900}
        >
          Actualizar lista
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Cargá el Excel nuevo de
          POLCARFER. El sistema
          actualiza automáticamente
          la lista que ven los
          clientes.
        </Typography>
      </Box>

      {message && (
        <Alert
          severity={message.type}
        >
          {message.text}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{ p: 3 }}
      >
        <Stack spacing={2.5}>

          <Typography
            variant="h6"
          >
            Seleccionar lista
          </Typography>

          <Button
            component="label"
            variant="outlined"
            startIcon={
              <UploadFileRoundedIcon />
            }
            sx={{
              alignSelf:
                'flex-start'
            }}
          >
            {file
              ? file.name
              : 'Seleccionar Excel'}

            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={(
                event
              ) =>
                setFile(
                  event.target
                    .files?.[0] ||
                    null
                )
              }
            />
          </Button>

          <Divider />

          <Alert
            severity="info"
            variant="outlined"
          >
            Los códigos repetidos
            están permitidos. Cada
            producto utiliza su ID
            interno de Supabase.
          </Alert>

          <Button
            variant="contained"
            size="large"
            disabled={
              !file || loading
            }
            onClick={importar}
            sx={{
              alignSelf:
                'flex-start'
            }}
          >
            {loading
              ? 'Actualizando lista...'
              : 'Actualizar lista'}
          </Button>

        </Stack>
      </Paper>

      <Button
        variant="outlined"
        startIcon={
          <DownloadRoundedIcon />
        }
        sx={{
          alignSelf:
            'flex-start'
        }}
        onClick={() =>
          exportExcel(products)
        }
      >
        Exportar lista actual
      </Button>

    </Stack>
  );
}


/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function PartnerAccessView({
  products,
  onCatalogChanged
}) {
  const [
    checking,
    setChecking
  ] = React.useState(true);

  const [
    session,
    setSession
  ] = React.useState(null);

  const [tab, setTab] =
    React.useState('home');

  React.useEffect(() => {
    let active = true;

    async function check() {
      if (
        !isSupabaseConfigured
      ) {
        if (active) {
          setChecking(false);
        }

        return;
      }

      const {
        data
      } =
        await supabase.auth
          .getSession();

      if (
        !data.session
      ) {
        if (active) {
          setSession(null);
          setChecking(false);
        }

        return;
      }

      const socio =
        await comprobarSocio();

      if (
        active &&
        socio
      ) {
        setSession(
          data.session
        );
      } else {
        await supabase.auth.signOut();
      }

      if (active) {
        setChecking(false);
      }
    }

    check();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <Stack
        alignItems="center"
        sx={{ py: 12 }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (!session) {
    return (
      <LoginSocio
        onSuccess={(
          newSession
        ) =>
          setSession(
            newSession
          )
        }
      />
    );
  }

  return (
    <Stack spacing={3}>

      <Stack
        direction={{
          xs: 'column',
          md: 'row'
        }}
        justifyContent="space-between"
        alignItems={{
          md: 'center'
        }}
        gap={2}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
          >
            Sistema de socios
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Administración del
            catálogo POLCARFER.
          </Typography>
        </Box>

        <Button
          color="inherit"
          startIcon={
            <LogoutRoundedIcon />
          }
          onClick={async () => {
            await supabase.auth.signOut();

            setSession(null);
            setTab('home');
          }}
        >
          Cerrar sesión
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Tabs
          value={tab}
          onChange={(
            _,
            newValue
          ) =>
            setTab(newValue)
          }
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            value="home"
            label="Inicio"
          />

          <Tab
            value="products"
            label="Productos"
          />

          <Tab
            value="import"
            label="Actualizar lista"
          />
        </Tabs>
      </Paper>

      {tab === 'products' && (
        <ProductsView
          products={products}
          refresh={
            onCatalogChanged
          }
        />
      )}

      {tab === 'import' && (
        <ImportView
          products={products}
          refresh={
            onCatalogChanged
          }
        />
      )}

      {tab === 'home' && (
        <Stack spacing={2}>

          <Paper
            variant="outlined"
            sx={{ p: 3 }}
          >
            <Typography
              color="text.secondary"
            >
              Productos publicados
            </Typography>

            <Typography
              variant="h3"
              fontWeight={900}
              sx={{ mt: 1 }}
            >
              {products.length.toLocaleString(
                'es-AR'
              )}
            </Typography>
          </Paper>

          <Stack
            direction={{
              xs: 'column',
              md: 'row'
            }}
            spacing={2}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                flex: 1
              }}
            >
              <Typography
                variant="h6"
              >
                Gestionar productos
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                  mb: 2
                }}
              >
                Modificá precios,
                presentaciones,
                stock y demás datos.
              </Typography>

              <Button
                variant="contained"
                onClick={() =>
                  setTab(
                    'products'
                  )
                }
              >
                Ver productos
              </Button>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 3,
                flex: 1
              }}
            >
              <Typography
                variant="h6"
              >
                Nueva lista
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                  mb: 2
                }}
              >
                Importá directamente
                el nuevo Excel de
                POLCARFER.
              </Typography>

              <Button
                variant="outlined"
                onClick={() =>
                  setTab(
                    'import'
                  )
                }
              >
                Actualizar lista
              </Button>
            </Paper>
          </Stack>

        </Stack>
      )}

    </Stack>
  );
}