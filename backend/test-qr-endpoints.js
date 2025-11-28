// Script de prueba para endpoints QR (usando http nativo)
const http = require('http');

const API_URL = 'http://localhost:4000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Iniciando pruebas de endpoints QR...\n');

  // Test 1: Obtener cajas recientes
  try {
    console.log('1️⃣ Probando GET /api/cajas/recientes...');
    const response = await makeRequest('/api/cajas/recientes?limit=1');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.cajas && response.data.cajas.length > 0) {
      const caja_id = response.data.cajas[0].codigo_qr || response.data.cajas[0].caja_id;
      
      // Test 2: Generar QR de caja
      if (caja_id) {
        console.log(`\n2️⃣ Probando GET /api/cajas/${caja_id}/qr?format=dataURL...`);
        const qrResponse = await makeRequest(`/api/cajas/${caja_id}/qr?format=dataURL`);
        console.log('Status:', qrResponse.status);
        console.log('✅ QR de caja generado:');
        console.log('  - Success:', qrResponse.data.success);
        console.log('  - Tiene dataURL:', !!qrResponse.data.dataURL);
        console.log('  - Datos caja:', qrResponse.data.data);
      }
    } else {
      console.log('⚠️  No hay cajas en la BD, continuando con pallets...');
    }
  } catch (error) {
    console.error('❌ Error en cajas:', error.message);
  }

  // Test 3: Obtener pallets
  try {
    console.log('\n3️⃣ Probando GET /api/pallets...');
    const response = await makeRequest('/api/pallets');
    console.log('Status:', response.status);
    
    if (response.data.success && response.data.pallets && response.data.pallets.length > 0) {
      const pallet_id = response.data.pallets[0].pallet_id;
      
      // Test 4: Generar QR de pallet
      console.log(`\n4️⃣ Probando GET /api/pallets/${pallet_id}/qr?format=dataURL...`);
      const qrResponse = await makeRequest(`/api/pallets/${pallet_id}/qr?format=dataURL`);
      console.log('Status:', qrResponse.status);
      console.log('✅ QR de pallet generado:');
      console.log('  - Success:', qrResponse.data.success);
      console.log('  - Tiene dataURL:', !!qrResponse.data.dataURL);
      console.log('  - Datos pallet:', qrResponse.data.data);
    } else {
      console.log('⚠️  No hay pallets en la BD');
    }
  } catch (error) {
    console.error('❌ Error en pallets:', error.message);
  }

  console.log('\n✅ Pruebas completadas');
}

testEndpoints().catch(console.error);
