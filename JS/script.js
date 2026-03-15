document.addEventListener('DOMContentLoaded', async () => {

    // --- ¡CONFIGURACIÓN CLAVE! ---
    // Pega aquí los datos que guardaste de JSONBin.io
    const BIN_ID = '69b609c8c3097a1dd526f2bf'; // <-- REEMPLAZA CON TU BIN ID REAL
    const API_KEY = '$2a$10$UHqGJu3C4D/LhxdCp6rBLO0fe91puZ.LNA2CxAe/Xs.On26cSec3y'; // <-- REEMPLAZA CON TU X-MASTER-KEY
    
    // Define tu contraseña secreta para la página de socios
    const SOCIO_PASSWORD = 'polcarferadmin2026'; // <-- ¡CÁMBIALA POR UNA TUYA!

    // Función para obtener productos desde la nube
    async function getProducts() {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`);
            if (!response.ok) throw new Error('No se pudo cargar la lista de productos.');
            const data = await response.json();
            return data.record; // En JSONBin, los datos están dentro de "record"
        } catch (error) {
            console.error('Error al obtener productos:', error);
            document.body.innerHTML = `<h1>Error de conexión</h1><p>No se pudo cargar la lista de productos. Por favor, intente más tarde.</p>`;
            return []; // Devuelve una lista vacía en caso de error
        }
    }

    const pageId = document.body.id;
    const productos = await getProducts(); // Carga productos desde la nube UNA VEZ al iniciar

    // Lógica del menú móvil
    const hamburger = document.querySelector('.hamburger-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => { mobileNav.classList.toggle('active'); });
    }
    
    // Lógica del carrusel de inicio
    // ... (sin cambios, se omite por brevedad)

    if (pageId === 'page-pedidos') {
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = '';
        productos.forEach(producto => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const imageUrl = producto.imagen || '';
            card.innerHTML = `<img src="${imageUrl}" alt="${producto.nombre}" onerror="this.src='https://via.placeholder.com/300x200/555/FFC107?text=Sin+Imagen'"><div class="product-card-content"><h3>${producto.nombre}</h3><p class="price">$${(producto.precio || 0).toLocaleString('es-AR')}</p><button class="btn add-to-cart" data-codigo="${producto.codigo}">Agregar al Carrito</button></div>`;
            productGrid.appendChild(card);
        });
        
        // Lógica completa del carrito que ya funciona
        // ... (se omite por brevedad, usa la versión completa anterior)
    }

    if (pageId === 'page-lista-precios') {
        const tableBody = document.querySelector('#price-table tbody');
        const loginSection = document.getElementById('login-section');
        const adminPanel = document.getElementById('admin-panel');
        const loginForm = document.getElementById('login-form');
        const passwordInput = document.getElementById('password-input');
        const uploadButton = document.getElementById('upload-btn');
        const fileInput = document.getElementById('excel-file');

        function renderPriceList(data) {
            tableBody.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${item.codigo || 'N/A'}</td><td>${item.nombre || 'N/A'}</td><td>$${item.precio ? item.precio.toLocaleString('es-AR') : 'N/A'}</td>`;
                tableBody.appendChild(row);
            });
        }
        renderPriceList(productos);

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (passwordInput.value === SOCIO_PASSWORD) {
                loginSection.style.display = 'none';
                adminPanel.style.display = 'block';
            } else {
                alert('Contraseña incorrecta.');
            }
        });

        uploadButton.addEventListener('click', () => {
            if (fileInput.files.length === 0) { return alert('Por favor, selecciona un archivo Excel.'); }
            const reader = new FileReader();
            reader.onload = async function(event) {
                try {
                    uploadButton.disabled = true;
                    uploadButton.innerText = 'Actualizando...';
                    
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    const nuevosProductos = jsonData.map(row => ({
                        codigo: row.Código,
                        nombre: row.Descripción || 'Sin nombre',
                        precio: parseFloat(String(row.Precio).replace(/\D/g, '')) || 0,
                        imagen: `imagenes/${row.Código}.jpg`
                    }));

                    // ¡ACTUALIZAR LA BASE DE DATOS EN LA NUBE!
                    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Master-Key': API_KEY
                        },
                        body: JSON.stringify(nuevosProductos)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Error del servidor: ${errorData.message}`);
                    }

                    alert('¡Base de datos actualizada con éxito para todos los usuarios! La página se recargará.');
                    window.location.reload();

                } catch (error) {
                    console.error("Error:", error);
                    alert(`Hubo un error al actualizar: ${error.message}`);
                    uploadButton.disabled = false;
                    uploadButton.innerText = 'Subir y Actualizar Catálogo';
                }
            };
            reader.readAsArrayBuffer(fileInput.files[0]);
        });
    }
    
    // Pega aquí la lógica del carrito de la página de pedidos
    // para asegurar que esté completa.
});
