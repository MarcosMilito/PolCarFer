import React from 'react';
import { Alert, CircularProgress, Snackbar, Stack } from '@mui/material';
import LoginView from './components/LoginView.jsx';
import PartnerShell from './components/PartnerShell.jsx';
import PartnerHome from './components/PartnerHome.jsx';
import ProductsView from './components/ProductsView.jsx';
import ImportView from './components/ImportView.jsx';
import { deleteProduct, getSession, importCatalog, loadCatalog, signIn, signOut, upsertProduct } from './lib/catalogService.js';

export default function App(){
 const [session,setSession]=React.useState(undefined);const [tab,setTab]=React.useState('home');const [products,setProducts]=React.useState([]);const [source,setSource]=React.useState('');const [loginError,setLoginError]=React.useState('');const [busy,setBusy]=React.useState(false);const [toast,setToast]=React.useState('');const [lastUpdate,setLastUpdate]=React.useState(null);
 const refresh=React.useCallback(async()=>{const r=await loadCatalog();setProducts(r.products);setSource(r.source)},[]);
 React.useEffect(()=>{getSession().then(s=>setSession(s||null)).catch(()=>setSession(null))},[]);
 React.useEffect(()=>{if(session)refresh()},[session,refresh]);
 const login=async(email,password)=>{setBusy(true);setLoginError('');try{const s=await signIn(email,password);setSession(s);await refresh()}catch(e){setLoginError(e.message||'No se pudo ingresar.')}finally{setBusy(false)}};
 const logout=async()=>{await signOut();setSession(null);setProducts([])};
 const save=async p=>{setBusy(true);try{await upsertProduct(p);await refresh();setLastUpdate(new Date().toISOString());setToast('Producto guardado.')}finally{setBusy(false)}};
 const remove=async id=>{setBusy(true);try{await deleteProduct(id);await refresh();setLastUpdate(new Date().toISOString());setToast('Producto eliminado.')}finally{setBusy(false)}};
 const doImport=async(rows,mode)=>{setBusy(true);try{await importCatalog(rows,mode);await refresh();setLastUpdate(new Date().toISOString());setToast('Lista actualizada correctamente.')}finally{setBusy(false)}};
 if(session===undefined)return <Stack alignItems="center" sx={{py:15}}><CircularProgress/></Stack>;
 if(!session)return <LoginView onLogin={login} loading={busy} error={loginError}/>;
 const body=tab==='products'?<ProductsView products={products} onSave={save} onDelete={remove}/>:tab==='import'?<ImportView products={products} onImport={doImport}/>:<PartnerHome products={products} setTab={setTab} source={source} lastUpdate={lastUpdate}/>;
 return <PartnerShell tab={tab} setTab={setTab} onLogout={logout} user={session}>{busy&&<Alert severity="info" sx={{mb:2}}>Procesando cambios…</Alert>}{body}<Snackbar open={Boolean(toast)} autoHideDuration={2800} onClose={()=>setToast('')} message={toast}/></PartnerShell>;
}
