import React,{useState,useEffect}from'react';
import{toast}from'react-toastify';
import{editTransportista}from"../services/settingsServices";
import"../../../style/addusermodal.css";

const EditTransportistaModal=({isOpen,onClose,onTransportistaUpdated,initialTransportistaData})=>{
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

 useEffect(()=>{
  if(isOpen&&initialTransportistaData){
   setFormData({
    nombre:initialTransportistaData.nombre||'',
    cuit:initialTransportistaData.cuit||'',
    contacto:initialTransportistaData.contacto||'',
    telefono:initialTransportistaData.telefono||'',
    email:initialTransportistaData.email||'',
    seguros:initialTransportistaData.seguros||'',
    habilitaciones:initialTransportistaData.habilitaciones||'',
   });
   setLocalError(null);
  }
 },[isOpen,initialTransportistaData]);

 if(!isOpen||!initialTransportistaData)return null;

 const handleChange=e=>{
  const{name,value}=e.target;
  setFormData(prev=>({...prev,[name]:value}));
 };

 const handleClose=()=>{
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

   const dataToUpdate={...formData};
   const transportistaId=initialTransportistaData.transportista_id;

   await editTransportista(transportistaId,dataToUpdate);
   toast.success(`Transportista ${formData.nombre} actualizado con éxito!`);
   onTransportistaUpdated();
   handleClose();

  }catch(err){
   const apiError=err.response?.data?.error||"Error al actualizar el transportista. Por favor, intenta nuevamente.";
   toast.error(apiError);
   setLocalError(apiError);

  }finally{
   setIsSubmitting(false);
  }
 };

 const handleOverlayClick=e=>{
  if(e.target===e.currentTarget)handleClose();
 };

 return(
  <div className="modal-overlay"onClick={handleOverlayClick}>
   <div className="modal-content">

    <div className="modal-header">
     <h3>
      <i className="fas fa-edit"></i>
      Editar Transportista: {initialTransportistaData.nombre}
     </h3>
     <button className="modal-close-btn"onClick={handleClose}disabled={isSubmitting}>
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
     <button type="button"onClick={handleClose}className="modal-btn modal-btn-cancel"disabled={isSubmitting}>
      <i className="fas fa-times"></i>
      Cancelar
     </button>
     <button type="submit"onClick={handleSubmit}className="modal-btn modal-btn-submit"disabled={isSubmitting}>
      {isSubmitting?<>
       <i className="fas fa-spinner fa-spin"></i>
       Actualizando...
      </>:<>
       <i className="fas fa-save"></i>
       Guardar Cambios
      </>}
     </button>
    </div>

   </div>
  </div>
 );
};

export default EditTransportistaModal;
