var express = require('express');
var router = express.Router();

// ##########################################
// ## 1. RUTA DE INICIO (CON MARCADOR VIVO) ##
// ##########################################
router.get('/', function(req, res, next) {
    res.render('index', { 
        title: 'Club Deportivo Sintrainagro - Inicio',
        // SUGERENCIA: Cambia estos valores cuando haya partidos reales
        marcadorEnVivo: 'Club Las Potras 2 - 1 Deportivo Poderosa',
        estadoPartido: 'EN VIVO' // Puede ser 'EN VIVO', 'FINALIZADO' o 'PRÓXIMO'
    });
});

// ##########################################
// ## 2. SECCIÓN DEPORTIVA URABÁ           ##
// ##########################################

/* Fútbol Masculino 2025 S1 */
router.get('/uraba/2025_s1', function(req, res, next) {
    res.render('uraba/2025_s1', { 
        title: 'Club deportivo Sintrainagro - 2025'
    }); 
});

/* Fútbol Femenino */
router.get('/uraba/femenino', function(req, res, next) {
    res.render('uraba/femenino', { 
        title: 'Torneo Femenino Sintrainagro - 2025'
    }); 
});

/* Baloncesto */
router.get('/uraba/baloncesto', function(req, res, next) {
    res.render('uraba/baloncesto', { title: 'Urabá - Baloncesto' }); 
});

// ##########################################
// ## 3. GIMNASIO CEREBRAL (JUEGOS)        ##
// ##########################################

/* Inicio de Juegos */
router.get('/juegos', (req, res) => {
    res.render('juegos_inicio', { title: 'Gimnasio Cerebral | Sintrainagro' });
});

/* Memorama */
router.get('/juegos/memorama', function(req, res, next) {
    res.render('juegos/memorama', { 
        title: 'Mini-Cerebros - 2025'
    }); 
});

/* Calculadora de Ejercicios / Fitness */
router.get('/juegos/calculadora', function(req, res, next) {
    res.render('juegos/calculadora', { 
        title: 'Calculadora de Ejercicios'
    }); 
});

/* Quinielas y Pronósticos */
router.get('/juegos/pronosticos', (req, res) => {
    const locals = {
        title: 'Quinielas - Pronósticos | Sintrainagro',
        query: req.query // Captura ?status=success para mostrar mensajes de confirmación
    };
    res.render('juegos/pronosticos', locals);
});

// ##########################################
// ## 4. SALUD INTEGRAL                    ##
// ##########################################

router.get('/salud/inicio', (req, res) => {
    res.render('salud/salud_inicio', {
        title: 'Salud Integral | Sintrainagro' 
    }); 
});

router.get('/salud/nutricion', (req, res) => {
    res.render('salud/nutricion', { title: 'Nutrición y Energía | Sintrainagro' });
});

router.get('/salud/lesiones', (req, res) => {
    res.render('salud/lesiones', { title: 'Prevención de Lesiones | Sintrainagro' });
});

router.get('/salud/bienestar', (req, res) => {
    res.render('salud/bienestar', { title: 'Bienestar Mental y Sueño | Sintrainagro' });
});

module.exports = router;