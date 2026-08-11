import React from 'react';
import { Alert, CircularProgress, Stack } from '@mui/material';
import AppShell from './components/AppShell.jsx';
import HomeView from './components/HomeView.jsx';
import PriceListView from './components/PriceListView.jsx';
import OrdersView from './components/OrdersView.jsx';
import ContactView from './components/ContactView.jsx';
import { loadCatalog, subscribeCatalog } from './lib/catalogService.js';

export default function App(){
 const [view,setView]=React.useState(()=>location.hash.replace('#','')||'home'); const [products,setProducts]=React.useState([]);const [source,setSource]=React.useState('');const [loading,setLoading]=React.useState(true);const [error,setError]=React.useState('');const [cart,setCart]=React.useState(()=>{try{return JSON.parse(localStorage.getItem('polcarfer_cart_react')||'[]')}catch{return []}});
 const refresh=React.useCallback(async()=>{try{const r=await loadCatalog();setProducts(r.products);setSource(r.source);setError('')}catch(e){setError(e.message||'Error de conexión')}finally{setLoading(false)}},[]);
 React.useEffect(()=>{refresh();const stop=subscribeCatalog(refresh);const onVisible=()=>{if(document.visibilityState==='visible')refresh()};document.addEventListener('visibilitychange',onVisible);return()=>{stop();document.removeEventListener('visibilitychange',onVisible)}},[refresh]);
 React.useEffect(()=>localStorage.setItem('polcarfer_cart_react',JSON.stringify(cart)),[cart]);
 const go=id=>{setView(id);history.replaceState(null,'',`#${id}`);window.scrollTo({top:0,behavior:'smooth'})};
 const body=loading?<Stack alignItems="center" sx={{py:12}}><CircularProgress/></Stack>:view==='prices'?<PriceListView products={products}/>:view==='orders'?<OrdersView products={products} cart={cart} setCart={setCart}/>:view==='contact'?<ContactView/>:<HomeView onNavigate={go} count={products.length} source={source} error={error}/>;
 return <AppShell view={view} onViewChange={go} cartCount={cart.reduce((a,b)=>a+b.cantidad,0)}>{error&&view!=='home'&&<Alert severity="warning" sx={{mb:2}}>{error}</Alert>}{body}</AppShell>;
}
