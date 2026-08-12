import fallback from '../data/productos.json';
import { supabase, isSupabaseConfigured } from './supabase.js';
import {
  fromDb,
  normalizeOffer,
  normalizeProduct,
  productIdentityKey,
  toDb
} from './catalogUtils.js';

export async function loadCatalog(){
  if(!isSupabaseConfigured){
    return {
      products:fallback.map((p,i)=>normalizeProduct({...p,id:`fallback-${i}`,offers:[]})),
      source:'Catálogo incluido'
    };
  }

  const {data,error}=await supabase
    .from('products')
    .select('*')
    .eq('activo',true)
    .order('codigo',{ascending:true})
    .order('nombre',{ascending:true});
  if(error) throw error;

  const products=(data||[]).map(fromDb);
  const offersByProduct=new Map();

  // No usamos .in() con los ~650 UUID del catálogo porque generaría una URL
  // innecesariamente grande. RLS ya limita qué ofertas puede ver el cliente.
  const {data:offerRows,error:offersError}=await supabase
    .from('product_offers')
    .select('*')
    .eq('activa',true)
    .order('cantidad_minima',{ascending:true,nullsFirst:true});

  // Permite desplegar el frontend antes de ejecutar la migración 06.
  // Una vez creada product_offers, cualquier otro error sí se informa.
  if(offersError && offersError.code!=='42P01') throw offersError;

  for(const row of offerRows||[]){
    const offer=normalizeOffer(row);
    if(!offersByProduct.has(row.product_id)) offersByProduct.set(row.product_id,[]);
    offersByProduct.get(row.product_id).push(offer);
  }

  return {
    products:products.map((product)=>({
      ...product,
      offers:offersByProduct.get(product.id)||[]
    })),
    source:'Catálogo en línea'
  };
}

export function subscribeCatalog(onChange){
  if(!isSupabaseConfigured) return ()=>{};
  const channel=supabase
    .channel('public-catalog')
    .on('postgres_changes',{event:'*',schema:'public',table:'products'},()=>onChange())
    .on('postgres_changes',{event:'*',schema:'public',table:'product_offers'},()=>onChange())
    .subscribe();
  return ()=>supabase.removeChannel(channel);
}

export async function signInPartner(email,password){
  if(!isSupabaseConfigured) throw new Error('La conexión con Supabase no está configurada.');
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error) throw error;
  const uid=data.user?.id;
  const {data:profile,error:profileError}=await supabase
    .from('profiles')
    .select('role,display_name')
    .eq('id',uid)
    .single();
  if(profileError||profile?.role!=='socio'){
    await supabase.auth.signOut();
    throw new Error('Esta cuenta no tiene permisos de socio.');
  }
  return {user:data.user,profile};
}

export async function getPartnerSession(){
  if(!isSupabaseConfigured) return null;
  const {data}=await supabase.auth.getSession();
  if(!data.session) return null;
  const {data:profile}=await supabase
    .from('profiles')
    .select('role,display_name')
    .eq('id',data.session.user.id)
    .single();
  if(profile?.role!=='socio') return null;
  return {user:data.session.user,profile};
}

export async function signOutPartner(){
  if(isSupabaseConfigured) await supabase.auth.signOut();
}

export async function upsertProduct(product){
  if(!isSupabaseConfigured) throw new Error('Supabase no está configurado.');
  const p=normalizeProduct({
    ...product,
    activo:true,
    descuento:0,
    precioSinIvaDescuento:0,
    precioConIvaDescuento:0
  });
  if(p.id){
    const {error}=await supabase.from('products').update(toDb(p,{includeId:false})).eq('id',p.id);
    if(error) throw error;
  }else{
    const draft=normalizeProduct({...p,id:null});
    const {error}=await supabase.from('products').insert(toDb(draft,{includeId:false}));
    if(error) throw error;
  }
}

export async function deleteProduct(id){
  if(!isSupabaseConfigured) throw new Error('Supabase no está configurado.');
  const {error}=await supabase
    .from('products')
    .update({activo:false,updated_at:new Date().toISOString()})
    .eq('id',id);
  if(error) throw error;
}

export async function replaceCatalogAtomic(analysis){
  if(!isSupabaseConfigured) throw new Error('Supabase no está configurado.');
  if(!analysis?.products?.length) throw new Error('No hay productos analizados para publicar.');

  const products=analysis.products.map((product)=>{
    const p=normalizeProduct({
      ...product,
      activo:true,
      descuento:0,
      precioSinIvaDescuento:0,
      precioConIvaDescuento:0
    });
    return {
      ...toDb(p,{includeId:false}),
      id:p.id||null,
      import_key:productIdentityKey(p)
    };
  });

  const offers=(analysis.offers||[]).map((offerRaw)=>{
    const offer=normalizeOffer(offerRaw);
    return {
      product_key:offer.productKey,
      condicion:offer.condicion,
      cantidad_minima:offer.cantidadMinima,
      descuento:offer.descuento,
      precio_lista_origen:offer.precioListaOrigen,
      precio_sin_iva:offer.precioSinIva,
      precio_con_iva:offer.precioConIva,
      requiere_revision:offer.requiereRevision,
      origen:offer.origen
    };
  });

  const {data,error}=await supabase.rpc('replace_catalog_atomic',{
    p_products:products,
    p_offers:offers
  });

  if(error) throw error;
  return data;
}
