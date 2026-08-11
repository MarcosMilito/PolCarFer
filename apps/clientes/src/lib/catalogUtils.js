import * as XLSX from 'xlsx';

export const IVA = 0.21;

export const CONTACT = {
  phone:
    '+54 9 11 2370-0742',

  whatsapp:
    '5491123700742',

  instagram:
    '@polcarfersrl',

  instagramUrl:
    'https://instagram.com/polcarfersrl',

  email:
    'polcarfer@outlook.com',

  address:
    'Federico Chopin 458, Lomas de Zamora, Buenos Aires',

  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=Federico+Chopin+458%2C+Lomas+de+Zamora%2C+Buenos+Aires'
};

export function normalizeText(
  value = ''
) {
  return String(value)
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();
}

export function parseNumber(
  value
) {
  if (
    typeof value === 'number'
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  let text =
    String(value ?? '')
      .trim()
      .replace(/\$/g, '')
      .replace(/%/g, '')
      .replace(/\s/g, '');

  if (!text) {
    return 0;
  }

  if (
    text.includes(',') &&
    text.includes('.')
  ) {
    text = text
      .replace(/\./g, '')
      .replace(',', '.');
  } else if (
    text.includes(',')
  ) {
    text =
      text.replace(',', '.');
  }

  text =
    text.replace(
      /[^\d.-]/g,
      ''
    );

  return (
    Number.parseFloat(text) ||
    0
  );
}

export function normalizeDiscount(
  value
) {
  const number =
    parseNumber(value);

  return Math.max(
    0,
    number > 1
      ? number / 100
      : number
  );
}

function quantityLabel(
  value
) {
  const number =
    parseNumber(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return '';
  }

  const shown =
    Number.isInteger(number)
      ? String(number)
      : String(number).replace(
          '.',
          ','
        );

  return `${shown} ${
    number === 1
      ? 'unidad'
      : 'unidades'
  }`;
}

/*
 * NORMALIZACIÓN DE PRESENTACIÓN
 *
 * Ejemplos:
 *
 * 12
 * → 12 unidades
 *
 * 1
 * → 1 unidad
 *
 * UNIDAD
 * → 1 unidad
 *
 * 12 UNIDADES
 * → 12 unidades
 *
 * 12 UNIDADES 12 UNIDADES
 * → 12 unidades
 *
 * 12 UNIDADES 18 UNIDADES
 * → 12 / 18 unidades
 *
 * Si existe información adicional:
 *
 * 6 UNIDADES 22 MM X 1,20 MTS
 *
 * se conserva porque las medidas
 * forman parte de la presentación.
 */
export function normalizePresentation(
  value = ''
) {
  let text =
    String(value ?? '')
      .trim()
      .replace(
        /\s+/g,
        ' '
      );

  if (!text) {
    return '';
  }

  const upper =
    text.toUpperCase();

  /*
   * Solo un número.
   */
  if (
    /^\d+(?:[.,]\d+)?$/.test(
      text
    )
  ) {
    return quantityLabel(
      text
    );
  }

  /*
   * Solamente UNIDAD.
   */
  if (
    /^UNIDAD\.?$/.test(
      upper
    )
  ) {
    return '1 unidad';
  }

  /*
   * Solamente UNIDADES.
   *
   * No podemos inventar una
   * cantidad si el Excel no la
   * especificó.
   */
  if (
    /^UNIDADES\.?$/.test(
      upper
    )
  ) {
    return 'Unidades';
  }

  /*
   * Ejemplos admitidos:
   *
   * 12 UNIDAD
   * 12 UNIDADES
   * 12 UN
   * 12 UNID
   * 12 U
   */
  const simple =
    upper.match(
      /^(\d+(?:[.,]\d+)?)\s*(?:U|UN|UNID|UNIDAD|UNIDADES)\.?$/
    );

  if (simple) {
    return quantityLabel(
      simple[1]
    );
  }

  /*
   * Solo modifica cuando TODA
   * la celda está formada por
   * cantidades + UNIDAD/UNIDADES.
   *
   * No toca medidas, cajas,
   * cartuchos, milímetros, etc.
   */
  if (
    /^(?:\d+(?:[.,]\d+)?\s+UNIDADES?\s*)+$/i.test(
      text
    )
  ) {
    const quantities = [
      ...text.matchAll(
        /(\d+(?:[.,]\d+)?)\s+UNIDADES?/gi
      )
    ].map(
      (match) =>
        match[1]
    );

    const unique = [
      ...new Set(
        quantities.map(
          (quantity) =>
            String(
              quantity
            ).replace(
              '.',
              ','
            )
        )
      )
    ];

    /*
     * Ejemplo:
     * 12 UNIDADES 12 UNIDADES
     */
    if (
      unique.length === 1
    ) {
      return quantityLabel(
        unique[0]
      );
    }

    /*
     * Ejemplo:
     * 12 UNIDADES 18 UNIDADES
     */
    if (
      unique.length > 1
    ) {
      return `${unique.join(
        ' / '
      )} unidades`;
    }
  }

  /*
   * Si contiene más información,
   * se respeta el texto original.
   */
  return text;
}

export function detectRubro(
  nombre = '',
  presentacion = '',
  seccion = ''
) {
  const text =
    `${nombre} ${presentacion} ${seccion}`.toUpperCase();

  if (
    /DISCO|AMOLADORA|TALADRO|ATORNILLADOR|SIERRA|MECHA|LIJADORA|DEMOL|FRESADORA|CALADORA|CEPILLO/.test(
      text
    )
  ) {
    return 'Herramientas eléctricas';
  }

  if (
    /PINZA|ALICATE|LLAVE|DESTORNILLADOR|MARTILLO|CUTTER|TENAZA|SERRUCHO|MORSA|METRO|NIVEL/.test(
      text
    )
  ) {
    return 'Herramientas manuales';
  }

  if (
    /TORNILLO|TARUGO|BULON|TUERCA|ARANDELA|CLAVO|REMACHE/.test(
      text
    )
  ) {
    return 'Bulonería y fijaciones';
  }

  if (
    /CANDADO|CERRADURA|CERROJO|PASADOR|PICAPORTE|BISAGRA/.test(
      text
    )
  ) {
    return 'Herrajes y seguridad';
  }

  if (
    /CABLE|ENCHUFE|TERMICA|TOMA|INTERRUPTOR|LAMPARA|PORTALAMPARA|PILA|BATERIA/.test(
      text
    )
  ) {
    return 'Electricidad';
  }

  if (
    /PINTURA|PINCEL|RODILLO|ESPATULA|LIJA|THINNER/.test(
      text
    )
  ) {
    return 'Pinturería';
  }

  if (
    /MANGUERA|GRIFERIA|CANILLA|TEFLON|SIFON|VALVULA|UNION|PLOMERIA|CAÑO|CANO|PVC/.test(
      text
    )
  ) {
    return 'Sanitaria';
  }

  if (
    /ADHESIVO|SILICONA|PEGAMENTO|SELLADOR|MEMBRANA/.test(
      text
    )
  ) {
    return 'Adhesivos y selladores';
  }

  if (
    /GUANTE|BARBIJO|LENTE|CASCO|PROTECTOR/.test(
      text
    )
  ) {
    return 'Seguridad';
  }

  if (
    /LUBRICANTE|GRASA|CINTA/.test(
      text
    )
  ) {
    return 'Lubricantes y cintas';
  }

  return 'General';
}

export function normalizeProduct(
  product = {}
) {
  const descuento =
    normalizeDiscount(
      product.descuento || 0
    );

  const sinIva =
    Number(
      product.precioSinIva ??
        product.precio_sin_iva ??
        product.precioLista ??
        product.precio_lista ??
        0
    ) || 0;

  const conIva =
    Number(
      product.precioConIva ??
        product.precio_con_iva ??
        0
    ) ||
    sinIva * (1 + IVA);

  const sinIvaDescuento =
    Number(
      product.precioSinIvaDescuento ??
        product.precio_sin_iva_descuento ??
        0
    ) ||
    (descuento > 0
      ? sinIva *
        (1 - descuento)
      : 0);

  const conIvaDescuento =
    Number(
      product.precioConIvaDescuento ??
        product.precio_con_iva_descuento ??
        0
    ) ||
    (descuento > 0
      ? conIva *
        (1 - descuento)
      : 0);

  const stockRaw =
    product.stock;

  const presentacion =
    normalizePresentation(
      product.presentacion
    );

  return {
    id: product.id
      ? String(product.id)
      : null,

    codigo:
      String(
        product.codigo || ''
      ).trim(),

    nombre:
      String(
        product.nombre || ''
      ).trim(),

    presentacion,

    rubro:
      String(
        product.rubro || ''
      ).trim() ||
      detectRubro(
        product.nombre,
        presentacion,
        product.seccion
      ),

    seccion:
      String(
        product.seccion || ''
      ).trim(),

    precioLista:
      Number(
        product.precioLista ??
          product.precio_lista ??
          sinIva
      ) || 0,

    precioSinIva:
      sinIva,

    precioConIva:
      conIva,

    descuento,

    precioSinIvaDescuento:
      sinIvaDescuento,

    precioConIvaDescuento:
      conIvaDescuento,

    tieneDescuento:
      descuento > 0,

    stock:
      stockRaw === null ||
      stockRaw === undefined ||
      stockRaw === ''
        ? null
        : Number(stockRaw),

    activo:
      product.activo !== false,

    origen:
      String(
        product.origen ||
          'CATÁLOGO'
      )
  };
}

export const finalSinIva = (
  product
) =>
  product.tieneDescuento &&
  product.precioSinIvaDescuento >
    0
    ? product.precioSinIvaDescuento
    : product.precioSinIva;

export const finalConIva = (
  product
) =>
  product.tieneDescuento &&
  product.precioConIvaDescuento >
    0
    ? product.precioConIvaDescuento
    : product.precioConIva;

export const formatPrice = (
  value
) =>
  new Intl.NumberFormat(
    'es-AR',
    {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(
    Number(value) || 0
  );

export const formatDate = (
  value
) =>
  value
    ? new Intl.DateTimeFormat(
        'es-AR',
        {
          dateStyle: 'short',
          timeStyle: 'short'
        }
      ).format(
        new Date(value)
      )
    : '—';

/*
 * La identidad comercial ya NO
 * depende solamente del código.
 *
 * Dos productos pueden tener
 * exactamente el mismo código.
 */
export function productIdentityKey(
  product = {}
) {
  return [
    product.codigo,
    product.nombre,
    normalizePresentation(
      product.presentacion
    )
  ]
    .map(normalizeText)
    .join('|');
}

export function toDb(
  product,
  {
    includeId = true
  } = {}
) {
  product =
    normalizeProduct(product);

  const row = {
    codigo:
      product.codigo,

    nombre:
      product.nombre,

    presentacion:
      product.presentacion,

    rubro:
      product.rubro,

    seccion:
      product.seccion,

    precio_lista:
      product.precioLista,

    precio_sin_iva:
      product.precioSinIva,

    precio_con_iva:
      product.precioConIva,

    descuento:
      product.descuento,

    precio_sin_iva_descuento:
      product.precioSinIvaDescuento,

    precio_con_iva_descuento:
      product.precioConIvaDescuento,

    stock:
      product.stock,

    activo:
      product.activo !== false,

    origen:
      product.origen,

    updated_at:
      new Date().toISOString()
  };

  if (
    includeId &&
    product.id
  ) {
    row.id =
      product.id;
  }

  return row;
}

export function fromDb(
  row
) {
  return normalizeProduct(row);
}

function findHeader(
  rows,
  names
) {
  const header =
    (rows[0] || []).map(
      normalizeText
    );

  return header.findIndex(
    (cell) =>
      names.some(
        (name) =>
          cell ===
          normalizeText(name)
      )
  );
}

function buildCandidateMaps(
  products
) {
  const byId =
    new Map();

  const byExact =
    new Map();

  const byCodePresentation =
    new Map();

  const byCodeName =
    new Map();

  const byCode =
    new Map();

  const add = (
    map,
    key,
    product
  ) => {
    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(
      product
    );
  };

  for (
    const product of
    products
  ) {
    if (product.id) {
      byId.set(
        String(
          product.id
        ),
        product
      );
    }

    add(
      byExact,
      productIdentityKey(
        product
      ),
      product
    );

    add(
      byCodePresentation,
      [
        product.codigo,
        normalizePresentation(
          product.presentacion
        )
      ]
        .map(normalizeText)
        .join('|'),
      product
    );

    add(
      byCodeName,
      [
        product.codigo,
        product.nombre
      ]
        .map(normalizeText)
        .join('|'),
      product
    );

    add(
      byCode,
      normalizeText(
        product.codigo
      ),
      product
    );
  }

  return {
    byId,
    byExact,
    byCodePresentation,
    byCodeName,
    byCode
  };
}

function firstUnused(
  list = [],
  usedIds
) {
  return (
    list.find(
      (product) =>
        product.id &&
        !usedIds.has(
          String(
            product.id
          )
        )
    ) || null
  );
}

export async function parseExcel(
  file,
  currentProducts = []
) {
  const buffer =
    await file.arrayBuffer();

  const workbook =
    XLSX.read(
      buffer,
      {
        type: 'array'
      }
    );

  const sheetName =
    workbook.SheetNames.find(
      (name) =>
        normalizeText(name) ===
        'lista de precios'
    ) ||
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      'El archivo no contiene hojas.'
    );
  }

  const raw =
    XLSX.utils.sheet_to_json(
      workbook.Sheets[
        sheetName
      ],
      {
        header: 1,
        defval: ''
      }
    );

  if (!raw.length) {
    throw new Error(
      'La hoja está vacía.'
    );
  }

  const systemId =
    findHeader(
      raw,
      [
        'ID Sistema',
        'ID interno',
        'System ID'
      ]
    );

  const code =
    findHeader(
      raw,
      [
        'Código',
        'Codigo'
      ]
    );

  const name =
    findHeader(
      raw,
      [
        'Producto',
        'Nombre',
        'Descripción',
        'Descripcion'
      ]
    );

  const presentation =
    findHeader(
      raw,
      [
        'Presentación',
        'Presentacion'
      ]
    );

  const rubro =
    findHeader(
      raw,
      [
        'Rubro',
        'Categoría',
        'Categoria'
      ]
    );

  const section =
    findHeader(
      raw,
      [
        'Sección',
        'Seccion'
      ]
    );

  const stock =
    findHeader(
      raw,
      [
        'Stock',
        'Existencia',
        'Existencias'
      ]
    );

  const listPrice =
    findHeader(
      raw,
      [
        'Precio de lista',
        'Precio lista'
      ]
    );

  const discount =
    findHeader(
      raw,
      [
        'Descuento'
      ]
    );

  const withoutVat =
    findHeader(
      raw,
      [
        'Precio S/IVA',
        'Precio S IVA',
        'Precio sin IVA'
      ]
    );

  const withVat =
    findHeader(
      raw,
      [
        'Precio C/IVA',
        'Precio C IVA',
        'Precio con IVA'
      ]
    );

  if (
    code < 0 ||
    name < 0 ||
    (
      listPrice < 0 &&
      withoutVat < 0
    )
  ) {
    throw new Error(
      'El Excel debe tener Código, Producto y Precio de lista o Precio S/IVA.'
    );
  }

  const maps =
    buildCandidateMaps(
      currentProducts
    );

  const usedIds =
    new Set();

  return raw
    .slice(1)
    .map((row) => {
      const codigo =
        String(
          row[code] || ''
        ).trim();

      const nombre =
        String(
          row[name] || ''
        ).trim();

      if (
        !codigo ||
        !nombre
      ) {
        return null;
      }

      const normalizedPresentation =
        normalizePresentation(
          presentation >= 0
            ? row[presentation]
            : ''
        );

      const explicitId =
        systemId >= 0
          ? String(
              row[systemId] ||
                ''
            ).trim()
          : '';

      let old =
        explicitId &&
        maps.byId.get(
          explicitId
        ) &&
        !usedIds.has(
          explicitId
        )
          ? maps.byId.get(
              explicitId
            )
          : null;

      /*
       * 1. Busca:
       * código + descripción
       * + presentación.
       */
      if (!old) {
        old =
          firstUnused(
            maps.byExact.get(
              productIdentityKey({
                codigo,
                nombre,
                presentacion:
                  normalizedPresentation
              })
            ),
            usedIds
          );
      }

      /*
       * 2. Código +
       * presentación.
       *
       * Solo si el resultado
       * es inequívoco.
       */
      if (!old) {
        const key =
          [
            codigo,
            normalizedPresentation
          ]
            .map(
              normalizeText
            )
            .join('|');

        const candidates =
          (
            maps.byCodePresentation.get(
              key
            ) || []
          ).filter(
            (product) =>
              product.id &&
              !usedIds.has(
                String(
                  product.id
                )
              )
          );

        if (
          candidates.length ===
          1
        ) {
          old =
            candidates[0];
        }
      }

      /*
       * 3. Código +
       * descripción.
       */
      if (!old) {
        const key =
          [
            codigo,
            nombre
          ]
            .map(
              normalizeText
            )
            .join('|');

        const candidates =
          (
            maps.byCodeName.get(
              key
            ) || []
          ).filter(
            (product) =>
              product.id &&
              !usedIds.has(
                String(
                  product.id
                )
              )
          );

        if (
          candidates.length ===
          1
        ) {
          old =
            candidates[0];
        }
      }

      /*
       * 4. Código solamente.
       *
       * IMPORTANTE:
       *
       * únicamente se usa
       * cuando ese código
       * identifica un único
       * producto pendiente.
       *
       * Si hay códigos
       * repetidos, no elige
       * ninguno al azar.
       */
      if (!old) {
        const candidates =
          (
            maps.byCode.get(
              normalizeText(
                codigo
              )
            ) || []
          ).filter(
            (product) =>
              product.id &&
              !usedIds.has(
                String(
                  product.id
                )
              )
          );

        if (
          candidates.length ===
          1
        ) {
          old =
            candidates[0];
        }
      }

      if (old?.id) {
        usedIds.add(
          String(old.id)
        );
      }

      old = old || {};

      const finalPresentation =
        presentation >= 0
          ? normalizedPresentation
          : normalizePresentation(
              old.presentacion
            );

      const descuento =
        discount >= 0
          ? normalizeDiscount(
              row[discount]
            )
          : normalizeDiscount(
              old.descuento ||
                0
            );

      const precioLista =
        listPrice >= 0
          ? parseNumber(
              row[listPrice]
            )
          : parseNumber(
              row[withoutVat]
            );

      const sinIvaCelda =
        withoutVat >= 0
          ? parseNumber(
              row[withoutVat]
            )
          : precioLista;

      const sinIvaBase =
        descuento > 0 &&
        sinIvaCelda > 0 &&
        sinIvaCelda <
          precioLista
          ? sinIvaCelda /
            (1 - descuento)
          : sinIvaCelda;

      const conIvaCelda =
        withVat >= 0
          ? parseNumber(
              row[withVat]
            )
          : sinIvaBase *
            (1 + IVA);

      const conIvaBase =
        descuento > 0 &&
        conIvaCelda > 0 &&
        conIvaCelda <
          sinIvaBase *
            (1 + IVA)
          ? conIvaCelda /
            (1 - descuento)
          : conIvaCelda;

      return normalizeProduct({
        id:
          old.id ||
          null,

        codigo,

        nombre,

        presentacion:
          finalPresentation,

        rubro:
          rubro >= 0
            ? row[rubro]
            : old.rubro,

        seccion:
          section >= 0
            ? row[section]
            : old.seccion,

        precioLista:
          precioLista ||
          sinIvaBase,

        precioSinIva:
          sinIvaBase,

        precioConIva:
          conIvaBase,

        descuento,

        precioSinIvaDescuento:
          descuento > 0
            ? sinIvaBase *
              (1 - descuento)
            : 0,

        precioConIvaDescuento:
          descuento > 0
            ? conIvaBase *
              (1 - descuento)
            : 0,

        stock:
          stock >= 0 &&
          row[stock] !== ''
            ? parseNumber(
                row[stock]
              )
            : old.stock,

        activo: true,

        origen:
          'IMPORTADO EXCEL'
      });
    })
    .filter(Boolean);
}

export function exportExcel(
  products,
  filename = 'POLCARFER - Lista de Precios.xlsx'
) {
  const rows = products.map((p) => ({
    'Código': p.codigo,
    'Producto': p.nombre,
    'Presentación': normalizePresentation(
      p.presentacion
    ),
    'Precio de lista': Number(
      p.precioLista || 0
    ),
    'Descuento': Number(
      p.descuento || 0
    ),
    'Precio S/IVA': Number(
      finalSinIva(p) || 0
    ),
    'Precio C/IVA': Number(
      finalConIva(p) || 0
    )
  }));

  const ws =
    XLSX.utils.json_to_sheet(rows);

  /*
   * Ancho de columnas
   */
  ws['!cols'] = [
    { wch: 16 }, // Código
    { wch: 55 }, // Producto
    { wch: 24 }, // Presentación
    { wch: 18 }, // Precio lista
    { wch: 14 }, // Descuento
    { wch: 18 }, // S/IVA
    { wch: 18 }  // C/IVA
  ];

  /*
   * Filtro en encabezados
   */
  if (ws['!ref']) {
    ws['!autofilter'] = {
      ref: ws['!ref']
    };
  }

  /*
   * Formato de precios y descuento
   */
  const range =
    XLSX.utils.decode_range(
      ws['!ref']
    );

  for (
    let row = 1;
    row <= range.e.r;
    row++
  ) {
    /*
     * D = Precio de lista
     * E = Descuento
     * F = Precio S/IVA
     * G = Precio C/IVA
     */

    const precioLista =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 3
        })
      ];

    const descuento =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 4
        })
      ];

    const sinIva =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 5
        })
      ];

    const conIva =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 6
        })
      ];

    if (precioLista) {
      precioLista.z =
        '$ #,##0.00';
    }

    if (descuento) {
      descuento.z =
        '0%';
    }

    if (sinIva) {
      sinIva.z =
        '$ #,##0.00';
    }

    if (conIva) {
      conIva.z =
        '$ #,##0.00';
    }
  }

  const wb =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    'Lista de Precios'
  );

  XLSX.writeFile(
    wb,
    filename
  );
}


/*
 * EXPORTACIÓN INTERNA PARA SOCIOS
 *
 * Esta sí conserva ID Sistema,
 * rubro, sección y stock para
 * poder volver a importar el archivo.
 */
export function exportAdminExcel(
  products,
  filename = 'POLCARFER - Catalogo Interno.xlsx'
) {
  const rows = products.map((p) => ({
    'ID Sistema': p.id || '',
    'Código': p.codigo,
    'Producto': p.nombre,
    'Presentación':
      normalizePresentation(
        p.presentacion
      ),
    'Rubro': p.rubro,
    'Sección': p.seccion,
    'Stock': p.stock ?? '',
    'Precio de lista':
      p.precioLista,
    'Descuento':
      p.descuento,
    'Precio S/IVA':
      finalSinIva(p),
    'Precio C/IVA':
      finalConIva(p)
  }));

  const ws =
    XLSX.utils.json_to_sheet(
      rows
    );

  ws['!cols'] = [
    { wch: 38 },
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
    ws['!autofilter'] = {
      ref: ws['!ref']
    };
  }

  const wb =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    'Lista de Precios'
  );

  XLSX.writeFile(
    wb,
    filename
  );
}

export function downloadJson(
  products
) {
  const blob =
    new Blob(
      [
        JSON.stringify(
          products,
          null,
          2
        )
      ],
      {
        type: 'application/json'
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      'a'
    );

  anchor.href = url;

  anchor.download =
    'productos.json';

  anchor.click();

  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    500
  );
}