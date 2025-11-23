import React,{useState,useEffect}from'react';
import{toast}from'react-toastify';
import{editCamion,getAllTransportes}from"../services/settingsServices";
import"../../../style/addusermodal.css";


const EditCamionModal=({isOpen,onClose,onCamionUpdated,initialCamionData})=>{
const[formData,setFormData]=useState({
transportista_id:'',
patente:'',
patente_acoplado:'',
tipo_camion:"",
capacidad_pallets:'',
temp_min:'',
temp_max:'',
ultima_desinfeccion:'',
documentos:'',
estado:'',
});
const[transportes,setTransportes]=useState([]);
const[isSubmitting,setIsSubmitting]=useState(false);
const[localError,setLocalError]=useState(null);

useEffect(()=>{
const fetchTransportes=async()=>{
try{
const dataT=await getAllTransportes();
setTransportes(dataT);
}catch(err){
console.error("Error al cargar transportistas:",err);
toast.error("Error al cargar la lista de transportistas.");
}
};

if(isOpen){
setLocalError(null);
fetchTransportes();

if(initialCamionData){
const desinfeccion=initialCamionData.ultima_desinfeccion
?new Date(initialCamionData.ultima_desinfeccion).toISOString().split('T')[0]
:'';

setFormData({
transportista_id:initialCamionData.transportista_id||'',
patente:initialCamionData.patente||'',
patente_acoplado:initialCamionData.patente_acoplado||'',
tipo_camion:initialCamionData.tipo_camion||TIPO_CAMION_OPTIONS[0],
capacidad_pallets:initialCamionData.capacidad_pallets||'',
temp_min:initialCamionData.temp_min!==null?initialCamionData.temp_min:'',
temp_max:initialCamionData.temp_max!==null?initialCamionData.temp_max:'',
ultima_desinfeccion:desinfeccion,
documentos:initialCamionData.documentos||'',
estado:initialCamionData.estado||'activo',
});
}
}
},[isOpen,initialCamionData]);

if(!isOpen||!initialCamionData)return null;

const handleChange=e=>{
const{name,value}=e.target;
const finalValue=(name==='transportista_id'||name==='capacidad_pallets')?(value?parseInt(value):value):value;
setFormData(prev=>({...prev,[name]:finalValue}));
};

const handleSubmit=async e=>{
e.preventDefault();
setLocalError(null);
setIsSubmitting(true);

try{
if(!formData.transportista_id||!formData.patente||!formData.tipo_camion||!formData.capacidad_pallets){
const requiredError="Los campos Transportista, Patente, Tipo y Capacidad son obligatorios.";
setLocalError(requiredError);
toast.error(requiredError);
setIsSubmitting(false);
return;
}

const dataToUpdate={...formData};

if(dataToUpdate.temp_min==='')dataToUpdate.temp_min=null;
if(dataToUpdate.temp_max==='')dataToUpdate.temp_max=null;

const camionId=initialCamionData.camion_id;

await editCamion(camionId,dataToUpdate);

toast.success(`Camión ${formData.patente} actualizado con éxito!`);

onCamionUpdated();
onClose();

}catch(err){
const apiError=err.response?.data?.error||"Error al actualizar el camión. Por favor, intenta nuevamente.";
toast.error(apiError);
setLocalError(apiError);
}finally{
setIsSubmitting(false);
}
};

const handleOverlayClick=e=>{
if(e.target===e.currentTarget)onClose();
};

const ESTADO_OPTIONS=['activo','mantenimiento'];

return(
<div className="modal-overlay"onClick={handleOverlayClick}>
<div className="modal-content"style={{maxWidth:'600px'}}>
<div className="modal-header">
<h3>
<i className="fas fa-edit"></i>
Editar Camión: {initialCamionData.patente}
</h3>
<button className="modal-close-btn"onClick={onClose}disabled={isSubmitting}>
<i className="fas fa-times"></i>
</button>
</div>

<div className="modal-body">
{localError&&<div className="modal-error">{localError}</div>}

<form onSubmit={handleSubmit}>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
<div className="form-group">
<label className="form-label"htmlFor="transportista_id">
Transportista <span className="required-star">*</span>
</label>
<select id="transportista_id"name="transportista_id"value={formData.transportista_id}onChange={handleChange}className="form-input"required disabled={transportes.length===0||isSubmitting}>
{transportes.length>0?(
transportes.map(t=>(
<option key={t.transportista_id}value={t.transportista_id}>{t.nombre}</option>
))
):(
<option value="">Cargando...</option>
)}
</select>
</div>

<div className="form-group">
<label className="form-label"htmlFor="patente">
Patente Principal <span className="required-star">*</span>
</label>
<input type="text"id="patente"name="patente"value={formData.patente}onChange={handleChange}className="form-input"placeholder="Ej: AA123BC"required/>
</div>
</div>

<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
<div className="form-group">
<label className="form-label"htmlFor="patente_acoplado">Patente Acoplado</label>
<input type="text"id="patente_acoplado"name="patente_acoplado"value={formData.patente_acoplado}onChange={handleChange}className="form-input"placeholder="Opcional"/>
</div>

<div className="form-group">
<label className="form-label"htmlFor="tipo_camion">
Tipo de Camión <span className="required-star">*</span>
</label>
<input type="text"id="tipo_camion"name="tipo_camion"value={formData.tipo_camion}onChange={handleChange}className="form-input"placeholder="Opcional"/>
</div>
</div>

<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
<div className="form-group">
<label className="form-label"htmlFor="capacidad_pallets">
Capacidad Pallets <span className="required-star">*</span>
</label>
<input type="number"id="capacidad_pallets"name="capacidad_pallets"value={formData.capacidad_pallets}onChange={handleChange}className="form-input"placeholder="Ej: 22"min="1"required/>
</div>

<div className="form-group">
<label className="form-label"htmlFor="ultima_desinfeccion">Última Desinfección</label>
<input type="date"id="ultima_desinfeccion"name="ultima_desinfeccion"value={formData.ultima_desinfeccion}onChange={handleChange}className="form-input"/>
</div>
</div>

<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
<div className="form-group">
<label className="form-label"htmlFor="temp_min">Temp Mínima (°C)</label>
<input type="number"step="0.1"id="temp_min"name="temp_min"value={formData.temp_min}onChange={handleChange}className="form-input"placeholder="Ej: 2.0"/>
</div>

<div className="form-group">
<label className="form-label"htmlFor="temp_max">Temp Máxima (°C)</label>
<input type="number"step="0.1"id="temp_max"name="temp_max"value={formData.temp_max}onChange={handleChange}className="form-input"placeholder="Ej: 5.0"/>
</div>
</div>

<div className="form-group">
<label className="form-label"htmlFor="estado">Estado del Camión</label>
<select id="estado"name="estado"value={formData.estado}onChange={handleChange}className="form-input">
{ESTADO_OPTIONS.map(estado=>(
<option key={estado}value={estado}>{estado.charAt(0).toUpperCase()+estado.slice(1)}</option>
))}
</select>
</div>

<div className="form-group">
<label className="form-label"htmlFor="documentos">Documentos / Notas (Opcional)</label>
<textarea id="documentos"name="documentos"value={formData.documentos}onChange={handleChange}className="form-input"rows="3"placeholder="Detalles de documentación importante o notas."/>
</div>
</form>
</div>

<div className="modal-footer">
<button type="button"onClick={onClose}className="modal-btn modal-btn-cancel"disabled={isSubmitting}>
<i className="fas fa-times"></i>Cancelar
</button>
<button type="submit"onClick={handleSubmit}className="modal-btn modal-btn-submit"disabled={isSubmitting}>
{isSubmitting?(
<>
<i className="fas fa-spinner fa-spin"></i>Actualizando...
</>
):(
<>
<i className="fas fa-save"></i>Guardar Cambios
</>
)}
</button>
</div>
</div>
</div>
);
};

export default EditCamionModal;
