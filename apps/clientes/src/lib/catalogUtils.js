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

export function normalizeText(value=''){
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .trim();
}

export function parseNumber(value){
  if(typeof value==='number') return Number.isFinite(value)?value:0;
  let s=String(value??'').trim().replace(/\$/g,'').replace(/%/g,'').replace(/\s/g,'');
  if(!s) return 0;
  if(s.includes(',')&&s.includes('.')) s=s.replace(/\./g,'').replace(',','.');
  else if(s.includes(',')) s=s.replace(',','.');
  s=s.replace(/[^\d.-]/g,'');
  return Number.parseFloat(s)||0;
}

export function normalizeDiscount(value){
  const n=parseNumber(value);
  return Math.max(0,n>1?n/100:n);
}

function quantityLabel(value){
  const n=parseNumber(value);
  if(!Number.isFinite(n)||n<=0) return '';
  const shown=Number.isInteger(n)?String(n):String(n).replace('.',',');
  return `${shown} ${n===1?'unidad':'unidades'}`;
}

/**
 * Normaliza únicamente presentaciones que representan cantidad pura.
 * Ejemplos:
 *  "12" -> "12 unidades"
 *  "1" -> "1 unidad"
 *  "UNIDAD" -> "1 unidad"
 *  "12 UNIDADES" -> "12 unidades"
 *  "12 UNIDADES 12 UNIDADES" -> "12 unidades"
 *  "12 UNIDADES 18 UNIDADES" -> "12 / 18 unidades"
 *
 * Si hay medidas o información comercial adicional, la conserva:
 *  "6 UNIDADES 22 MM X 1,20 MTS" queda igual.
 */
export function normalizePresentation(value=''){
  let s=String(value??'').trim().replace(/\s+/g,' ');
  if(!s) return '';

  const upper=s.toUpperCase();

  if(/^\d+(?:[.,]\d+)?$/.test(s)) return quantityLabel(s);

  if(/^UNIDAD\.?$/.test(upper)) return '1 unidad';
  if(/^UNIDADES\.?$/.test(upper)) return 'Unidades';

  const simple=upper.match(/^(\d+(?:[.,]\d+)?)\s*(?:U|UN|UNID|UNIDAD|UNIDADES)\.?$/);
  if(simple) return quantityLabel(simple[1]);

  // Solo actúa cuando TODA la celda son bloques "N UNIDAD/ES".
  // No toca textos que además contienen medidas, cajas, cartuchos, etc.
  if(/^(?:\d+(?:[.,]\d+)?\s+UNIDADES?\s*)+$/i.test(s)){
    const quantities=[...s.matchAll(/(\d+(?:[.,]\d+)?)\s+UNIDADES?/gi)]
      .map(m=>m[1]);
    const unique=[...new Set(quantities.map(q=>String(q).replace('.',',')))];
    if(unique.length===1) return quantityLabel(unique[0]);
    if(unique.length>1) return `${unique.join(' / ')} unidades`;
  }

  return s;
}

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
 const sinDto=Number(p.precioSinIvaDescuento??p.precio_sin_iva_descuento??0)||(descuento>0?sin*(1-descuento):0);
 const conDto=Number(p.precioConIvaDescuento??p.precio_con_iva_descuento??0)||(descuento>0?con*(1-descuento):0);
 const stockRaw=p.stock;
 const presentacion=normalizePresentation(p.presentacion);
 return {
  id:p.id?String(p.id):null,
  codigo:String(p.codigo||'').trim(),
  nombre:String(p.nombre||'').trim(),
  presentacion,
  rubro:String(p.rubro||'').trim()||detectRubro(p.nombre,presentacion,p.seccion),
  seccion:String(p.seccion||'').trim(),
  precioLista:Number(p.precioLista??p.precio_lista??sin)||0,
  precioSinIva:sin,
  precioConIva:con,
  descuento,
  precioSinIvaDescuento:sinDto,
  precioConIvaDescuento:conDto,
  tieneDescuento:descuento>0,
  stock:stockRaw===null||stockRaw===undefined||stockRaw===''?null:Number(stockRaw),
  activo:p.activo!==false,
  origen:String(p.origen||'CATÁLOGO')
 };
}

export const finalSinIva=p=>p.tieneDescuento&&p.precioSinIvaDescuento>0?p.precioSinIvaDescuento:p.precioSinIva;
export const finalConIva=p=>p.tieneDescuento&&p.precioConIvaDescuento>0?p.precioConIvaDescuento:p.precioConIva;
export const formatPrice=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
export const formatDate=v=>v?new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'—';

export function productIdentityKey(p={}){
 return [p.codigo,p.nombre,normalizePresentation(p.presentacion)].map(normalizeText).join('|');
}

export function toDb(p,{includeId=true}={}){
 p=normalizeProduct(p);
 const row={
  codigo:p.codigo,
  nombre:p.nombre,
  presentacion:p.presentacion,
  rubro:p.rubro,
  seccion:p.seccion,
  precio_lista:p.precioLista,
  precio_sin_iva:p.precioSinIva,
  precio_con_iva:p.precioConIva,
  descuento:p.descuento,
  precio_sin_iva_descuento:p.precioSinIvaDescuento,
  precio_con_iva_descuento:p.precioConIvaDescuento,
  stock:p.stock,
  activo:p.activo!==false,
  origen:p.origen,
  updated_at:new Date().toISOString()
 };
 if(includeId&&p.id) row.id=p.id;
 return row;
}

export function fromDb(row){return normalizeProduct(row);}

function findHeader(raw,names){
 const h=(raw[0]||[]).map(normalizeText);
 return h.findIndex(cell=>names.some(n=>cell===normalizeText(n)));
}

function buildCandidateMaps(products){
 const byId=new Map();
 const byExact=new Map();
 const byCodePresentation=new Map();
 const byCodeName=new Map();
 const byCode=new Map();
 const add=(map,key,p)=>{
  if(!map.has(key)) map.set(key,[]);
  map.get(key).push(p);
 };
 for(const p of products){
  if(p.id) byId.set(String(p.id),p);
  add(byExact,productIdentityKey(p),p);
  add(byCodePresentation,[p.codigo,normalizePresentation(p.presentacion)].map(normalizeText).join('|'),p);
  add(byCodeName,[p.codigo,p.nombre].map(normalizeText).join('|'),p);
  add(byCode,normalizeText(p.codigo),p);
 }
 return {byId,byExact,byCodePresentation,byCodeName,byCode};
}

function firstUnused(list=[],usedIds){
 return list.find(p=>p.id&&!usedIds.has(String(p.id)))||null;
}

export async function parseExcel(file,currentProducts=[]){
 const buffer=await file.arrayBuffer();
 const wb=XLSX.read(buffer,{type:'array'});
 const sheetName=wb.SheetNames.find(n=>normalizeText(n)==='lista de precios')||wb.SheetNames[0];
 if(!sheetName) throw new Error('El archivo no contiene hojas.');
 const raw=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:''});
 if(!raw.length) throw new Error('La hoja está vacía.');

 const systemId=findHeader(raw,['ID Sistema','ID interno','System ID']);
 const code=findHeader(raw,['Código','Codigo']);
 const name=findHeader(raw,['Producto','Nombre','Descripción','Descripcion']);
 const pres=findHeader(raw,['Presentación','Presentacion']);
 const rubro=findHeader(raw,['Rubro','Categoría','Categoria']);
 const section=findHeader(raw,['Sección','Seccion']);
 const stock=findHeader(raw,['Stock','Existencia','Existencias']);
 const list=findHeader(raw,['Precio de lista','Precio lista']);
 const disc=findHeader(raw,['Descuento']);
 const sin=findHeader(raw,['Precio S/IVA','Precio S IVA','Precio sin IVA']);
 const con=findHeader(raw,['Precio C/IVA','Precio C IVA','Precio con IVA']);

 if(code<0||name<0||(list<0&&sin<0)){
  throw new Error('El Excel debe tener Código, Producto y Precio de lista o Precio S/IVA.');
 }

 const maps=buildCandidateMaps(currentProducts);
 const usedIds=new Set();

 return raw.slice(1).map(row=>{
  const c=String(row[code]||'').trim();
  const n=String(row[name]||'').trim();
  if(!c||!n) return null;

  const presentation=normalizePresentation(pres>=0?row[pres]:'');
  const explicitId=systemId>=0?String(row[systemId]||'').trim():'';
  let old=explicitId&&maps.byId.get(explicitId)&&!usedIds.has(explicitId)?maps.byId.get(explicitId):null;

  if(!old) old=firstUnused(maps.byExact.get(productIdentityKey({codigo:c,nombre:n,presentacion:presentation})),usedIds);

  if(!old){
   const key=[c,presentation].map(normalizeText).join('|');
   const candidates=(maps.byCodePresentation.get(key)||[]).filter(p=>p.id&&!usedIds.has(String(p.id)));
   if(candidates.length===1) old=candidates[0];
  }

  if(!old){
   const key=[c,n].map(normalizeText).join('|');
   const candidates=(maps.byCodeName.get(key)||[]).filter(p=>p.id&&!usedIds.has(String(p.id)));
   if(candidates.length===1) old=candidates[0];
  }

  // Solo cae al código si ese código identifica un único producto pendiente.
  // Así los códigos repetidos nunca se pisan entre sí.
  if(!old){
   const candidates=(maps.byCode.get(normalizeText(c))||[]).filter(p=>p.id&&!usedIds.has(String(p.id)));
   if(candidates.length===1) old=candidates[0];
  }

  if(old?.id) usedIds.add(String(old.id));
  old=old||{};

  const finalPresentation=pres>=0?presentation:normalizePresentation(old.presentacion);
  const d=disc>=0?normalizeDiscount(row[disc]):normalizeDiscount(old.descuento||0);
  const listPrice=list>=0?parseNumber(row[list]):parseNumber(row[sin]);
  const sinCell=sin>=0?parseNumber(row[sin]):listPrice;
  const sinBase=d>0&&sinCell>0&&sinCell<listPrice?sinCell/(1-d):sinCell;
  const conCell=con>=0?parseNumber(row[con]):sinBase*(1+IVA);
  const conBase=d>0&&conCell>0&&conCell<sinBase*(1+IVA)?conCell/(1-d):conCell;

  return normalizeProduct({
   id:old.id||null,
   codigo:c,
   nombre:n,
   presentacion:finalPresentation,
   rubro:rubro>=0?row[rubro]:old.rubro,
   seccion:section>=0?row[section]:old.seccion,
   precioLista:listPrice||sinBase,
   precioSinIva:sinBase,
   precioConIva:conBase,
   descuento:d,
   precioSinIvaDescuento:d>0?sinBase*(1-d):0,
   precioConIvaDescuento:d>0?conBase*(1-d):0,
   stock:stock>=0&&row[stock]!==''?parseNumber(row[stock]):old.stock,
   activo:true,
   origen:'IMPORTADO EXCEL'
  });
 }).filter(Boolean);
}

export function exportExcel(products, filename = 'POLCARFER - Lista de Precios.xlsx') {
  const rows = products.map((p) => ({
    'Código': p.codigo,
    'Producto': p.nombre,
    'Presentación': normalizePresentation(p.presentacion),
    'Precio de lista': Number(p.precioLista || 0),
    'Descuento': Number(p.descuento || 0),
    'Precio S/IVA': Number(finalSinIva(p) || 0),
    'Precio C/IVA': Number(finalConIva(p) || 0)
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 55 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 }
  ];

  if (ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] };
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let row = 1; row <= range.e.r; row++) {
      const precioLista = ws[XLSX.utils.encode_cell({ r: row, c: 3 })];
      const descuento = ws[XLSX.utils.encode_cell({ r: row, c: 4 })];
      const sinIva = ws[XLSX.utils.encode_cell({ r: row, c: 5 })];
      const conIva = ws[XLSX.utils.encode_cell({ r: row, c: 6 })];
      if (precioLista) precioLista.z = '$ #,##0.00';
      if (descuento) descuento.z = '0%';
      if (sinIva) sinIva.z = '$ #,##0.00';
      if (conIva) conIva.z = '$ #,##0.00';
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lista de Precios');
  XLSX.writeFile(wb, filename);
}

export function exportAdminExcel(products, filename = 'POLCARFER - Catalogo Editable.xlsx') {
  /*
   * El ID interno se exporta en la primera columna, pero queda OCULTO.
   * El socio no tiene que verlo, completarlo ni modificarlo.
   *
   * - Producto existente: conserva su UUID oculto y se actualiza exactamente.
   * - Fila nueva: ID vacío -> Supabase genera el UUID automáticamente al importar.
   * - Excel externo sin ID: parseExcel usa Código + Producto + Presentación
   *   y solo cae al código cuando no existe ambigüedad.
   */
  const rows = products.map((p) => ({
    'ID Sistema': p.id || '',
    'Código': p.codigo,
    'Producto': p.nombre,
    'Presentación': normalizePresentation(p.presentacion),
    'Rubro': p.rubro,
    'Sección': p.seccion,
    'Stock': p.stock ?? '',
    'Precio de lista': Number(p.precioLista || 0),
    'Descuento': Number(p.descuento || 0),
    'Precio S/IVA': Number(finalSinIva(p) || 0),
    'Precio C/IVA': Number(finalConIva(p) || 0)
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // La columna A contiene el ID técnico y se oculta para el usuario.
  ws['!cols'] = [
    { wch: 38, hidden: true },
    { wch: 16 },
    { wch: 55 },
    { wch: 24 },
    { wch: 25 },
    { wch: 35 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 }
  ];

  if (ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] };

    // Formato numérico. A está oculta, por lo que las columnas visibles empiezan en B.
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let row = 1; row <= range.e.r; row++) {
      const precioLista = ws[XLSX.utils.encode_cell({ r: row, c: 7 })];
      const descuento = ws[XLSX.utils.encode_cell({ r: row, c: 8 })];
      const sinIva = ws[XLSX.utils.encode_cell({ r: row, c: 9 })];
      const conIva = ws[XLSX.utils.encode_cell({ r: row, c: 10 })];

      if (precioLista) precioLista.z = '$ #,##0.00';
      if (descuento) descuento.z = '0%';
      if (sinIva) sinIva.z = '$ #,##0.00';
      if (conIva) conIva.z = '$ #,##0.00';
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lista de Precios');
  XLSX.writeFile(wb, filename);
}

export function downloadJson(products){
 const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download='productos.json';
 a.click();
 setTimeout(()=>URL.revokeObjectURL(url),500);
}
