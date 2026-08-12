let xlsxModulePromise;

async function loadXlsx() {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx').then((module) =>
      module.default?.utils ? module.default : module
    );
  }
  return xlsxModulePromise;
}

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

export const finalSinIva=p=>Number(p?.precioSinIva||0);
export const finalConIva=p=>Number(p?.precioConIva||0);
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


function findHeaderInRow(row, names) {
  const normalized = (row || []).map(normalizeText);
  return normalized.findIndex((cell) =>
    names.some((name) => cell === normalizeText(name))
  );
}

function findHeaderLayout(raw) {
  const maxRows = Math.min(raw.length, 80);

  for (let headerRow = 0; headerRow < maxRows; headerRow++) {
    const row = raw[headerRow] || [];

    const systemId = findHeaderInRow(row, ['ID Sistema', 'ID interno', 'System ID']);
    const code = findHeaderInRow(row, ['Código', 'Codigo', 'CODIGO']);
    const name = findHeaderInRow(row, [
      'Producto',
      'Nombre',
      'Descripción',
      'Descripcion',
      'Detalle',
      'DETALLE'
    ]);
    const pres = findHeaderInRow(row, ['Presentación', 'Presentacion', 'PRESENTACION']);
    const rubro = findHeaderInRow(row, ['Rubro', 'Categoría', 'Categoria']);
    const section = findHeaderInRow(row, ['Sección', 'Seccion']);
    const stock = findHeaderInRow(row, ['Stock', 'Existencia', 'Existencias']);
    const list = findHeaderInRow(row, [
      'Precio de lista',
      'Precio lista',
      'Lista',
      'LISTA'
    ]);
    const disc = findHeaderInRow(row, ['Descuento', 'DESCUENTO']);
    const sin = findHeaderInRow(row, [
      'Precio S/IVA',
      'Precio S IVA',
      'Precio sin IVA',
      'S/IVA'
    ]);
    const con = findHeaderInRow(row, [
      'Precio C/IVA',
      'Precio C IVA',
      'Precio con IVA',
      'C/IVA'
    ]);
    const bulk = findHeaderInRow(row, [
      'Cantidad por bulto',
      'CANTIDAD POR BULTO'
    ]);
    const sizeUnits = findHeaderInRow(row, [
      'Tamaño/Unidades',
      'Tamano/Unidades',
      'TAMAÑO/UNIDADES',
      'TAMANO/UNIDADES'
    ]);
    const condition = findHeaderInRow(row, [
      'Oferta por bulto cerrado',
      'OFERTA POR BULTO CERRADO',
      'Condición',
      'Condicion',
      'Cantidad mínima',
      'Cantidad minima'
    ]);

    if (code >= 0 && name >= 0 && (list >= 0 || sin >= 0)) {
      return {
        headerRow,
        systemId,
        code,
        name,
        pres,
        rubro,
        section,
        stock,
        list,
        disc,
        sin,
        con,
        bulk,
        sizeUnits,
        condition
      };
    }
  }

  return null;
}

function numericCell(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value ?? '').trim();
  if (!text || text.startsWith('=')) return 0;
  return parseNumber(text);
}

function combinePresentation(first, second) {
  const a = String(first ?? '').trim().replace(/\s+/g, ' ');
  const b = String(second ?? '').trim().replace(/\s+/g, ' ');

  if (!a) return normalizePresentation(b);
  if (!b) return normalizePresentation(a);
  if (normalizeText(a) === normalizeText(b)) return normalizePresentation(a);

  return normalizePresentation(`${a} ${b}`);
}

function isLikelySectionLabel(name, presentation = '') {
  const text = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return false;

  const normalized = normalizeText(text);
  if (
    normalized.includes('fecha:') ||
    normalized === 'polcarfersrl' ||
    normalized.includes('15-5821') ||
    normalized.includes('15-2370')
  ) {
    return false;
  }

  const words = text.split(/\s+/).filter(Boolean);
  const hasDigits = /\d/.test(text);
  const hasPresentation = Boolean(String(presentation ?? '').trim());

  if (!hasPresentation) return words.length <= 12;
  return !hasDigits && words.length <= 9;
}

function buildCandidateMaps(products) {
  const byId = new Map();
  const byExact = new Map();
  const byCodePresentation = new Map();
  const byCodeName = new Map();
  const byCode = new Map();

  const add = (map, key, product) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(product);
  };

  for (const product of products) {
    if (product.id) byId.set(String(product.id), product);
    add(byExact, productIdentityKey(product), product);
    add(
      byCodePresentation,
      [product.codigo, normalizePresentation(product.presentacion)]
        .map(normalizeText)
        .join('|'),
      product
    );
    add(
      byCodeName,
      [product.codigo, product.nombre].map(normalizeText).join('|'),
      product
    );
    add(byCode, normalizeText(product.codigo), product);
  }

  return { byId, byExact, byCodePresentation, byCodeName, byCode };
}

function firstUnused(list = [], usedIds) {
  return list.find(
    (product) => product.id && !usedIds.has(String(product.id))
  ) || null;
}

function findExistingProduct(product, maps, usedIds) {
  const explicitId = product.id ? String(product.id) : '';

  if (explicitId) {
    const direct = maps.byId.get(explicitId);
    if (direct && !usedIds.has(explicitId)) return direct;
  }

  let old = firstUnused(
    maps.byExact.get(productIdentityKey(product)),
    usedIds
  );
  if (old) return old;

  const codePresentationKey = [
    product.codigo,
    normalizePresentation(product.presentacion)
  ]
    .map(normalizeText)
    .join('|');

  const byPresentation = (
    maps.byCodePresentation.get(codePresentationKey) || []
  ).filter(
    (candidate) =>
      candidate.id && !usedIds.has(String(candidate.id))
  );

  if (byPresentation.length === 1) return byPresentation[0];

  const codeNameKey = [product.codigo, product.nombre]
    .map(normalizeText)
    .join('|');

  const byName = (maps.byCodeName.get(codeNameKey) || []).filter(
    (candidate) =>
      candidate.id && !usedIds.has(String(candidate.id))
  );

  if (byName.length === 1) return byName[0];

  const byCode = (
    maps.byCode.get(normalizeText(product.codigo)) || []
  ).filter(
    (candidate) =>
      candidate.id && !usedIds.has(String(candidate.id))
  );

  if (byCode.length === 1) return byCode[0];

  return null;
}

function attachExistingIds(rows, currentProducts = []) {
  const maps = buildCandidateMaps(currentProducts);
  const usedIds = new Set();

  return rows.map((row) => {
    const old = findExistingProduct(row, maps, usedIds);

    if (old?.id) usedIds.add(String(old.id));

    return normalizeProduct({
      ...row,
      id: old?.id || row.id || null,
      rubro: old?.rubro || row.rubro || detectRubro(
        row.nombre,
        row.presentacion,
        row.seccion || old?.seccion || ''
      ),
      seccion: old?.seccion || row.seccion || '',
      stock:
        row.stock !== null && row.stock !== undefined
          ? row.stock
          : old?.stock ?? null
    });
  });
}

function normalizedSheetMap(workbook) {
  const map = new Map();
  for (const name of workbook.SheetNames || []) {
    map.set(normalizeText(name), name);
  }
  return map;
}

function parseLegacyBaseSheet(XLSX, workbook, sheetName, config = {}) {
  const raw = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    { header: 1, defval: '' }
  );

  const layout = findHeaderLayout(raw);
  if (!layout) return [];

  let currentSection = '';
  const rows = [];

  for (let index = layout.headerRow + 1; index < raw.length; index++) {
    const row = raw[index] || [];
    const code = String(row[layout.code] ?? '').trim();
    const name = String(row[layout.name] ?? '').trim();
    const sinIva = layout.sin >= 0 ? numericCell(row[layout.sin]) : 0;

    const sectionPresentation =
      layout.pres >= 0
        ? row[layout.pres]
        : layout.bulk >= 0
          ? row[layout.bulk]
          : '';

    if (!code && name && !sinIva) {
      if (isLikelySectionLabel(name, sectionPresentation)) {
        currentSection = name.trim();
      }
      continue;
    }

    if (!code || !name) continue;

    let presentation = '';

    if (config.combineBulkAndSize) {
      presentation = combinePresentation(
        layout.bulk >= 0 ? row[layout.bulk] : '',
        layout.sizeUnits >= 0 ? row[layout.sizeUnits] : ''
      );
    } else {
      presentation = normalizePresentation(
        layout.pres >= 0 ? row[layout.pres] : ''
      );
    }

    const conIvaCell =
      layout.con >= 0 ? numericCell(row[layout.con]) : 0;
    const conIva = conIvaCell || sinIva * (1 + IVA);

    rows.push(
      normalizeProduct({
        codigo: code,
        nombre: name,
        presentacion: presentation,
        rubro: detectRubro(name, presentation, currentSection),
        seccion: currentSection,
        precioLista: sinIva,
        precioSinIva: sinIva,
        precioConIva: conIva,
        descuento: 0,
        precioSinIvaDescuento: 0,
        precioConIvaDescuento: 0,
        stock: null,
        activo: true,
        origen: sheetName
      })
    );
  }

  return rows;
}

function parseMinimumQuantity(value = '') {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const valueNumber = parseNumber(match[1]);
  return valueNumber > 0 ? valueNumber : null;
}

export function normalizeOffer(o = {}) {
  const descuento = normalizeDiscount(o.descuento ?? o.discount ?? 0);
  const precioListaOrigen = Number(
    o.precioListaOrigen ?? o.precio_lista_origen ?? o.listPrice ?? 0
  ) || 0;
  const precioSinIva = Number(
    o.precioSinIva ?? o.precio_sin_iva ?? o.discountedSin ?? 0
  ) || (descuento > 0 && precioListaOrigen > 0
    ? precioListaOrigen * (1 - descuento)
    : 0);
  const precioConIva = Number(
    o.precioConIva ?? o.precio_con_iva ?? o.discountedCon ?? 0
  ) || (precioSinIva > 0 ? precioSinIva * (1 + IVA) : 0);

  return {
    id: o.id ? String(o.id) : null,
    productId: o.productId ?? o.product_id ?? null,
    productKey: String(o.productKey ?? o.product_key ?? ''),
    codigo: String(o.codigo ?? '').trim(),
    nombre: String(o.nombre ?? '').trim(),
    condicion: String(o.condicion ?? o.condition ?? '').trim().replace(/\s+/g, ' '),
    cantidadMinima: o.cantidadMinima ?? o.cantidad_minima ?? null,
    descuento,
    precioListaOrigen,
    precioSinIva,
    precioConIva,
    requiereRevision: Boolean(o.requiereRevision ?? o.requiere_revision),
    activa: o.activa !== false,
    origen: String(o.origen || 'LISTA CON DESCUENTOS')
  };
}

function parseLegacyOffers(XLSX, workbook, sheetName) {
  if (!sheetName) return [];

  const raw = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    { header: 1, defval: '' }
  );
  const layout = findHeaderLayout(raw);

  if (!layout || layout.disc < 0 || layout.list < 0) return [];

  const offers = [];

  for (let index = layout.headerRow + 1; index < raw.length; index++) {
    const row = raw[index] || [];
    const codigo = String(row[layout.code] ?? '').trim();
    const nombre = String(row[layout.name] ?? '').trim();

    if (!codigo || !nombre) continue;

    const precioListaOrigen = numericCell(row[layout.list]);
    const descuento = normalizeDiscount(row[layout.disc]);
    const precioSinIvaCelda = layout.sin >= 0 ? numericCell(row[layout.sin]) : 0;
    const precioConIvaCelda = layout.con >= 0 ? numericCell(row[layout.con]) : 0;
    const condicion = layout.condition >= 0
      ? String(row[layout.condition] ?? '').trim().replace(/\s+/g, ' ')
      : '';

    // Una fila de la hoja de descuentos es una condición comercial independiente.
    // Nunca reemplaza el precio base del producto.
    if (descuento <= 0 && precioSinIvaCelda <= 0 && precioConIvaCelda <= 0) continue;

    const precioSinIva = precioSinIvaCelda || (
      descuento > 0 && precioListaOrigen > 0
        ? precioListaOrigen * (1 - descuento)
        : 0
    );
    const precioConIva = precioConIvaCelda || (
      precioSinIva > 0 ? precioSinIva * (1 + IVA) : 0
    );

    offers.push(normalizeOffer({
      codigo,
      nombre,
      condicion,
      cantidadMinima: parseMinimumQuantity(condicion),
      descuento,
      precioListaOrigen,
      precioSinIva,
      precioConIva,
      origen: sheetName
    }));
  }

  return offers;
}

function matchLegacyOffers(products, rawOffers) {
  const byCodeName = new Map();
  const byCode = new Map();

  const add = (map, key, product) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(product);
  };

  for (const product of products) {
    add(
      byCodeName,
      [product.codigo, product.nombre].map(normalizeText).join('|'),
      product
    );
    add(byCode, normalizeText(product.codigo), product);
  }

  const offers = [];
  const warnings = [];

  for (const rawOffer of rawOffers) {
    const exactKey = [rawOffer.codigo, rawOffer.nombre]
      .map(normalizeText)
      .join('|');

    let candidates = byCodeName.get(exactKey) || [];

    if (candidates.length === 0) {
      const byCodeCandidates = byCode.get(normalizeText(rawOffer.codigo)) || [];
      if (byCodeCandidates.length === 1) candidates = byCodeCandidates;
    }

    if (candidates.length !== 1) {
      warnings.push({
        type: candidates.length ? 'ambiguous_offer' : 'orphan_offer',
        codigo: rawOffer.codigo,
        nombre: rawOffer.nombre,
        message: candidates.length
          ? `La oferta ${rawOffer.codigo} coincide con más de un producto y no se vinculó automáticamente.`
          : `La oferta ${rawOffer.codigo} no tiene un producto base equivalente y no se importará.`
      });
      continue;
    }

    const product = candidates[0];
    const basePrice = Number(product.precioSinIva || 0);
    const sourcePrice = Number(rawOffer.precioListaOrigen || 0);
    const priceConflict = basePrice > 0 && sourcePrice > 0 && Math.abs(basePrice - sourcePrice) > 0.01;

    const offer = normalizeOffer({
      ...rawOffer,
      productId: product.id || null,
      productKey: productIdentityKey(product),
      requiereRevision: priceConflict
    });

    offers.push(offer);

    if (priceConflict) {
      warnings.push({
        type: 'price_conflict',
        codigo: product.codigo,
        nombre: product.nombre,
        basePrice,
        offerListPrice: sourcePrice,
        message: `${product.codigo}: la lista base indica ${formatPrice(basePrice)} S/IVA y la hoja de descuentos usa ${formatPrice(sourcePrice)}. El precio base NO será reemplazado.`
      });
    }
  }

  const offerCountByProduct = new Map();
  for (const offer of offers) {
    offerCountByProduct.set(
      offer.productKey,
      (offerCountByProduct.get(offer.productKey) || 0) + 1
    );
  }

  return {
    offers,
    warnings,
    multipleOffers: [...offerCountByProduct.values()].filter((count) => count > 1).length
  };
}

function baseOnlyProduct(product) {
  return normalizeProduct({
    ...product,
    descuento: 0,
    precioSinIvaDescuento: 0,
    precioConIvaDescuento: 0
  });
}

function buildAnalysis(products, offers = [], warnings = [], format = 'generic') {
  const cleanProducts = products.map(baseOnlyProduct);
  const cleanOffers = offers.map(normalizeOffer);

  return {
    products: cleanProducts,
    offers: cleanOffers,
    warnings,
    format,
    summary: {
      products: cleanProducts.length,
      offers: cleanOffers.length,
      multipleOffers: (() => {
        const counts = new Map();
        for (const offer of cleanOffers) {
          counts.set(offer.productKey, (counts.get(offer.productKey) || 0) + 1);
        }
        return [...counts.values()].filter((count) => count > 1).length;
      })(),
      priceConflicts: cleanOffers.filter((offer) => offer.requiereRevision).length,
      zeroPrices: cleanProducts.filter((product) => Number(product.precioSinIva || 0) <= 0).length,
      orphanOffers: warnings.filter((warning) => warning.type === 'orphan_offer').length,
      ambiguousOffers: warnings.filter((warning) => warning.type === 'ambiguous_offer').length
    }
  };
}

function parseLegacyPolcarferWorkbook(XLSX, workbook, currentProducts) {
  const sheets = normalizedSheetMap(workbook);
  const listSheet = sheets.get('lista de precios');
  const suprabondSheet = sheets.get('suprabond-bulit-somerset');

  if (!listSheet || !suprabondSheet) return null;

  const discountSheet = sheets.get('lista con descuentos');

  const baseRows = [
    ...parseLegacyBaseSheet(XLSX, workbook, listSheet),
    ...parseLegacyBaseSheet(
      XLSX,
      workbook,
      suprabondSheet,
      { combineBulkAndSize: true }
    )
  ];

  if (!baseRows.length) return null;

  const products = attachExistingIds(baseRows, currentProducts)
    .map(baseOnlyProduct);
  const rawOffers = parseLegacyOffers(XLSX, workbook, discountSheet);
  const matched = matchLegacyOffers(products, rawOffers);

  return buildAnalysis(
    products,
    matched.offers,
    matched.warnings,
    'polcarfer_legacy'
  );
}

function findBestGenericSheet(XLSX, workbook) {
  let best = null;

  for (const sheetName of workbook.SheetNames || []) {
    const raw = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { header: 1, defval: '' }
    );

    const layout = findHeaderLayout(raw);
    if (!layout) continue;

    let score = 0;
    if (normalizeText(sheetName) === 'lista de precios') score += 10;
    if (layout.systemId >= 0) score += 6;
    if (layout.pres >= 0) score += 3;
    if (layout.list >= 0) score += 3;
    if (layout.disc >= 0) score += 2;
    if (layout.stock >= 0) score += 1;

    if (!best || score > best.score) {
      best = { sheetName, raw, layout, score };
    }
  }

  return best;
}

function parseGenericRows(raw, layout, currentProducts) {
  const rows = [];

  for (let index = layout.headerRow + 1; index < raw.length; index++) {
    const row = raw[index] || [];
    const code = String(row[layout.code] ?? '').trim();
    const name = String(row[layout.name] ?? '').trim();

    if (!code || !name) continue;

    const presentation = normalizePresentation(
      layout.pres >= 0 ? row[layout.pres] : ''
    );

    const explicitId =
      layout.systemId >= 0
        ? String(row[layout.systemId] ?? '').trim()
        : '';

    const discount =
      layout.disc >= 0
        ? normalizeDiscount(row[layout.disc])
        : 0;

    const listPrice =
      layout.list >= 0
        ? numericCell(row[layout.list])
        : numericCell(row[layout.sin]);

    const sinCell =
      layout.sin >= 0
        ? numericCell(row[layout.sin])
        : listPrice;

    const baseSin =
      discount > 0 &&
      listPrice > 0 &&
      sinCell > 0 &&
      sinCell < listPrice
        ? sinCell / (1 - discount)
        : sinCell || listPrice;

    const conCell =
      layout.con >= 0
        ? numericCell(row[layout.con])
        : 0;

    const baseCon =
      discount > 0 &&
      conCell > 0 &&
      conCell < baseSin * (1 + IVA)
        ? conCell / (1 - discount)
        : conCell || baseSin * (1 + IVA);

    rows.push(
      normalizeProduct({
        id: explicitId || null,
        codigo: code,
        nombre: name,
        presentacion: presentation,
        rubro: layout.rubro >= 0 ? row[layout.rubro] : '',
        seccion: layout.section >= 0 ? row[layout.section] : '',
        precioLista: listPrice || baseSin,
        precioSinIva: baseSin,
        precioConIva: baseCon,
        descuento: discount,
        precioSinIvaDescuento:
          discount > 0 ? baseSin * (1 - discount) : 0,
        precioConIvaDescuento:
          discount > 0 ? baseCon * (1 - discount) : 0,
        stock:
          layout.stock >= 0 && row[layout.stock] !== ''
            ? numericCell(row[layout.stock])
            : null,
        activo: true,
        origen: 'IMPORTADO EXCEL'
      })
    );
  }

  return attachExistingIds(rows, currentProducts);
}

export async function parseExcel(file, currentProducts = []) {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames?.length) {
    throw new Error('El archivo no contiene hojas.');
  }

  /*
   * Formato histórico real de POLCARFER:
   * - LISTA DE PRECIOS
   * - SUPRABOND-BULIT-SOMERSET
   * - LISTA CON DESCUENTOS
   *
   * Las primeras dos hojas son la ÚNICA fuente del precio base.
   * La hoja de descuentos crea ofertas independientes y nunca pisa
   * precio_lista / precio_sin_iva / precio_con_iva del producto.
   */
  const legacy = parseLegacyPolcarferWorkbook(
    XLSX,
    workbook,
    currentProducts
  );

  if (legacy?.products?.length) return legacy;

  const generic = findBestGenericSheet(XLSX, workbook);

  if (!generic) {
    throw new Error(
      'No pude encontrar una tabla de productos. Necesito columnas equivalentes a Código, Producto/Detalle y Precio de lista o S/IVA.'
    );
  }

  const rows = parseGenericRows(
    generic.raw,
    generic.layout,
    currentProducts
  );

  if (!rows.length) {
    throw new Error(
      'Encontré los encabezados, pero no detecté productos con código y descripción.'
    );
  }

  const offers = [];
  const products = rows.map((row) => {
    if (row.descuento > 0) {
      offers.push(normalizeOffer({
        productId: row.id || null,
        productKey: productIdentityKey(row),
        codigo: row.codigo,
        nombre: row.nombre,
        condicion: '',
        cantidadMinima: null,
        descuento: row.descuento,
        precioListaOrigen: row.precioLista || row.precioSinIva,
        precioSinIva: row.precioSinIvaDescuento,
        precioConIva: row.precioConIvaDescuento,
        origen: 'IMPORTADO EXCEL'
      }));
    }
    return baseOnlyProduct(row);
  });

  return buildAnalysis(products, offers, [], 'generic');
}

export function offersForQuantity(product, quantity = 1) {
  const qty = Math.max(1, Number(quantity) || 1);
  return (product?.offers || [])
    .map(normalizeOffer)
    .filter((offer) =>
      offer.activa !== false &&
      (offer.cantidadMinima === null ||
        offer.cantidadMinima === undefined ||
        qty >= Number(offer.cantidadMinima || 0))
    );
}

export function priceForQuantity(product, quantity = 1, includeVat = true) {
  const base = Number(
    includeVat ? product?.precioConIva : product?.precioSinIva
  ) || 0;
  const eligible = offersForQuantity(product, quantity);

  if (!eligible.length) return base;

  const offerPrices = eligible
    .map((offer) => Number(includeVat ? offer.precioConIva : offer.precioSinIva) || 0)
    .filter((price) => price > 0);

  if (!offerPrices.length) return base;
  if (base <= 0) return Math.min(...offerPrices);
  return Math.min(base, ...offerPrices);
}

function appendOffersSheet(XLSX, workbook, products) {
  const offerRows = products.flatMap((product) =>
    (product.offers || []).map((offerRaw) => {
      const offer = normalizeOffer(offerRaw);
      return {
        'Código': product.codigo,
        'Producto': product.nombre,
        'Condición': offer.condicion || 'Oferta general',
        'Cantidad mínima': offer.cantidadMinima ?? '',
        'Descuento': Number(offer.descuento || 0),
        'Precio lista origen': Number(offer.precioListaOrigen || 0),
        'Precio oferta S/IVA': Number(offer.precioSinIva || 0),
        'Precio oferta C/IVA': Number(offer.precioConIva || 0)
      };
    })
  );

  if (!offerRows.length) return;

  const offersSheet = XLSX.utils.json_to_sheet(offerRows);
  offersSheet['!cols'] = [
    { wch: 16 },
    { wch: 55 },
    { wch: 34 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 21 },
    { wch: 21 }
  ];

  if (offersSheet['!ref']) {
    offersSheet['!autofilter'] = { ref: offersSheet['!ref'] };
    const range = XLSX.utils.decode_range(offersSheet['!ref']);
    for (let row = 1; row <= range.e.r; row++) {
      const descuento = offersSheet[XLSX.utils.encode_cell({ r: row, c: 4 })];
      if (descuento) descuento.z = '0%';
      for (const col of [5, 6, 7]) {
        const cell = offersSheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell) cell.z = '$ #,##0.00';
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, offersSheet, 'Ofertas');
}

export async function exportExcel(products, filename = 'POLCARFER - Lista de Precios.xlsx') {
  const XLSX = await loadXlsx();

  // La primera hoja conserva EXACTAMENTE las 7 columnas comerciales acordadas.
  // Muestra el precio base oficial. Las ofertas por cantidad se detallan en
  // una segunda hoja para no convertir una condición de volumen en un precio general.
  const rows = products.map((p) => ({
    'Código': p.codigo,
    'Producto': p.nombre,
    'Presentación': normalizePresentation(p.presentacion),
    'Precio de lista': Number(p.precioLista || p.precioSinIva || 0),
    'Descuento': 0,
    'Precio S/IVA': Number(p.precioSinIva || 0),
    'Precio C/IVA': Number(p.precioConIva || 0)
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
  appendOffersSheet(XLSX, wb, products);
  XLSX.writeFile(wb, filename);
}

export async function exportAdminExcel(products, filename = 'POLCARFER - Catalogo Editable.xlsx') {
  const XLSX = await loadXlsx();

  const rows = products.map((p) => ({
    'ID Sistema': p.id || '',
    'Código': p.codigo,
    'Producto': p.nombre,
    'Presentación': normalizePresentation(p.presentacion),
    'Rubro': p.rubro,
    'Sección': p.seccion,
    'Stock': p.stock ?? '',
    'Precio de lista': Number(p.precioLista || p.precioSinIva || 0),
    'Descuento': 0,
    'Precio S/IVA': Number(p.precioSinIva || 0),
    'Precio C/IVA': Number(p.precioConIva || 0)
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
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
  appendOffersSheet(XLSX, wb, products);
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
