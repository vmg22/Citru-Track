import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Función auxiliar para cargar imagen y convertir a base64
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = url;
  });
};

export const generarRemitoPDF = async (ordenData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ==========================================
  // CARGAR LOGO
  // ==========================================
  let logoBase64 = null;
  try {
    logoBase64 = await loadImageAsBase64("/logo_citrustrack.png");
  } catch (error) {
    console.warn("No se pudo cargar el logo:", error);
  }

  // ==========================================
  // ENCABEZADO - DATOS DE LA EMPRESA
  // ==========================================
  
  // Logo
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 15, 10, 35, 35);
  }

  // Nombre de la empresa
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("CITRUSTRACK", 55, 20);

  // Datos de la empresa
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("CITRUSTRACK S.A.", 55, 27);
  doc.text("MENDOZA 1537/41", 55, 32);
  doc.text("SAN MIGUEL DE TUCUMÁN", 55, 37);
  doc.text("Tel: (0381) 4330345", 55, 42);
  doc.text(`CUIT: 30-54335963-1`, 55, 47);

  // Recuadro REMITO
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.rect(145, 10, 50, 35);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REMITO", 157, 20);
  
  doc.setFontSize(32);
  doc.text("R", 165, 35);

  // Información del remito (derecha)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("REMITO", pageWidth - 15, 50, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`R-${ordenData.od_code || ordenData.od_id}`, pageWidth - 15, 56, { align: "right" });
  doc.text(`Fecha: ${new Date(ordenData.fechaProgramada).toLocaleDateString("es-AR")}`, pageWidth - 15, 62, { align: "right" });
  doc.text(`Código: ${Date.now()}`, pageWidth - 15, 68, { align: "right" });

  // ==========================================
  // DATOS DEL CLIENTE
  // ==========================================
  let yPos = 80;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", 18, yPos + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Razón Social: ${ordenData.clienteNombre}`, 18, yPos + 12);
  doc.text(`Dirección: ${ordenData.clienteDireccion || "N/A"}`, 18, yPos + 17);
  doc.text(`CUIT/DNI: ${ordenData.clienteCuit || "N/A"}`, 18, yPos + 22);

  // ==========================================
  // DATOS DE TRANSPORTE
  // ==========================================
  yPos += 30;
  
  doc.rect(15, yPos, pageWidth - 30, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DATOS DE TRANSPORTE:", 18, yPos + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Chofer: ${ordenData.choferNombre || "No asignado"}`, 18, yPos + 12);
  doc.text(`DNI: ${ordenData.choferDni || "N/A"}`, 100, yPos + 12);
  doc.text(`Vehículo: ${ordenData.camionTipo || "No asignado"}`, 18, yPos + 17);
  doc.text(`Patente: ${ordenData.camionPatente || "N/A"}`, 100, yPos + 17);

  // ==========================================
  // DESTINO
  // ==========================================
  yPos += 25;
  
  doc.rect(15, yPos, pageWidth - 30, 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DESTINO:", 18, yPos + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Origen: San Miguel de Tucumán`, 18, yPos + 11);
  doc.text(`Destino: ${ordenData.destino}`, 110, yPos + 11);

  // ==========================================
  // TABLA DE ARTÍCULOS (PALLETS)
  // ==========================================
  yPos += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ARTÍCULOS:", 15, yPos);

  yPos += 5;

  const tableData = ordenData.pallets.map((pallet, index) => [
    index + 1,
    `PALLET-${pallet.pallet_id}`,
    pallet.productoNombre || "PRODUCTO CITRUS",
    "UNI",
    pallet.cantidad_cajas || 1,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["N°", "Código", "Descripción", "Uni", "Cantidad"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 80 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
    },
    margin: { left: 15, right: 15 },
  });

  yPos = doc.lastAutoTable.finalY + 5;

  // Total de artículos
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total de artículos: ${ordenData.pallets.length}`, pageWidth - 15, yPos, { align: "right" });

  // ==========================================
  // MENSAJE DE VERIFICACIÓN (VERDE)
  // ==========================================
  yPos += 10;

  doc.setFillColor(220, 255, 220);
  doc.setDrawColor(100, 200, 100);
  doc.rect(15, yPos, pageWidth - 30, 15, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 100, 0);
  doc.text("* IMPORTANTE: Este remito fue generado mediante código QR verificado", pageWidth / 2, yPos + 6, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Código de Verificación: ${Date.now()}-1-3-PTOXG0`, pageWidth / 2, yPos + 11, { align: "center" });

  // ==========================================
  // OBSERVACIONES
  // ==========================================
  yPos += 20;

  if (ordenData.observaciones) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Observaciones: ${ordenData.observaciones}`, 15, yPos);
  }

  // ==========================================
  // FIRMAS
  // ==========================================
  yPos = pageHeight - 40;

  doc.setDrawColor(0, 0, 0);
  doc.line(20, yPos, 80, yPos);
  doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  doc.text("Firma del Transportista", 50, yPos + 5, { align: "center" });
  doc.text(ordenData.choferNombre || "Roberto Gómez", 50, yPos + 10, { align: "center" });
  doc.text(`DNI: ${ordenData.choferDni || "28555444"}`, 50, yPos + 15, { align: "center" });

  doc.text("Firma del Receptor", pageWidth - 50, yPos + 5, { align: "center" });
  doc.text("Aclaración", pageWidth - 50, yPos + 10, { align: "center" });
  doc.text("DNI: ___________", pageWidth - 50, yPos + 15, { align: "center" });

  // ==========================================
  // PIE DE PÁGINA
  // ==========================================
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("CITRUSTRACK S.A. C.I.F.I.A. - MENDOZA 1537/41, SAN MIGUEL DE TUCUMÁN", pageWidth / 2, pageHeight - 10, { align: "center" });

  // ==========================================
  // GUARDAR PDF
  // ==========================================
  const fileName = `Remito_${ordenData.od_code || ordenData.od_id}_${Date.now()}.pdf`;
  doc.save(fileName);
};