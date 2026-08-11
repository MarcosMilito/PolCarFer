import fallback from '../data/productos.json';

import {
  supabase,
  isSupabaseConfigured
} from './supabase.js';

import {
  fromDb,
  normalizeProduct,
  toDb
} from './catalogUtils.js';

export async function loadCatalog() {
  if (!isSupabaseConfigured) {
    return {
      products: fallback.map(
        (product, index) =>
          normalizeProduct({
            ...product,
            id: `fallback-${index}`
          })
      ),
      source: 'Catálogo incluido'
    };
  }

  const {
    data,
    error
  } = await supabase
    .from('products')
    .select('*')
    .eq('activo', true)
    .order('codigo', {
      ascending: true
    })
    .order('nombre', {
      ascending: true
    });

  if (error) {
    throw error;
  }

  return {
    products: (data || []).map(
      fromDb
    ),
    source: 'Catálogo en línea'
  };
}

export function subscribeCatalog(
  onChange
) {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel =
    supabase
      .channel(
        'public-products'
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          onChange();
        }
      )
      .subscribe();

  return () =>
    supabase.removeChannel(
      channel
    );
}

export async function signInPartner(
  email,
  password
) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'La conexión con Supabase no está configurada.'
    );
  }

  const {
    data,
    error
  } =
    await supabase.auth.signInWithPassword(
      {
        email,
        password
      }
    );

  if (error) {
    throw error;
  }

  const userId =
    data.user?.id;

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from('profiles')
    .select(
      'role,display_name'
    )
    .eq('id', userId)
    .single();

  if (
    profileError ||
    profile?.role !== 'socio'
  ) {
    await supabase.auth.signOut();

    throw new Error(
      'Esta cuenta no tiene permisos de socio.'
    );
  }

  return {
    user: data.user,
    profile
  };
}

export async function getPartnerSession() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data } =
    await supabase.auth.getSession();

  if (!data.session) {
    return null;
  }

  const {
    data: profile
  } = await supabase
    .from('profiles')
    .select(
      'role,display_name'
    )
    .eq(
      'id',
      data.session.user.id
    )
    .single();

  if (
    profile?.role !== 'socio'
  ) {
    return null;
  }

  return {
    user:
      data.session.user,
    profile
  };
}

export async function signOutPartner() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

export async function upsertProduct(
  product
) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no está configurado.'
    );
  }

  const normalized =
    normalizeProduct({
      ...product,
      activo: true
    });

  if (normalized.id) {
    const { error } =
      await supabase
        .from('products')
        .update(
          toDb(normalized, {
            includeId: false
          })
        )
        .eq(
          'id',
          normalized.id
        );

    if (error) {
      throw error;
    }
  } else {
    const draft =
      normalizeProduct({
        ...normalized,
        id: null
      });

    const { error } =
      await supabase
        .from('products')
        .insert(
          toDb(draft, {
            includeId: false
          })
        );

    if (error) {
      throw error;
    }
  }
}

export async function deleteProduct(
  id
) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no está configurado.'
    );
  }

  const { error } =
    await supabase
      .from('products')
      .update({
        activo: false,
        updated_at:
          new Date().toISOString()
      })
      .eq('id', id);

  if (error) {
    throw error;
  }
}

function chunkRows(
  rows,
  size = 150
) {
  const groups = [];

  for (
    let index = 0;
    index < rows.length;
    index += size
  ) {
    groups.push(
      rows.slice(
        index,
        index + size
      )
    );
  }

  return groups;
}

export async function importCatalog(
  products,
  mode = 'replace'
) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no está configurado.'
    );
  }

  const rows =
    products.map((product) =>
      normalizeProduct({
        ...product,
        activo: true
      })
    );

  /*
   * Lista completa:
   * primero deja inactivos todos
   * los productos actuales.
   *
   * Los productos que aparezcan
   * nuevamente en el Excel se
   * reactivan debajo.
   */
  if (mode === 'replace') {
    const { error } =
      await supabase
        .from('products')
        .update({
          activo: false,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          'activo',
          true
        );

    if (error) {
      throw error;
    }
  }

  /*
   * Productos reconocidos:
   * ya tienen un UUID interno.
   */
  const existing =
    rows.filter(
      (product) =>
        product.id
    );

  /*
   * Productos nuevos:
   * Supabase genera automáticamente
   * el UUID.
   */
  const fresh =
    rows
      .filter(
        (product) =>
          !product.id
      )
      .map(
        (product) => ({
          ...product,
          id: null
        })
      );

  for (
    const group of
    chunkRows(existing)
  ) {
    const { error } =
      await supabase
        .from('products')
        .upsert(
          group.map(
            (product) =>
              toDb(
                product,
                {
                  includeId: true
                }
              )
          ),
          {
            onConflict: 'id'
          }
        );

    if (error) {
      throw error;
    }
  }

  for (
    const group of
    chunkRows(fresh)
  ) {
    const { error } =
      await supabase
        .from('products')
        .insert(
          group.map(
            (product) =>
              toDb(
                product,
                {
                  includeId: false
                }
              )
          )
        );

    if (error) {
      throw error;
    }
  }
}