const router = require('express').Router(); // Usamos express.Router

/**
 * Función que compara los resultados pronosticados con los resultados reales 
 * y calcula el puntaje total.
 * * Reglas de Puntuación:
 * - Resultado Exacto (Ej: Pronostico 2-1, Real 2-1): 3 PUNTOS
 * - Ganador o Empate Correcto (Ej: Pronostico 2-0, Real 3-1): 1 PUNTO
 * * @param {object} pronosticos - Objeto con los pronósticos del usuario (e.g., {score_1_local: '3', score_1_visitante: '1', ...})
 * @returns {number} Puntuación total obtenida.
 */
function calcularPuntos(pronosticos) {
    let puntosTotales = 0;

    // SIMULACIÓN DE RESULTADOS REALES DE LA JORNADA
    // NOTA: En un entorno real, estos resultados deben venir de una base de datos o API cuando se hayan jugado los partidos.
    const resultadosReales = {
        'partido_1': { local: 2, visitante: 1 }, // Atléticas 2 - 1 Poderosas
        'partido_2': { local: 0, visitante: 0 }, // Las Potras 0 - 0 Amazonas
        'partido_3': { local: 3, visitante: 2 }  // Club Deportivo 3 - 2 Los Leones
    };

    // Estructura de los pronósticos enviados por el formulario
    const partidos = [
        { id: 'partido_1', local: 'score_1_local', visitante: 'score_1_visitante' },
        { id: 'partido_2', local: 'score_2_local', visitante: 'score_2_visitante' },
        { id: 'partido_3', local: 'score_3_local', visitante: 'score_3_visitante' },
    ];

    partidos.forEach(partido => {
        // Asegurarse de que los valores sean números enteros
        const pronosticoLocal = parseInt(pronosticos[partido.local]);
        const pronosticoVisitante = parseInt(pronosticos[partido.visitante]);
        const realLocal = resultadosReales[partido.id].local;
        const realVisitante = resultadosReales[partido.id].visitante;

        // Comprobar si el pronóstico es válido (no NaN)
        if (isNaN(pronosticoLocal) || isNaN(pronosticoVisitante)) {
            console.warn(`⚠️ Pronóstico inválido para ${partido.id}. Saltando cálculo.`);
            return; // Salta esta iteración si los datos no son números válidos
        }

        // 1. RESULTADO EXACTO (3 PUNTOS)
        if (pronosticoLocal === realLocal && pronosticoVisitante === realVisitante) {
            puntosTotales += 3;
            console.log(`+3 pts: Resultado exacto para ${partido.id}`);
            return; // Si acierta el resultado exacto, no revisamos más.
        }

        // 2. GANADOR/EMPATADOR CORRECTO (1 PUNTO)
        
        // Determinar el resultado real (1: Local gana, 0: Empate, -1: Visitante gana)
        const resultadoReal = Math.sign(realLocal - realVisitante);
        
        // Determinar el pronóstico (1: Local gana, 0: Empate, -1: Visitante gana)
        const resultadoPronosticado = Math.sign(pronosticoLocal - pronosticoVisitante);

        // Si el pronóstico de ganador/empate coincide
        if (resultadoPronosticado === resultadoReal) {
            puntosTotales += 1;
            console.log(`+1 pt: Ganador/Empate correcto para ${partido.id}`);
        }
    });

    return puntosTotales;
}

// RUTA POST: Recibe y guarda los datos del formulario 
// action del formulario en EJS: /api/guardar-pronosticos
router.post('/api/guardar-pronosticos', (req, res) => {
    
    // 1. Recepción de datos del formulario
    const datosDelUsuario = req.body; 

    // 2. Verificación de datos
    if (Object.keys(datosDelUsuario).length === 0) {
        console.warn('❌ Recepción vacía. El usuario no ingresó ningún pronóstico.');
        // Redirigimos con un mensaje de error
        return res.redirect('/juegos/pronosticos?status=error');
    }

    // 3. CALCULAR PUNTOS (basado en resultados de prueba)
    const puntosObtenidos = calcularPuntos(datosDelUsuario);
    
    // 4. Imprime el paquete de datos completo y el resultado en la consola del servidor
    console.log('-------------------------------------------');
    console.log('✅ Pronósticos Recibidos Exitosamente:');
    console.log('Datos del usuario:', datosDelUsuario);
    console.log(`⭐ Puntuación Calculada para esta jornada: ${puntosObtenidos} PUNTOS`);
    console.log('-------------------------------------------');

    // 5. [PASO DE BASE DE DATOS FALTANTE] Aquí se debe guardar la información
    //    (e.g., nombreDelUsuario, fecha, pronósticos y puntosObtenidos) en Firestore.

    // 6. Redirige al usuario a la página de pronósticos con un mensaje de éxito
    res.redirect('/juegos/pronosticos?status=success'); 
});

// Exportamos el router para que pueda ser montado en app.js
module.exports = { router, calcularPuntos };