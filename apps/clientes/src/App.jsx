import React from 'react';

import {
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';

import AppShell from './components/AppShell.jsx';
import HomeView from './components/HomeView.jsx';
import PriceListView from './components/PriceListView.jsx';
import OrdersView from './components/OrdersView.jsx';
import ContactView from './components/ContactView.jsx';
import PartnerAccessView from './components/PartnerAccessView.jsx';

import {
  loadCatalog,
  subscribeCatalog
} from './lib/catalogService.js';

const VALID_VIEWS = [
  'home',
  'prices',
  'orders',
  'contact',
  'partner'
];

function getViewFromHash() {
  const hash =
    window.location.hash
      .replace('#', '')
      .trim();

  return VALID_VIEWS.includes(hash)
    ? hash
    : 'home';
}

export default function App() {
  const [view, setView] =
    React.useState(
      getViewFromHash
    );

  const [
    products,
    setProducts
  ] = React.useState([]);

  const [
    source,
    setSource
  ] = React.useState('');

  const [
    loading,
    setLoading
  ] = React.useState(true);

  const [
    error,
    setError
  ] = React.useState('');

  const [cart, setCart] =
    React.useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(
            'polcarfer_cart_react'
          ) || '[]'
        );
      } catch {
        return [];
      }
    });

  const refresh =
    React.useCallback(
      async () => {
        try {
          const result =
            await loadCatalog();

          setProducts(
            result.products
          );

          setSource(
            result.source
          );

          setError('');
        } catch (err) {
          console.error(err);

          setError(
            err.message ||
              'Error de conexión'
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /*
   * MUY IMPORTANTE:
   *
   * React escucha los cambios
   * de #home, #prices,
   * #partner, etc.
   */
  React.useEffect(() => {
    const handleHashChange =
      () => {
        setView(
          getViewFromHash()
        );
      };

    window.addEventListener(
      'hashchange',
      handleHashChange
    );

    handleHashChange();

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange
      );
    };
  }, []);

  React.useEffect(() => {
    refresh();

    const stop =
      subscribeCatalog(
        refresh
      );

    const onVisible = () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        refresh();
      }
    };

    document.addEventListener(
      'visibilitychange',
      onVisible
    );

    return () => {
      stop();

      document.removeEventListener(
        'visibilitychange',
        onVisible
      );
    };
  }, [refresh]);

  React.useEffect(() => {
    localStorage.setItem(
      'polcarfer_cart_react',
      JSON.stringify(cart)
    );
  }, [cart]);

  const go = (id) => {
    if (
      !VALID_VIEWS.includes(id)
    ) {
      return;
    }

    const newHash =
      `#${id}`;

    if (
      window.location.hash ===
      newHash
    ) {
      setView(id);
    } else {
      window.location.hash =
        newHash;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  let body;

  if (loading) {
    body = (
      <Stack
        alignItems="center"
        sx={{ py: 12 }}
      >
        <CircularProgress />
      </Stack>
    );
  } else if (
    view === 'prices'
  ) {
    body = (
      <PriceListView
        products={products}
      />
    );
  } else if (
    view === 'orders'
  ) {
    body = (
      <OrdersView
        products={products}
        cart={cart}
        setCart={setCart}
      />
    );
  } else if (
    view === 'contact'
  ) {
    body = <ContactView />;
  } else if (
    view === 'partner'
  ) {
    body = (
      <PartnerAccessView
        products={products}
        onCatalogChanged={
          refresh
        }
      />
    );
  } else {
    body = (
      <HomeView
        onNavigate={go}
        count={
          products.length
        }
        source={source}
        error={error}
      />
    );
  }

  return (
    <AppShell
      view={view}
      onViewChange={go}
      cartCount={cart.reduce(
        (total, item) =>
          total +
          Number(
            item.cantidad ||
              0
          ),
        0
      )}
    >
      {error &&
        view !== 'home' && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

      {body}
    </AppShell>
  );
}