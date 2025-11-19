import React, { useState, useEffect } from "react";
import "../../style/configuracion.css";
import { deleteUserById, getAllUsers } from "./services/settingsServices";

const Ajustes = () => {
  const t = {
    systemConfig: "Configuración del Sistema",
    systemAdmin: "Administrador del Sistema",
    generalConfig: "Configuración General",
    apiIntegrations: "API y Integraciones",
    iotSensors: "Sensores IoT",
    sensorManagement: "Gestión de Sensores",
    thresholdsAlerts: "Umbrales y Alertas",
    calibration: "Calibración",
    usersRoles: "Usuarios y Roles",
    userManagement: "Gestión de Usuarios",
    permissionsRoles: "Permisos y Roles",
    audit: "Auditoría",
    notifications: "Notificaciones",
    alertConfig: "Configuración Alertas",
    notifChannels: "Canales de Notificación",
    messageTemplates: "Plantillas de Mensajes",
    backupRestore: "Backup y Restauración",
    systemLogs: "Logs del Sistema",
    maintenance: "Mantenimiento",
    configSaved: "Configuración guardada exitosamente",
    basicInfo: "Información Básica",
    systemName: "Nombre del Sistema",
    version: "Versión",
    viewMode: "Modo de Visualización",
    compact: "Compacto",
    expanded: "Expandido",
    notifPreferences: "Preferencias de Notificación",
    emailNotif: "Notificaciones por Email",
    emailNotifDesc: "Recibir notificaciones importantes por correo electrónico",
    pushNotif: "Notificaciones Push",
    pushNotifDesc: "Notificaciones en tiempo real en el navegador",
    smsAlerts: "Alertas por SMS",
    smsAlertsDesc: "Alertas críticas por mensaje de texto",
    autoReportFreq: "Frecuencia de Reportes Automáticos",
    daily: "Diario",
    weekly: "Semanal",
    monthly: "Mensual",
    none: "No enviar automáticamente",
    dataConfig: "Configuración de Datos",
    dataRetention: "Período de Retención de Datos",
    dataRetentionDesc:
      "Los datos más antiguos serán archivados automáticamente",
    autoBackupFreq: "Frecuencia de Backup Automático",
    backupLocation: "Ubicación de Backup",
    backupLocationDesc: "Ruta en el servidor donde se almacenarán los backups",
    security: "Seguridad",
    sessionTime: "Tiempo de Sesión (minutos)",
    sessionTimeDesc:
      "Tiempo de inactividad antes de cerrar sesión automáticamente",
    loginAttempts: "Intentos de Login Permitidos",
    loginAttemptsDesc:
      "Número de intentos fallidos antes de bloquear la cuenta",
    twoFactorAuth: "Autenticación de Dos Factores",
    twoFactorAuthDesc:
      "Requerir verificación adicional para acceder al sistema",
    auditLog: "Registro de Auditoría",
    auditLogDesc: "Registrar todas las actividades del sistema",
    currentTime: "Hora actual",
    months3: "3 meses",
    months6: "6 meses",
    year1: "1 año",
    years2: "2 años",
    years3: "3 años",
    companyName: "Nombre de la Empresa",
    address: "Dirección",
    phone: "Teléfono",
    plantsLocations: "Plantas y Ubicaciones",
    plantT1: "Planta T1",
    plantT2: "Planta T2",
    plantT3: "Planta T3",
    sensorTemp: "Temperatura - Línea A",
    sensorPlant: "Planta T1 • Última lectura: 8.7°C",
    active: "Activo",
    edit: "Editar",
    data: "Datos",
    error: "Error",
    noCommunication: "Planta T1 • Sin comunicación",
    restart: "Reiniciar",
    offline: "Offline",
    lastConnection: "Planta T2 • Última conexión: hace 2h",
    connect: "Conectar",
    addSensor: "Agregar Nuevo Sensor",
    scanSensors: "Escanear Sensores",
    addUser: "Agregar Usuario",
    exportList: "Exportar Lista",
    adminRole: "Administrador del Sistema",
    supervisorRole: "Supervisor de Planta",
    logisticsRole: "Coordinador Logístico",
    auditorRole: "Auditor",
    alertTypes: "Tipos de Alertas",
    coldChainBreak: "Ruptura de Frío",
    coldChainDesc:
      "Temperatura fuera del rango permitido por más de 15 minutos",
    excessiveVibration: "Vibración Excesiva",
    vibrationDesc: "Nivel de vibración superior a 0.5g por más de 5 minutos",
    sensorFailure: "Falla de Sensor",
    sensorFailureDesc: "Sensor sin comunicación por más de 30 minutos",
    deliveryDelay: "Retraso en Entrega",
    deliveryDelayDesc: "Entrega con más de 1 hora de retraso",
  };

  const [activeCategory, setActiveCategory] = useState("sistema");
  const [activePanel, setActivePanel] = useState("general");
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const traerUsuarios = async () => {
      try {
        const data = await getAllUsers();
        setUsuarios(data);
        // console.log(data)
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };
    traerUsuarios();
  }, []);

  const handleAgregarUsuario = () =>{
    console.log("agregar")
  }

  const handleEliminarUsuario = (idUser) => {
    console.log("eliminar", idUser)
    confirm("¿Estás seguro de que deseas eliminar este usuario?")
    if(confirm){
      deleteUserById(idUser)
    }
    else{
      console.log("cancelado")
    }
  }
  const [config, setConfig] = useState({
    nombreSistema: "CitrusTrack",
    version: "v2.1.0",
    modoVisualizacion: "compacto",
    notifEmail: true,
    notifPush: true,
    notifSMS: false,
    frecuenciaReportes: "semanal",
    retencionDatos: "12",
    frecuenciaBackup: "semanal",
    ubicacionBackup: "/var/backups/citrustrack/",
    tiempoSesion: 120,
    intentosLogin: 5,
    auth2FA: false,
    registroAuditoria: true,
  });

  const toggleSubmenu = (categoria) => {
    setActiveCategory(activeCategory === categoria ? "" : categoria);
  };

  const cargarPanel = (panel) => {
    setActivePanel(panel);
  };

  const handleConfigChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };


  const renderPanelContent = () => {
    switch (activePanel) {
      case "general":
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4>
                <i className="fas fa-bell"></i> {t.notifPreferences}
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{t.emailNotif}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.notifEmail}
                        onChange={(e) =>
                          handleConfigChange("notifEmail", e.target.checked)
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.emailNotifDesc}</div>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{t.pushNotif}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.notifPush}
                        onChange={(e) =>
                          handleConfigChange("notifPush", e.target.checked)
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.pushNotifDesc}</div>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{t.smsAlerts}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.notifSMS}
                        onChange={(e) =>
                          handleConfigChange("notifSMS", e.target.checked)
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.smsAlertsDesc}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="frecuencia-reportes">
                    {t.autoReportFreq}
                  </label>
                  <select
                    id="frecuencia-reportes"
                    value={config.frecuenciaReportes}
                    onChange={(e) =>
                      handleConfigChange("frecuenciaReportes", e.target.value)
                    }
                  >
                    <option value="diario">{t.daily}</option>
                    <option value="semanal">{t.weekly}</option>
                    <option value="mensual">{t.monthly}</option>
                    <option value="ninguno">{t.none}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>
                <i className="fas fa-database"></i> {t.dataConfig}
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="retencion-datos">{t.dataRetention}</label>
                  <select
                    id="retencion-datos"
                    value={config.retencionDatos}
                    onChange={(e) =>
                      handleConfigChange("retencionDatos", e.target.value)
                    }
                  >
                    <option value="3">{t.months3}</option>
                    <option value="6">{t.months6}</option>
                    <option value="12">{t.year1}</option>
                    <option value="24">{t.years2}</option>
                    <option value="36">{t.years3}</option>
                  </select>
                  <div className="form-help">{t.dataRetentionDesc}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="frecuencia-backup">{t.autoBackupFreq}</label>
                  <select
                    id="frecuencia-backup"
                    value={config.frecuenciaBackup}
                    onChange={(e) =>
                      handleConfigChange("frecuenciaBackup", e.target.value)
                    }
                  >
                    <option value="diario">{t.daily}</option>
                    <option value="semanal">{t.weekly}</option>
                    <option value="mensual">{t.monthly}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>
                <i className="fas fa-shield-alt"></i> {t.security}
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="tiempo-sesion">{t.sessionTime}</label>
                  <input
                    type="number"
                    id="tiempo-sesion"
                    value={config.tiempoSesion}
                    onChange={(e) =>
                      handleConfigChange("tiempoSesion", e.target.value)
                    }
                    min="15"
                    max="480"
                  />
                  <div className="form-help">{t.sessionTimeDesc}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="intentos-login">{t.loginAttempts}</label>
                  <input
                    type="number"
                    id="intentos-login"
                    value={config.intentosLogin}
                    onChange={(e) =>
                      handleConfigChange("intentosLogin", e.target.value)
                    }
                    min="3"
                    max="10"
                  />
                  <div className="form-help">{t.loginAttemptsDesc}</div>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{t.twoFactorAuth}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.auth2FA}
                        onChange={(e) =>
                          handleConfigChange("auth2FA", e.target.checked)
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.twoFactorAuthDesc}</div>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{t.auditLog}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.registroAuditoria}
                        onChange={(e) =>
                          handleConfigChange(
                            "registroAuditoria",
                            e.target.checked
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.auditLogDesc}</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "sensores":
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4>
                <i className="fas fa-list"></i> {t.sensorManagement}
              </h4>
              <div className="sensores-grid">
                <div className="sensor-card">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T1-A1</div>
                    <div className="sensor-status status-active">
                      {t.active}
                    </div>
                  </div>
                  <div className="sensor-info">
                    <div>{t.sensorTemp}</div>
                    <div>{t.sensorPlant}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {t.edit}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-chart-line"></i> {t.data}
                    </button>
                  </div>
                </div>

                <div className="sensor-card">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T1-A2</div>
                    <div className="sensor-status status-active">
                      {t.active}
                    </div>
                  </div>
                  <div className="sensor-info">
                    <div>Humedad - Línea A</div>
                    <div>Planta T1 • Última lectura: 68%</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {t.edit}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-chart-line"></i> {t.data}
                    </button>
                  </div>
                </div>

                <div className="sensor-card error">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T1-B3</div>
                    <div className="sensor-status status-error">{t.error}</div>
                  </div>
                  <div className="sensor-info">
                    <div>Vibración - Línea B</div>
                    <div>{t.noCommunication}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {t.edit}
                    </button>
                    <button className="btn btn-danger btn-sm">
                      <i className="fas fa-redo"></i> {t.restart}
                    </button>
                  </div>
                </div>

                <div className="sensor-card offline">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T2-C1</div>
                    <div className="sensor-status status-offline">
                      {t.offline}
                    </div>
                  </div>
                  <div className="sensor-info">
                    <div>Temperatura - Línea C</div>
                    <div>{t.lastConnection}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {t.edit}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-power-off"></i> {t.connect}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <button className="btn btn-primary">
                  <i className="fas fa-plus"></i> {t.addSensor}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ marginLeft: "10px" }}
                >
                  <i className="fas fa-sync"></i> {t.scanSensors}
                </button>
              </div>
            </div>
          </div>
        );

      case "usuarios":
        return (
          <div className="form-configuracion">
            <div className="form-section">
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button className="btn btn-primary" onClick={handleAgregarUsuario()}>
                    <i className="fas fa-user-plus"></i> {t.addUser}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ marginLeft: "10px" }}
                  >
                    <i className="fas fa-file-export"></i> {t.exportList}
                  </button>
                </div>
              <div className="usuarios-list">
                {usuarios.map((user) => (
                  <div key={user.user_id} className="usuario-card">
                    <div className="usuario-avatar">
                      {user.nombre?.charAt(0)}
                      {user.apellido?.charAt(0)}
                    </div>
                    <div className="usuario-info">
                      <div
                        className="usuario-nombre"
                        title={`${user.nombre} ${user.apellido}`}
                      >
                        {user.nombre} {user.apellido}
                      </div>
                      <div className="usuario-email" title={user.email}>
                        {user.email}
                      </div>
                    </div>
                    <div className="usuario-acciones">
                      <button
                        className="btn btn-warning btn-sm"
                        title="Editar usuario"
                      >
                        <i className="fas fa-edit"></i>Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Eliminar usuario"
                        onClick={()=>handleEliminarUsuario(user.user_id)}
                      >
                        <i class="fa-solid fa-trash"></i>Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "alertas":
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4>
                <i className="fas fa-bell"></i> {t.alertTypes}
              </h4>
              <div className="alertas-config">
                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{t.coldChainBreak}</h5>
                    <div className="alerta-descripcion">{t.coldChainDesc}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{t.excessiveVibration}</h5>
                    <div className="alerta-descripcion">{t.vibrationDesc}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{t.sensorFailure}</h5>
                    <div className="alerta-descripcion">
                      {t.sensorFailureDesc}
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{t.deliveryDelay}</h5>
                    <div className="alerta-descripcion">
                      {t.deliveryDelayDesc}
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "api":
      case "umbrales":
      case "calibracion":
      case "roles":
      case "canales":
      case "plantillas":
      case "backup":
      case "logs":
      case "mantenimiento":
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4>
                <i className="fas fa-exclamation"></i> Panel en Construcción
              </h4>
              <p>
                El panel de **
                {getPanelTitle()
                  .replace(/<[^>]*>/g, "")
                  .trim()}
                ** aún no tiene su interfaz de configuración finalizada. Vuelve
                pronto.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPanelTitle = () => {
    const titles = {
      general: `<i class="fas fa-cog"></i> ${t.generalConfig}`,
      api: `<i class="fas fa-code"></i> ${t.apiIntegrations}`,
      sensores: `<i class="fas fa-microchip"></i> ${t.sensorManagement}`,
      umbrales: `<i class="fas fa-thermometer-half"></i> ${t.thresholdsAlerts}`,
      calibracion: `<i class="fas fa-tools"></i> ${t.calibration}`,
      usuarios: `<i class="fas fa-user-friends"></i> ${t.userManagement}`,
      roles: `<i class="fas fa-user-shield"></i> ${t.permissionsRoles}`,
      alertas: `<i class="fas fa-exclamation-triangle"></i> ${t.alertConfig}`,
      canales: `<i class="fas fa-comment-alt"></i> ${t.notifChannels}`,
      plantillas: `<i class="fas fa-envelope"></i> ${t.messageTemplates}`,
      backup: `<i class="fas fa-database"></i> ${t.backupRestore}`,
      logs: `<i class="fas fa-file-alt"></i> ${t.systemLogs}`,
      mantenimiento: `<i class="fas fa-server"></i> ${t.maintenance}`,
    };
    return titles[activePanel] || titles.general;
  };

  return (
    <div className="main-content">
      <div className="configuracion-layout">
        <div className="menu-configuracion">
          <div className="categoria-config">
            <div
              className={`categoria-header ${
                activeCategory === "sensores" ? "active" : ""
              }`}
              onClick={() => toggleSubmenu("sensores")}
            >
              <h3>
                <i className="fas fa-microchip"></i> {t.iotSensors}
              </h3>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div
              className={`submenu-items ${
                activeCategory === "sensores" ? "active" : ""
              }`}
            >
              <div
                className={`submenu-item ${
                  activePanel === "sensores" ? "active" : ""
                }`}
                onClick={() => cargarPanel("sensores")}
              >
                <i className="fas fa-list"></i> {t.sensorManagement}
              </div>
              <div
                className={`submenu-item ${
                  activePanel === "umbrales" ? "active" : ""
                }`}
                onClick={() => cargarPanel("umbrales")}
              >
                <i className="fas fa-thermometer-half"></i> {t.thresholdsAlerts}
              </div>
              <div
                className={`submenu-item ${
                  activePanel === "calibracion" ? "active" : ""
                }`}
                onClick={() => cargarPanel("calibracion")}
              >
                <i className="fas fa-tools"></i> {t.calibration}
              </div>
            </div>
          </div>

          <div className="categoria-config">
            <div
              className={`categoria-header ${
                activeCategory === "usuarios" ? "active" : ""
              }`}
              onClick={() => toggleSubmenu("usuarios")}
            >
              <h3>
                <i className="fas fa-users"></i> {t.usersRoles}
              </h3>
              <i className="fas fa-chevron-down"></i>
            </div>

            <div
              className={`submenu-items ${
                activeCategory === "usuarios" ? "active" : ""
              }`}
            >
              <div
                className={`submenu-item ${
                  activePanel === "usuarios" ? "active" : ""
                }`}
                onClick={() => cargarPanel("usuarios")}
              >
                <i className="fas fa-user-friends"></i> {t.userManagement}
              </div>
              <div
                className={`submenu-item ${
                  activePanel === "roles" ? "active" : ""
                }`}
                onClick={() => cargarPanel("roles")}
              >
                <i className="fas fa-user-shield"></i> {t.permissionsRoles}
              </div>
              <div
                className={`submenu-item`}
                onClick={() => cargarPanel("roles")}
              >
                <i className="fas fa-user-shield"></i> Choferes
              </div>
            </div>
          </div>

          <div className="categoria-config">
            <div
              className={`categoria-header ${
                activeCategory === "notificaciones" ? "active" : ""
              }`}
              onClick={() => toggleSubmenu("notificaciones")}
            >
              <h3>
                <i className="fas fa-bell"></i> {t.notifications}
              </h3>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div
              className={`submenu-items ${
                activeCategory === "notificaciones" ? "active" : ""
              }`}
            >
              <div
                className={`submenu-item ${
                  activePanel === "alertas" ? "active" : ""
                }`}
                onClick={() => cargarPanel("alertas")}
              >
                <i className="fas fa-exclamation-triangle"></i> {t.alertConfig}
              </div>
              <div
                className={`submenu-item ${
                  activePanel === "canales" ? "active" : ""
                }`}
                onClick={() => cargarPanel("canales")}
              >
                <i className="fas fa-comment-alt"></i> {t.notifChannels}
              </div>
              <div
                className={`submenu-item ${
                  activePanel === "plantillas" ? "active" : ""
                }`}
                onClick={() => cargarPanel("plantillas")}
              >
                <i className="fas fa-envelope"></i> {t.messageTemplates}
              </div>
            </div>
          </div>
        </div>

        <div className="panel-configuracion">
          <div className="panel-header">
            <h3 dangerouslySetInnerHTML={{ __html: getPanelTitle() }}></h3>
          </div>

          <div id="panel-contenido">{renderPanelContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default Ajustes;
