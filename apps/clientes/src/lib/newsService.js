import { supabase, isSupabaseConfigured } from './supabase.js';

export const NEWS_BUCKET = 'novedades';
export const MAX_NEWS_IMAGE_BYTES = 5 * 1024 * 1024;

function ensureConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado.');
  }
}

function normalizeNews(row) {
  return {
    id: row.id,
    titulo: row.titulo || '',
    descripcion: row.descripcion || '',
    imagenUrl: row.imagen_url || '',
    imagenPath: row.imagen_path || '',
    activo: row.activo !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function loadPublicNews() {
  ensureConfigured();

  const { data, error } = await supabase
    .from('novedades')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeNews);
}

export async function loadAdminNews() {
  ensureConfigured();

  const { data, error } = await supabase
    .from('novedades')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeNews);
}

export function subscribeNews(onChange) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('polcarfer-novedades')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'novedades'
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

function validateImage(file) {
  if (!file) throw new Error('Seleccioná una imagen.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('La imagen debe ser JPG, PNG o WEBP.');
  }

  if (file.size > MAX_NEWS_IMAGE_BYTES) {
    throw new Error('La imagen no puede superar los 5 MB.');
  }
}

function extensionFor(file) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function createNews({ titulo, descripcion, file }) {
  ensureConfigured();
  validateImage(file);

  const cleanTitle = String(titulo || '').trim();
  if (!cleanTitle) throw new Error('Escribí un título para la novedad.');

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('La sesión del socio no es válida.');
  }

  const unique =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const path = `${user.id}/${unique}.${extensionFor(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(NEWS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage
    .from(NEWS_BUCKET)
    .getPublicUrl(path);

  const imagenUrl = publicData?.publicUrl;

  if (!imagenUrl) {
    await supabase.storage.from(NEWS_BUCKET).remove([path]);
    throw new Error('No se pudo generar la URL pública de la imagen.');
  }

  const { data, error } = await supabase
    .from('novedades')
    .insert({
      titulo: cleanTitle,
      descripcion: String(descripcion || '').trim(),
      imagen_url: imagenUrl,
      imagen_path: path,
      activo: true,
      creado_por: user.id
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(NEWS_BUCKET).remove([path]);
    throw error;
  }

  return normalizeNews(data);
}

export async function setNewsActive(id, activo) {
  ensureConfigured();

  const { error } = await supabase
    .from('novedades')
    .update({
      activo: Boolean(activo),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteNews(item) {
  ensureConfigured();

  const { error } = await supabase
    .from('novedades')
    .delete()
    .eq('id', item.id);

  if (error) throw error;

  if (item.imagenPath) {
    const { error: storageError } = await supabase.storage
      .from(NEWS_BUCKET)
      .remove([item.imagenPath]);

    if (storageError) {
      console.warn('La novedad se eliminó, pero quedó una imagen huérfana en Storage:', storageError);
    }
  }
}
