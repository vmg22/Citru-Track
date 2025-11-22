const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path"); 
dotenv.config();

// ===============================================
// CONFIGURACIÓN DEL TRANSPORTER
// ===============================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('🔧 Transporter creado con:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT);
console.log('  User:', process.env.EMAIL_USER ? '✅' : '❌ FALTA');
console.log('  Pass:', process.env.EMAIL_PASS ? '✅' : '❌ FALTA');
// ===============================================
// FUNCIONES BASE
// ===============================================


const enviarMailTest = async (to) => {
  try {
    // Siempre envía al email de prueba Y al que pases como parámetro
    const destinatarios = to 
      ? `${to}, citrustrackutn@gmail.com`
      : "citrustrackutn@gmail.com";

    const info = await transporter.sendMail({
      from: `Servidor de pruebas <${process.env.EMAIL_USER}>`,
      to: destinatarios,
      subject: "Email de prueba",
      text: "Este es un email de prueba enviado desde el servidor Node.js usando Nodemailer",
      html: "<h1>Hola!</h1><p>Este es un email de prueba enviado desde el servidor Node.js usando Nodemailer</p>",
    });
    console.log("✅ Email de prueba enviado a:", destinatarios);
    console.log("   Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar email de prueba:", error);
    throw error;
  }
};

const enviarRecuperacionPassword = async (mail, resetLink, username) => {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Configuración de email no encontrada en variables de entorno');
    }

    console.log('=== INICIANDO ENVÍO DE EMAIL ===');
    console.log('📧 Para:', mail);
    console.log('🔗 Link completo:', resetLink);
    console.log('👤 Usuario:', username);
    
    // Verificar que el link tenga un token válido
    if (!resetLink.includes('token=') || !resetLink.split('token=')[1] || resetLink.split('token=')[1].length < 10) {
      throw new Error('El link de reset no contiene un token válido');
    }

    
  
    const mailOptions = {
      from: `CitrusTrack <${process.env.EMAIL_USER}>`,
      to: mail,
      subject: "Recuperación de Contraseña - CitrusTrack",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background-color: #5b68df;
              color: white;
              padding: 25px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              padding: 14px 35px;
              background-color: #5b68df;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .button:hover {
              background-color: #4a56c4;
            }
            .footer {
              margin-top: 25px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .link-box {
              background-color: #f8f9fa;
              padding: 12px;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <h2>Hola, ${username || "Usuario"}!</h2>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el <strong>Sistema de Gestión CitrusTrackUtn</strong>.</p>
              
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button" style="color: white;">🎯 RESTABLECER CONTRASEÑA</a>
              </div>
              
              <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <div class="link-box">
                ${resetLink}
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Este enlace es válido por <strong>1 hora</strong></li>
                  <li>Si no solicitaste este cambio, ignora este correo</li>
                  <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                  <li>Nunca compartas este enlace con otras personas</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <em>¿No solicitaste este cambio? Si recibiste este correo por error, puedes ignorarlo de forma segura.</em>
              </p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p><strong>&copy; ${new Date().getFullYear()} CitrusTrackUtn - Sistema de Gestión</strong></p>
              <p style="font-size: 11px; color: #999;">
                Dirección: [Dirección de CitrusTrackUtn] | Teléfono: [Teléfono] | Email: [Email de contacto]
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Versión texto plano como alternativa
      text: `
        RECUPERACIÓN DE CONTRASEÑA
        ==========================

        Hola, ${username || "Usuario"}!

        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta 
        en el Sistema de Gestión CitrusTrackUtn.

        Para crear una nueva contraseña, haz clic en el siguiente enlace:
        ${resetLink}

        Si el enlace no funciona, cópialo y pégalo en tu navegador.

        ⚠️ IMPORTANTE:
        - Este enlace es válido por 1 hora
        - Si no solicitaste este cambio, ignora este correo
        - Tu contraseña actual seguirá siendo válida hasta que la cambies
        - Nunca compartas este enlace con otras personas

        ¿No solicitaste este cambio? Si recibiste este correo por error, 
        puedes ignorarlo de forma segura.

        --
        Este es un correo automático, por favor no respondas a este mensaje.

        © ${new Date().getFullYear()} CitrusTrackUtn - Sistema de Gestión
        Dirección: [Dirección de CitrusTrackUtn] | Teléfono: [Teléfono] 
      `,
    };

    console.log('📤 Enviando email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email enviado exitosamente:", info.messageId);
    console.log("📨 Respuesta:", info.response);
    
    return info;
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    console.error("🔧 Detalles del error:", {
      message: error.message,
      code: error.code,
      command: error.command
    });
    
    throw new Error(`No se pudo enviar el correo de recuperación: ${error.message}`);
  }
};


 const emailGeneraCodigoPedido = async (mail, nombreEmpresa, codigoConfirmacion) => {
  try {
    const mailOptions = {
      from: `CitrusTrack <${process.env.EMAIL_USER}>`,
      to: mail,
      subject: "Confirmación de Pedido – CitrusTrack",
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: 0 auto;">
        
        <!-- LOGO -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:citrustrack-logo" alt="CitrusTrack" style="max-width: 180px; height: auto;">
        </div>

        <!-- CUERPO PRINCIPAL -->
        <h1 style="font-size: 22px; color: #1a1a1a; margin-bottom: 10px;">
          Estimado/a ${nombreEmpresa},
        </h1>

        <p style="font-size: 15px; line-height: 1.5;">
          Le informamos que su pedido ha sido <strong>registrado correctamente</strong> en el sistema de gestión 
          <strong>CitrusTrack</strong>.
        </p>

        <p style="font-size: 15px; line-height: 1.5;">
          Para confirmar la <strong>recepción efectiva</strong> de este pedido, deberá utilizar el siguiente 
          <strong>código de confirmación</strong>:
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <span style="
            display: inline-block;
            padding: 12px 24px;
            font-size: 26px;
            letter-spacing: 4px;
            font-weight: bold;
            color: #ffffff;
            background-color: #7ac143;
            border-radius: 8px;
          ">
            ${codigoConfirmacion}
          </span>
        </div>

        <p style="font-size: 15px; line-height: 1.5;">
          Este código es <strong>único</strong> y está asociado exclusivamente a este pedido. 
          Deberá ingresarlo en la plataforma CitrusTrack para dejar registrada la recepción por parte de su establecimiento.
        </p>

        <!-- CONTACTO -->
        <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
          Ante cualquier consulta o inconveniente, puede contactarse con nosotros:
        </p>

        <p style="font-size: 14px; line-height: 1.6; margin: 0;">
          <strong>Soporte CitrusTrack</strong><br>
          Email: <a href="mailto:soporte@citrustrack.com" style="color: #4a57d4;">soporte@citrustrack.com</a><br>
          Teléfono: +54 9 381 000 0000<br>
          Sitio web: <a href="https://citrustrack.com" style="color: #4a57d4;">https://citrustrack.com</a>
        </p>

        <!-- DISCLAIMER -->
        <p style="font-size: 12px; line-height: 1.5; color: #777; margin-top: 25px;">
          Si usted ha recibido este correo por error, le solicitamos amablemente <strong>desestimarlo</strong> 
          y, de ser posible, notificar a nuestro equipo de soporte. 
          No comparta este código con terceros ajenos a su organización.
        </p>

        <p style="font-size: 12px; line-height: 1.5; color: #777;">
          Este mensaje fue generado de forma automática por el sistema CitrusTrack.
        </p>

      </div>
      `,
      // Adjuntás el logo para usarlo con cid:citrustrack-logo
      attachments: [
         {
            filename: "citrustrack-logo.png",
            path: path.join(__dirname, "../../assets/logo/citrustrack-4.png"),
            cid: "citrustrack-logo",
       },
                 ],
    };

    const info = await transporter.sendMail(mailOptions);
    return info;

  } catch (error) {
    console.error("❌ Error al enviar email de confirmación de pedido:", error);
    throw error;
  }
};

module.exports = {enviarMailTest,enviarRecuperacionPassword,emailGeneraCodigoPedido};