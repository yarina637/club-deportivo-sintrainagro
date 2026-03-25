const router = require('express').Router(); // Usamos express.Router

// La función calcularPuntos y la lógica de base de datos fueron movidas
// al cliente (pronosticos.ejs) para aprovechar la conexión a Firestore inyectada
// y el guardado en tiempo real.

// RUTA POST: Recibe la solicitud del cliente y redirige, 
// asumiendo que el cliente ya ha guardado los datos en Firestore.
router.post('/api/guardar-pronosticos', (req, res) => {
    
    // NOTA: El cliente ya guardó los datos en Firestore y calculó los puntos.
    // Esta ruta solo maneja la redirección de vuelta al juego.
    
    // 1. Opcional: Log del servidor (ya no se calcula aquí)
    console.log('-------------------------------------------');
    console.log('✅ POST Recibido: El cliente completó la persistencia en Firestore.');
    console.log(`Datos recibidos del formulario (solo para referencia):`, req.body);
    console.log('-------------------------------------------');

    // 2. Redirige al usuario a la página de pronósticos con un mensaje de éxito
    res.redirect('/juegos/pronosticos?status=success'); 
});


// RUTA GET: Renderiza la vista principal de pronósticos y pasa las variables globales.
router.get('/', (req, res) => {
    // Estas variables son cruciales para que el código de Firebase del cliente se conecte
    res.render('juegos/pronosticos', {
        title: 'Quinielas de Pronósticos - Sintrainagro',
        // Variables globales inyectadas en la vista EJS
        __initial_auth_token: req.initialAuthToken || null, 
        __firebase_config: req.firebaseConfig || null,
        __app_id: req.appId || 'default-app-id'
    });
});

// CAMBIO CLAVE: Exportamos solo el objeto router.
module.exports = router;