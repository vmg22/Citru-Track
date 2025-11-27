const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/stock/resumen',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('=== TOTALES ===');
      console.log(`Total Cajas: ${json.totales.total_cajas}`);
      console.log(`Total Pallets: ${json.totales.total_pallets}`);
      console.log(`Peso Total: ${json.totales.peso_total}`);

      console.log('\n=== POR ESTADO ===');
      let sumCajasActivos = 0;
      let sumPalletsActivos = 0;
      json.porEstado.forEach(e => {
        console.log(`${e.estado}: ${e.cantidad_cajas} cajas, ${e.cantidad_pallets} pallets`);
        if (!['despachado', 'anulado'].includes(e.estado)) {
          sumCajasActivos += Number(e.cantidad_cajas);
          sumPalletsActivos += Number(e.cantidad_pallets);
        }
      });

      console.log('\n=== SUMA DE ESTADOS ACTIVOS ===');
      console.log(`Cajas: ${sumCajasActivos}`);
      console.log(`Pallets: ${sumPalletsActivos}`);

      console.log('\n=== COMPARACIÓN ===');
      if (json.totales.total_cajas == sumCajasActivos) {
        console.log('✅ Total Cajas coincide con suma de activos');
      } else {
        console.log('❌ Total Cajas NO coincide');
        console.log(`   API dice: ${json.totales.total_cajas}`);
        console.log(`   Suma activos: ${sumCajasActivos}`);
      }

      console.log('\n=== STOCK POR PRODUCTO ===');
      let sumCajasProductos = 0;
      json.porProducto.forEach(p => {
        console.log(`${p.producto_nombre}: ${p.cantidad_cajas} cajas, ${p.cantidad_pallets} pallets`);
        sumCajasProductos += Number(p.cantidad_cajas);
      });
      console.log(`\nSuma total de productos: ${sumCajasProductos} cajas`);

    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
