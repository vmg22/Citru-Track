# 🚛 Simulador de GPS para Camiones - Citru Track

Este simulador genera datos de posición GPS en tiempo real para 10 camiones, permitiendo visualizar el seguimiento en vivo con velocidades y rutas realistas.

## 📋 Características

- **10 camiones simulados** con patentes únicas (SIM1000-SIM1009)
- **Rutas reales** de Argentina:
  - Buenos Aires → Rosario
  - Buenos Aires → Córdoba
  - Buenos Aires → Mar del Plata
  - Buenos Aires → Mendoza
  - Buenos Aires → Bahía Blanca
- **Velocidades variables** entre 40-90 km/h
- **Estados dinámicos**: en_ruta, detenido, cargando, descargando
- **Actualización en tiempo real** cada 3 segundos
- **Integración completa** con WebSockets y base de datos

## 🚀 Uso Rápido

### Opción 1: Script de ejecución directa

```bash
cd backend/src
node runSimulator.js
```

### Opción 2: Ejecutar el módulo directamente

```bash
cd backend/src/utils
node gpsSimulator.js
```

## 📦 Requisitos Previos

1. **Base de datos configurada** con las siguientes tablas:
   - `camiones`
   - `orden_despacho`
   - `tracking_realtime`
   - `productos`

2. **Servidor backend corriendo** en `http://localhost:3000`

3. **Socket.io configurado** en el servidor

4. **Dependencias instaladas**:
   ```bash
   npm install socket.io-client
   ```

## 🔧 Configuración

Puedes modificar los parámetros del simulador editando el archivo `utils/gpsSimulator.js`:

```javascript
const CONFIG = {
  NUM_CAMIONES: 10,              // Número de camiones a simular
  UPDATE_INTERVAL: 3000,         // Intervalo de actualización (ms)
  VELOCIDAD_MIN: 40,             // Velocidad mínima (km/h)
  VELOCIDAD_MAX: 90,             // Velocidad máxima (km/h)
  SOCKET_URL: 'http://localhost:3000'
};
```

## 📊 Datos Generados

Cada actualización envía:

```javascript
{
  orden_despacho_id: 123,
  camion_id: 45,
  patente: "SIM1000",
  lat: -34.6037,
  lng: -58.3816,
  velocidad: 75,
  evento: "en_ruta",
  timestamp: "2025-11-24T15:30:00Z"
}
```

## 🎯 Visualización

Una vez el simulador está corriendo, puedes ver los datos en:

- **Dashboard Frontend**: http://localhost:5173
- **API Endpoint**: http://localhost:3000/api/tracking/live
- **Consola del simulador**: Muestra logs de actividad

## 🛑 Detener el Simulador

1. Presiona `CTRL + C`
2. El simulador preguntará si deseas limpiar los datos
3. Responde `s` para eliminar datos de prueba o `n` para mantenerlos

## 🧹 Limpieza de Datos

El simulador puede limpiar automáticamente:
- Registros de `tracking_realtime` de órdenes simuladas
- Órdenes de despacho con código `OD-SIM-*`
- Camiones con patente `SIM*` (marcados como inactivos)

## 📝 Estructura de Rutas

Cada ruta simula un viaje completo con puntos intermedios:

```javascript
{
  nombre: 'Buenos Aires - Rosario',
  puntos: [
    { lat: -34.6037, lng: -58.3816 }, // Inicio
    { lat: -34.2, lng: -58.5 },       // Punto intermedio
    // ... más puntos
    { lat: -32.9468, lng: -60.6393 }  // Destino
  ],
  destino: 'Rosario, Santa Fe',
  tipo_destino: 'Industrial'
}
```

## 🔄 Comportamiento del Simulador

1. **Inicialización**:
   - Crea 10 camiones en la BD (o usa existentes)
   - Genera órdenes de despacho simuladas
   - Conecta al servidor de WebSockets

2. **Simulación**:
   - Mueve cada camión a lo largo de su ruta
   - Interpola posiciones entre puntos
   - Varía la velocidad aleatoriamente
   - Cambia estados ocasionalmente
   - Reinicia la ruta al completarse

3. **Transmisión**:
   - Envía datos por WebSocket: `tracking:update`
   - Guarda en base de datos: tabla `tracking_realtime`
   - Emite eventos específicos: `tracking:od:{id}`

## 🐛 Solución de Problemas

### Error de conexión al socket
```
❌ Error de conexión al socket: connect ECONNREFUSED
```
**Solución**: Asegúrate de que el servidor backend esté corriendo en el puerto 3000.

### Error de base de datos
```
❌ Error al crear camión: ER_NO_SUCH_TABLE
```
**Solución**: Ejecuta las migraciones de la base de datos primero.

### Camiones no se mueven
**Solución**: Verifica que la configuración de `UPDATE_INTERVAL` no sea demasiado alta.

## 💡 Uso Programático

También puedes usar el simulador en tu propio código:

```javascript
const SimuladorGPS = require('./utils/gpsSimulator');

const simulador = new SimuladorGPS();

async function miSimulacion() {
  await simulador.inicializar();
  simulador.iniciarSimulacion();
  
  // ... tu lógica
  
  // Detener después de 1 minuto
  setTimeout(() => {
    simulador.detener();
  }, 60000);
}

miSimulacion();
```

## 📄 Licencia

Parte del proyecto Citru Track - Sistema de seguimiento de flota de transporte refrigerado.

---

**Desarrollado para**: Citru Track - Gestión Logística
**Versión**: 1.0.0
**Última actualización**: Noviembre 2025
