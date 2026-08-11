import React from 'react';
import {
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';

import AppShell from './components/AppShell.jsx';
import HomeView from './components/HomeView.jsx';
import {
  loadCatalog,
  subscribeCatalog
} from './lib/catalogService.js';

// Las vistas secundarias se descargan solo cuando el usuario las abre.
const PriceListView = React.lazy(() => import('./components/PriceListView.jsx'));
const OrdersView = React.lazy(() => import('./components/OrdersView.jsx'));
const ContactView = React.lazy(() => import('./components/ContactView.jsx'));
const PartnerAccessView = React.lazy(() => import('./components/PartnerAccessView.jsx'));

const VALID_VIEWS = new Set([
  'home',
  'prices',
  'orders',
  'contact',
  'partner'
]);

function ViewLoading() {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320, py: 8 }}>
      <CircularProgress size={34} />
    </Stack>
  );
}

export default function App() {
  const [view, setView] = React.useState('home');
  const [products, setProducts] = React.useState([]);
  const [source, setSource] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [cart, setCart] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('polcarfer_cart_react') || '[]');
    } catch {
      return [];
    }
  });

  const refresh = React.useCallback(async () => {
    try {
      const result = await loadCatalog();
      setProducts(result.products);
      setSource(result.source);
      setError('');
    } catch (err) {
      console.error('Error catálogo POLCARFER:', err);
      setError(err?.message || 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const stop = subscribeCatalog(refresh);
    return () => {
      if (stop) stop();
    };
  }, [refresh]);

  React.useEffect(() => {
    localStorage.setItem('polcarfer_cart_react', JSON.stringify(cart));
  }, [cart]);

  const go = React.useCallback((nextView) => {
    if (!VALID_VIEWS.has(nextView)) return;
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  let body;

  if (loading) {
    body = <ViewLoading />;
  } else if (view === 'prices') {
    body = <PriceListView products={products} />;
  } else if (view === 'orders') {
    body = <OrdersView products={products} cart={cart} setCart={setCart} />;
  } else if (view === 'contact') {
    body = <ContactView />;
  } else if (view === 'partner') {
    body = <PartnerAccessView products={products} onCatalogChanged={refresh} />;
  } else {
    body = (
      <HomeView
        onNavigate={go}
        count={products.length}
        source={source}
        error={error}
      />
    );
  }

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );

  return (
    <AppShell view={view} onViewChange={go} cartCount={cartCount}>
      {error && view !== 'home' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <React.Suspense fallback={<ViewLoading />}>
        {body}
      </React.Suspense>
    </AppShell>
  );
}
