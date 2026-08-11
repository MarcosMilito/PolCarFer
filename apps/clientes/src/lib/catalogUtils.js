import * as XLSX from 'xlsx';

export const IVA = 0.21;
export const CONTACT = {
  phone: '+54 9 11 2370-0742',
  whatsapp: '5491123700742',
  instagram: '@polcarfersrl',
  instagramUrl: 'https://instagram.com/polcarfersrl',
  email: 'polcarfer@outlook.com',
  address: 'Federico Chopin 458, Lomas de Zamora, Buenos Aires',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Federico+Chopin+458%2C+Lomas+de+Zamora%2C+Buenos+Aires'
};

export function normalizeText(value=''){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
export function parseNumber(value){
  if(typeof value==='number') return Number.isFinite(value)?value:0;
  let s=String(value??'').trim().replace(/\$/g,'').replace(/%/g,'').replace(/\s/g,'');
  if(!s) return 0;
  if(s.includes(',')&&s.includes('.')) s=s.replace(/\./g,'').replace(',','.'); else if(s.includes(',')) s=s.replace(',','.');
  s=s.replace(/[^\d.-]/g,''); return Number.parseFloat(s)||0;
}
export function normalizeDiscount(value){const n=parseNumber(value);return Math.max(0,n>1?n/100:n);}
export function detectRubro(nombre='',presentacion='',seccion=''){
 const t=`${nombre} ${presentacion} ${seccion}`.toUpperCase();
 if(/DISCO|AMOLADORA|TALADRO|ATORNILLADOR|SIERRA|MECHA|LIJADORA|DEMOL|FRESADORA|CALADORA|CEPILLO/.test(t)) return 'Herramientas eléctricas';
 if(/PINZA|ALICATE|LLAVE|DESTORNILLADOR|MARTILLO|CUTTER|TENAZA|SERRUCHO|MORSA|METRO|NIVEL/.test(t)) return 'Herramientas manuales';
 if(/TORNILLO|TARUGO|BULON|TUERCA|ARANDELA|CLAVO|REMACHE/.test(t)) return 'Bulonería y fijaciones';
 if(/CANDADO|CERRADURA|CERROJO|PASADOR|PICAPORTE|BISAGRA/.test(t)) return 'Herrajes y seguridad';
 if(/CABLE|ENCHUFE|TERMICA|TOMA|INTERRUPTOR|LAMPARA|PORTALAMPARA|PILA|BATERIA/.test(t)) return 'Electricidad';
 if(/PINTURA|PINCEL|RODILLO|ESPATULA|LIJA|THINNER/.test(t)) return 'Pinturería';
 if(/MANGUERA|GRIFERIA|CANILLA|TEFLON|SIFON|VALVULA|UNION|PLOMERIA|CAÑO|CANO|PVC/.test(t)) return 'Sanitaria';
 if(/ADHESIVO|SILICONA|PEGAMENTO|SELLADOR|MEMBRANA/.test(t)) return 'Adhesivos y selladores';
 if(/GUANTE|BARBIJO|LENTE|CASCO|PROTECTOR/.test(t)) return 'Seguridad';
 if(/LUBRICANTE|GRASA|CINTA/.test(t)) return 'Lubricantes y cintas';
 return 'General';
}
export function normalizeProduct(p={}){
 const descuento=normalizeDiscount(p.descuento||0);
 const sin=Number(p.precioSinIva??p.precio_sin_iva??p.precioLista??p.precio_lista??0)||0;
 const con=Number(p.precioConIva??p.precio_con_iva??0)||sin*(1+IVA);
 const sinDto=Number(p.precioSinIvaDescuento??p.precio_sin_iva_descuento??0)|| (descuento>0?sin*(1-descuento):0);
 const conDto=Number(p.precioConIvaDescuento??p.precio_con_iva_descuento??0)|| (descuento>0?con*(1-descuento):0);
 const stockRaw=p.stock;
 return {
  id:p.id?String(p.id):null,
  codigo:String(p.codigo||'').trim(), nombre:String(p.nombre||'').trim(), presentacion:String(p.presentacion||'').trim(), rubro:String(p.rubro||'').trim()||detectRubro(p.nombre,p.presentacion,p.seccion), seccion:String(p.seccion||'').trim(),
  precioLista:Number(p.precioLista??p.precio_lista??sin)||0, precioSinIva:sin, precioConIva:con, descuento, precioSinIvaDescuento:sinDto, precioConIvaDescuento:conDto, tieneDescuento:descuento>0,
  stock:stockRaw===null||stockRaw===undefined||stockRaw===''?null:Number(stockRaw), activo:p.activo!==false, origen:String(p.origen||'CATÁLOGO')
 };
}
export const finalSinIva=p=>p.tieneDescuento&&p.precioSinIvaDescuento>0?p.precioSinIvaDescuento:p.precioSinIva;
export const finalConIva=p=>p.tieneDescuento&&p.precioConIvaDescuento>0?p.precioConIvaDescuento:p.precioConIva;
export const formatPrice=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
export const formatDate=v=>v?new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'—';
export function fromDb(row){return normalizeProduct(row);}
export function exportExcel(products,filename='PolCarFer - Lista de Precios.xlsx'){
 const rows=products.map(p=>({'Código':p.codigo,'Producto':p.nombre,'Presentación':p.presentacion,'Rubro':p.rubro,'Sección':p.seccion,'Stock':p.stock??'','Precio de lista':p.precioLista,'Descuento %':Math.round(p.descuento*10000)/100,'Precio S/IVA':finalSinIva(p),'Precio C/IVA':finalConIva(p)}));
 const ws=XLSX.utils.json_to_sheet(rows); ws['!cols']=[{wch:16},{wch:58},{wch:20},{wch:26},{wch:34},{wch:12},{wch:16},{wch:14},{wch:16},{wch:16}]; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Lista de Precios'); XLSX.writeFile(wb,filename);
}
