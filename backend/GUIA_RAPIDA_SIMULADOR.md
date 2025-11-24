# 🚀 Guía Rápida - Simulador GPS

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Verificar Requisitos
```bash
cd backend
npm run check-simulator
```

### 2️⃣ Iniciar Servidor Backend
```bash
npm run dev
```

### 3️⃣ Ejecutar Simulador
```bash
# En otra terminal
npm run simulator
```

---

## 📂 Archivos Creados

```
backend/
├── src/
│   ├── utils/
│   │   ├── gpsSimulator.js          # ⭐ Simulador principal
│   │   └── simulatorConfig.js       # 🔧 Configuración
│   ├── runSimulator.js              # 🎯 Script de ejecución
│   └── checkSimulatorRequirements.js # ✅ Verificador
├── package.json                      # 📦 Scripts agregados
└── SIMULADOR_GPS_README.md          # 📖 Documentación completa
```

---

## 🎮 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run check-simulator` | Verifica que todo esté configurado |
| `npm run simulator` | Ejecuta el simulador |
| `node src/runSimulator.js` | Ejecución directa |

---

## 🚛 Datos Simulados

- **10 camiones** con patentes `SIM1000` a `SIM1009`
- **5 rutas** diferentes por Argentina
- **Velocidad**: 40-90 km/h (variable)
- **Actualización**: Cada 3 segundos
- **Estados**: en_ruta, detenido, cargando, descargando

---

## ⚙️ Personalización

Edita `backend/src/utils/simulatorConfig.js`:

```javascript
module.exports = {
  NUM_CAMIONES: 10,        // Cantidad de camiones
  UPDATE_INTERVAL: 3000,   // Intervalo (ms)
  VELOCIDAD_MIN: 40,       // Velocidad mín (km/h)
  VELOCIDAD_MAX: 90,       // Velocidad máx (km/h)
  // ... más opciones
};
```

---

## 🔍 Visualización

Una vez corriendo, ve los datos en:

- **API**: http://localhost:3000/api/tracking/live
- **Frontend**: http://localhost:5173
- **Consola**: Logs en tiempo real

---

## 🛑 Detener Simulador

1. Presiona `CTRL + C`
2. Responde `s` para limpiar datos o `n` para mantenerlos

---

## 🐛 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| ❌ Error de socket | Verifica que el backend esté corriendo |
| ❌ Error de BD | Revisa conexión MySQL y .env |
| ❌ Tabla no existe | Ejecuta las migraciones SQL |
| ❌ Sin productos | Inserta productos en la BD primero |

---

## 📊 Ejemplo de Datos Generados

```json
{
  "orden_despacho_id": 123,
  "camion_id": 45,
  "patente": "SIM1000",
  "lat": -34.6037,
  "lng": -58.3816,
  "velocidad": 75,
  "evento": "en_ruta",
  "timestamp": "2025-11-24T15:30:00Z"
}
```

---

## 💡 Consejos

- ✅ Ejecuta `check-simulator` primero
- ✅ Mantén el backend corriendo
- ✅ Los datos se guardan en BD automáticamente
- ✅ Puedes cambiar configuración sin reiniciar

---

**¿Dudas?** Lee la documentación completa en `SIMULADOR_GPS_README.md`
