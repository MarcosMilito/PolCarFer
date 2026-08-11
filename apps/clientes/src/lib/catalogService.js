import fallback from '../data/productos.json';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { fromDb, normalizeProduct } from './catalogUtils.js';

export async function loadCatalog(){
 if(!isSupabaseConfigured) return {products:fallback.map((p,i)=>normalizeProduct({...p,id:`fallback-${i}`})),source:'Catálogo incluido'};
 const {data,error}=await supabase.from('products').select('*').eq('activo',true).order('codigo',{ascending:true}).order('nombre',{ascending:true});
 if(error) throw error;
 return {products:(data||[]).map(fromDb),source:'Catálogo en línea'};
}
export function subscribeCatalog(onChange){
 if(!isSupabaseConfigured) return ()=>{};
 const channel=supabase.channel('public-products').on('postgres_changes',{event:'*',schema:'public',table:'products'},()=>onChange()).subscribe();
 return ()=>supabase.removeChannel(channel);
}
