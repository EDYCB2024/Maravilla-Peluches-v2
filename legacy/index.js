const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory to access Stitch folders
app.use(express.static(path.join(__dirname)));

// Specific routes to easily access the exported HTML files
app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'panel_de_administraci_n_escritorio', 'code.html'));
});

app.get('/cat_logo', (req, res) => {
    res.sendFile(path.join(__dirname, 'cat_logo_de_peluches_escritorio', 'code.html'));
});

// Default route
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>SoftBoutique - Vista Previa</title>
                <style>
                    body { font-family: 'Inter', sans-serif; background: #f7f6f3; padding: 50px; text-align: center; }
                    .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    h1 { color: #923f5f; }
                    a { display: block; margin: 10px 0; color: #923f5f; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>SoftBoutique</h1>
                    <p>Seleccione una vista para previsualizar las exportaciones de Stitch:</p>
                    <a href="/panel">Panel de Administración</a>
                    <a href="/cat_logo">Catálogo de Productos</a>
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`- Admin Panel: http://localhost:${PORT}/panel`);
    console.log(`- Product Catalog: http://localhost:${PORT}/cat_logo`);
});
