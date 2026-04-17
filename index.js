const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const app = express();

// --- 1. CONFIGURACIÓN DE ALMACENAMIENTO (MULTER) ---
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 2. CONFIGURACIÓN DE SEGURIDAD ---
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

function revisarAcceso(req, res, next) {
    const auth = { login: ADMIN_USER, password: ADMIN_PASS };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Acceso Privado"');
    res.status(401).send('Acceso denegado. Se requiere contraseña.');
}

// --- 3. CONFIGURACIONES GENERALES ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// PÓNLA AQUÍ (Para probar que funcione)
app.get('/nosotros', (req, res) => {
    res.render('nosotros');
});

// --- 4. CONEXIÓN A LA BASE DE DATOS ---
const db = mysql.createPool({
  host: process.env.DB_HOST,      // Aquí busca el cuadro llamado DB_HOST
  user: process.env.DB_USER,      // Aquí busca el cuadro llamado DB_USER
  password: process.env.DB_PASSWORD, // Aquí busca el cuadro llamado DB_PASSWORD
  database: process.env.DB_NAME,     // Aquí busca el cuadro llamado DB_NAME
  waitForConnections: true,
  connectionLimit: 10
});

// Para verificar la conexión en un Pool:
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos: ' + err.message);
        return;
    }
    console.log('✅ ¡Conexión exitosa al Pool de la base de datos!');
    connection.release(); // Muy importante: libera la conexión de prueba
});



// --- TRUCO TEMPORAL PARA CREAR LA COLUMNA EN LA NUBE ---
db.query("ALTER TABLE noticias ADD COLUMN IF NOT EXISTS fecha DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
    if (err) console.log("Nota: Tal vez la columna ya existía o hubo un aviso.");
    else console.log("✅ Columna 'fecha' verificada/creada en la nube de Aiven");
});



// --- 5. RUTAS ADMINISTRATIVAS (PROTEGIDAS) ---
app.get('/noticia/:id', (req, res) => {
    const noticiaId = req.params.id; // Esto captura el "7" de la URL

    // 1. Buscamos la noticia en la base de datos
    const sql = 'SELECT * FROM noticias WHERE id = ?';
    
    db.query(sql, [noticiaId], (err, result) => {
        if (err) {
            console.error("Error en la base de datos:", err);
            return res.status(500).send("Error interno");
        }

        if (result.length > 0) {
            // 2. Si existe, mostramos la página de detalle que creamos
            // IMPORTANTE: El primer parámetro es el nombre del archivo .ejs
            res.render('noticia', { noticia: result[0] });
        } else {
            // 3. Si no existe la noticia 7, volvemos al inicio
            res.redirect('/publico');
        }
    });
});

app.get('/admin', revisarAcceso, (req, res) => {
    // Consultamos noticias y partidos al mismo tiempo
    const sqlNoticias = 'SELECT * FROM noticias ORDER BY id DESC';
    const sqlPartidos = 'SELECT * FROM partidos ORDER BY fecha_hora ASC';

    db.query(sqlNoticias, (err, noticias) => {
        if (err) throw err;
        db.query(sqlPartidos, (err, partidos) => {
            if (err) throw err;
            // Enviamos ambos resultados a la vista
            res.render('admin', { noticias: noticias, partidos: partidos });
        });
    });
});

// Goleadores (UNIFICADO)
app.post('/admin/goleador', revisarAcceso, (req, res) => {
    const { nombre, finca, goles, categoria } = req.body;
    const query = `INSERT INTO goleadores (nombre_jugador, finca, goles, categoria) VALUES (?, ?, ?, ?) 
                   ON DUPLICATE KEY UPDATE goles = VALUES(goles), finca = VALUES(finca), categoria = VALUES(categoria)`;
    db.query(query, [nombre, finca, goles, categoria], (err) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});

// Posiciones (UNIFICADO)
app.post('/admin/posiciones', revisarAcceso, (req, res) => {
    const { equipo, categoria, pj, pg, pe, pp, gf, gc, puntos } = req.body;
    const query = `INSERT INTO posiciones (equipo, categoria, pj, pg, pe, pp, gf, gc, puntos) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                   ON DUPLICATE KEY UPDATE 
                   categoria=VALUES(categoria), pj=VALUES(pj), pg=VALUES(pg), 
                   pe=VALUES(pe), pp=VALUES(pp), gf=VALUES(gf), gc=VALUES(gc), puntos=VALUES(puntos)`;
    db.query(query, [equipo, categoria, pj, pg, pe, pp, gf, gc, puntos], (err) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});

// Función necesaria para que funcionen las rutas de galería
function agruparPorFinca(results) {
    return results.reduce((acc, foto) => {
        (acc[foto.finca] = acc[foto.finca] || []).push(foto);
        return acc;
    }, {});
}
// Galería (UNIFICADO)
app.post('/subir-galeria', revisarAcceso, upload.single('imagen'), (req, res) => {
    const { nombre_equipo, finca, categoria } = req.body;
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
    db.query('INSERT INTO galeria (nombre_equipo, finca, imagen_url, categoria) VALUES (?, ?, ?, ?)', 
    [nombre_equipo, finca, imagen_url, categoria], (err) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});

// Noticias
app.post('/subir', revisarAcceso, upload.single('imagen'), (req, res) => {
    const { titulo, contenido, destacada, categoria } = req.body; 
    const imagen_url = req.file ? '/uploads/' + req.file.filename : null;
    const esDestacada = destacada === "1" ? 1 : 0;

    // INTENTO 1: Sin incluir la columna fecha (dejamos que la DB la ponga sola)
    const query = 'INSERT INTO noticias (titulo, contenido, imagen_url, destacada, categoria) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [titulo, contenido, imagen_url, esDestacada, categoria], (err) => {
        if (err) {
            console.error("❌ Error al subir noticia:", err);
            // Si falla porque realmente FALTA la fecha en la lógica de la vista,
            // aquí podrías manejarlo, pero para el INSERT, esto es lo más seguro.
            return res.status(500).send("Error al guardar noticia");
        }
        console.log("✅ Noticia guardada con éxito (sin forzar columna fecha)");
        res.redirect('/admin');
    });
});

app.post('/eliminar/:id', revisarAcceso, (req, res) => {
    const id = req.params.id;
    db.query('SELECT imagen_url FROM noticias WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        if (result.length > 0 && result[0].imagen_url) {
            const pathCompleto = path.join(__dirname, 'public', result[0].imagen_url);
            if (fs.existsSync(pathCompleto)) fs.unlinkSync(pathCompleto);
        }
        db.query('DELETE FROM noticias WHERE id = ?', [id], (err) => {
            if (err) throw err;
            res.redirect('/admin');
        });
    });
});

// Suscriptores
app.get('/admin/suscriptores', revisarAcceso, (req, res) => {
    db.query('SELECT * FROM suscriptores ORDER BY id DESC', (err, resultado) => {
        if (err) throw err;
        res.render('admin_suscriptores', { lista: resultado });
    });
});

app.post('/admin/eliminar-suscriptor/:id', revisarAcceso, (req, res) => {
    db.query('DELETE FROM suscriptores WHERE id = ?', [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/admin/suscriptores');
    });
});

// --- 6. RUTAS PÚBLICAS ---

app.get('/calendario', (req, res) => {
    // Traemos todos los partidos ordenados por fecha
    const sql = "SELECT * FROM partidos ORDER BY fecha_hora ASC";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('calendario', { partidos: results });
    });
});

app.get('/goleadores', (req, res) => {
    db.query('SELECT * FROM goleadores ORDER BY goles DESC', (err, lista) => {
        if (err) throw err;
        res.render('goleadores', { lista });
    });
});

app.get('/posiciones', (req, res) => {
    const query = 'SELECT *, (gf - gc) AS dg FROM posiciones ORDER BY categoria ASC, puntos DESC, dg DESC';
    db.query(query, (err, equipos) => {
        if (err) throw err;
        res.render('posiciones', { equipos });
    });
});

// RUTA ÚNICA PARA GALERÍA (Maneja Masculino y Femenino)
app.get('/galeria/:categoria', (req, res) => {
    // Convertimos la primera letra a Mayúscula para que coincida con la DB (ej: 'femenino' -> 'Femenino')
    const catParam = req.params.categoria;
    const categoriaFormateada = catParam.charAt(0).toUpperCase() + catParam.slice(1).toLowerCase();
    
    const sql = "SELECT * FROM galeria WHERE categoria = ? ORDER BY finca ASC";

    db.query(sql, [categoriaFormateada], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error en la base de datos");
        }

        // Lógica de agrupación (Reemplaza a la función que te faltaba)
        const fotosPorFinca = results.reduce((acc, foto) => {
            (acc[foto.finca] = acc[foto.finca] || []).push(foto);
            return acc;
        }, {});

        // Renderizamos enviando SIEMPRE el título para que no de error
        res.render('galeria', { 
            fotosPorFinca: fotosPorFinca, 
            titulo: `Torneo ${categoriaFormateada}`,
            categoriaActual: categoriaFormateada 
        });
    });
});

app.post('/suscribir', (req, res) => {
    const { nombre, finca, correo, whatsapp } = req.body;

    const query = `INSERT INTO suscriptores (nombre, finca, correo, whatsapp) VALUES (?, ?, ?, ?) 
                   ON DUPLICATE KEY UPDATE 
                   nombre = VALUES(nombre), 
                   finca = VALUES(finca), 
                   whatsapp = VALUES(whatsapp)`;

    db.query(query, [nombre, finca, correo, whatsapp], (err) => {
        if (err) {
            console.error("❌ Error al suscribir:", err);
            return res.send("Error al procesar la suscripción.");
        }
        res.send(`
            <script>
                alert('¡Listo ${nombre}! Te mantendremos informado por WhatsApp y correo.');
                window.location.href = '/publico';
            </script>
        `);
    });
});

app.get('/galeria', (req, res) => {
    res.redirect('/galeria/masculino'); 
});

// Galería Masculina
app.get('/galeria/masculino', (req, res) => {
    const sql = "SELECT * FROM galeria WHERE categoria = 'Masculino' ORDER BY finca ASC";
    db.query(sql, (err, results) => {
        if (err) throw err;
        const fotosPorFinca = agruparPorFinca(results);
        res.render('galeria', { fotosPorFinca, titulo: 'Torneo Masculino', categoriaActual: 'Masculino' });
    });
});

// Galería Femenina
app.get('/galeria/femenino', (req, res) => {
    const sql = "SELECT * FROM galeria WHERE categoria = 'Femenino' ORDER BY finca ASC";
    db.query(sql, (err, results) => {
        if (err) throw err;
        const fotosPorFinca = agruparPorFinca(results);
        res.render('galeria', { fotosPorFinca, titulo: 'Torneo Femenino', categoriaActual: 'Femenino' });
    });
});

// Ruta para procesar el formulario de partidos
app.post('/admin/partido', revisarAcceso, (req, res) => {
    const { equipo_local, equipo_visitante, fecha_hora, lugar, categoria } = req.body;
    const query = 'INSERT INTO partidos (equipo_local, equipo_visitante, fecha_hora, lugar, categoria) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [equipo_local, equipo_visitante, fecha_hora, lugar, categoria], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error al guardar el partido");
        }
        res.redirect('/admin');
    });
});

// Ruta para ELIMINAR partidos
app.post('/admin/eliminar-partido/:id', revisarAcceso, (req, res) => {
    db.query('DELETE FROM partidos WHERE id = ?', [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});

//RESULTADOS
// Ruta para procesar la actualización del marcador
// RUTA PARA VER EL PANEL DE RESULTADOS
// Ejemplo de la ruta que renderiza esta página
app.get('/admin_partidos', (req, res) => {
    const query = "SELECT * FROM partidos ORDER BY fecha_hora DESC";
    db.query(query, (err, results) => {
        if (err) throw err;
        // IMPORTANTE: El nombre 'partidos' aquí debe coincidir con el del .ejs
        res.render('admin_partidos', { partidos: results });
    });
});

// RUTA PARA PROCESAR LA ACTUALIZACIÓN DEL MARCADOR
app.post('/actualizar-resultado/:id', (req, res) => {
    const { id } = req.params;
    const { goles_local, goles_visitante } = req.body;

    const sql = "UPDATE partidos SET goles_local = ?, goles_visitante = ? WHERE id = ?";
    
    db.query(sql, [goles_local, goles_visitante, id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error");
        }
        // CAMBIA ESTA LÍNEA por la URL que te funcionó en el navegador
        res.redirect('/admin_partidos'); 
    });
})
// CONTADOR DE VISITAS (Versión Corregida con Callbacks)
// ESTA ES LA QUE SE QUEDA (Al final del archivo)
app.get('/publico', (req, res) => {
    // 1. Consultamos las noticias directamente
    const sqlNoticias = 'SELECT * FROM noticias ORDER BY destacada DESC, id DESC';
    db.query(sqlNoticias, (err, noticias) => {
        if (err) {
            console.error("Error al cargar noticias:", err);
            return res.status(500).send("Error cargando noticias");
        }

        // 2. Consultamos los partidos
        db.query('SELECT * FROM partidos ORDER BY fecha_hora ASC', (err, partidos) => {
            if (err) {
                console.error("Error al cargar partidos:", err);
                return res.status(500).send("Error cargando partidos");
            }

            // 3. Renderizamos sin el contador por ahora
            res.render('publico', { 
                noticias: noticias, 
                partidos: partidos, 
                visitas: 0 // Ponemos 0 fijo para que no dé error la vista
            });
        });
    });
});


// --- NUEVA RUTA: IDENTIDAD ---
app.get('/nosotros', (req, res) => {
    res.render('nosotros'); 
});

// --- 7. INICIO DEL SERVIDOR ---
// Cambia esto:
// app.listen(3000, () => { ... });

// Busca esto al final de tu index.js
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor funcionando en http://localhost:${PORT}`);
});
