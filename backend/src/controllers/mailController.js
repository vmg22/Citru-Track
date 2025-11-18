const { enviarMailTest} = require("../services/emails.service");


const TestMail = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res
        .status(400)
        .json({ success: false, message: 'El campo "to" es requerido' });
    }
    const info = await enviarMailTest(to);
    return res.status(200).json({
      success: true,
      message: "Email de prueba enviado correctamente",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error al enviar email:", error);
    return res.status(500).json({
      success: false,
      message: "Error al enviar email",
      error: error.message,
    });
  }
};

module.exports = { TestMail};