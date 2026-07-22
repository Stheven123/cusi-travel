-- ============================================================
-- CUSI TRAVEL ERP — Datos de demostración
-- ============================================================
SET search_path TO cusi, public;

-- ============================================================
-- USUARIOS / TRABAJADORES
-- Passwords: Maria2025! / Carlos2025! / Rosa2025! / Juan2025! / Pedro2025!
-- ============================================================
INSERT INTO usuarios (codigo, nombre, apellido, email, password_hash, rol, activo) VALUES
  ('USR-002', 'María',  'López Quispe',   'maria@cusitravel.pe',  '$2b$12$YNwmOFmdToC5Oxse00w8O.0iPJUkWzJsCrtGuGPDxRiM5SsJ9qWiW', 'OPERACIONES', true),
  ('USR-003', 'Carlos', 'Quispe Mamani',  'carlos@cusitravel.pe', '$2b$12$gdeql6SqEz/2PbkGWXmO2en06o9wTdaTT4RAc6plMgVLW.VYiyUy6', 'VENTAS',      true),
  ('USR-004', 'Rosa',   'Mamani Ccoa',    'rosa@cusitravel.pe',   '$2b$12$F0O4r.TG.7yctje2qrrUl.ANFw6uSswaSWB4ddgtM0B8h/SXcl6XC', 'FINANZAS',    true),
  ('USR-005', 'Juan',   'Condori Huanca', 'juan@cusitravel.pe',   '$2b$12$CyrcChXY2vZYy6v9uYydNucQiKa6Rzn4lUMabcG37CChq1nbG.4XG', 'GUIA',        true),
  ('USR-006', 'Pedro',  'Ttito Flores',   'pedro@cusitravel.pe',  '$2b$12$uV.G0wFSPlho7ue8weu0BOiAO1EO/9FmscEnvjtQTlMmyOgEmpz0.', 'OPERACIONES', true);

-- ============================================================
-- PROVEEDORES  (tipo: HOTEL TRANSPORTE RESTAURANTE GUIA AEROLINEA TREN OPERADOR_LOCAL SEGURO ACTIVIDAD OTRO)
-- ============================================================
INSERT INTO proveedores (codigo, nombre, tipo, contacto_nombre, contacto_email, contacto_telefono, whatsapp, activo) VALUES
  ('PROV-002', 'Inkaterra Machu Picchu Pueblo Hotel', 'HOTEL',       'Lucía Vargas',        'reservas@inkaterra.com',      '+51 84 211122', '+51 984 211122', true),
  ('PROV-003', 'Andean Spirit Tours',                 'TRANSPORTE',  'Roberto Huillca',     'ops@andeanspirit.pe',         '+51 84 235678', '+51 960 235678', true),
  ('PROV-004', 'Inca Rail',                           'TREN',        'Servicio al cliente', 'info@incarail.com',           '+51 84 233030', '+51 984 233030', true),
  ('PROV-005', 'Chicha por Gastón',                   'RESTAURANTE', 'Marco Delgado',       'reservas@chicha.pe',          '+51 84 240520', '+51 976 240520', true),
  ('PROV-006', 'Apus Peru Guiding Company',           'GUIA',        'David Ugarte',        'info@apusperu.com',           '+51 84 232691', '+51 984 232691', true),
  ('PROV-007', 'Sky Airline Perú',                    'AEROLINEA',   'Call Center',         'reservas@skyairline.pe',      '+51 1 7119999',  null,            true),
  ('PROV-008', 'Hotel El Mercado Cusco',              'HOTEL',       'Ana Ccori',           'reservas@elmercadocusco.com', '+51 84 222222', '+51 984 222222', true),
  ('PROV-009', 'Sumaq Machu Picchu Hotel',            'HOTEL',       'Gustavo Palma',       'ventas@sumaqhotel.com',       '+51 84 211059', '+51 960 211059', true),
  ('PROV-010', 'Bus Turístico Cusco',                 'TRANSPORTE',  'Héctor Quispe',       'info@buscusco.pe',            '+51 84 223344', null,            true),
  ('PROV-011', 'Peru Rail',                           'TREN',        'Reservas Web',        'contact@perurail.com',        '+51 84 581414', null,            true);

-- ============================================================
-- SERVICIOS TURÍSTICOS
-- ============================================================
INSERT INTO servicios_turisticos (codigo, nombre, tipo, descripcion, duracion_dias, precio_base_usd, nivel_dificultad, activo) VALUES
  ('IT4D',  'Inca Trail 4 Días / 3 Noches',    'TREK',            'El clásico Camino Inca hasta Machu Picchu por la Puerta del Sol.',      4, 750.00,  'DIFICIL',    true),
  ('IT2D',  'Inca Trail Corto 2 Días',         'TREK',            'Versión express: Km 104 hasta Machu Picchu por Wiñay Wayna.',           2, 480.00,  'MODERADO',   true),
  ('VH1D',  'Valle Sagrado Full Day',          'DAY_TOUR',        'Pisac, Ollantaytambo y Chinchero. Incluye almuerzo buffet.',            1, 85.00,   'FACIL',      true),
  ('MP1D',  'Machu Picchu Classic Day Tour',   'DAY_TOUR',        'Tren + bus + guía en Machu Picchu. Opción Huayna Picchu extra.',        1, 195.00,  'FACIL',      true),
  ('CQ1D',  'City Tour Cusco + Sacsayhuamán', 'CITY_TOUR',       'Catedral, Qorikancha, Sacsayhuamán y ruinas periféricas.',             1, 55.00,   'FACIL',      true),
  ('SS7D',  'Sacred & Salkantay 7 Días',      'TREK',            'Salkantay Trek + Valle Sagrado + Machu Picchu. Campamentos premium.',   7, 1200.00, 'MUY_DIFICIL', true),
  ('PKG5D', 'Paquete Cusco Completo 5 Días',  'PAQUETE_COMPLETO','Hotel + traslados + City Tour + Valle Sagrado + Machu Picchu.',         5, 680.00,  'FACIL',      true),
  ('TRF-A', 'Transfer Aeropuerto Cusco',      'TRANSFER',        'Recojo aeropuerto Velasco Astete hacia hoteles en Cusco.',              1, 18.00,   'FACIL',      true);

-- ============================================================
-- ITINERARIOS
-- ============================================================
-- IT4D
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,1,'Cusco → Wayllabamba (Km 82)','Inicio en Piscacucho Km 82. Subida gradual hasta Wayllabamba por bosque nublado.',3000,12,5,false,true,true,'Campamento Wayllabamba' FROM servicios_turisticos WHERE codigo='IT4D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,2,'Wayllabamba → Pacaymayu','El día más exigente. Abra de Warmiwañusca 4215 msnm — Paso de la Mujer Muerta.',4215,16,8,true,true,true,'Campamento Pacaymayu' FROM servicios_turisticos WHERE codigo='IT4D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,3,'Pacaymayu → Wiñay Wayna','Paso Runkurakay y Sayacmarca. Túnel inca. Llegada a Phuyupatamarca y Wiñay Wayna.',3900,16,7,true,true,true,'Campamento Wiñay Wayna' FROM servicios_turisticos WHERE codigo='IT4D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,4,'Wiñay Wayna → Machu Picchu','Madrugada a la Puerta del Sol (Inti Punku). Tour guiado 2h. Tren de regreso a Cusco.',2400,6,3,true,false,false,'Hotel en Aguas Calientes' FROM servicios_turisticos WHERE codigo='IT4D';

-- IT2D
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,1,'Ollantaytambo → Chachabamba → Wiñay Wayna','Inicio en Km 104. Subida a Chachabamba y Wiñay Wayna.',2700,11,5,false,true,true,'Campamento Wiñay Wayna' FROM servicios_turisticos WHERE codigo='IT2D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena)
SELECT id,2,'Wiñay Wayna → Machu Picchu','Madrugada a Inti Punku. Tour guiado 2h. Tren de regreso.',2430,6,3,true,false,false FROM servicios_turisticos WHERE codigo='IT2D';

-- VH1D
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena)
SELECT id,1,'Cusco → Pisac → Ollantaytambo → Chinchero','Mercado de Pisac, ruinas incas, almuerzo buffet en Urubamba, fortaleza de Ollantaytambo y tejidos de Chinchero.',3760,3,2,false,true,false FROM servicios_turisticos WHERE codigo='VH1D';

-- MP1D
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena)
SELECT id,1,'Cusco → Machu Picchu → Cusco','Tren desde Ollantaytambo. Bus zigzag. Tour guiado 2.5h. Tiempo libre. Retorno en tren.',2430,4,2,false,false,false FROM servicios_turisticos WHERE codigo='MP1D';

-- CQ1D
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena)
SELECT id,1,'Cusco: Centro Histórico + Ruinas periféricas','Plaza de Armas, Catedral, Qorikancha. En bus: Sacsayhuamán, Qenqo, Puca Pucara, Tambomachay.',3701,3,2,false,false,false FROM servicios_turisticos WHERE codigo='CQ1D';

-- SS7D
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,1,'Cusco → Soraypampa','Traslado 4x4 a Soraypampa (3900 msnm). Aclimatación. Vista al glaciar Salkantay.',3900,4,2,false,true,true,'Glamping Salkantay Lodge' FROM servicios_turisticos WHERE codigo='SS7D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,2,'Soraypampa → Paso Salkantay → Chaullay','Cumbre: Abra Salkantay 4638 msnm. Descenso dramático a zona tropical.',4638,22,9,true,true,true,'Wayra Lodge Chaullay' FROM servicios_turisticos WHERE codigo='SS7D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,3,'Chaullay → Santa Teresa','Selva ceja de montaña. Plantaciones de café y cacao. Baños termales de Cocalmayo.',2100,20,7,true,true,true,'Lucma Lodge Santa Teresa' FROM servicios_turisticos WHERE codigo='SS7D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,4,'Santa Teresa → Aguas Calientes','Tren local o caminata por vía férrea. Tarde libre en Aguas Calientes.',2040,10,3,true,false,true,'Hotel Presidente Aguas Calientes' FROM servicios_turisticos WHERE codigo='SS7D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,5,'Machu Picchu','Visita completa a la ciudadela inca. Opción Huayna Picchu o Montaña extra.',2430,5,3,true,false,true,'Hotel Presidente Aguas Calientes' FROM servicios_turisticos WHERE codigo='SS7D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena, alojamiento)
SELECT id,6,'Aguas Calientes → Valle Sagrado','Tren a Ollantaytambo. Tour Pisac y Chinchero. Noche en hotel del Valle.',3760,3,2,true,true,true,'Sonesta Posada del Inca Valle Sagrado' FROM servicios_turisticos WHERE codigo='SS7D';
INSERT INTO itinerarios (servicio_id, dia_numero, titulo, descripcion, altitud_max_msnm, distancia_km, horas_caminata, desayuno, almuerzo, cena)
SELECT id,7,'Valle Sagrado → Cusco','Mañana libre en Urubamba. Tarde traslado a Cusco. Cena de despedida incluida.',3400,0,0,true,false,true FROM servicios_turisticos WHERE codigo='SS7D';

-- ============================================================
-- RESERVAS  (columnas reales: usuario_operador_id, usuario_creador_id, operador_nombre)
-- ============================================================
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00001',s.id,s.nombre,'2026-06-15','2026-06-18',4,'Inglés','Andean Dream Tours','ADT-012','María López',2,1,750.00,3000.00,1500.00,0.00,'RESERVADO','PARCIAL','05:00','Hotel El Mercado Cusco lobby','Grupo de Australia. Llevan equipo de fotografía.' FROM servicios_turisticos s WHERE s.codigo='IT4D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00002',s.id,s.nombre,'2026-06-14','2026-06-14',2,'Español','Turismo Perú Mágico','TPM-008','Carlos Quispe',3,1,195.00,390.00,390.00,0.00,'SERVICIO_COMPLETO','PAGADO','06:00','Estación Poroy','Luna de miel. Preparar detalle de bienvenida.' FROM servicios_turisticos s WHERE s.codigo='MP1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00003',s.id,s.nombre,'2026-06-16','2026-06-16',6,'Francés','Voyages Extraordinaires','VEX-034','María López',2,1,85.00,510.00,255.00,50.00,'RESERVADO','PARCIAL','08:00','Plaza Regocijo frente al hotel','Familia francesa. 2 niños 8 y 11 años.' FROM servicios_turisticos s WHERE s.codigo='VH1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00004',s.id,s.nombre,'2026-06-20','2026-06-26',3,'Inglés','Wild Earth Adventures','WEA-091','María López',2,1,1200.00,3600.00,1800.00,0.00,'RESERVADO','PARCIAL','04:30','Hotel del cliente','Clientes VIP. Confirmar glamping 72h antes.' FROM servicios_turisticos s WHERE s.codigo='SS7D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00005',s.id,s.nombre,'2026-06-13','2026-06-13',8,'Inglés','USA Cultural Exchange','UCE-017','Carlos Quispe',3,1,55.00,440.00,440.00,0.00,'SERVICIO_COMPLETO','PAGADO','09:00','Hotel Monasterio','Grupo universitario. Tour académico arqueológico.' FROM servicios_turisticos s WHERE s.codigo='CQ1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00006',s.id,s.nombre,'2026-06-22','2026-06-25',2,'Alemán','Abenteuer Reisen GmbH','ARG-055','Pedro Ttito',6,1,750.00,1500.00,750.00,0.00,'RESERVADO','PARCIAL','05:00','Hotel del cliente','Clientes piden guía con alemán básico.' FROM servicios_turisticos s WHERE s.codigo='IT4D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00007',s.id,s.nombre,'2026-06-18','2026-06-22',2,'Portugués','Brasil Turismo Premium','BTP-023','María López',2,1,680.00,1360.00,680.00,0.00,'RESERVADO','PARCIAL','15:00','Aeropuerto Velasco Astete','Llegada vuelo LA2403 a las 15:20.' FROM servicios_turisticos s WHERE s.codigo='PKG5D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00008',s.id,s.nombre,'2026-06-17','2026-06-18',5,'Inglés','Gap Year Adventures','GYA-088','Pedro Ttito',6,1,480.00,2400.00,1200.00,100.00,'RESERVADO','PARCIAL','05:30','Estación Ollantaytambo','Jóvenes 20-25 años. Descuento grupal.' FROM servicios_turisticos s WHERE s.codigo='IT2D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00009',s.id,s.nombre,'2026-05-28','2026-05-28',4,'Inglés','Luxury Escapes AU','LEA-041','María López',2,1,195.00,780.00,780.00,0.00,'SERVICIO_COMPLETO','PAGADO','06:00','Hotel Palacio del Inka',null FROM servicios_turisticos s WHERE s.codigo='MP1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00010',s.id,s.nombre,'2026-05-30','2026-05-30',3,'Español','Agencia Local Wiracocha','ALW-001','Carlos Quispe',3,1,85.00,255.00,255.00,0.00,'SERVICIO_COMPLETO','PAGADO','08:30','Hostal del cliente',null FROM servicios_turisticos s WHERE s.codigo='VH1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00011',s.id,s.nombre,'2026-05-20','2026-05-23',6,'Inglés','National Geographic Expeditions','NGE-007','María López',2,1,800.00,4800.00,4800.00,0.00,'SERVICIO_COMPLETO','PAGADO','05:00','Hotel del cliente','Grupo periodistas. Autorización fotografía especial.' FROM servicios_turisticos s WHERE s.codigo='IT4D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00012',s.id,s.nombre,'2026-05-10','2026-05-16',2,'Italiano','Avventure nel Mondo','ANM-019','Pedro Ttito',6,1,1200.00,2400.00,2400.00,200.00,'SERVICIO_COMPLETO','PAGADO','04:30','Hotel del cliente','Descuento fidelidad aplicado.' FROM servicios_turisticos s WHERE s.codigo='SS7D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00013',s.id,s.nombre,'2026-05-25','2026-05-25',12,'Español','Colegios Unidos Perú','CUP-003','Carlos Quispe',3,1,45.00,540.00,540.00,0.00,'SERVICIO_COMPLETO','PAGADO','09:00','Colegio','Visita escolar. Precio especial grupos.' FROM servicios_turisticos s WHERE s.codigo='CQ1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00014',s.id,s.nombre,'2026-07-05','2026-07-08',4,'Inglés','Exodus Travels UK','ETK-067','María López',2,1,780.00,3120.00,1560.00,0.00,'RESERVADO','PARCIAL','05:00','Hotel del cliente','Confirmar permisos Sernanp cuando disponibles.' FROM servicios_turisticos s WHERE s.codigo='IT4D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00015',s.id,s.nombre,'2026-07-10','2026-07-14',4,'Inglés','Trafalgar Tours','TRT-054','Carlos Quispe',3,1,700.00,2800.00,1400.00,0.00,'COTIZACION','PENDIENTE','14:00','Aeropuerto Velasco Astete','Pendiente confirmación final del cliente.' FROM servicios_turisticos s WHERE s.codigo='PKG5D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00016',s.id,s.nombre,'2026-07-15','2026-07-15',2,'Japonés','Japan Travel Agency','JTA-029','Pedro Ttito',6,1,195.00,390.00,195.00,0.00,'COTIZACION','PENDIENTE','06:00','Hotel del cliente','Guía con inglés fluido o japonés.' FROM servicios_turisticos s WHERE s.codigo='MP1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00017',s.id,s.nombre,'2026-07-20','2026-07-26',5,'Inglés','G Adventures','GAD-112','María López',2,1,1150.00,5750.00,2875.00,0.00,'RESERVADO','PARCIAL','04:30','Hotel del cliente','Grupo mixto. 2 con experiencia en altura.' FROM servicios_turisticos s WHERE s.codigo='SS7D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00018',s.id,s.nombre,'2026-06-10','2026-06-11',2,'Inglés','Free Spirit Travel','FST-044','Carlos Quispe',3,1,480.00,960.00,480.00,0.00,'ANULADO_SIN_PENALIDAD','REEMBOLSADO','05:30','Hotel del cliente','Cliente canceló por emergencia médica.' FROM servicios_turisticos s WHERE s.codigo='IT2D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00019',s.id,s.nombre,'2026-05-15','2026-05-15',4,'Español','Turista Local','TLO-001','Carlos Quispe',3,1,85.00,340.00,170.00,0.00,'ANULADO_CON_PENALIDAD','PARCIAL','08:00','Plaza de Armas','No se presentaron. Penalidad 50%.' FROM servicios_turisticos s WHERE s.codigo='VH1D';
INSERT INTO reservas (codigo_reserva, servicio_id, nombre_servicio_snap, fecha_inicio, fecha_fin, n_pasajeros, idioma_servicio, agencia_nombre, agencia_codigo, operador_nombre, usuario_operador_id, usuario_creador_id, precio_usd_por_pax, total_usd, adelanto_usd, descuento_usd, estado_operacion, estado_pago, hora_encuentro, lugar_encuentro, observaciones)
SELECT 'R-2026-00020',s.id,s.nombre,'2026-08-01','2026-08-04',6,'Inglés','Intrepid Travel AU','ITA-078','María López',2,1,750.00,4500.00,2250.00,0.00,'RESERVADO','PARCIAL','05:00','Hotel del cliente','Grupo agosto. Permisos cuando disponibles.' FROM servicios_turisticos s WHERE s.codigo='IT4D';

-- ============================================================
-- PASAJEROS
-- ============================================================
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,whatsapp,es_vegetariano,es_celiaco)
SELECT r.id,'James','O''Brien','PA1234567','2027-08-15','Australiana','1985-03-22','M','james.obrien@gmail.com','+61412345678',false,false FROM reservas r WHERE r.codigo_reserva='R-2026-00001';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,whatsapp,es_vegetariano)
SELECT r.id,'Sarah','O''Brien','PA1234568','2027-08-15','Australiana','1987-06-10','F','sarah.obrien@gmail.com','+61412345679',true FROM reservas r WHERE r.codigo_reserva='R-2026-00001';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,es_celiaco)
SELECT r.id,'Michael','Thompson','PA9876543','2026-11-20','Australiana','1990-01-05','M','mthompson@hotmail.com',true FROM reservas r WHERE r.codigo_reserva='R-2026-00001';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,es_vegetariano)
SELECT r.id,'Emma','Wilson','PA8765432','2028-03-01','Australiana','1992-09-18','F','emma.wilson@gmail.com',true FROM reservas r WHERE r.codigo_reserva='R-2026-00001';

INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Alejandro','García Ruiz','PE12345678','2029-01-20','Peruana','1988-07-14','M','alejandro.garcia@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00002';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Valentina','García Ruiz','PE87654321','2029-01-20','Peruana','1990-04-28','F','vale.garcia@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00002';

INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'François','Dubois','FR1234567','2028-05-10','Francesa','1978-11-03','M','francois.dubois@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00003';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,restricciones_alimenticias)
SELECT r.id,'Isabelle','Dubois','FR1234568','2028-05-10','Francesa','1980-02-14','F','isabelle.dubois@gmail.com','Alergia severa a los mariscos' FROM reservas r WHERE r.codigo_reserva='R-2026-00003';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Lucas','Dubois','FR1234569','2031-08-01','Francesa','2015-04-20','M' FROM reservas r WHERE r.codigo_reserva='R-2026-00003';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Chloé','Dubois','FR1234570','2030-12-15','Francesa','2018-09-07','F' FROM reservas r WHERE r.codigo_reserva='R-2026-00003';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Pierre','Martin','FR9876541','2027-03-22','Francesa','1955-06-30','M','p.martin@orange.fr' FROM reservas r WHERE r.codigo_reserva='R-2026-00003';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,es_diabetico)
SELECT r.id,'Claire','Martin','FR9876542','2027-03-22','Francesa','1957-09-15','F','claire.martin@orange.fr',true FROM reservas r WHERE r.codigo_reserva='R-2026-00003';

-- R-2026-00004: pasaporte William Clarke vence ago 2026 → alerta URGENTE
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,whatsapp)
SELECT r.id,'Oliver','Bennett','GB12345678','2027-06-30','Británica','1986-12-01','M','o.bennett@gmail.com','+447911234567' FROM reservas r WHERE r.codigo_reserva='R-2026-00004';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,es_vegano)
SELECT r.id,'Charlotte','Bennett','GB12345679','2027-06-30','Británica','1988-08-22','F','c.bennett@gmail.com',true FROM reservas r WHERE r.codigo_reserva='R-2026-00004';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'William','Clarke','GB98765432','2026-08-15','Británica','1975-03-10','M','wclarke@yahoo.co.uk' FROM reservas r WHERE r.codigo_reserva='R-2026-00004';

INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Tyler','Johnson','US12345671','2028-07-20','Estadounidense','2002-03-15','M' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Megan','Smith','US12345672','2028-07-21','Estadounidense','2001-11-08','F' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Ethan','Davis','US12345673','2028-07-22','Estadounidense','2002-06-25','M' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Ashley','Brown','US12345674','2028-07-23','Estadounidense','2003-01-30','F' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Nathan','Miller','US12345675','2028-07-24','Estadounidense','2002-09-12','M' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Jessica','Wilson','US12345676','2028-07-25','Estadounidense','2001-04-18','F' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Brandon','Moore','US12345677','2028-07-26','Estadounidense','2003-07-04','M' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero)
SELECT r.id,'Samantha','Taylor','US12345678','2028-07-27','Estadounidense','2002-12-22','F' FROM reservas r WHERE r.codigo_reserva='R-2026-00005';

-- R-2026-00006: alemanes, pasaportes vencen ago 2026 → alerta URGENTE
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Klaus','Müller','DE12345671','2026-08-10','Alemana','1979-05-17','M','k.mueller@web.de' FROM reservas r WHERE r.codigo_reserva='R-2026-00006';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Helga','Müller','DE12345672','2026-08-10','Alemana','1981-10-25','F','h.mueller@web.de' FROM reservas r WHERE r.codigo_reserva='R-2026-00006';

INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Rafael','Souza','BR12345671','2028-04-15','Brasileña','1982-08-09','M','r.souza@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00007';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email,es_diabetico)
SELECT r.id,'Camila','Souza','BR12345672','2028-04-15','Brasileña','1984-02-14','F','c.souza@gmail.com',true FROM reservas r WHERE r.codigo_reserva='R-2026-00007';

INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Harry','Potter','GB88888881','2027-12-31','Británica','2000-07-31','M','h.potter@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00008';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Hermione','Granger','GB88888882','2027-12-31','Británica','2000-09-19','F','h.granger@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00008';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Ronald','Weasley','GB88888883','2027-12-31','Británica','2000-03-01','M','r.weasley@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00008';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Neville','Longbottom','GB88888884','2027-12-31','Británica','2000-07-30','M','n.longbottom@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00008';
INSERT INTO pasajeros (reserva_id,nombre,apellido,pasaporte,pasaporte_vencimiento,nacionalidad,fecha_nacimiento,genero,email)
SELECT r.id,'Luna','Lovegood','GB88888885','2027-12-31','Británica','2001-02-13','F','l.lovegood@gmail.com' FROM reservas r WHERE r.codigo_reserva='R-2026-00008';

-- ============================================================
-- DETALLES OPERACIÓN PROVEEDOR  (costo_total_usd es GENERATED)
-- ============================================================
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'GUIA','Guía certificado Inca Trail 4D - inglés','2026-06-15','2026-06-18',1,320.00,'CONFIRMADO','APU-2026-0615-01' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00001' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'HOTEL','Hotel El Mercado 1 noche pre-trek','2026-06-14','2026-06-15',4,85.00,'CONFIRMADO','MER-0614-R001' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00001' AND p.codigo='PROV-008';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'TREN','Inca Rail Aguas Calientes → Cusco','2026-06-18','2026-06-18',4,55.00,'CONFIRMADO','IR-2026-06184' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00001' AND p.codigo='PROV-004';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'TREN','Peru Rail Vistadome Poroy-Aguas Calientes','2026-06-14','2026-06-14',2,75.00,'COMPLETADO','PR-20260614-2' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00002' AND p.codigo='PROV-011';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'GUIA','Guía privado Machu Picchu 2.5h','2026-06-14','2026-06-14',1,90.00,'COMPLETADO','APU-2026-0614-02' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00002' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'HOTEL','Inkaterra 2 noches post-trek','2026-06-24','2026-06-26',3,280.00,'CONFIRMADO','INK-JUN24-3' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00004' AND p.codigo='PROV-002';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'GUIA','Guía certificado Salkantay 7 días','2026-06-20','2026-06-26',1,550.00,'CONFIRMADO','APU-2026-0620-04' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00004' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'HOTEL','Hotel El Mercado 4 noches','2026-06-18','2026-06-22',2,85.00,'CONFIRMADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00007' AND p.codigo='PROV-008';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'TRANSPORTE','Transfer aeropuerto privado','2026-06-18','2026-06-18',1,25.00,'PENDIENTE_PAGO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00007' AND p.codigo='PROV-003';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'TREN','Inca Rail Voyager MP ida/vuelta','2026-06-20','2026-06-20',2,85.00,'CONFIRMADO','IR-2026-06202' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00007' AND p.codigo='PROV-004';

-- ============================================================
-- DETALLES ADICIONALES (más cobertura para demo del módulo Operaciones)
-- ============================================================

-- R-2026-00003: Familia Dubois — Valle Sagrado
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'TRANSPORTE','Bus turístico Valle Sagrado ida/vuelta','2026-06-16','2026-06-16',6,18.00,'CONFIRMADO','BTC-0616-DUB6' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00003' AND p.codigo='PROV-010';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'RESTAURANTE','Almuerzo buffet familiar Urubamba','2026-06-16','2026-06-16',6,22.00,'CONFIRMADO','CHI-0616-DUB6' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00003' AND p.codigo='PROV-005';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'GUIA','Guía francófono Valle Sagrado fullday','2026-06-16','2026-06-16',1,95.00,'PENDIENTE_PAGO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00003' AND p.codigo='PROV-006';

-- R-2026-00005: Grupo universitario USA — City Tour
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'TRANSPORTE','Bus turístico city tour Cusco','2026-06-13','2026-06-13',8,12.00,'COMPLETADO','BTC-0613-UCE8' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00005' AND p.codigo='PROV-010';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'GUIA','Guía arqueólogo certificado Cusco','2026-06-13','2026-06-13',1,110.00,'COMPLETADO','APU-2026-0613-05' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00005' AND p.codigo='PROV-006';

-- R-2026-00006: Pareja alemana — Inca Trail
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'GUIA','Guía certificado IT4D con alemán básico','2026-06-22','2026-06-25',1,350.00,'SOLICITADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00006' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'HOTEL','Hotel El Mercado 1 noche pre-trek','2026-06-21','2026-06-22',2,85.00,'CONFIRMADO','MER-0621-R006' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00006' AND p.codigo='PROV-008';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'TREN','Inca Rail Voyager retorno AC→Cusco','2026-06-25','2026-06-25',2,55.00,'CONFIRMADO','IR-2026-06252' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00006' AND p.codigo='PROV-004';

-- R-2026-00008: Jóvenes IT2D
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'TREN','Inca Rail Voyager Ollantaytambo→AC ida','2026-06-17','2026-06-17',5,48.00,'CONFIRMADO','IR-2026-06175' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00008' AND p.codigo='PROV-004';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'GUIA','Guía certificado IT2D inglés','2026-06-17','2026-06-18',1,200.00,'CONFIRMADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00008' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'TRANSPORTE','Transfer privado Cusco→Ollantaytambo','2026-06-17','2026-06-17',1,65.00,'PENDIENTE_PAGO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00008' AND p.codigo='PROV-003';

-- R-2026-00014: Exodus Travels julio
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'GUIA','Guía premium IT4D inglés fluido','2026-07-05','2026-07-08',1,360.00,'SOLICITADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00014' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'HOTEL','Sumaq Machu Picchu 1 noche post-trek','2026-07-08','2026-07-09',4,195.00,'SOLICITADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00014' AND p.codigo='PROV-009';

-- R-2026-00017: G Adventures Salkantay julio
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado,confirmacion_ref)
SELECT r.id,p.id,'GUIA','Guía certificado Salkantay 7 días','2026-07-20','2026-07-26',1,580.00,'CONFIRMADO','APU-2026-0720-17' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00017' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'HOTEL','Inkaterra Machu Picchu 2 noches','2026-07-24','2026-07-26',5,260.00,'SOLICITADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00017' AND p.codigo='PROV-002';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'TRANSPORTE','Traslados 4x4 Cusco→Soraypampa','2026-07-20','2026-07-20',1,120.00,'CONFIRMADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00017' AND p.codigo='PROV-003';

-- R-2026-00020: Intrepid Travel agosto
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'GUIA','Guía IT4D premium inglés x6 pax','2026-08-01','2026-08-04',1,340.00,'SOLICITADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00020' AND p.codigo='PROV-006';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'HOTEL','Hotel El Mercado pre-trek x6 pax','2026-07-31','2026-08-01',6,85.00,'SOLICITADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00020' AND p.codigo='PROV-008';
INSERT INTO detalles_operacion_proveedor (reserva_id,proveedor_id,tipo_servicio,descripcion,fecha_inicio,fecha_fin,cantidad,costo_unitario_usd,estado)
SELECT r.id,p.id,'TREN','Peru Rail Vistadome AC→Cusco retorno','2026-08-04','2026-08-04',6,62.00,'SOLICITADO' FROM reservas r,proveedores p WHERE r.codigo_reserva='R-2026-00020' AND p.codigo='PROV-011';

-- ============================================================
-- TAREAS  (columna correcta: usuario_id, no asignado_a_id)
-- COMPLETADA requiere completada_en NOT NULL
-- ============================================================
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Confirmar permisos IT4D — R-2026-00001','Permisos del Inca Trail deben confirmarse con 48h. Verificar lista con Sernanp.',r.id,2,1,'URGENTE','PENDIENTE','2026-06-13' FROM reservas r WHERE r.codigo_reserva='R-2026-00001';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Alerta pasaporte William Clarke — R-2026-00004','Pasaporte vence agosto 2026. Notificar urgente al cliente para renovar antes del trek.',r.id,2,1,'URGENTE','EN_PROGRESO','2026-06-14' FROM reservas r WHERE r.codigo_reserva='R-2026-00004';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Confirmar glamping Salkantay — R-2026-00004','Llamar a Salkantay Lodge para confirmar disponibilidad 3 personas del 20 al 22 junio.',r.id,2,1,'URGENTE','PENDIENTE','2026-06-13' FROM reservas r WHERE r.codigo_reserva='R-2026-00004';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Coordinar guía hablante alemán — R-2026-00006','Clientes alemanes piden guía con alemán básico. Contactar Apus Peru para disponibilidad 22 junio.',r.id,6,2,'ALTA','PENDIENTE','2026-06-15' FROM reservas r WHERE r.codigo_reserva='R-2026-00006';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento,completada_en,completada_por_id)
SELECT 'Preparar detalle luna de miel — R-2026-00002','Coordinar con Hotel Mercado flores y vino de bienvenida para los esposos García.',r.id,6,2,'ALTA','COMPLETADA','2026-06-13',NOW(),6 FROM reservas r WHERE r.codigo_reserva='R-2026-00002';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Enviar vouchers confirmados a ADT-012','Andean Dream Tours espera vouchers de confirmación R-2026-00001.',r.id,3,1,'ALTA','PENDIENTE','2026-06-13' FROM reservas r WHERE r.codigo_reserva='R-2026-00001';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Verificar menú sin gluten — R-2026-00001','Michael Thompson es celíaco. Confirmar con catering del trek opción sin gluten todos los días.',r.id,6,2,'MEDIA','EN_PROGRESO','2026-06-14' FROM reservas r WHERE r.codigo_reserva='R-2026-00001';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Cobrar saldo USD 255 — R-2026-00003','Familia Dubois tiene saldo pendiente. Contactar a Voyages Extraordinaires antes del 14 junio.',r.id,4,1,'MEDIA','PENDIENTE','2026-06-14' FROM reservas r WHERE r.codigo_reserva='R-2026-00003';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Confirmar número de vuelo brasileños — R-2026-00007','Solicitar vuelo a Brasil Turismo Premium para coordinar traslado aeropuerto del 18 junio.',r.id,2,1,'MEDIA','PENDIENTE','2026-06-15' FROM reservas r WHERE r.codigo_reserva='R-2026-00007';
INSERT INTO tareas_pendientes (titulo,descripcion,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
VALUES ('Gestionar reembolso cancelación R-2026-00018','Free Spirit Travel canceló por emergencia médica. Procesar devolución USD 480.',4,1,'MEDIA','EN_PROGRESO','2026-06-20');
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Tramitar permisos IT julio — R-2026-00014','Exodus Travels julio 5-8. Iniciar trámite permisos Sernanp para 4 personas.',r.id,2,1,'MEDIA','PENDIENTE','2026-06-25' FROM reservas r WHERE r.codigo_reserva='R-2026-00014';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento,completada_en,completada_por_id)
SELECT 'Kit bienvenida grupo universitario USA — R-2026-00005','Preparar mapa de Cusco, tarjeta de emergencias y lista de restaurantes.',r.id,6,2,'MEDIA','COMPLETADA','2026-06-12',NOW(),6 FROM reservas r WHERE r.codigo_reserva='R-2026-00005';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Cotizar tren agosto — R-2026-00020','Solicitar cotización a Peru Rail e Inca Rail para comparar precios temporada alta agosto.',r.id,3,1,'BAJA','PENDIENTE','2026-06-30' FROM reservas r WHERE r.codigo_reserva='R-2026-00020';
INSERT INTO tareas_pendientes (titulo,descripcion,reserva_id,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
SELECT 'Documentación digital G Adventures — R-2026-00017','G Adventures requiere documentación digital completa. Organizar en carpeta compartida.',r.id,5,2,'BAJA','PENDIENTE','2026-07-01' FROM reservas r WHERE r.codigo_reserva='R-2026-00017';
INSERT INTO tareas_pendientes (titulo,descripcion,usuario_id,creado_por_id,prioridad,estado,fecha_vencimiento)
VALUES ('Encuesta satisfacción clientes mayo','Enviar formulario a clientes que viajaron en mayo (reservas 09 al 13).',3,1,'BAJA','PENDIENTE','2026-06-20');

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM cusi.usuarios)                     AS usuarios,
  (SELECT COUNT(*) FROM cusi.proveedores)                  AS proveedores,
  (SELECT COUNT(*) FROM cusi.servicios_turisticos)         AS servicios,
  (SELECT COUNT(*) FROM cusi.itinerarios)                  AS dias_itinerario,
  (SELECT COUNT(*) FROM cusi.reservas)                     AS reservas,
  (SELECT COUNT(*) FROM cusi.pasajeros)                    AS pasajeros,
  (SELECT COUNT(*) FROM cusi.detalles_operacion_proveedor) AS detalles_proveedor,
  (SELECT COUNT(*) FROM cusi.tareas_pendientes)            AS tareas;
