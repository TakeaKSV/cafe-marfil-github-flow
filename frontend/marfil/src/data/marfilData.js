// ==========================================================================
// CAFÉ MARFIL — CAFÉ DE ESPECIALIDAD & COCINA HONESTA — DURANGO, MÉXICO
// ADN Gastronómico:
// 1. Barra de Especialidad e Indulgencia: Espresso, Flat White, Cold Brew Tonic
//    con romero, frappés de confitería (Kinder, Gansito, Barbie, Mazapán),
//    sodas italianas, tés/tisanas, cervezas y mezcal.
// 2. Cocina Salada y Dulce Contundente: Chilaquiles con boneless o rellenos,
//    molletes monumentales ("Mamut"), hamburguesas, pizzas artesanales,
//    waffles temáticos y fresas estilo Dubái con pistache y kataifi.
// ==========================================================================

export const SUCURSALES = [
  {
    id: 'porras-matriz',
    nombre: 'Sucursal Porras (Matriz)',
    subtitulo: 'Terraza con luces de ambiente, barra de especialidad y música en vivo',
    direccion: 'Calle Porras #100, esq. Aquiles Serdán, Zona Centro, Durango, Dgo.',
    horario: 'Lun a Sáb: 8:00 AM – 11:00 PM · Dom: 9:00 AM – 11:00 PM',
    telefono: '(618) 170-6666',
    imagen: '/images/sucursal_porras.png',
    caracteristicas: [
      'Terraza superior con luces de ambiente',
      'Salón de juegos de mesa (+60 juegos)',
      'Cocina caliente continua (All-Day Breakfast)',
      'Barra de métodos y frappés de autor',
      'Pet friendly en terraza'
    ],
    servicios: ['WiFi 150 Mbps', 'Enchufes en cada mesa', 'Coctelería y mezcal de Durango', 'Bicicletero'],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Cafe+Marfil+Calle+Porras+100+Durango',
    mapEmbedUrl: 'https://maps.google.com/maps?q=Cafe+Marfil+Calle+Porras+100+Durango&t=&z=16&ie=UTF8&iwloc=&output=embed',
    destacada: true
  },
  {
    id: 'calvario',
    nombre: 'Sucursal Calvario',
    subtitulo: 'Casona colonial con balcones, ludoteca, brunch y tardes de café',
    direccion: 'Calle De la Cruz #302-B, Barrio del Calvario, Durango, Dgo.',
    horario: 'Lun a Sáb: 8:00 AM – 11:00 PM · Dom: 9:00 AM – 11:00 PM',
    telefono: '(618) 174-0702',
    imagen: '/images/sucursal_calvario.png',
    caracteristicas: [
      'Fachada colonial con balcones y vegetación',
      'Ludoteca y mesas para grupos',
      'Barra express de frappés y sodas italianas',
      'Ambiente cálido e iluminación íntima',
      'Pet friendly total'
    ],
    servicios: ['Grab & Go', 'Fresas estilo Dubái al paso', 'WiFi de alta velocidad', 'Desayunos'],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Cafe+Marfil+De+la+Cruz+302+Durango',
    mapEmbedUrl: 'https://maps.google.com/maps?q=Calle+De+la+Cruz+302-B+Barrio+del+Calvario+Durango&t=&z=16&ie=UTF8&iwloc=&output=embed',
    destacada: false
  }
];

export const PLATILLOS_ESTRELLA = [
  {
    id: 'chilaquiles-boneless',
    nombre: 'Chilaquiles con Boneless Crujientes',
    categoria: 'Cocina Salada Contundente',
    categoriaSlug: 'salado',
    porcion: 'PLATO FUERTE',
    salsa: 'Salsa Verde Martajada o Chipotle Dulce',
    precio: '$175 MXN',
    precioNum: 175,
    descripcion: 'Totopos de maíz nixtamalizado bañados en salsa verde martajada de la casa, crema de rancho, queso asadero y 180g de boneless de pechuga crujiente.',
    imagen: '/images/desayunos_marfil.jpg',
    badge: 'FAVORITO DE LA CASA'
  },
  {
    id: 'mollete-mamut',
    nombre: 'Mollete Monumental "Mamut" (28cm)',
    categoria: 'Desayunos All-Day',
    categoriaSlug: 'salado',
    porcion: 'PARA COMPARTIR',
    salsa: 'Pico de Gallo & Chiles Toreados',
    precio: '$155 MXN',
    precioNum: 155,
    descripcion: 'Pan rústico de masa madre de 28cm untado con frijoles puercos, abundante costra dorada de queso asadero duranguense y chorizo artesanal dorado.',
    imagen: '/images/desayunos_marfil.jpg',
    badge: 'MONUMENTAL'
  },
  {
    id: 'fresas-estilo-dubai',
    nombre: 'Fresas Estilo Dubái con Pistache & Kataifi',
    categoria: 'Indulgencia Dulce',
    categoriaSlug: 'dulce',
    porcion: 'COPA DOBLE',
    precio: '$145 MXN',
    precioNum: 145,
    descripcion: 'Fresas frescas de temporada bañadas en crema untuosa de pistache siciliano puro, chocolate derretido y lluvia crocante de pasta kataifi tostada en mantequilla.',
    imagen: '/images/marfil_dubai_pistache.jpg',
    badge: 'TENDENCIA DUBÁI'
  },
  {
    id: 'frappe-kinder-bueno',
    nombre: 'Frappé de Confitería: Kinder Bueno & Avellana',
    categoria: 'Barra de Indulgencia',
    categoriaSlug: 'frappes',
    porcion: '16 OZ',
    precio: '$98 MXN',
    precioNum: 98,
    descripcion: 'Frappé cremoso a base de crema de avellana y chocolate blanco, coronado con crema batida artesanal, chocolate fundido y barra completa de Kinder Bueno.',
    imagen: '/images/marfil_kinder_hero.jpg',
    badge: 'MÁS PEDIDO'
  },
  {
    id: 'cold-brew-tonic-romero',
    nombre: 'Cold Brew Tonic con Romero & Naranja',
    categoria: 'Barra de Especialidad',
    categoriaSlug: 'especialidad',
    porcion: '14 OZ',
    precio: '$78 MXN',
    precioNum: 78,
    descripcion: 'Extracción en frío durante 18 horas de café Chiapas de especialidad, agua tónica artesanal, hielo cristalino y ramita de romero fresco quemado al momento.',
    imagen: '/images/specialty_coffee.jpg',
    badge: 'AUTOR MARFIL'
  }
];

export const ACTIVIDADES = [
  {
    id: 'noche-cine',
    nombre: 'Noche de Cine & Proyección Especial',
    categoria: 'Cine & Proyecciones',
    categoriaSlug: 'cine',
    fecha: 'Viernes 3 de Octubre, 2026',
    fechaCorta: 'Vie, 3 Oct',
    hora: '8:00 PM – 11:00 PM',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Porras (Matriz)',
    imagen: '/images/live_music.jpg',
    resumen: 'Proyección en pantalla grande con snacks y bebidas de la barra. Películas de culto, estrenos indie y ciclos temáticos en un ambiente único.',
    descripcionCompleta: 'Disfruta del cine en la terraza superior de Café Marfil Porras. Cada sesión incluye una selección curada de películas —desde clásicos de culto hasta estrenos indie— acompañadas de nuestra barra completa de frappés, bebidas artesanales y snacks de la cocina.',
    duracion: '3 horas',
    cupoTotal: 40,
    lugaresOcupados: 28,
    lugaresDisponibles: 12,
    precio: '$80 MXN',
    precioNum: 80,
    esGratis: false,
    incluye: ['Proyección en pantalla grande', 'Snack de bienvenida', 'Acceso a barra completa'],
    requisitos: 'Apto para todas las edades según la película. Consumo mínimo recomendado.'
  },
  {
    id: 'glow-paint',
    nombre: 'Glow & Paint: Pintura Neón con Luz Negra',
    categoria: 'Talleres Creativos',
    categoriaSlug: 'talleres',
    fecha: 'Sábado 4 de Octubre, 2026',
    fechaCorta: 'Sáb, 4 Oct',
    hora: '7:00 PM – 10:00 PM',
    sucursalId: 'calvario',
    sucursalNombre: 'Calvario',
    imagen: '/images/marfil_latte_art.jpg',
    resumen: 'Pinta un cuadro con pinturas neón que brillan bajo luz negra, con música, snacks y bebidas incluidas. Sin experiencia necesaria.',
    descripcionCompleta: 'Una noche creativa y luminosa: pinturas fluorescentes, luz negra ambiental y música de fondo para que expreses tu lado artístico. Recibirás tu lienzo, pinceles y pinturas neón. Incluye snacks y una bebida de la barra Marfil.',
    duracion: '3 horas',
    cupoTotal: 20,
    lugaresOcupados: 16,
    lugaresDisponibles: 4,
    precio: '$250 MXN',
    precioNum: 250,
    esGratis: false,
    incluye: ['Lienzo, pinceles y pinturas neón', 'Una bebida de la barra incluida', 'Snacks durante la sesión', 'Te llevas tu obra terminada'],
    requisitos: 'No se requiere experiencia previa. Ropa cómoda recomendada (las pinturas pueden manchar).'
  },
  {
    id: 'pinta-planta-florece',
    nombre: 'Pinta, Planta y Florece',
    categoria: 'Talleres Creativos',
    categoriaSlug: 'talleres',
    fecha: 'Domingo 5 de Octubre, 2026',
    fechaCorta: 'Dom, 5 Oct',
    hora: '11:00 AM – 1:30 PM',
    sucursalId: 'calvario',
    sucursalNombre: 'Calvario',
    imagen: '/images/marfil_dubai_pistache.jpg',
    resumen: 'Decora y pinta tu propia maceta de barro y al terminar te llevas una planta o flores de temporada. Un taller relajante con café y desayuno.',
    descripcionCompleta: 'Un taller matutino y creativo: recibirás una maceta de barro virgen, pinturas acrílicas y todo el material para personalizarla. Al concluir, elige una planta de temporada o un ramo de flores para llevarte a casa. Incluye café de especialidad y un desayuno ligero.',
    duracion: '2.5 horas',
    cupoTotal: 16,
    lugaresOcupados: 10,
    lugaresDisponibles: 6,
    precio: '$220 MXN',
    precioNum: 220,
    esGratis: false,
    incluye: ['Maceta de barro y materiales de pintura', 'Planta o flores para llevar', 'Café de especialidad y desayuno ligero'],
    requisitos: 'Apto para todas las edades. Perfecto para ir en pareja, con amigas o en familia.'
  },
  {
    id: 'cafe-y-tinta',
    nombre: 'Café y Tinta: Flash Tattoos & Música en Vivo',
    categoria: 'Talleres Creativos',
    categoriaSlug: 'talleres',
    fecha: 'Viernes 10 de Octubre, 2026',
    fechaCorta: 'Vie, 10 Oct',
    hora: '7:00 PM – 11:00 PM',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Porras (Matriz)',
    imagen: '/images/marfil_hero_cup.jpg',
    resumen: 'Música en vivo, bebidas artesanales y sesiones de flash tattoos con artistas locales de Durango. Una noche de arte, café y adrenalina.',
    descripcionCompleta: 'La noche más cool de Marfil: artistas del tatuaje locales ofrecen diseños flash a precio fijo mientras disfrutas de música acústica en vivo y la barra completa de bebidas. Agenda tu turno al llegar o aparta el tuyo por adelantado.',
    duracion: '4 horas',
    cupoTotal: 30,
    lugaresOcupados: 22,
    lugaresDisponibles: 8,
    precio: 'Consumo mínimo $100',
    precioNum: 100,
    esGratis: false,
    incluye: ['Música en vivo toda la noche', 'Acceso a barra completa', 'Flash tattoos disponibles por separado'],
    requisitos: 'Mayores de 18 años para tatuajes. Consumo mínimo de $100 MXN en barra.'
  },
  {
    id: 'musica-en-vivo',
    nombre: 'Sesión Acústica en Vivo',
    categoria: 'Música en Vivo',
    categoriaSlug: 'musica',
    fecha: 'Sábado 11 de Octubre, 2026',
    fechaCorta: 'Sáb, 11 Oct',
    hora: '8:00 PM – 10:30 PM',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Porras (Matriz)',
    imagen: '/images/live_music.jpg',
    resumen: 'Cantautores y ensambles locales de Durango en la terraza de Marfil Porras. Pizzas de masa madre, mezcal artesanal y buenas vibras.',
    descripcionCompleta: 'Las noches de música en vivo son parte del alma de Café Marfil. Disfruta de cantautores y ensambles acústicos locales en nuestra terraza superior, acompañado de pizzas recién horneadas, cócteles de café y mezcal artesanal de Nombre de Dios, Durango.',
    duracion: '2.5 horas',
    cupoTotal: 50,
    lugaresOcupados: 38,
    lugaresDisponibles: 12,
    precio: 'Entrada Libre',
    precioNum: 0,
    esGratis: true,
    incluye: ['Concierto acústico en vivo', 'Mesa asegurada con reservación'],
    requisitos: 'Consumo de alimentos o bebidas. Se recomienda reservar con anticipación.'
  },
  {
    id: 'juegos-de-mesa',
    nombre: 'Tarde & Noche de Juegos de Mesa',
    categoria: 'Juegos de Mesa',
    categoriaSlug: 'juegos',
    fecha: 'Todos los días',
    fechaCorta: 'Permanente',
    hora: '12:00 PM – 11:00 PM',
    sucursalId: 'porras-matriz',
    sucursalNombre: 'Porras (Matriz) & Calvario',
    imagen: '/images/board_games.jpg',
    resumen: 'Más de 60 juegos de mesa disponibles para pasar el rato con amigos mientras consumes. Catan, Dixit, Dobble, UNO y muchos más.',
    descripcionCompleta: 'Nuestra ludoteca está disponible todos los días para que vengas con amigos, pareja o familia. Elige entre más de 60 títulos: juegos de estrategia, de fiesta, cooperativos y clásicos. Un anfitrión puede explicarte las reglas si es tu primera vez.',
    duracion: 'Sin límite de tiempo',
    cupoTotal: 60,
    lugaresOcupados: 0,
    lugaresDisponibles: 60,
    precio: 'Acceso con consumo',
    precioNum: 0,
    esGratis: true,
    incluye: ['+60 juegos de mesa disponibles', 'Anfitrión disponible para explicar reglas', 'Sin límite de tiempo con tu consumo'],
    requisitos: 'Consumo mínimo en alimentos o bebidas para acceder a la ludoteca.'
  },
  {
    id: 'casitas-jengibre',
    nombre: 'Arma tu Casita Navideña de Jengibre',
    categoria: 'Actividad de Temporada',
    categoriaSlug: 'temporada',
    fecha: 'Diciembre 2026',
    fechaCorta: 'Dic 2026',
    hora: 'Por confirmar',
    sucursalId: 'calvario',
    sucursalNombre: 'Calvario',
    imagen: '/images/marfil_caramel_ribbon.jpg',
    resumen: 'Arma y decora tu propia casita navideña de jengibre con glaseado, dulces y chocolates. La actividad perfecta para llevar a los pequeños.',
    descripcionCompleta: 'Una tradición navideña en Café Marfil: cada año abrimos inscripciones para armar y decorar casitas de jengibre con toda la familia. Incluye la casita pre-horneada, glaseado real, dulces surtidos y chocolates para decorar. ¡Te la llevas a casa!',
    duracion: '2 horas',
    cupoTotal: 18,
    lugaresOcupados: 0,
    lugaresDisponibles: 18,
    precio: 'Por confirmar',
    precioNum: 0,
    esGratis: false,
    incluye: ['Casita de jengibre pre-horneada', 'Glaseado y dulces de decoración', 'Bebida caliente de temporada incluida', 'Te llevas tu casita terminada'],
    requisitos: 'Apto para todas las edades. Disponible solo en temporada navideña (Diciembre).'
  },
  {
    id: 'eventos-privados',
    nombre: 'Eventos Privados: Cumpleaños & Celebraciones',
    categoria: 'Eventos Privados',
    categoriaSlug: 'privados',
    fecha: 'Todo el año — Bajo reservación',
    fechaCorta: 'Todo el año',
    hora: 'A convenir',
    sucursalId: 'calvario',
    sucursalNombre: 'Calvario (Espacio Reservable)',
    imagen: '/images/sucursal_calvario.png',
    resumen: 'Reserva el espacio de la sucursal Calvario para cumpleaños, reuniones familiares y celebraciones privadas con menú y barra exclusiva.',
    descripcionCompleta: 'La Sucursal Calvario ofrece la posibilidad de reservar el salón completo o una sección para eventos privados: cumpleaños, reuniones de empresa, baby showers, despedidas y más. Coordinamos menú personalizado, decoración y música para tu evento.',
    duracion: 'Según el evento',
    cupoTotal: 60,
    lugaresOcupados: 0,
    lugaresDisponibles: 60,
    precio: 'Cotización personalizada',
    precioNum: 0,
    esGratis: false,
    incluye: ['Espacio privado o semi-privado', 'Menú personalizado', 'Coordinación de decoración', 'Barra de bebidas dedicada'],
    requisitos: 'Reservación con mínimo 5 días de anticipación. Sujeto a disponibilidad de fecha.'
  }
];

export const PROMOCIONES = [
  {
    id: 'promo-combo-mamut',
    nombre: 'Combo Monumental: Mamut + Flat White',
    categoria: 'Promociones del mes',
    categoriaSlug: 'mes',
    descuentoBadge: 'COMBO $145',
    vigencia: 'Lunes a Domingo de 8:00 AM a 2:00 PM',
    sucursalesAplicables: ['Centro Histórico', 'Lomas del Parque', 'Paseo Constitución'],
    sucursalesValidas: ['Centro Histórico', 'Lomas del Parque', 'Paseo Constitución'],
    imagen: '/images/desayunos_marfil.jpg',
    resumen: 'Mollete Mamut de masa madre con costra de queso asadero duranguense y chorizo artesanal más un Flat White doble de 12oz.',
    descripcion: 'Mollete Mamut de masa madre con costra de queso asadero duranguense y chorizo artesanal más un Flat White doble de 12oz.',
    beneficioDetalle: 'Precio especial combo: $145 MXN (Ahorras $45 MXN)',
    codigoCupon: 'MAMUTMARFIL',
    condiciones: [
      'Aplica en consumo en sucursal y para llevar.',
      'Disponible en cualquier sucursal de Café Marfil en Durango.',
      'Puedes cambiar tu Flat White por Cold Brew Tonic sin costo extra.'
    ],
    terminos: [
      'Aplica en consumo en sucursal y para llevar.',
      'Disponible en cualquier sucursal de Café Marfil en Durango.',
      'Puedes cambiar tu Flat White por Cold Brew Tonic sin costo extra.'
    ],
    comoUsar: 'Presiona "Mostrar cupón al barista", presenta tu código al ordenar en mostrador y disfruta tu experiencia.'
  },
  {
    id: 'promo-jueves-frappes',
    nombre: 'Jueves Lúdico: 2x1 en Frappés de Confitería',
    categoria: 'Temporada',
    categoriaSlug: 'temporada',
    descuentoBadge: '2x1 JUEVES',
    vigencia: 'Todos los Jueves de 4:00 PM a 8:00 PM',
    sucursalesAplicables: ['Centro Histórico', 'Paseo Constitución'],
    sucursalesValidas: ['Centro Histórico', 'Paseo Constitución'],
    imagen: '/images/dubai_frappes.jpg',
    resumen: 'Pide tu frappé favorito de Kinder Bueno, Gansito, Barbie Pink o Mazapán y el segundo va por nuestra cuenta.',
    descripcion: 'Pide tu frappé favorito de Kinder Bueno, Gansito, Barbie Pink o Mazapán y el segundo va por nuestra cuenta.',
    beneficioDetalle: '2x1 en toda la línea de Frappés de Confitería Comercial 16oz.',
    codigoCupon: 'FRAPPES2X1',
    condiciones: [
      'Válido exclusivamente los días Jueves de 4:00 PM a 8:00 PM.',
      'Aplica en sabores: Kinder Bueno, Gansito, Barbie Pink y Mazapán.',
      'La segunda bebida es de igual o menor precio.'
    ],
    terminos: [
      'Válido exclusivamente los días Jueves de 4:00 PM a 8:00 PM.',
      'Aplica en sabores: Kinder Bueno, Gansito, Barbie Pink y Mazapán.',
      'La segunda bebida es de igual o menor precio.'
    ],
    comoUsar: 'Genera tu código digital y muéstralo al barista antes de cerrar tu orden.'
  },
  {
    id: 'promo-fresas-dubai-launch',
    nombre: 'Lanzamiento: Fresas Dubái con Pistache 15% OFF',
    categoria: 'Promociones por sucursal',
    categoriaSlug: 'sucursal',
    descuentoBadge: '15% DTO',
    vigencia: 'Válido durante todo Octubre 2026',
    sucursalesAplicables: ['Centro Histórico', 'Lomas del Parque'],
    sucursalesValidas: ['Centro Histórico', 'Lomas del Parque'],
    imagen: '/images/dubai_frappes.jpg',
    resumen: 'Prueba la sensación gastronómica: fresas frescas bañadas en crema pura de pistache siciliano y pasta kataifi tostada en mantequilla.',
    descripcion: 'Prueba la sensación gastronómica: fresas frescas bañadas en crema pura de pistache siciliano y pasta kataifi tostada en mantequilla.',
    beneficioDetalle: '15% de descuento directo en cualquier copa de Fresas Estilo Dubái.',
    codigoCupon: 'DUBAIMARFIL',
    condiciones: [
      'Válido en sucursales Centro Histórico y Lomas del Parque.',
      'Sujeto a disponibilidad diaria de pasta kataifi artesanal.',
      'Presentar código desde la aplicación web al ordenar.'
    ],
    terminos: [
      'Válido en sucursales Centro Histórico y Lomas del Parque.',
      'Sujeto a disponibilidad diaria de pasta kataifi artesanal.',
      'Presentar código desde la aplicación web al ordenar.'
    ],
    comoUsar: 'Muestra tu QR al ordenar tu postre en mostrador.'
  },
  {
    id: 'promo-estudiantes-creativos',
    nombre: 'Comunidad Estudiantes & Cowork Durango',
    categoria: 'Clientes frecuentes',
    categoriaSlug: 'frecuentes',
    descuentoBadge: '15% ALL-DAY',
    vigencia: 'Lunes a Viernes todo el ciclo escolar',
    sucursalesAplicables: ['Centro Histórico', 'Paseo Constitución'],
    sucursalesValidas: ['Centro Histórico', 'Paseo Constitución'],
    imagen: '/images/hero_cafe.jpg',
    resumen: '15% de descuento en barra de especialidad, chilaquiles con boneless y uso de ludoteca para estudiantes y docentes.',
    descripcion: '15% de descuento en barra de especialidad, chilaquiles con boneless y uso de ludoteca para estudiantes y docentes.',
    beneficioDetalle: 'Descuento del 15% en todo el menú de alimentos, café y ludoteca.',
    codigoCupon: 'ESTUDIAMARFIL',
    condiciones: [
      'Presentar credencial vigente de estudiante o profesor.',
      'Válido para consumo individual de lunes a viernes.',
      'No acumulable con otras promociones o cupones.'
    ],
    terminos: [
      'Presentar credencial vigente de estudiante o profesor.',
      'Válido para consumo individual de lunes a viernes.',
      'No acumulable con otras promociones o cupones.'
    ],
    comoUsar: 'Genera el cupón y muéstralo junto con tu credencial.'
  }
];

export const PERFIL_USUARIO = {
  nombre: 'Sofía Navarro Morales',
  primerNombre: 'Sofía',
  correo: 'sofia.navarro@gmail.com',
  telefono: '(618) 154-8920',
  ciudad: 'Durango, Dgo.',
  avatarUrl: '',
  nivelFidelidad: 'Club Marfil Oro',
  visitasRealizadas: 14,
  sellosActuales: 6,
  sellosTotalesParaMeta: 8,
  puntosFidelidad: 380,
  preferencias: {
    platilloFavorito: 'Chilaquiles con boneless verdes',
    frappeFavorito: 'Frappé Kinder Bueno 16oz',
    cafeFavorito: 'Flat White 12oz con leche de avena',
    sucursalFrecuente: 'Centro Histórico'
  }
};

export const BENEFICIOS_USUARIO = [
  {
    id: 'ben-1',
    titulo: 'Frappé de Confitería Gratis (16oz)',
    subtitulo: 'A elegir: Kinder Bueno, Gansito, Barbie Pink o Mazapán',
    estado: 'disponible',
    vigencia: 'Vence el 25 de Octubre, 2026',
    codigo: 'MF-FRAPPE-992',
    icono: 'Sparkles'
  },
  {
    id: 'ben-2',
    titulo: 'Mollete Mamut con 50% de Descuento',
    subtitulo: 'Aplica en tu siguiente visita a Café Marfil',
    estado: 'disponible',
    vigencia: 'Vence el 30 de Noviembre, 2026',
    codigo: 'MF-MAMUT-418',
    icono: 'Utensils'
  },
  {
    id: 'ben-3',
    titulo: 'Pase Prioritario a Noche de Juegos de Mesa',
    subtitulo: 'Entrada y mesa asegurada sin costo de ludoteca',
    estado: 'usado',
    fechaUso: 'Canjeado el 18 de Septiembre, 2026',
    codigo: 'MF-LUDO-880',
    icono: 'Dices'
  },
  {
    id: 'ben-4',
    titulo: 'Copa de Fresas Estilo Dubái de Cortesía',
    subtitulo: 'Desbloquea al completar tus 8 sellos de visita en Durango',
    estado: 'bloqueado',
    progreso: '6 de 8 sellos completados',
    codigo: 'PROXIMAMENTE',
    icono: 'Gift'
  }
];

export const RULETA_PREMIOS = [
  { id: 1, texto: 'Frappé Kinder Gratis', valor: 'Frappé Kinder Gratis', tipo: 'frappe' },
  { id: 2, texto: '15% DTO en Tu Consumo', valor: '15% OFF Consumo', tipo: 'descuento' },
  { id: 3, texto: 'Shot de Mezcal Durango', valor: 'Shot Mezcal Gratis', tipo: 'social' },
  { id: 4, texto: '2x1 Bebidas de Barra', valor: '2x1 Bebidas', tipo: 'promo' },
  { id: 5, texto: 'Mollete Mamut al 50%', valor: 'Mamut 50% OFF', tipo: 'comida' },
  { id: 6, texto: '+60 Puntos Marfil Club', valor: '+60 Pts Marfil', tipo: 'puntos' }
];

export const NOTIFICACIONES_INICIALES = [
  {
    id: 'notif-1',
    titulo: '¡Mesa confirmada en Centro Histórico!',
    mensaje: 'Tu reservación para 4 personas está lista para mañana a las 7:30 PM (Folio #MF-8492). Chilaquiles y juegos esperándote.',
    tiempo: 'Hace 2 horas',
    tipo: 'reservacion',
    leida: false,
    screenDestino: 'mis_reservaciones'
  },
  {
    id: 'notif-2',
    titulo: '¡Nuevo beneficio por tus 6 visitas!',
    mensaje: 'Desbloqueaste "Frappé de Confitería Gratis 16oz" en Café Marfil. Válido en cualquier sucursal.',
    tiempo: 'Ayer',
    tipo: 'beneficio',
    leida: false,
    screenDestino: 'beneficios'
  },
  {
    id: 'notif-3',
    titulo: 'Nuevo platillo en carta: Fresas Dubái',
    mensaje: 'Ya puedes pedir fresas con crema pura de pistache siciliano y kataifi crocante en Centro y Lomas.',
    tiempo: 'Hace 2 días',
    tipo: 'promo',
    leida: true,
    screenDestino: 'promociones'
  }
];

export const RESERVACIONES_INICIALES = [
  {
    id: 'MF-8492',
    tipo: 'Cafetería & Noche de Juegos',
    sucursalId: 'centro-historico',
    sucursalNombre: 'Centro Histórico (Casona 5 de Febrero)',
    fecha: 'Mañana, 1 de Octubre, 2026',
    fechaISO: '2026-10-01',
    hora: '7:30 PM',
    personas: 4,
    nombreCliente: 'Sofía Navarro Morales',
    telefonoCliente: '(618) 154-8920',
    correoCliente: 'sofia.navarro@gmail.com',
    notas: 'Queremos mesa cerca de la ludoteca. Pediremos combo Mamut y frappés.',
    estado: 'Confirmada',
    qrCode: 'MF-8492-MARFIL-CENTRO',
    esHistorica: false
  },
  {
    id: 'MF-7319',
    tipo: 'Desayunos & Degustación All-Day',
    sucursalId: 'lomas-del-parque',
    sucursalNombre: 'Lomas del Parque',
    fecha: '14 de Septiembre, 2026',
    fechaISO: '2026-09-14',
    hora: '11:00 AM',
    personas: 2,
    nombreCliente: 'Sofía Navarro Morales',
    telefonoCliente: '(618) 154-8920',
    correoCliente: 'sofia.navarro@gmail.com',
    notas: 'Celebración de cumpleaños de mi amiga.',
    estado: 'Completada',
    qrCode: 'MF-7319-HISTORICO',
    esHistorica: true
  }
];
