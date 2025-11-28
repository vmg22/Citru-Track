const db = require('./src/config/db');

async function checkSchema() {
  try {
    const [rows] = await db.query("DESCRIBE pallets");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error describing table:", error);
    process.exit(1);
  }
}

checkSchema();
