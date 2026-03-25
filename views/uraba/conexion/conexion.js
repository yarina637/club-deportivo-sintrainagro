// Importamos el módulo 'mysql2' y su versión 'promise' para usar async/await
const mysql = require('mysql2/promise');

/**
 * Función para establecer la conexión a la base de datos MySQL.
 * Utiliza una conexión de "pool" (grupo de conexiones) para mejor rendimiento,
 * aunque para un ejemplo simple también funcionaría una conexión directa.
 *
 * @returns {Promise<mysql.Pool>} El objeto Pool de conexión a la base de datos.
 */
async function conectarBD() {
    try {
        // Creamos un Pool de conexiones con los datos proporcionados
        const pool = mysql.createPool({
            host: 'sql202.infinityfree.com',
            user: 'if0_37548550',
            password: 'Xalleta2006',
            database: 'if0_37548550_crud_relacion',
            port: 3306, // El puerto es opcional si es el predeterminado (3306), pero se incluye para coincidir
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Opcional: Probar la conexión al Pool. Esto no es estrictamente necesario,
        // pero valida que las credenciales sean correctas.
        await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida correctamente.');
        
        return pool;
    } catch (error) {
        console.error('❌ Error en la conexión a la base de datos:', error.message);
        // En un entorno de producción, podrías optar por lanzar el error o devolver null
        throw new Error('No se pudo conectar a la base de datos.');
    }
}

// Ejemplo de cómo usar la función de conexión:
/*
(async () => {
    try {
        const dbPool = await conectarBD();
        
        // Aquí podrías realizar tus consultas
        // const [rows] = await dbPool.execute('SELECT * FROM tu_tabla LIMIT 1');
        // console.log(rows);

        // No necesitas cerrar la conexión del pool inmediatamente,
        // ya que el pool gestiona las conexiones.
        // Si quieres detener el proceso de Node.js, podrías usar pool.end()
        // await dbPool.end(); 
    } catch (error) {
        console.log(error.message);
    }
})();
*/

// Exportamos la función para poder usarla en otros archivos (módulos)
module.exports = {
    conectarBD
};