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
      products:
        fallback.map(
          (
            product,
            index
          ) =>
            normalizeProduct({
              ...product,
              id:
                `fallback-${index}`
            })
        ),

      source:
        'Catálogo incluido'
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
    products:
      (data || []).map(
        fromDb
      ),

    source:
      'Catálogo en línea'
  };
}

export function subscribeCatalog(
  onChange
) {
  if (
    !isSupabaseConfigured
  ) {
    return () => {};
  }

  const channel =
    supabase
      .channel(
        'polcarfer-products'
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

  return () => {
    supabase.removeChannel(
      channel
    );
  };
}

function translateLoginError(
  error
) {
  const message =
    String(
      error?.message || ''
    ).toLowerCase();

  if (
    message.includes(
      'invalid login credentials'
    )
  ) {
    return (
      'El email o la contraseña son incorrectos.'
    );
  }

  if (
    message.includes(
      'email not confirmed'
    )
  ) {
    return (
      'El usuario todavía no tiene el email confirmado en Supabase.'
    );
  }

  if (
    message.includes(
      'fetch'
    )
  ) {
    return (
      'No se pudo conectar con Supabase.'
    );
  }

  return (
    error?.message ||
    'No se pudo iniciar sesión.'
  );
}

export async function signInPartner(
  email,
  password
) {
  if (
    !isSupabaseConfigured
  ) {
    throw new Error(
      'La conexión con Supabase no está configurada.'
    );
  }

  const cleanEmail =
    String(email || '')
      .trim()
      .toLowerCase();

  if (
    !cleanEmail ||
    !password
  ) {
    throw new Error(
      'Ingresá el email y la contraseña.'
    );
  }

  const {
    data,
    error
  } =
    await supabase.auth
      .signInWithPassword({
        email: cleanEmail,
        password
      });

  if (error) {
    throw new Error(
      translateLoginError(
        error
      )
    );
  }

  if (!data.session) {
    throw new Error(
      'Supabase no devolvió una sesión válida.'
    );
  }

  /*
   * Usamos la función segura
   * que ya existe en la base.
   */
  const {
    data: isSocio,
    error: roleError
  } =
    await supabase.rpc(
      'is_socio'
    );

  if (
    roleError ||
    isSocio !== true
  ) {
    await supabase.auth.signOut();

    throw new Error(
      'El usuario existe, pero no tiene permiso de socio.'
    );
  }

  return {
    user: data.user,
    session:
      data.session,
    profile: {
      role: 'socio'
    }
  };
}

export async function getPartnerSession() {
  if (
    !isSupabaseConfigured
  ) {
    return null;
  }

  const {
    data,
    error
  } =
    await supabase.auth
      .getSession();

  if (
    error ||
    !data.session
  ) {
    return null;
  }

  const {
    data: isSocio,
    error: roleError
  } =
    await supabase.rpc(
      'is_socio'
    );

  if (
    roleError ||
    isSocio !== true
  ) {
    await supabase.auth.signOut();

    return null;
  }

  return {
    user:
      data.session.user,

    session:
      data.session,

    profile: {
      role: 'socio'
    }
  };
}

export async function signOutPartner() {
  if (
    isSupabaseConfigured
  ) {
    await supabase.auth.signOut();
  }
}

export async function upsertProduct(
  product
) {
  if (
    !isSupabaseConfigured
  ) {
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
    const {
      error
    } = await supabase
      .from('products')
      .update(
        toDb(
          normalized,
          {
            includeId:
              false
          }
        )
      )
      .eq(
        'id',
        normalized.id
      );

    if (error) {
      throw error;
    }

    return;
  }

  const {
    error
  } = await supabase
    .from('products')
    .insert(
      toDb(
        normalized,
        {
          includeId: false
        }
      )
    );

  if (error) {
    throw error;
  }
}

export async function deleteProduct(
  id
) {
  if (
    !isSupabaseConfigured
  ) {
    throw new Error(
      'Supabase no está configurado.'
    );
  }

  const {
    error
  } = await supabase
    .from('products')
    .update({
      activo: false,
      updated_at:
        new Date()
          .toISOString()
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

function chunks(
  rows,
  size = 150
) {
  const result = [];

  for (
    let index = 0;
    index < rows.length;
    index += size
  ) {
    result.push(
      rows.slice(
        index,
        index + size
      )
    );
  }

  return result;
}

export async function importCatalog(
  products,
  mode = 'replace'
) {
  if (
    !isSupabaseConfigured
  ) {
    throw new Error(
      'Supabase no está configurado.'
    );
  }

  const rows =
    products.map(
      (product) =>
        normalizeProduct({
          ...product,
          activo: true
        })
    );

  if (
    mode === 'replace'
  ) {
    const {
      error
    } = await supabase
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

    if (error) {
      throw error;
    }
  }

  const existing =
    rows.filter(
      (product) =>
        product.id
    );

  const newProducts =
    rows.filter(
      (product) =>
        !product.id
    );

  for (
    const group of
    chunks(existing)
  ) {
    const {
      error
    } = await supabase
      .from('products')
      .upsert(
        group.map(
          (product) =>
            toDb(
              product,
              {
                includeId:
                  true
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
    chunks(newProducts)
  ) {
    const {
      error
    } = await supabase
      .from('products')
      .insert(
        group.map(
          (product) =>
            toDb(
              product,
              {
                includeId:
                  false
              }
            )
        )
      );

    if (error) {
      throw error;
    }
  }
}