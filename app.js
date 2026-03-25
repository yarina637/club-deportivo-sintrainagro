var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var createError = require('http-errors'); 

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var juegosRouter = require('./routes/juegos'); // Importa el router de juegos
// AÑADE ESTA LÍNEA para importar el nuevo router de pronósticos
var pronosticosApiRouter = require('./routes/pronosticos-api'); 

var app = express();

// ######################################################
// ## 1. CONFIGURACIÓN DEL MOTOR DE VISTAS (CRÍTICO) ##
// ######################################################

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').__express); 


// ######################################################
// ## 2. MIDDLEWARE GENERAL Y ARCHIVOS ESTÁTICOS ##
// ######################################################

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// ######################################################
// ## 3. DEFINICIÓN DE RUTAS (TODOS LOS app.use() y app.get()) ##
// ######################################################

// Rutas principales y generales
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/juegos', juegosRouter); 

// AÑADE ESTA LÍNEA para montar la ruta de pronósticos
// Ahora, cualquier ruta definida como '/' dentro de pronosticos-api.js se convertirá en '/juegos/pronosticos'
app.use('/juegos/pronosticos', pronosticosApiRouter); // <-- ¡LA SOLUCIÓN!

// 🚀 RUTA DE LA GALERÍA
app.get('/uraba/galeria-fincas', (req, res) => {
    res.render('uraba/galeria-fincas'); 
});


// ######################################################
// ## 4. MANEJO DE ERRORES (catch 404 y error handler) ##
// ######################################################

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});


module.exports = app;