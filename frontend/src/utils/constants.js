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
  'HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','COCINERO','PORTER','OTRO',
];

// Estados posibles de una operación (detalles_operacion_proveedor.estado).
// Única fuente de verdad — se usa tanto en el formulario de la reserva como
// en el filtro del motor de reportes, para que ambos queden siempre en sync
// con el enum real de la base de datos (estado_detalle_proveedor).
export const ESTADOS_DETALLE_OPERACION = [
  { value: 'PENDIENTE',      label: 'Pendiente'      },
  { value: 'SOLICITADO',     label: 'Solicitado'     },
  { value: 'RESERVADO',      label: 'Reservado'      },
  { value: 'PAGADO',         label: 'Pagado'         },
  { value: 'CONFIRMADO',     label: 'Confirmado'     },
  { value: 'RECONFIRMADO',   label: 'Reconfirmado'   },
  { value: 'EMITIDO',        label: 'Emitido'        },
  { value: 'ANULADO',        label: 'Anulado'        },
  { value: 'FACTURADO',      label: 'Facturado'      },
  { value: 'COMPLETADO',     label: 'Completado'     },
  { value: 'CANCELADO',      label: 'Cancelado'      },
  { value: 'PENDIENTE_PAGO', label: 'Pendiente pago' },
];

// Tipos de documento que puede sustentar una operación (comprobante del proveedor)
export const TIPOS_DOCUMENTO = [
  'FACTURA', 'BOLETA', 'RECIBO POR HONORARIOS', 'VOUCHER', 'GUIA DE REMISION', 'NOTA DE CREDITO', 'OTRO',
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
].sort((a, b) => a.localeCompare(b, 'es'));

export const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
export const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
