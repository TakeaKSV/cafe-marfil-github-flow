// ==========================================================================
// CAFÉ MARFIL — DATOS SIMULADOS PARA EL PANEL DE ADMINISTRACIÓN Y ANALÍTICA
// Operación en Durango, Dgo., México
// Paleta Oficial: Rojo Marfil (#E12927), Negro Café (#1F1410), Blanco (#FFFFFF), Rosa Claro (#FCEAE9)
// ==========================================================================

export const INITIAL_SUCURSALES = [
  {
    id: 'porras-matriz',
    nombre: 'Sucursal Porras (Matriz)',
    direccion: 'Calle Porras #100, esq. Aquiles Serdán, Centro Histórico',
    horario: 'Lun a Sáb: 8:00 AM – 11:00 PM · Dom: 9:00 AM – 11:00 PM',
    telefono: '(618) 170-6666',
    aforoMax: 85,
    aforoActual: 62,
    imagen: '/images/sucursal_centro.jpg',
    zonas: ['Terraza Colonial', 'Salón Principal', 'Ludoteca & Juegos'],
    encargado: 'Sofía Valenzuela (Gerente de Turno)'
  },
  {
    id: 'calvario',
    nombre: 'Sucursal Calvario',
    direccion: 'Calle De la Cruz #302-B, Barrio del Calvario',
    horario: 'Lun a Sáb: 8:00 AM – 11:00 PM · Dom: 9:00 AM – 11:00 PM',
    telefono: '(618) 174-0702',
    aforoMax: 48,
    aforoActual: 31,
    imagen: '/images/hero_cafe.jpg',
    zonas: ['Salón Acogedor', 'Barra Express & Sala'],
    encargado: 'Mateo Nevárez (Líder de Barra)'
  }
];

export const INITIAL_MESAS = [
  // Sucursal Porras Matriz
  { id: 'm-p01', sucursalId: 'porras-matriz', numero: 'M01', zona: 'Salón Principal', capacidad: 2, estado: 'ocupada', comensal: 'Andrea Garza', personas: 2, tiempoMinutos: 42, ticketAprox: 425, reservaFolio: 'MF-RES-88219', notas: '2x Flat White + Chilaquiles Verdes' },
  { id: 'm-p02', sucursalId: 'porras-matriz', numero: 'M02', zona: 'Salón Principal', capacidad: 4, estado: 'ocupada', comensal: 'Carlos Mendoza', personas: 3, tiempoMinutos: 65, ticketAprox: 680, reservaFolio: null, notas: 'Walk-in directo. Pidieron Mollete Mamut' },
  { id: 'm-p03', sucursalId: 'porras-matriz', numero: 'M03', zona: 'Salón Principal', capacidad: 4, estado: 'libre', comensal: null, personas: 0, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: null, notas: 'Mesa desinfectada lista para asignar' },
  { id: 'm-p04', sucursalId: 'porras-matriz', numero: 'M04', zona: 'Salón Principal', capacidad: 6, estado: 'reservada', comensal: 'Familia Rivas', personas: 5, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: 'MF-RES-90142', notas: 'Llegada programada 11:30 AM. Cumpleaños' },
  { id: 'm-p05', sucursalId: 'porras-matriz', numero: 'M05', zona: 'Terraza Colonial', capacidad: 2, estado: 'ocupada', comensal: 'Valeria & Daniel', personas: 2, tiempoMinutos: 25, ticketAprox: 290, reservaFolio: null, notas: 'Pet friendly con perro beagle' },
  { id: 'm-p06', sucursalId: 'porras-matriz', numero: 'M06', zona: 'Terraza Colonial', capacidad: 4, estado: 'limpieza', comensal: null, personas: 0, tiempoMinutos: 5, ticketAprox: 0, reservaFolio: null, notas: 'Por recoger loza y sanitizar' },
  { id: 'm-p07', sucursalId: 'porras-matriz', numero: 'M07', zona: 'Terraza Colonial', capacidad: 4, estado: 'libre', comensal: null, personas: 0, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: null, notas: 'Excelente vista a fuente colonial' },
  { id: 'm-p08', sucursalId: 'porras-matriz', numero: 'M08', zona: 'Terraza Colonial', capacidad: 8, estado: 'ocupada', comensal: 'Grupo Arquitectura', personas: 7, tiempoMinutos: 80, ticketAprox: 1450, reservaFolio: 'MF-RES-77190', notas: 'Pizzas rústicas y Cold Brews' },
  { id: 'm-p09', sucursalId: 'porras-matriz', numero: 'L01', zona: 'Ludoteca & Juegos', capacidad: 4, estado: 'ocupada', comensal: 'Javier y amigos', personas: 4, tiempoMinutos: 95, ticketAprox: 540, reservaFolio: 'MF-RES-66231', notas: 'Jugando Catan con anfitrión' },
  { id: 'm-p10', sucursalId: 'porras-matriz', numero: 'L02', zona: 'Ludoteca & Juegos', capacidad: 6, estado: 'ocupada', comensal: 'Mariana Soto', personas: 5, tiempoMinutos: 50, ticketAprox: 710, reservaFolio: 'MF-RES-88301', notas: 'Jugando Dixit. Frappés Kinder' },
  { id: 'm-p11', sucursalId: 'porras-matriz', numero: 'L03', zona: 'Ludoteca & Juegos', capacidad: 4, estado: 'libre', comensal: null, personas: 0, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: null, notas: 'Mesa con tapete de fieltro para cartas' },
  { id: 'm-p12', sucursalId: 'porras-matriz', numero: 'L04', zona: 'Ludoteca & Juegos', capacidad: 8, estado: 'reservada', comensal: 'Torneo Exploding Kittens', personas: 8, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: 'MF-RES-99441', notas: 'Reservada para evento de las 6:00 PM' },

  // Sucursal Calvario
  { id: 'm-c01', sucursalId: 'calvario', numero: 'M01', zona: 'Salón Acogedor', capacidad: 2, estado: 'ocupada', comensal: 'Esteban Ortiz', personas: 1, tiempoMinutos: 35, ticketAprox: 180, reservaFolio: null, notas: 'Coworking con laptop' },
  { id: 'm-c02', sucursalId: 'calvario', numero: 'M02', zona: 'Salón Acogedor', capacidad: 4, estado: 'libre', comensal: null, personas: 0, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: null, notas: 'Lista para walk-in' },
  { id: 'm-c03', sucursalId: 'calvario', numero: 'M03', zona: 'Barra Express & Sala', capacidad: 4, estado: 'ocupada', comensal: 'Diana Luna', personas: 3, tiempoMinutos: 40, ticketAprox: 460, reservaFolio: 'MF-RES-55102', notas: 'Fresas estilo Dubái y Cappuccinos' },
  { id: 'm-c04', sucursalId: 'calvario', numero: 'M04', zona: 'Barra Express & Sala', capacidad: 6, estado: 'libre', comensal: null, personas: 0, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: null, notas: 'Mesa comunal de madera' }
];

export const INITIAL_RESERVACIONES = [
  {
    folio: 'MF-RES-88219',
    comensal: 'Andrea Garza',
    telefono: '618-123-4567',
    email: 'andrea.garza@gmail.com',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '10:00 AM',
    personas: 2,
    mesaAsignada: 'M01',
    tipo: 'brunch',
    tipoNombre: 'Desayuno & Brunch',
    estado: 'en_curso', // confirmada | en_curso | asistida | cancelada | no_show
    notas: 'Celebran aniversario de novios. Solicitaron mesa con luz natural.',
    tokenQR: 'QR-RES-88219-AUTH',
    totalEstimado: '$425 MXN'
  },
  {
    folio: 'MF-RES-90142',
    comensal: 'Familia Rivas',
    telefono: '618-876-5432',
    email: 'rivas.fam@outlook.com',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '11:30 AM',
    personas: 5,
    mesaAsignada: 'M04',
    tipo: 'brunch',
    tipoNombre: 'Desayuno & Brunch',
    estado: 'confirmada',
    notas: 'Cumpleaños número 30. Traen pastel propio, solicitan apoyo de velitas.',
    tokenQR: 'QR-RES-90142-AUTH',
    totalEstimado: '$850 MXN'
  },
  {
    folio: 'MF-RES-66231',
    comensal: 'Javier Domínguez',
    telefono: '618-333-2211',
    email: 'javier.d@gmail.com',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '10:30 AM',
    personas: 4,
    mesaAsignada: 'L01',
    tipo: 'juegos',
    tipoNombre: 'Tarde de Juegos con Anfitrión',
    estado: 'en_curso',
    notas: 'Solicitaron asesoría para Catan y Carcassonne.',
    tokenQR: 'QR-RES-66231-AUTH',
    totalEstimado: '$540 MXN'
  },
  {
    folio: 'MF-RES-88301',
    comensal: 'Mariana Soto',
    telefono: '618-444-9988',
    email: 'mariana.soto@live.com',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '10:15 AM',
    personas: 5,
    mesaAsignada: 'L02',
    tipo: 'juegos',
    tipoNombre: 'Tarde de Juegos con Anfitrión',
    estado: 'en_curso',
    notas: 'Grupo escolar de preparatoria. Consumo libre.',
    tokenQR: 'QR-RES-88301-AUTH',
    totalEstimado: '$710 MXN'
  },
  {
    folio: 'MF-RES-77190',
    comensal: 'Grupo Arquitectura Durango',
    telefono: '618-555-7766',
    email: 'contacto@arquidurango.com',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '09:30 AM',
    personas: 7,
    mesaAsignada: 'M08',
    tipo: 'brunch',
    tipoNombre: 'Reunión / Desayuno',
    estado: 'en_curso',
    notas: 'Requieren factura electrónica y mesa con enchufes para laptops.',
    tokenQR: 'QR-RES-77190-AUTH',
    totalEstimado: '$1,450 MXN'
  },
  {
    folio: 'MF-RES-99441',
    comensal: 'Torneo Exploding Kittens',
    telefono: '618-999-0011',
    email: 'torneos@cafemarfil.mx',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '06:00 PM',
    personas: 8,
    mesaAsignada: 'L04',
    tipo: 'actividad',
    tipoNombre: 'Torneo Oficial de Ludoteca',
    estado: 'confirmada',
    notas: 'Mesa reservada para finalistas del torneo.',
    tokenQR: 'QR-RES-99441-AUTH',
    totalEstimado: '$760 MXN'
  },
  {
    folio: 'MF-RES-55102',
    comensal: 'Diana Luna',
    telefono: '618-222-3344',
    email: 'diana.luna@gmail.com',
    sucursalId: 'calvario',
    sucursalNombre: 'Sucursal Calvario',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '10:00 AM',
    personas: 3,
    mesaAsignada: 'M03',
    tipo: 'brunch',
    tipoNombre: 'Café & Dulce Dubái',
    estado: 'en_curso',
    notas: 'Quieren probar las Fresas Dubái con pistache.',
    tokenQR: 'QR-RES-55102-AUTH',
    totalEstimado: '$460 MXN'
  },
  {
    folio: 'MF-RES-44319',
    comensal: 'Rodrigo Peña',
    telefono: '618-777-1122',
    email: 'rodrigo.p@yahoo.com',
    sucursalId: 'calvario',
    sucursalNombre: 'Sucursal Calvario',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '09:45 AM',
    personas: 4,
    mesaAsignada: 'M02',
    tipo: 'brunch',
    tipoNombre: 'Brunch en Terraza',
    estado: 'en_curso',
    notas: 'Vienen con niños pequeños, solicitan sillita periquera.',
    tokenQR: 'QR-RES-44319-AUTH',
    totalEstimado: '$620 MXN'
  },
  {
    folio: 'MF-RES-31298',
    comensal: 'Lucía Benítez',
    telefono: '618-888-6655',
    email: 'lucia.b@gmail.com',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '08:30 AM',
    personas: 2,
    mesaAsignada: 'M05',
    tipo: 'brunch',
    tipoNombre: 'Desayuno Temprano',
    estado: 'asistida',
    notas: 'Servicio concluido a las 09:45 AM. Pagado con tarjeta.',
    tokenQR: 'QR-RES-31298-AUTH',
    totalEstimado: '$360 MXN'
  },
  {
    folio: 'MF-RES-20944',
    comensal: 'Gerardo Villalobos',
    telefono: '618-111-9900',
    email: 'gerardo.v@gmail.com',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Sucursal Porras (Matriz)',
    fecha: 'Hoy (02 Oct 2026)',
    hora: '09:00 AM',
    personas: 4,
    mesaAsignada: null,
    tipo: 'brunch',
    tipoNombre: 'Desayuno Monumental',
    estado: 'no_show',
    notas: 'Pasaron más de 20 minutos de tolerancia sin llamada de aviso.',
    tokenQR: 'QR-RES-20944-AUTH',
    totalEstimado: '$0 MXN'
  }
];

export const INITIAL_MENU = [
  {
    id: 'prod-01',
    nombre: 'Chilaquiles con Boneless Crujientes',
    categoria: 'Brunch & Cocina Salada',
    categoriaSlug: 'salado',
    porcion: 'Plato Fuerte (180g Boneless)',
    precio: 175,
    precioStr: '$175 MXN',
    descripcion: 'Totopos nixtamalizados, salsa verde martajada o chipotle dulce, crema de rancho, queso asadero y boneless dorados.',
    disponibleEnCocina: true,
    stockDiario: 45,
    vendidosHoy: 28,
    tiempoPrepMin: 14,
    imagen: '/images/desayunos_marfil.jpg',
    badge: 'TOP 1 VENTAS'
  },
  {
    id: 'prod-02',
    nombre: 'Mollete Monumental "Mamut" (28cm)',
    categoria: 'Brunch & Cocina Salada',
    categoriaSlug: 'salado',
    porcion: 'Para Compartir (28cm)',
    precio: 155,
    precioStr: '$155 MXN',
    descripcion: 'Pan de masa madre untado con frijoles puercos de la casa, abundante costra dorada de queso asadero y chorizo artesanal.',
    disponibleEnCocina: true,
    stockDiario: 35,
    vendidosHoy: 22,
    tiempoPrepMin: 12,
    imagen: '/images/desayunos_marfil.jpg',
    badge: 'MONUMENTAL'
  },
  {
    id: 'prod-03',
    nombre: 'Fresas Estilo Dubái con Pistache & Kataifi',
    categoria: 'Postres & Indulgencia',
    categoriaSlug: 'postres',
    porcion: 'Copa Doble',
    precio: 145,
    precioStr: '$145 MXN',
    descripcion: 'Fresas seleccionadas bañadas en crema pura de pistache siciliano, chocolate belga fundido y lluvia de pasta kataifi tostada.',
    disponibleEnCocina: true,
    stockDiario: 50,
    vendidosHoy: 34,
    tiempoPrepMin: 6,
    imagen: '/images/marfil_dubai_pistache.jpg',
    badge: 'TENDENCIA DUBÁI'
  },
  {
    id: 'prod-04',
    nombre: 'Frappé de Confitería: Kinder Bueno',
    categoria: 'Frappés & Bebidas Frías',
    categoriaSlug: 'frappes',
    porcion: '16 oz (Grande)',
    precio: 98,
    precioStr: '$98 MXN',
    descripcion: 'Base de avellana y cacao blanco, crema batida artesanal, jarabe de chocolate semiamargo y barra completa de Kinder Bueno.',
    disponibleEnCocina: true,
    stockDiario: 60,
    vendidosHoy: 41,
    tiempoPrepMin: 5,
    imagen: '/images/marfil_kinder_hero.jpg',
    badge: 'FAVORITO JOVEN'
  },
  {
    id: 'prod-05',
    nombre: 'Cold Brew Tonic con Romero & Naranja',
    categoria: 'Barra de Especialidad',
    categoriaSlug: 'especialidad',
    porcion: '14 oz',
    precio: 78,
    precioStr: '$78 MXN',
    descripcion: 'Extracción en frío durante 18 horas de café Chiapas arábica, agua tónica premium, rodaja de naranja deshidratada y romero flameado.',
    disponibleEnCocina: true,
    stockDiario: 30,
    vendidosHoy: 19,
    tiempoPrepMin: 4,
    imagen: '/images/specialty_coffee.jpg',
    badge: 'AUTOR MARFIL'
  },
  {
    id: 'prod-06',
    nombre: 'Flat White Chiapas 100% Arábica',
    categoria: 'Barra de Especialidad',
    categoriaSlug: 'especialidad',
    porcion: '8 oz (Doble Ristretto)',
    precio: 65,
    precioStr: '$65 MXN',
    descripcion: 'Doble ristretto de café de especialidad de origen Chiapas con microespuma sedosa de leche entera pasteurizada localmente.',
    disponibleEnCocina: true,
    stockDiario: 80,
    vendidosHoy: 36,
    tiempoPrepMin: 3,
    imagen: '/images/marfil_latte_art.jpg',
    badge: 'ESPECIALIDAD'
  },
  {
    id: 'prod-07',
    nombre: 'Hamburguesa Monumental Marfil Brioche',
    categoria: 'Cocina Contundente',
    categoriaSlug: 'salado',
    porcion: '200g Carne de Res Angus',
    precio: 185,
    precioStr: '$185 MXN',
    descripcion: 'Pan brioche tostado con mantequilla, carne angus a la plancha, queso cheddar fundido, tocino caramelizado y papas gajo.',
    disponibleEnCocina: true,
    stockDiario: 25,
    vendidosHoy: 14,
    tiempoPrepMin: 18,
    imagen: '/images/Menu/Hamburguesa.png',
    badge: 'ALL-DAY'
  },
  {
    id: 'prod-08',
    nombre: 'Frappé Mazapán Artesanal Duranguense',
    categoria: 'Frappés & Bebidas Frías',
    categoriaSlug: 'frappes',
    porcion: '16 oz',
    precio: 85,
    precioStr: '$85 MXN',
    descripcion: 'Cremoso frappé con dos piezas completas de mazapán tradicional, leche evaporada, canela y toque de miel de mezquite.',
    disponibleEnCocina: false, // Apagado temporal para simulación
    stockDiario: 0,
    vendidosHoy: 12,
    tiempoPrepMin: 5,
    imagen: '/images/dubai_frappes.jpg',
    badge: 'AGOTADO TEMPORAL'
  },
  {
    id: 'prod-09',
    nombre: 'Pizza Rústica Cuatro Quesos & Miel Picante',
    categoria: 'Cocina Contundente',
    categoriaSlug: 'salado',
    porcion: 'Individual 26cm',
    precio: 165,
    precioStr: '$165 MXN',
    descripcion: 'Masa madre madurada 48h, salsa pomodoro casera, mozzarella, provolone, queso asadero de Durango y drizzle de miel habanero.',
    disponibleEnCocina: true,
    stockDiario: 20,
    vendidosHoy: 11,
    tiempoPrepMin: 16,
    imagen: '/images/desayunos_marfil.jpg',
    badge: 'NOCHES'
  },
  {
    id: 'prod-10',
    nombre: 'Shot de Mezcal de Nombre de Dios con Naranja',
    categoria: 'Bebidas Sociales & Noches',
    categoriaSlug: 'bar',
    porcion: '1.5 oz',
    precio: 75,
    precioStr: '$75 MXN',
    descripcion: 'Mezcal artesanal 100% de agave cenizo producido en Nombre de Dios, Durango. Servido con gajos de naranja y sal de gusano.',
    disponibleEnCocina: true,
    stockDiario: 40,
    vendidosHoy: 15,
    tiempoPrepMin: 2,
    imagen: '/images/live_music.jpg',
    badge: 'LOCAL DURANGO'
  }
];

export const INITIAL_PROMOCIONES = [
  {
    id: 'promo-01',
    codigo: 'MF-PROMO-2X1',
    titulo: 'Jueves 2x1 en Frappés de Confitería',
    categoria: 'Frappés & Indulgencia',
    descuentoBadge: '2x1 JUEVES',
    beneficio: 'Segundo frappé de igual o menor precio totalmente gratis',
    vigencia: 'Válido todos los jueves de 4:00 PM a 8:00 PM',
    canjesHoy: 19,
    limiteDiario: 50,
    estado: 'activo',
    sucursales: ['porras-matriz', 'calvario']
  },
  {
    id: 'promo-02',
    codigo: 'MF-PROMO-DUBAI',
    titulo: 'Combo Tarde Dubái: Fresas + Cold Brew',
    categoria: 'Postres & Especialidad',
    descuentoBadge: '20% OFF',
    beneficio: 'Fresas Estilo Dubái + Cold Brew Tonic por solo $179 MXN (Antes $223)',
    vigencia: 'Válido Lunes a Viernes de 3:00 PM a 7:00 PM',
    canjesHoy: 14,
    limiteDiario: 35,
    estado: 'activo',
    sucursales: ['porras-matriz', 'calvario']
  },
  {
    id: 'promo-03',
    codigo: 'MF-PROMO-BRUNCH',
    titulo: 'Brunch Amigos: Chilaquiles + Café Refill',
    categoria: 'Brunch & Desayunos',
    descuentoBadge: 'COMBO ESPECIAL',
    beneficio: 'Chilaquiles con Boneless + Refill ilimitado de café americano Chiapas',
    vigencia: 'Válido todos los días antes de las 12:00 PM',
    canjesHoy: 23,
    limiteDiario: 60,
    estado: 'activo',
    sucursales: ['porras-matriz', 'calvario']
  },
  {
    id: 'promo-04',
    codigo: 'MF-PROMO-LUDOTECA',
    titulo: 'Pase Grupal de Juegos: 4 Personas x $299',
    categoria: 'Juegos de Mesa',
    descuentoBadge: 'AHORRO $80',
    beneficio: 'Acceso a ludoteca para 4 personas + 1 jarra de soda italiana + anfitrión',
    vigencia: 'Viernes y Sábados a partir de las 5:00 PM',
    canjesHoy: 6,
    limiteDiario: 15,
    estado: 'activo',
    sucursales: ['porras-matriz']
  }
];

export const INITIAL_CLIENTES_CLUB = [
  {
    codigoCliente: 'MF-CLUB-77312',
    nombre: 'Paola Santillán',
    telefono: '618-912-3344',
    nivel: 'Marfil VIP',
    sellosActuales: 7, // 7 de 8
    sellosMeta: 8,
    puntos: 420,
    visitasTotales: 23,
    recompensaDisponible: false,
    ultimaVisita: 'Hoy, 09:20 AM',
    sucursalHabitual: 'Porras Matriz'
  },
  {
    codigoCliente: 'MF-CLUB-88410',
    nombre: 'Fernando Quiñones',
    telefono: '618-456-7890',
    nivel: 'Café Lover',
    sellosActuales: 8, // ¡Completo!
    sellosMeta: 8,
    puntos: 510,
    visitasTotales: 16,
    recompensaDisponible: true,
    recompensaNombre: 'Copa Doble de Fresas Estilo Dubái GRATIS',
    ultimaVisita: 'Ayer, 06:40 PM',
    sucursalHabitual: 'Calvario'
  },
  {
    codigoCliente: 'MF-CLUB-33109',
    nombre: 'Mariana Corrales',
    telefono: '618-234-5678',
    nivel: 'Explorador',
    sellosActuales: 3,
    sellosMeta: 8,
    puntos: 120,
    visitasTotales: 4,
    recompensaDisponible: false,
    ultimaVisita: '28 Sep 2026',
    sucursalHabitual: 'Calvario'
  }
];

export const INITIAL_LUDOTECA = [
  {
    id: 'game-01',
    nombre: 'Catan (El Juego Base)',
    categoria: 'Estrategia & Negociación',
    jugadores: '3 - 4 jugadores',
    duracionMin: '60 - 90 min',
    dificultad: 'Media',
    piezasEstado: '100% Completo (Verificado)',
    estado: 'en_mesa',
    mesaActual: 'L01 (Javier y amigos)',
    vecesJugadoMes: 48,
    reposicionRequerida: false
  },
  {
    id: 'game-02',
    nombre: 'Dixit Odyssey',
    categoria: 'Creatividad & Deducción',
    jugadores: '3 - 12 jugadores',
    duracionMin: '30 - 45 min',
    dificultad: 'Fácil',
    piezasEstado: '100% Completo (84 cartas)',
    estado: 'en_mesa',
    mesaActual: 'L02 (Mariana Soto)',
    vecesJugadoMes: 62,
    reposicionRequerida: false
  },
  {
    id: 'game-03',
    nombre: 'Carcassonne',
    categoria: 'Colocación de Losetas',
    jugadores: '2 - 5 jugadores',
    duracionMin: '35 - 45 min',
    dificultad: 'Fácil / Media',
    piezasEstado: '100% Completo',
    estado: 'disponible',
    mesaActual: null,
    vecesJugadoMes: 39,
    reposicionRequerida: false
  },
  {
    id: 'game-04',
    nombre: 'Exploding Kittens: Edición NSFW & Original',
    categoria: 'Party Game & Risas',
    jugadores: '2 - 5 jugadores',
    duracionMin: '15 min',
    dificultad: 'Muy Fácil',
    piezasEstado: 'Faltan 2 micas protectoras',
    estado: 'disponible',
    mesaActual: null,
    vecesJugadoMes: 84,
    reposicionRequerida: true
  },
  {
    id: 'game-05',
    nombre: 'Código Secreto (Codenames)',
    categoria: 'Palabras & Equipos',
    jugadores: '4 - 8 jugadores',
    duracionMin: '20 min',
    dificultad: 'Fácil',
    piezasEstado: '100% Completo',
    estado: 'disponible',
    mesaActual: null,
    vecesJugadoMes: 55,
    reposicionRequerida: false
  },
  {
    id: 'game-06',
    nombre: 'Wingspan',
    categoria: 'Gestión de Recursos & Motor',
    jugadores: '1 - 5 jugadores',
    duracionMin: '60 - 75 min',
    dificultad: 'Media / Alta',
    piezasEstado: '100% Completo (Huevos y comederos)',
    estado: 'disponible',
    mesaActual: null,
    vecesJugadoMes: 22,
    reposicionRequerida: false
  },
  {
    id: 'game-07',
    nombre: 'Virus! 2 Evolution',
    categoria: 'Cartas Rápido',
    jugadores: '2 - 6 jugadores',
    duracionMin: '20 min',
    dificultad: 'Muy Fácil',
    piezasEstado: '100% Completo',
    estado: 'disponible',
    mesaActual: null,
    vecesJugadoMes: 71,
    reposicionRequerida: false
  },
  {
    id: 'game-08',
    nombre: 'Taco Gato Queso Pizza',
    categoria: 'Reflejos & Caos',
    jugadores: '3 - 8 jugadores',
    duracionMin: '10 - 15 min',
    dificultad: 'Muy Fácil',
    piezasEstado: '100% Completo',
    estado: 'disponible',
    mesaActual: null,
    vecesJugadoMes: 93,
    reposicionRequerida: false
  }
];

export const METRICAS_DIARIAS = {
  ventasHoy: 28450,
  ticketPromedio: 285,
  comensalesHoy: 148,
  aforoPorcentaje: 74,
  reservasHoy: 28,
  reservasAsistidas: 22,
  reservasNoShow: 1,
  reservasCanceladas: 2,
  sellosEmitidosHoy: 94,
  cuponesRedimidosHoy: 26,
  tiempoPromedioMesaMin: 58,

  // Distribución horaria de comensales (8am a 11pm)
  distribucionHoraria: [
    { hora: '08:00', comensales: 14, ventas: 1820 },
    { hora: '09:00', comensales: 28, ventas: 4150 },
    { hora: '10:00', comensales: 42, ventas: 6890 }, // Pico desayuno
    { hora: '11:00', comensales: 38, ventas: 5420 },
    { hora: '12:00', comensales: 22, ventas: 2950 },
    { hora: '13:00', comensales: 26, ventas: 3800 },
    { hora: '14:00', comensales: 34, ventas: 4950 },
    { hora: '15:00', comensales: 25, ventas: 3400 },
    { hora: '16:00', comensales: 18, ventas: 2200 },
    { hora: '17:00', comensales: 30, ventas: 3900 },
    { hora: '18:00', comensales: 36, ventas: 4800 }, // Pico tarde/juegos
    { hora: '19:00', comensales: 40, ventas: 5600 },
    { hora: '20:00', comensales: 32, ventas: 4300 },
    { hora: '21:00', comensales: 24, ventas: 3100 },
    { hora: '22:00', comensales: 15, ventas: 1850 }
  ],

  // Desglose de ventas por categoría gastronómica
  ventasPorCategoria: [
    { categoria: 'Brunch & Cocina Salada', porcentaje: 38, monto: 10811, color: '#E12927' },
    { categoria: 'Frappés de Confitería', porcentaje: 26, monto: 7397, color: '#FCEAE9', textColor: '#1F1410' },
    { categoria: 'Café de Especialidad', porcentaje: 18, monto: 5121, color: '#1F1410' },
    { categoria: 'Postres & Dubái', porcentaje: 12, monto: 3414, color: '#F87171' },
    { categoria: 'Bebidas & Mezcal', porcentaje: 6, monto: 1707, color: '#78350F' }
  ]
};

export const STAFF_ACTIVO = [
  { id: 'st-01', nombre: 'Sofía Valenzuela', rol: 'Gerente de Sucursal', sucursal: 'Porras Matriz', estado: 'activo', turno: '07:30 - 16:00' },
  { id: 'st-02', nombre: 'Mateo Nevárez', rol: 'Head Barista & Métodos', sucursal: 'Porras Matriz', estado: 'activo', turno: '07:30 - 15:30' },
  { id: 'st-03', nombre: 'Alejandro Morales', rol: 'Anfitrión de Ludoteca', sucursal: 'Porras Matriz', estado: 'activo', turno: '10:00 - 19:00' },
  { id: 'st-04', nombre: 'Valeria Siqueiros', rol: 'Hostess de Recepción', sucursal: 'Porras Matriz', estado: 'activo', turno: '08:00 - 16:30' },
  { id: 'st-05', nombre: 'Erick Rentería', rol: 'Cocinero de Línea Caliente', sucursal: 'Porras Matriz', estado: 'activo', turno: '07:00 - 15:30' },
  { id: 'st-06', nombre: 'Camila Rosales', rol: 'Supervisora de Piso', sucursal: 'Calvario', estado: 'activo', turno: '08:00 - 16:30' }
];
