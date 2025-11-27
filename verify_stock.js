
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
      console.log('--- Totales from API ---');
      console.log(json.totales);

      console.log('\n--- Por Estado ---');
      let sumCajas = 0;
      let sumPallets = 0;
      let activeCajas = 0;
      let activePallets = 0;

      json.porEstado.forEach(e => {
        console.log(`${e.estado}: ${e.cantidad_cajas} cajas, ${e.cantidad_pallets} pallets`);
        sumCajas += Number(e.cantidad_cajas);
        sumPallets += Number(e.cantidad_pallets);

        if (['armado', 'en_camara', 'reservado', 'en_transporte'].includes(e.estado)) {
            activeCajas += Number(e.cantidad_cajas);
            activePallets += Number(e.cantidad_pallets);
        }
      });

      console.log('\n--- Calculated Sums ---');
      console.log(`Sum All States: ${sumCajas} cajas, ${sumPallets} pallets`);
      console.log(`Sum Active States: ${activeCajas} cajas, ${activePallets} pallets`);

      console.log('\n--- Comparison ---');
      if (json.totales.total_cajas == sumCajas) {
          console.log('API Total matches Sum of ALL states (including despachado/anulado).');
      } else if (json.totales.total_cajas == activeCajas) {
          console.log('API Total matches Sum of ACTIVE states.');
      } else {
          console.log('API Total matches NEITHER.');
      }

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
