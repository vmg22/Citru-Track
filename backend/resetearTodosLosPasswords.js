const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetearPasswords() {
  try {
    console.log('🔧 Conectando a la base de datos...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    // Define los usuarios y sus nuevas contraseñas
    const usuarios = [
      { email: 'admin@citrustrack.com', password: '123456' },
      { email: 'juanmarcelo84@gmail.com', password: 'Marce2585' }
    ];

    console.log('\n🔐 Actualizando contraseñas...\n');

    for (const user of usuarios) {
      console.log(`📧 Procesando: ${user.email}`);
      
      // Generar hash
      const hash = await bcrypt.hash(user.password, 10);
      console.log(`   🔑 Hash generado: ${hash.substring(0, 30)}...`);
      
      // Actualizar en BD
      const [result] = await connection.execute(
        'UPDATE users SET hashed_password = ? WHERE email = ?',
        [hash, user.email]
      );
      
      if (result.affectedRows > 0) {
        console.log(`   ✅ Actualizado correctamente`);
        
        // Verificar
        const [[dbUser]] = await connection.execute(
          'SELECT hashed_password FROM users WHERE email = ?',
          [user.email]
        );
        
        const match = await bcrypt.compare(user.password, dbUser.hashed_password);
        console.log(`   🧪 Verificación: ${match ? '✅ OK' : '❌ FALLÓ'}`);
      } else {
        console.log(`   ⚠️ No se encontró el usuario`);
      }
      
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('🎉 PROCESO COMPLETADO');
    console.log('═'.repeat(60));
    console.log('\nAhora puedes hacer login con:');
    console.log('\n1️⃣ Usuario Admin:');
    console.log('   Email: admin@citrustrack.com');
    console.log('   Password: 123456');
    console.log('\n2️⃣ Usuario Juan:');
    console.log('   Email: juanmarcelo84@gmail.com');
    console.log('   Password: Marce2585');
    console.log('');

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetearPasswords();