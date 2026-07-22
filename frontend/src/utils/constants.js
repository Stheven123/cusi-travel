export const ESTADOS_OPERACION = [
  { value: 'COTIZACION',           label: 'Cotización',         color: 'gray' },
  { value: 'RESERVADO',            label: 'Reservado',          color: 'blue' },
  { value: 'SERVICIO_COMPLETO',    label: 'Servicio Completo',  color: 'green' },
  { value: 'PENDIENTE',            label: 'Pendiente',          color: 'yellow' },
  { value: 'ANULADO_SIN_PENALIDAD',label: 'Cancelado sin cargo', color: 'orange' },
  { value: 'ANULADO_CON_PENALIDAD',label: 'Cancelado con cargo', color: 'red' },
];

export const ESTADOS_PAGO = [
  { value: 'PENDIENTE',   label: 'Pendiente',   color: 'red' },
  { value: 'PARCIAL',     label: 'Parcial',     color: 'yellow' },
  { value: 'PAGADO',      label: 'Pagado',      color: 'green' },
  { value: 'REEMBOLSADO', label: 'Reembolsado', color: 'purple' },
  { value: 'ANULADO',     label: 'Anulado',     color: 'gray' },
];

export const TIPOS_PROVEEDOR = [
  'HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','OTRO',
];

export const TIPOS_SERVICIO = [
  { value: 'TREK',             label: 'Trekking' },
  { value: 'DAY_TOUR',         label: 'Tour 1 día' },
  { value: 'CITY_TOUR',        label: 'City Tour' },
  { value: 'TRANSFER',         label: 'Transfer' },
  { value: 'MULTI_DAY',        label: 'Multi-día' },
  { value: 'VUELO',            label: 'Vuelo' },
  { value: 'PAQUETE_COMPLETO', label: 'Paquete completo' },
];

export const NIVELES_DIFICULTAD = ['FACIL','MODERADO','DIFICIL','MUY_DIFICIL','EXTREMO'];

export const PRIORIDADES_TAREA = [
  { value: 'BAJA',    label: 'Baja',    color: 'gray' },
  { value: 'MEDIA',   label: 'Media',   color: 'blue' },
  { value: 'ALTA',    label: 'Alta',    color: 'orange' },
  { value: 'URGENTE', label: 'Urgente', color: 'red' },
];

export const ESTADOS_TAREA = [
  { value: 'PENDIENTE',   label: 'Pendiente',   color: 'yellow' },
  { value: 'EN_PROGRESO', label: 'En progreso', color: 'blue' },
  { value: 'COMPLETADA',  label: 'Completada',  color: 'green' },
  { value: 'CANCELADA',   label: 'Cancelada',   color: 'gray' },
];

export const ROLES_USUARIO = ['ADMIN','OPERACIONES','VENTAS','GUIA','FINANZAS','SOLO_LECTURA'];

export const IDIOMAS = ['Español','Inglés','Francés','Alemán','Portugués','Italiano'];

export const TIPOS_HAB = ['SGL','DBL','TWN','TPL','SUITE'];

export const NACIONALIDADES = [
  'Peruana','Argentina','Boliviana','Brasileña','Chilena','Colombiana','Ecuatoriana',
  'Paraguaya','Uruguaya','Venezolana','Mexicana','Estadounidense','Canadiense',
  'Española','Francesa','Alemana','Italiana','Portuguesa','Británica','Suiza',
  'Holandesa','Belga','Sueca','Noruega','Danesa','Australiana','Neozelandesa',
  'China','Japonesa','Coreana','India','Israelí',
];

export const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
export const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
