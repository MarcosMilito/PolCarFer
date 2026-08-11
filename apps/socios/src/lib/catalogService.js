import fallback from '../data/productos.json';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { fromDb, normalizeProduct, toDb } from './catalogUtils.js';

const DEV_KEY='polcarfer_dev_products_v3';
const localSeed=()=>fallback.map((p,i)=>normalizeProduct({...p,id:`local-${i}`,activo:true}));
function localLoad(){try{const x=JSON.parse(localStorage.getItem(DEV_KEY)||'null');return Array.isArray(x)?x.map(normalizeProduct):localSeed()}catch{return localSeed()}}
function localSave(rows){localStorage.setItem(DEV_KEY,JSON.stringify(rows));return rows;}
function localNewId(){return globalThis.crypto?.randomUUID?.()||`local-${Date.now()}-${Math.random().toString(36).slice(2)}`;}

export async function loadCatalog(){if(!isSupabaseConfigured)return {products:localLoad().filter(p=>p.activo!==false),source:'Modo local'};const {data,error}=await supabase.from('products').select('*').eq('activo',true).order('codigo').order('nombre');if(error)throw error;return {products:(data||[]).map(fromDb),source:'Base en línea'};}
export async function signIn(email,password){if(!isSupabaseConfigured){if(import.meta.env.DEV&&email==='socio'&&password==='polcarfer-demo')return {demo:true};throw new Error('El acceso privado todavía no está configurado.');}const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;const uid=data.user?.id;const {data:profile,error:profileError}=await supabase.from('profiles').select('role,display_name').eq('id',uid).single();if(profileError||profile?.role!=='socio'){await supabase.auth.signOut();throw new Error('Esta cuenta no tiene permisos de socio.');}return {user:data.user,profile};}
export async function getSession(){if(!isSupabaseConfigured)return null;const {data}=await supabase.auth.getSession();if(!data.session)return null;const {data:profile}=await supabase.from('profiles').select('role,display_name').eq('id',data.session.user.id).single();if(profile?.role!=='socio')return null;return {user:data.session.user,profile};}
export async function signOut(){if(isSupabaseConfigured)await supabase.auth.signOut();}

export async function upsertProduct(product){
 if(!isSupabaseConfigured){const rows=localLoad();const p=normalizeProduct({...product,id:product.id||localNewId(),activo:true});const idx=rows.findIndex(x=>x.id===p.id);if(idx>=0)rows[idx]=p;else rows.push(p);localSave(rows);return;}
 const p=normalizeProduct({...product,activo:true});
 if(p.id){const {error}=await supabase.from('products').update(toDb(p,{includeId:false})).eq('id',p.id);if(error)throw error;}
 else {const {error}=await supabase.from('products').insert(toDb(p,{includeId:false}));if(error)throw error;}
}
export async function deleteProduct(id){
 if(!isSupabaseConfigured){localSave(localLoad().map(x=>x.id===id?{...x,activo:false}:x));return;}
 const {error}=await supabase.from('products').update({activo:false,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;
}
function chunkRows(rows,size=200){const arr=[];for(let i=0;i<rows.length;i+=size)arr.push(rows.slice(i,i+size));return arr;}
export async function importCatalog(products,mode='replace'){
 const rows=products.map(p=>normalizeProduct({...p,activo:true}));
 if(!isSupabaseConfigured){
   const current=localLoad();
   if(mode==='replace') current.forEach(p=>p.activo=false);
   for(const p of rows){const item={...p,id:p.id||localNewId(),activo:true};const idx=current.findIndex(x=>x.id===item.id);if(idx>=0)current[idx]=item;else current.push(item);}
   localSave(current);return;
 }
 if(mode==='replace'){
   const {error}=await supabase.from('products').update({activo:false,updated_at:new Date().toISOString()}).eq('activo',true);
   if(error)throw error;
 }
 const existing=rows.filter(p=>p.id);
 const fresh=rows.filter(p=>!p.id);
 for(const group of chunkRows(existing)){
   const {error}=await supabase.from('products').upsert(group.map(p=>toDb(p,{includeId:true})),{onConflict:'id'});
   if(error)throw error;
 }
 for(const group of chunkRows(fresh)){
   const {error}=await supabase.from('products').insert(group.map(p=>toDb(p,{includeId:false})));
   if(error)throw error;
 }
}
