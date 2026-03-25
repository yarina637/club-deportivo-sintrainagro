// index.js
var express = require('express');
var router = express.Router();

/* GET Uraba 2025 S1 page. */
router.get('/uraba/registro', function(req, res, next) {
  // DEBES enviar el objeto con la variable 'title'
  res.render('uraba/registro', { 
      title: 'Registrarse ' // <-- ¡Esto es crucial!
  }); 
});


module.exports = router;


