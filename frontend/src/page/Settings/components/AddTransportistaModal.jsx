import React,{useState}from'react';
import{toast}from'react-toastify';
import{createTransportista}from"../services/settingsServices";
import"../../../style/addusermodal.css";

const AddTransportistaModal=({isOpen,onClose,onTransportistaAdded})=>{
 const[formData,setFormData]=useState({
  nombre:'',
  cuit:'',
  contacto:'',
  telefono:'',
  email:'',
  seguros:'',
  habilitaciones:'',
 });
 const[isSubmitting,setIsSubmitting]=useState(false);
 const[localError,setLocalError]=useState(null);

 if(!isOpen)return null;

 const handleChange=e=>{
  const{name,value}=e.target;
  setFormData(prev=>({...prev,[name]:value}));
 };

 const handleCloseAndReset=()=>{
  setFormData({
   nombre:'',
   cuit:'',
   contacto:'',
   telefono:'',
   email:'',
   seguros:'',
   habilitaciones:'',
  });
  setLocalError(null);
  onClose();
 };

 const handleSubmit=async e=>{
  e.preventDefault();
  setLocalError(null);
  setIsSubmitting(true);

  try{
   if(!formData.nombre||!formData.cuit||!formData.contacto||!formData.telefono||!formData.email){
    const requiredError="Los campos Nombre, CUIT, Contacto, Teléfono y Email son obligatorios.";
    setLocalError(requiredError);
    toast.error(requiredError);
    setIsSubmitting(false);
    return;
   }

   await createTransportista({...formData});
   toast.success(`Transportista ${formData.nombre} agregado con éxito!`);
   onTransportistaAdded();
   handleCloseAndReset();

  }catch(err){
   const apiError=err.response?.data?.error||"Error al crear el transportista. Por favor, intenta nuevamente.";
   toast.error(apiError);
   setLocalError(apiError);

  }finally{
   setIsSubmitting(false);
  }
 };

 const handleOverlayClick=e=>{
  if(e.target===e.currentTarget)handleCloseAndReset();
 };

 return(
  <div className="modal-overlay"onClick={handleOverlayClick}>
   <div className="modal-content">

    <div className="modal-header">
     <h3>
      <i className="fas fa-truck"></i>
      Agregar Nuevo Transportista
     </h3>
     <button className="modal-close-btn"onClick={handleCloseAndReset}disabled={isSubmitting}>
      <i className="fas fa-times"></i>
     </button>
    </div>

    <div className="modal-body">
     {localError&&(<div className="modal-error">{localError}</div>)}

     <form onSubmit={handleSubmit}>
      <div className="form-group">
       <label className="form-label"htmlFor="nombre">
        Nombre Empresa<span className="required-star">*</span>
       </label>
       <input type="text"id="nombre"name="nombre"value={formData.nombre}onChange={handleChange}className="form-input"placeholder="Nombre legal de la empresa"required/>
      </div>

      <div className="form-group">
       <label className="form-label"htmlFor="cuit">
        CUIT<span className="required-star">*</span>
       </label>
       <input type="text"id="cuit"name="cuit"value={formData.cuit}onChange={handleChange}className="form-input"placeholder="XX-XXXXXXXX-X"required/>
      </div>

      <div className="form-group">
       <label className="form-label"htmlFor="contacto">
        Contacto Principal<span className="required-star">*</span>
       </label>
       <input type="text"id="contacto"name="contacto"value={formData.contacto}onChange={handleChange}className="form-input"placeholder="Nombre de la persona de contacto"required/>
      </div>

      <div className="form-group">
       <label className="form-label"htmlFor="telefono">
        Teléfono<span className="required-star">*</span>
       </label>
       <input type="tel"id="telefono"name="telefono"value={formData.telefono}onChange={handleChange}className="form-input"placeholder="+54 9 11 1234-5678"required/>
      </div>

      <div className="form-group">
       <label className="form-label"htmlFor="email">
        Email<span className="required-star">*</span>
       </label>
       <input type="email"id="email"name="email"value={formData.email}onChange={handleChange}className="form-input"placeholder="contacto@empresa.com"required/>
      </div>

      <div className="form-group">
       <label className="form-label"htmlFor="seguros">Detalles de Seguros</label>
       <textarea id="seguros"name="seguros"value={formData.seguros}onChange={handleChange}className="form-input"rows="3"placeholder="Información sobre pólizas, vigencia, etc. (Opcional)"/>
      </div>

      <div className="form-group">
       <label className="form-label"htmlFor="habilitaciones">Habilitaciones / Permisos</label>
       <textarea id="habilitaciones"name="habilitaciones"value={formData.habilitaciones}onChange={handleChange}className="form-input"rows="3"placeholder="Permisos nacionales o internacionales, SENASA, etc. (Opcional)"/>
      </div>
     </form>
    </div>

    <div className="modal-footer">
     <button type="button"onClick={handleCloseAndReset}className="modal-btn modal-btn-cancel"disabled={isSubmitting}>
      <i className="fas fa-times"></i>
      Cancelar
     </button>

     <button type="submit"onClick={handleSubmit}className="modal-btn modal-btn-submit"disabled={isSubmitting}>
      {isSubmitting?<>
       <i className="fas fa-spinner fa-spin"></i>
       Guardando...
      </>:<>
       <i className="fas fa-check"></i>
       Crear Transportista
      </>}
     </button>
    </div>

   </div>
  </div>
 );
};

export default AddTransportistaModal;
