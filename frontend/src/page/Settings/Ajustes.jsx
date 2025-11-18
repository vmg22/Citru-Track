import React, { useState, useEffect } from 'react';
import '../../style/configuracion.css';

const Ajustes = () => {
  const [activeCategory, setActiveCategory] = useState('sistema');
  const [activePanel, setActivePanel] = useState('general');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estados para configuraciones
  const [config, setConfig] = useState({
    idioma: localStorage.getItem('idioma') || 'es',
    tema: localStorage.getItem('tema') || 'claro',
    colorPrimario: localStorage.getItem('colorPrimario') || '#2e7d32',
    nombreSistema: 'CitrusTrack',
    version: 'v2.1.0',
    zonaHoraria: '-3',
    modoVisualizacion: 'compacto',
    notifEmail: true,
    notifPush: true,
    notifSMS: false,
    frecuenciaReportes: 'semanal',
    retencionDatos: '12',
    frecuenciaBackup: 'semanal',
    ubicacionBackup: '/var/backups/citrustrack/',
    tiempoSesion: 120,
    intentosLogin: 5,
    auth2FA: false,
    registroAuditoria: true
  });

  // Traducciones
  const translations = {
    es: {
      systemConfig: 'Configuración del Sistema',
      systemAdmin: 'Administrador del Sistema',
      generalSystem: 'Sistema General',
      generalConfig: 'Configuración General',
      companyInfo: 'Información Empresa',
      apiIntegrations: 'API y Integraciones',
      iotSensors: 'Sensores IoT',
      sensorManagement: 'Gestión de Sensores',
      thresholdsAlerts: 'Umbrales y Alertas',
      calibration: 'Calibración',
      usersRoles: 'Usuarios y Roles',
      userManagement: 'Gestión de Usuarios',
      permissionsRoles: 'Permisos y Roles',
      audit: 'Auditoría',
      notifications: 'Notificaciones',
      alertConfig: 'Configuración Alertas',
      notifChannels: 'Canales de Notificación',
      messageTemplates: 'Plantillas de Mensajes',
      advancedConfig: 'Configuración Avanzada',
      backupRestore: 'Backup y Restauración',
      systemLogs: 'Logs del Sistema',
      maintenance: 'Mantenimiento',
      cancel: 'Cancelar',
      saveChanges: 'Guardar Cambios',
      configSaved: 'Configuración guardada exitosamente',
      basicInfo: 'Información Básica',
      systemName: 'Nombre del Sistema',
      version: 'Versión',
      timeZone: 'Zona Horaria',
      language: 'Idioma',
      appearance: 'Apariencia',
      colorTheme: 'Tema de Color',
      light: 'Claro',
      dark: 'Oscuro',
      auto: 'Automático',
      primaryColor: 'Color Primario',
      viewMode: 'Modo de Visualización',
      compact: 'Compacto',
      expanded: 'Expandido',
      notifPreferences: 'Preferencias de Notificación',
      emailNotif: 'Notificaciones por Email',
      emailNotifDesc: 'Recibir notificaciones importantes por correo electrónico',
      pushNotif: 'Notificaciones Push',
      pushNotifDesc: 'Notificaciones en tiempo real en el navegador',
      smsAlerts: 'Alertas por SMS',
      smsAlertsDesc: 'Alertas críticas por mensaje de texto',
      autoReportFreq: 'Frecuencia de Reportes Automáticos',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      none: 'No enviar automáticamente',
      dataConfig: 'Configuración de Datos',
      dataRetention: 'Período de Retención de Datos',
      dataRetentionDesc: 'Los datos más antiguos serán archivados automáticamente',
      autoBackupFreq: 'Frecuencia de Backup Automático',
      backupLocation: 'Ubicación de Backup',
      backupLocationDesc: 'Ruta en el servidor donde se almacenarán los backups',
      security: 'Seguridad',
      sessionTime: 'Tiempo de Sesión (minutos)',
      sessionTimeDesc: 'Tiempo de inactividad antes de cerrar sesión automáticamente',
      loginAttempts: 'Intentos de Login Permitidos',
      loginAttemptsDesc: 'Número de intentos fallidos antes de bloquear la cuenta',
      twoFactorAuth: 'Autenticación de Dos Factores',
      twoFactorAuthDesc: 'Requerir verificación adicional para acceder al sistema',
      auditLog: 'Registro de Auditoría',
      auditLogDesc: 'Registrar todas las actividades del sistema',
      currentTime: 'Hora actual',
      months3: '3 meses',
      months6: '6 meses',
      year1: '1 año',
      years2: '2 años',
      years3: '3 años'
    },
    en: {
      systemConfig: 'System Configuration',
      systemAdmin: 'System Administrator',
      generalSystem: 'General System',
      generalConfig: 'General Configuration',
      companyInfo: 'Company Information',
      apiIntegrations: 'API & Integrations',
      iotSensors: 'IoT Sensors',
      sensorManagement: 'Sensor Management',
      thresholdsAlerts: 'Thresholds & Alerts',
      calibration: 'Calibration',
      usersRoles: 'Users & Roles',
      userManagement: 'User Management',
      permissionsRoles: 'Permissions & Roles',
      audit: 'Audit',
      notifications: 'Notifications',
      alertConfig: 'Alert Configuration',
      notifChannels: 'Notification Channels',
      messageTemplates: 'Message Templates',
      advancedConfig: 'Advanced Configuration',
      backupRestore: 'Backup & Restore',
      systemLogs: 'System Logs',
      maintenance: 'Maintenance',
      cancel: 'Cancel',
      saveChanges: 'Save Changes',
      configSaved: 'Configuration saved successfully',
      basicInfo: 'Basic Information',
      systemName: 'System Name',
      version: 'Version',
      timeZone: 'Time Zone',
      language: 'Language',
      appearance: 'Appearance',
      colorTheme: 'Color Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Automatic',
      primaryColor: 'Primary Color',
      viewMode: 'View Mode',
      compact: 'Compact',
      expanded: 'Expanded',
      notifPreferences: 'Notification Preferences',
      emailNotif: 'Email Notifications',
      emailNotifDesc: 'Receive important notifications by email',
      pushNotif: 'Push Notifications',
      pushNotifDesc: 'Real-time notifications in the browser',
      smsAlerts: 'SMS Alerts',
      smsAlertsDesc: 'Critical alerts by text message',
      autoReportFreq: 'Automatic Report Frequency',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      none: 'Do not send automatically',
      dataConfig: 'Data Configuration',
      dataRetention: 'Data Retention Period',
      dataRetentionDesc: 'Older data will be archived automatically',
      autoBackupFreq: 'Automatic Backup Frequency',
      backupLocation: 'Backup Location',
      backupLocationDesc: 'Server path where backups will be stored',
      security: 'Security',
      sessionTime: 'Session Time (minutes)',
      sessionTimeDesc: 'Inactivity time before automatic logout',
      loginAttempts: 'Allowed Login Attempts',
      loginAttemptsDesc: 'Number of failed attempts before account lockout',
      twoFactorAuth: 'Two-Factor Authentication',
      twoFactorAuthDesc: 'Require additional verification to access the system',
      auditLog: 'Audit Log',
      auditLogDesc: 'Record all system activities',
      currentTime: 'Current time',
      months3: '3 months',
      months6: '6 months',
      year1: '1 year',
      years2: '2 years',
      years3: '3 years'
    },
    pt: {
      systemConfig: 'Configuração do Sistema',
      systemAdmin: 'Administrador do Sistema',
      generalSystem: 'Sistema Geral',
      generalConfig: 'Configuração Geral',
      companyInfo: 'Informações da Empresa',
      apiIntegrations: 'API e Integrações',
      iotSensors: 'Sensores IoT',
      sensorManagement: 'Gestão de Sensores',
      thresholdsAlerts: 'Limites e Alertas',
      calibration: 'Calibração',
      usersRoles: 'Usuários e Funções',
      userManagement: 'Gestão de Usuários',
      permissionsRoles: 'Permissões e Funções',
      audit: 'Auditoria',
      notifications: 'Notificações',
      alertConfig: 'Configuração de Alertas',
      notifChannels: 'Canais de Notificação',
      messageTemplates: 'Modelos de Mensagens',
      advancedConfig: 'Configuração Avançada',
      backupRestore: 'Backup e Restauração',
      systemLogs: 'Logs do Sistema',
      maintenance: 'Manutenção',
      cancel: 'Cancelar',
      saveChanges: 'Salvar Alterações',
      configSaved: 'Configuração salva com sucesso',
      basicInfo: 'Informações Básicas',
      systemName: 'Nome do Sistema',
      version: 'Versão',
      timeZone: 'Fuso Horário',
      language: 'Idioma',
      appearance: 'Aparência',
      colorTheme: 'Tema de Cores',
      light: 'Claro',
      dark: 'Escuro',
      auto: 'Automático',
      primaryColor: 'Cor Primária',
      viewMode: 'Modo de Visualização',
      compact: 'Compacto',
      expanded: 'Expandido',
      notifPreferences: 'Preferências de Notificação',
      emailNotif: 'Notificações por Email',
      emailNotifDesc: 'Receber notificações importantes por email',
      pushNotif: 'Notificações Push',
      pushNotifDesc: 'Notificações em tempo real no navegador',
      smsAlerts: 'Alertas por SMS',
      smsAlertsDesc: 'Alertas críticos por mensagem de texto',
      autoReportFreq: 'Frequência de Relatórios Automáticos',
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      none: 'Não enviar automaticamente',
      dataConfig: 'Configuração de Dados',
      dataRetention: 'Período de Retenção de Dados',
      dataRetentionDesc: 'Dados mais antigos serão arquivados automaticamente',
      autoBackupFreq: 'Frequência de Backup Automático',
      backupLocation: 'Local do Backup',
      backupLocationDesc: 'Caminho no servidor onde os backups serão armazenados',
      security: 'Segurança',
      sessionTime: 'Tempo de Sessão (minutos)',
      sessionTimeDesc: 'Tempo de inatividade antes do logout automático',
      loginAttempts: 'Tentativas de Login Permitidas',
      loginAttemptsDesc: 'Número de tentativas falhadas antes do bloqueio da conta',
      twoFactorAuth: 'Autenticação de Dois Fatores',
      twoFactorAuthDesc: 'Requer verificação adicional para acessar o sistema',
      auditLog: 'Registro de Auditoria',
      auditLogDesc: 'Registrar todas as atividades do sistema',
      currentTime: 'Hora atual',
      months3: '3 meses',
      months6: '6 meses',
      year1: '1 ano',
      years2: '2 anos',
      years3: '3 anos'
    }
  };

  const t = translations[config.idioma];

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Aplicar tema al cargar y cuando cambia el idioma
  useEffect(() => {
    applyTheme(config.tema);
    applyPrimaryColor(config.colorPrimario);
  }, [config.tema, config.colorPrimario]);

  const applyTheme = (tema) => {
    const root = document.documentElement;
    
    let temaActual = tema;
    if (tema === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      temaActual = prefersDark ? 'oscuro' : 'claro';
    }
    
    if (temaActual === 'oscuro') {
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--bg-tertiary', '#3a3a3a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.5)');
      root.style.setProperty('--card-bg', '#2d2d2d');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f5f5f5');
      root.style.setProperty('--bg-tertiary', '#e8e8e8');
      root.style.setProperty('--text-primary', '#333333');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--border-color', '#e0e0e0');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--card-bg', '#ffffff');
    }
  };

  const applyPrimaryColor = (color) => {
    document.documentElement.style.setProperty('--color-primary', color);
    
    // Calcular color más oscuro para hover
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const darker = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`;
    document.documentElement.style.setProperty('--color-primary-dark', darker);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(config.idioma === 'en' ? 'en-US' : config.idioma === 'pt' ? 'pt-BR' : 'es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: config.idioma === 'en'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(config.idioma === 'en' ? 'en-US' : config.idioma === 'pt' ? 'pt-BR' : 'es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleSubmenu = (categoria) => {
    setActiveCategory(activeCategory === categoria ? '' : categoria);
  };

  const cargarPanel = (panel) => {
    setActivePanel(panel);
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    
    // Aplicar cambios en tiempo real
    if (key === 'tema') {
      applyTheme(value);
    } else if (key === 'colorPrimario') {
      applyPrimaryColor(value);
    }
  };

  const guardarConfiguracion = () => {
    // Guardar en localStorage
    Object.keys(config).forEach(key => {
      localStorage.setItem(key, config[key]);
    });
    
    alert(t.configSaved);
  };

  const renderPanelContent = () => {
    switch(activePanel) {
      case 'general':
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4><i className="fas fa-info-circle"></i> {t.basicInfo}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nombre-sistema">{t.systemName}</label>
                  <input 
                    type="text" 
                    id="nombre-sistema" 
                    value={config.nombreSistema}
                    onChange={(e) => handleConfigChange('nombreSistema', e.target.value)}
                    placeholder={t.systemName}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="version-sistema">{t.version}</label>
                  <input 
                    type="text" 
                    id="version-sistema" 
                    value={config.version} 
                    readOnly 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="zona-horaria">{t.timeZone}</label>
                  <select 
                    id="zona-horaria"
                    value={config.zonaHoraria}
                    onChange={(e) => handleConfigChange('zonaHoraria', e.target.value)}
                  >
                    <option value="-3">UTC-3: Argentina</option>
                    <option value="-5">UTC-5: Chile, Perú</option>
                    <option value="-6">UTC-6: Centroamérica</option>
                    <option value="0">UTC: Europa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="idioma">{t.language}</label>
                  <select 
                    id="idioma"
                    value={config.idioma}
                    onChange={(e) => handleConfigChange('idioma', e.target.value)}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4><i className="fas fa-palette"></i> {t.appearance}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="tema">{t.colorTheme}</label>
                  <select 
                    id="tema"
                    value={config.tema}
                    onChange={(e) => handleConfigChange('tema', e.target.value)}
                  >
                    <option value="claro">{t.light}</option>
                    <option value="oscuro">{t.dark}</option>
                    <option value="auto">{t.auto}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="color-primario">{t.primaryColor}</label>
                  <input 
                    type="color" 
                    id="color-primario" 
                    value={config.colorPrimario}
                    onChange={(e) => handleConfigChange('colorPrimario', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{t.viewMode}</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="radio" 
                        name="modo-visualizacion" 
                        value="compacto" 
                        checked={config.modoVisualizacion === 'compacto'}
                        onChange={(e) => handleConfigChange('modoVisualizacion', e.target.value)}
                      /> {t.compact}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="radio" 
                        name="modo-visualizacion" 
                        value="expandido" 
                        checked={config.modoVisualizacion === 'expandido'}
                        onChange={(e) => handleConfigChange('modoVisualizacion', e.target.value)}
                      /> {t.expanded}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4><i className="fas fa-bell"></i> {t.notifPreferences}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t.emailNotif}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={config.notifEmail}
                        onChange={(e) => handleConfigChange('notifEmail', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.emailNotifDesc}</div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t.pushNotif}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={config.notifPush}
                        onChange={(e) => handleConfigChange('notifPush', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.pushNotifDesc}</div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t.smsAlerts}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={config.notifSMS}
                        onChange={(e) => handleConfigChange('notifSMS', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.smsAlertsDesc}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="frecuencia-reportes">{t.autoReportFreq}</label>
                  <select 
                    id="frecuencia-reportes"
                    value={config.frecuenciaReportes}
                    onChange={(e) => handleConfigChange('frecuenciaReportes', e.target.value)}
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
              <h4><i className="fas fa-database"></i> {t.dataConfig}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="retencion-datos">{t.dataRetention}</label>
                  <select 
                    id="retencion-datos"
                    value={config.retencionDatos}
                    onChange={(e) => handleConfigChange('retencionDatos', e.target.value)}
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
                    onChange={(e) => handleConfigChange('frecuenciaBackup', e.target.value)}
                  >
                    <option value="diario">{t.daily}</option>
                    <option value="semanal">{t.weekly}</option>
                    <option value="mensual">{t.monthly}</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="ubicacion-backup">{t.backupLocation}</label>
                  <input 
                    type="text" 
                    id="ubicacion-backup" 
                    value={config.ubicacionBackup}
                    onChange={(e) => handleConfigChange('ubicacionBackup', e.target.value)}
                    placeholder={t.backupLocation}
                  />
                  <div className="form-help">{t.backupLocationDesc}</div>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4><i className="fas fa-shield-alt"></i> {t.security}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="tiempo-sesion">{t.sessionTime}</label>
                  <input 
                    type="number" 
                    id="tiempo-sesion" 
                    value={config.tiempoSesion}
                    onChange={(e) => handleConfigChange('tiempoSesion', e.target.value)}
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
                    onChange={(e) => handleConfigChange('intentosLogin', e.target.value)}
                    min="3" 
                    max="10" 
                  />
                  <div className="form-help">{t.loginAttemptsDesc}</div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t.twoFactorAuth}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={config.auth2FA}
                        onChange={(e) => handleConfigChange('auth2FA', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </label>
                  <div className="form-help">{t.twoFactorAuthDesc}</div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t.auditLog}</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={config.registroAuditoria}
                        onChange={(e) => handleConfigChange('registroAuditoria', e.target.checked)}
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

      case 'empresa':
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4><i className="fas fa-info-circle"></i> {t.companyInfo}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nombre-empresa">{config.idioma === 'en' ? 'Company Name' : config.idioma === 'pt' ? 'Nome da Empresa' : 'Nombre de la Empresa'}</label>
                  <input type="text" id="nombre-empresa" defaultValue="CitrusCorp S.A." />
                </div>
                <div className="form-group">
                  <label htmlFor="ruc">RUC/CUIT</label>
                  <input type="text" id="ruc" defaultValue="30-12345678-9" />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="direccion">{config.idioma === 'en' ? 'Address' : config.idioma === 'pt' ? 'Endereço' : 'Dirección'}</label>
                  <input type="text" id="direccion" defaultValue="Av. Siempre Viva 123, Tucumán" />
                </div>
                <div className="form-group">
                  
                  <label htmlFor="telefono">{config.idioma === 'en' ? 'Phone' : config.idioma === 'pt' ? 'Telefone' : 'Teléfono'}</label>
                  <input type="text" id="telefono" defaultValue="+54 381 123-4567" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" defaultValue="info@citruscorp.com" />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4><i className="fas fa-industry"></i> {config.idioma === 'en' ? 'Plants and Locations' : config.idioma === 'pt' ? 'Plantas e Localizações' : 'Plantas y Ubicaciones'}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="planta-t1">{config.idioma === 'en' ? 'Plant T1' : config.idioma === 'pt' ? 'Planta T1' : 'Planta T1'}</label>
                  <input type="text" id="planta-t1" defaultValue={config.idioma === 'en' ? 'Main Plant Tucumán' : config.idioma === 'pt' ? 'Planta Principal Tucumán' : 'Planta Principal Tucumán'} />
                </div>
                <div className="form-group">
                  <label htmlFor="planta-t2">{config.idioma === 'en' ? 'Plant T2' : config.idioma === 'pt' ? 'Planta T2' : 'Planta T2'}</label>
                  <input type="text" id="planta-t2" defaultValue={config.idioma === 'en' ? 'Secondary Plant Salta' : config.idioma === 'pt' ? 'Planta Secundária Salta' : 'Planta Secundaria Salta'} />
                </div>
                <div className="form-group">
                  <label htmlFor="planta-t3">{config.idioma === 'en' ? 'Plant T3' : config.idioma === 'pt' ? 'Planta T3' : 'Planta T3'}</label>
                  <input type="text" id="planta-t3" defaultValue={config.idioma === 'en' ? 'Tertiary Plant Jujuy' : config.idioma === 'pt' ? 'Planta Terciária Jujuy' : 'Planta Terciaria Jujuy'} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'sensores':
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4><i className="fas fa-list"></i> {t.sensorManagement}</h4>
              <div className="sensores-grid">
                <div className="sensor-card">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T1-A1</div>
                    <div className="sensor-status status-active">{config.idioma === 'en' ? 'Active' : config.idioma === 'pt' ? 'Ativo' : 'Activo'}</div>
                  </div>
                  <div className="sensor-info">
                    <div>{config.idioma === 'en' ? 'Temperature - Line A' : config.idioma === 'pt' ? 'Temperatura - Linha A' : 'Temperatura - Línea A'}</div>
                    <div>{config.idioma === 'en' ? 'Plant T1 • Last reading: 8.7°C' : config.idioma === 'pt' ? 'Planta T1 • Última leitura: 8.7°C' : 'Planta T1 • Última lectura: 8.7°C'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {config.idioma === 'en' ? 'Edit' : config.idioma === 'pt' ? 'Editar' : 'Editar'}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-chart-line"></i> {config.idioma === 'en' ? 'Data' : config.idioma === 'pt' ? 'Dados' : 'Datos'}
                    </button>
                  </div>
                </div>
                
                <div className="sensor-card">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T1-A2</div>
                    <div className="sensor-status status-active">{config.idioma === 'en' ? 'Active' : config.idioma === 'pt' ? 'Ativo' : 'Activo'}</div>
                  </div>
                  <div className="sensor-info">
                    <div>{config.idioma === 'en' ? 'Humidity - Line A' : config.idioma === 'pt' ? 'Umidade - Linha A' : 'Humedad - Línea A'}</div>
                    <div>{config.idioma === 'en' ? 'Plant T1 • Last reading: 68%' : config.idioma === 'pt' ? 'Planta T1 • Última leitura: 68%' : 'Planta T1 • Última lectura: 68%'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {config.idioma === 'en' ? 'Edit' : config.idioma === 'pt' ? 'Editar' : 'Editar'}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-chart-line"></i> {config.idioma === 'en' ? 'Data' : config.idioma === 'pt' ? 'Dados' : 'Datos'}
                    </button>
                  </div>
                </div>
                
                <div className="sensor-card error">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T1-B3</div>
                    <div className="sensor-status status-error">Error</div>
                  </div>
                  <div className="sensor-info">
                    <div>{config.idioma === 'en' ? 'Vibration - Line B' : config.idioma === 'pt' ? 'Vibração - Linha B' : 'Vibración - Línea B'}</div>
                    <div>{config.idioma === 'en' ? 'Plant T1 • No communication' : config.idioma === 'pt' ? 'Planta T1 • Sem comunicação' : 'Planta T1 • Sin comunicación'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {config.idioma === 'en' ? 'Edit' : config.idioma === 'pt' ? 'Editar' : 'Editar'}
                    </button>
                    <button className="btn btn-danger btn-sm">
                      <i className="fas fa-redo"></i> {config.idioma === 'en' ? 'Restart' : config.idioma === 'pt' ? 'Reiniciar' : 'Reiniciar'}
                    </button>
                  </div>
                </div>
                
                <div className="sensor-card offline">
                  <div className="sensor-header">
                    <div className="sensor-name">Sensor T2-C1</div>
                    <div className="sensor-status status-offline">Offline</div>
                  </div>
                  <div className="sensor-info">
                    <div>{config.idioma === 'en' ? 'Temperature - Line C' : config.idioma === 'pt' ? 'Temperatura - Linha C' : 'Temperatura - Línea C'}</div>
                    <div>{config.idioma === 'en' ? 'Plant T2 • Last connection: 2h ago' : config.idioma === 'pt' ? 'Planta T2 • Última conexão: há 2h' : 'Planta T2 • Última conexión: hace 2h'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i> {config.idioma === 'en' ? 'Edit' : config.idioma === 'pt' ? 'Editar' : 'Editar'}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-power-off"></i> {config.idioma === 'en' ? 'Connect' : config.idioma === 'pt' ? 'Conectar' : 'Conectar'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <button className="btn btn-primary">
                  <i className="fas fa-plus"></i> {config.idioma === 'en' ? 'Add New Sensor' : config.idioma === 'pt' ? 'Adicionar Novo Sensor' : 'Agregar Nuevo Sensor'}
                </button>
                <button className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                  <i className="fas fa-sync"></i> {config.idioma === 'en' ? 'Scan Sensors' : config.idioma === 'pt' ? 'Escanear Sensores' : 'Escanear Sensores'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'usuarios':
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4><i className="fas fa-users"></i> {t.userManagement}</h4>
              <div className="usuarios-list">
                <div className="usuario-card">
                  <div className="usuario-avatar">AG</div>
                  <div className="usuario-info">
                    <div className="usuario-nombre">Ana González</div>
                    <div className="usuario-rol">{config.idioma === 'en' ? 'System Administrator' : config.idioma === 'pt' ? 'Administrador do Sistema' : 'Administrador del Sistema'}</div>
                  </div>
                  <div className="usuario-acciones">
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-key"></i>
                    </button>
                  </div>
                </div>
                
                <div className="usuario-card">
                  <div className="usuario-avatar">CL</div>
                  <div className="usuario-info">
                    <div className="usuario-nombre">Carlos López</div>
                    <div className="usuario-rol">{config.idioma === 'en' ? 'Plant Supervisor' : config.idioma === 'pt' ? 'Supervisor de Planta' : 'Supervisor de Planta'}</div>
                  </div>
                  <div className="usuario-acciones">
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-key"></i>
                    </button>
                  </div>
                </div>
                
                <div className="usuario-card">
                  <div className="usuario-avatar">MP</div>
                  <div className="usuario-info">
                    <div className="usuario-nombre">María Pérez</div>
                    <div className="usuario-rol">{config.idioma === 'en' ? 'Logistics Coordinator' : config.idioma === 'pt' ? 'Coordenador Logístico' : 'Coordinador Logístico'}</div>
                  </div>
                  <div className="usuario-acciones">
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-key"></i>
                    </button>
                  </div>
                </div>
                
                <div className="usuario-card">
                  <div className="usuario-avatar">RA</div>
                  <div className="usuario-info">
                    <div className="usuario-nombre">Roberto Alvarez</div>
                    <div className="usuario-rol">{config.idioma === 'en' ? 'Auditor' : config.idioma === 'pt' ? 'Auditor' : 'Auditor'}</div>
                  </div>
                  <div className="usuario-acciones">
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <i className="fas fa-key"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <button className="btn btn-primary">
                  <i className="fas fa-user-plus"></i> {config.idioma === 'en' ? 'Add User' : config.idioma === 'pt' ? 'Adicionar Usuário' : 'Agregar Usuario'}
                </button>
                <button className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                  <i className="fas fa-file-export"></i> {config.idioma === 'en' ? 'Export List' : config.idioma === 'pt' ? 'Exportar Lista' : 'Exportar Lista'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'alertas':
        return (
          <div className="form-configuracion">
            <div className="form-section">
              <h4><i className="fas fa-bell"></i> {config.idioma === 'en' ? 'Alert Types' : config.idioma === 'pt' ? 'Tipos de Alertas' : 'Tipos de Alertas'}</h4>
              <div className="alertas-config">
                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{config.idioma === 'en' ? 'Cold Chain Break' : config.idioma === 'pt' ? 'Quebra de Cadeia de Frio' : 'Ruptura de Frío'}</h5>
                    <div className="alerta-descripcion">{config.idioma === 'en' ? 'Temperature out of allowed range for more than 15 minutes' : config.idioma === 'pt' ? 'Temperatura fora da faixa permitida por mais de 15 minutos' : 'Temperatura fuera del rango permitido por más de 15 minutos'}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{config.idioma === 'en' ? 'Excessive Vibration' : config.idioma === 'pt' ? 'Vibração Excessiva' : 'Vibración Excesiva'}</h5>
                    <div className="alerta-descripcion">{config.idioma === 'en' ? 'Vibration level above 0.5g for more than 5 minutes' : config.idioma === 'pt' ? 'Nível de vibração superior a 0.5g por mais de 5 minutos' : 'Nivel de vibración superior a 0.5g por más de 5 minutos'}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{config.idioma === 'en' ? 'Sensor Failure' : config.idioma === 'pt' ? 'Falha de Sensor' : 'Falla de Sensor'}</h5>
                    <div className="alerta-descripcion">{config.idioma === 'en' ? 'Sensor without communication for more than 30 minutes' : config.idioma === 'pt' ? 'Sensor sem comunicação por mais de 30 minutos' : 'Sensor sin comunicación por más de 30 minutos'}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="alerta-item">
                  <div className="alerta-info">
                    <h5>{config.idioma === 'en' ? 'Delivery Delay' : config.idioma === 'pt' ? 'Atraso na Entrega' : 'Retraso en Entrega'}</h5>
                    <div className="alerta-descripcion">{config.idioma === 'en' ? 'Delivery delayed by more than 1 hour' : config.idioma === 'pt' ? 'Entrega com mais de 1 hora de atraso' : 'Entrega con más de 1 hora de retraso'}</div>
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

      default:
        return null;
    }
  };

  const getPanelTitle = () => {
    const titles = {
      general: `<i class="fas fa-cog"></i> ${t.generalConfig}`,
      empresa: `<i class="fas fa-building"></i> ${t.companyInfo}`,
      sensores: `<i class="fas fa-microchip"></i> ${t.sensorManagement}`,
      usuarios: `<i class="fas fa-user-friends"></i> ${t.userManagement}`,
      alertas: `<i class="fas fa-exclamation-triangle"></i> ${t.alertConfig}`
    };
    return titles[activePanel] || titles.general;
  };

  return (
    <div className="main-content">
      <div className="header">
        <h2><i className="fas fa-cog"></i> {t.systemConfig}</h2>
        <div className="user-info">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            marginRight: '20px',
            padding: '8px 15px',
            background: 'var(--bg-tertiary, #e8e8e8)',
            borderRadius: '8px',
            minWidth: '200px'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'var(--color-primary, #2e7d32)',
              fontFamily: 'monospace'
            }}>
              {formatTime(currentTime)}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary, #666)',
              marginTop: '2px'
            }}>
              {formatDate(currentTime)}
            </div>
          </div>
          <i className="fas fa-user-circle"></i>
          <span>{t.systemAdmin}</span>
        </div>
      </div>
      
      <div className="configuracion-layout">
        <div className="menu-configuracion">
          <div className="categoria-config">
            <div 
              className={`categoria-header ${activeCategory === 'sistema' ? 'active' : ''}`}
              onClick={() => toggleSubmenu('sistema')}
            >
              <h3><i className="fas fa-sliders-h"></i> {t.generalSystem}</h3>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div className={`submenu-items ${activeCategory === 'sistema' ? 'active' : ''}`}>
              <div 
                className={`submenu-item ${activePanel === 'general' ? 'active' : ''}`}
                onClick={() => cargarPanel('general')}
              >
                <i className="fas fa-cog"></i> {t.generalConfig}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'empresa' ? 'active' : ''}`}
                onClick={() => cargarPanel('empresa')}
              >
                <i className="fas fa-building"></i> {t.companyInfo}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'api' ? 'active' : ''}`}
                onClick={() => cargarPanel('api')}
              >
                <i className="fas fa-code"></i> {t.apiIntegrations}
              </div>
            </div>
          </div>
          
          <div className="categoria-config">
            <div 
              className={`categoria-header ${activeCategory === 'sensores' ? 'active' : ''}`}
              onClick={() => toggleSubmenu('sensores')}
            >
              <h3><i className="fas fa-microchip"></i> {t.iotSensors}</h3>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div className={`submenu-items ${activeCategory === 'sensores' ? 'active' : ''}`}>
              <div 
                className={`submenu-item ${activePanel === 'sensores' ? 'active' : ''}`}
                onClick={() => cargarPanel('sensores')}
              >
                <i className="fas fa-list"></i> {t.sensorManagement}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'umbrales' ? 'active' : ''}`}
                onClick={() => cargarPanel('umbrales')}
              >
                <i className="fas fa-thermometer-half"></i> {t.thresholdsAlerts}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'calibracion' ? 'active' : ''}`}
                onClick={() => cargarPanel('calibracion')}
              >
                <i className="fas fa-tools"></i> {t.calibration}
              </div>
            </div>
          </div>
          
          <div className="categoria-config">
            <div 
              className={`categoria-header ${activeCategory === 'usuarios' ? 'active' : ''}`}
              onClick={() => toggleSubmenu('usuarios')}
            >
              <h3><i className="fas fa-users"></i> {t.usersRoles}</h3>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div className={`submenu-items ${activeCategory === 'usuarios' ? 'active' : ''}`}>
              <div 
                className={`submenu-item ${activePanel === 'usuarios' ? 'active' : ''}`}
                onClick={() => cargarPanel('usuarios')}
              >
                <i className="fas fa-user-friends"></i> {t.userManagement}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'roles' ? 'active' : ''}`}
                onClick={() => cargarPanel('roles')}
              >
                <i className="fas fa-user-shield"></i> {t.permissionsRoles}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'auditoria' ? 'active' : ''}`}
                onClick={() => cargarPanel('auditoria')}
              >
                <i className="fas fa-clipboard-list"></i> {t.audit}
              </div>
            </div>
          </div>
          
          <div className="categoria-config">
            <div 
              className={`categoria-header ${activeCategory === 'notificaciones' ? 'active' : ''}`}
              onClick={() => toggleSubmenu('notificaciones')}
            >
              <h3><i className="fas fa-bell"></i> {t.notifications}</h3>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div className={`submenu-items ${activeCategory === 'notificaciones' ? 'active' : ''}`}>
              <div 
                className={`submenu-item ${activePanel === 'alertas' ? 'active' : ''}`}
                onClick={() => cargarPanel('alertas')}
              >
                <i className="fas fa-exclamation-triangle"></i> {t.alertConfig}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'canales' ? 'active' : ''}`}
                onClick={() => cargarPanel('canales')}
              >
                <i className="fas fa-comment-alt"></i> {t.notifChannels}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'plantillas' ? 'active' : ''}`}
                onClick={() => cargarPanel('plantillas')}
              >
                <i className="fas fa-envelope"></i> {t.messageTemplates}
              </div>
            </div>
          </div>
          
          <div className="categoria-config">
            <div 
              className={`categoria-header ${activeCategory === 'avanzada' ? 'active' : ''}`}
              onClick={() => toggleSubmenu('avanzada')}
            >
              <h3><i className="fas fa-tools"></i> {t.advancedConfig}</h3>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div className={`submenu-items ${activeCategory === 'avanzada' ? 'active' : ''}`}>
              <div 
                className={`submenu-item ${activePanel === 'backup' ? 'active' : ''}`}
                onClick={() => cargarPanel('backup')}
              >
                <i className="fas fa-database"></i> {t.backupRestore}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'logs' ? 'active' : ''}`}
                onClick={() => cargarPanel('logs')}
              >
                <i className="fas fa-file-alt"></i> {t.systemLogs}
              </div>
              <div 
                className={`submenu-item ${activePanel === 'mantenimiento' ? 'active' : ''}`}
                onClick={() => cargarPanel('mantenimiento')}
              >
                <i className="fas fa-server"></i> {t.maintenance}
              </div>
            </div>
          </div>
        </div>
        
        <div className="panel-configuracion">
          <div className="panel-header">
            <h3 dangerouslySetInnerHTML={{ __html: getPanelTitle() }}></h3>
            <div className="panel-actions">
              <button className="btn btn-secondary">
                <i className="fas fa-times"></i> {t.cancel}
              </button>
              <button className="btn btn-primary" onClick={guardarConfiguracion}>
                <i className="fas fa-save"></i> {t.saveChanges}
              </button>
            </div>
          </div>
          
          <div id="panel-contenido">
            {renderPanelContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ajustes;
