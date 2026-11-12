// ==========================================================================
// DATOS DE EJEMPLO
//
// Reproduce el escenario de los mocks del frontend (adminMockData.js y
// marfilData.js) unificando lo que estaba duplicado o era inconsistente entre
// las dos apps. Todas las fechas son relativas al momento de sembrar: "hoy"
// siempre tiene mesas ocupadas, reservaciones y actividades próximas.
//
// Se inserta directo con SQL (sin pasar por los servicios) para poder fabricar
// historial: servicios ya cerrados, préstamos pasados, visitas anteriores...
// Todo va en una sola transacción: o se carga completo o no se carga nada.
// ==========================================================================

import bcrypt from 'bcryptjs';
import { generarTokenQR } from '../utils/codigos.js';
import { fechaLocal, horaLocal, hoyLocal, instanteLocal, sumarDias } from '../utils/fechas.js';
import { db, enTransaccion } from './conexion.js';

/** Contraseña de todas las cuentas de ejemplo. Solo para desarrollo. */
export const PASSWORD_DEMO = 'marfil2026';

const MINUTO = 60 * 1000;
const DIA = 24 * 60 * MINUTO;
const dos = (n) => String(n).padStart(2, '0');
const json = JSON.stringify;

/** Generador pseudoaleatorio con semilla fija: la base queda igual en cada siembra. */
function crearAzar(semilla) {
  let estado = semilla;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function insertar(tabla, fila) {
  const columnas = Object.keys(fila);
  const sql = `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map((c) => `:${c}`).join(', ')})`;
  return (await db.ejecutar(sql, fila)).id;
}

export function sembrar() {
  return enTransaccion(async () => {
    const azar = crearAzar(20261002);
    const entero = (min, max) => min + Math.floor(azar() * (max - min + 1));
    const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

    const ahora = new Date();
    const ahoraISO = ahora.toISOString();
    const hoy = hoyLocal();
    const hace = (minutos) => new Date(ahora.getTime() - minutos * MINUTO).toISOString();
    const haceDias = (dias) => new Date(ahora.getTime() - dias * DIA).toISOString();

    /** Hora local ('HH:MM') de una marca de tiempo, redondeada hacia abajo a 5 minutos. */
    const horaDe = (iso) => {
      const [h, m] = horaLocal(new Date(iso)).split(':').map(Number);
      return `${dos(h)}:${dos(m - (m % 5))}`;
    };
    /** Hora de hoy dentro de N minutos, redondeada a la media hora (tope 22:30). */
    const horaHoyEn = (minutos) => {
      const [h, m] = horaLocal(ahora).split(':').map(Number);
      const total = Math.min(22 * 60 + 30, Math.ceil((h * 60 + m + minutos) / 30) * 30);
      return `${dos(Math.floor(total / 60))}:${dos(total % 60)}`;
    };

    const passwordHash = bcrypt.hashSync(PASSWORD_DEMO, 10);
    const HORARIO = 'Lun a Sáb: 8:00 AM – 11:00 PM · Dom: 9:00 AM – 11:00 PM';
    const PORRAS = 'porras-matriz';
    const CALVARIO = 'calvario';

    // ----------------------------------------------------------------------
    // Sucursales y zonas
    // ----------------------------------------------------------------------

    await insertar('sucursales', {
      id: PORRAS,
      nombre: 'Sucursal Porras (Matriz)',
      subtitulo: 'Terraza con luces de ambiente, barra de especialidad y música en vivo',
      direccion: 'Calle Porras #100, esq. Aquiles Serdán, Zona Centro, Durango, Dgo.',
      horario: HORARIO,
      telefono: '(618) 170-6666',
      imagen: '/images/sucursal_porras.png',
      aforo_max: 85,
      caracteristicas: json([
        'Terraza superior con luces de ambiente',
        'Salón de juegos de mesa (+60 juegos)',
        'Cocina caliente continua (All-Day Breakfast)',
        'Barra de métodos y frappés de autor',
        'Pet friendly en terraza'
      ]),
      servicios: json(['WiFi 150 Mbps', 'Enchufes en cada mesa', 'Coctelería y mezcal de Durango', 'Bicicletero']),
      maps_url: 'https://www.google.com/maps/search/?api=1&query=Cafe+Marfil+Calle+Porras+100+Durango',
      map_embed_url: 'https://maps.google.com/maps?q=Cafe+Marfil+Calle+Porras+100+Durango&t=&z=16&ie=UTF8&iwloc=&output=embed',
      destacada: 1
    });
    await insertar('sucursales', {
      id: CALVARIO,
      nombre: 'Sucursal Calvario',
      subtitulo: 'Casona colonial con balcones, ludoteca, brunch y tardes de café',
      direccion: 'Calle De la Cruz #302-B, Barrio del Calvario, Durango, Dgo.',
      horario: HORARIO,
      telefono: '(618) 174-0702',
      imagen: '/images/sucursal_calvario.png',
      aforo_max: 48,
      caracteristicas: json([
        'Fachada colonial con balcones y vegetación',
        'Ludoteca y mesas para grupos',
        'Barra express de frappés y sodas italianas',
        'Ambiente cálido e iluminación íntima',
        'Pet friendly total'
      ]),
      servicios: json(['Grab & Go', 'Fresas estilo Dubái al paso', 'WiFi de alta velocidad', 'Desayunos']),
      maps_url: 'https://www.google.com/maps/search/?api=1&query=Cafe+Marfil+De+la+Cruz+302+Durango',
      map_embed_url: 'https://maps.google.com/maps?q=Calle+De+la+Cruz+302-B+Barrio+del+Calvario+Durango&t=&z=16&ie=UTF8&iwloc=&output=embed',
      destacada: 0
    });

    const zona = {};
    for (const [sucursal, nombres] of [
      [PORRAS, ['Salón Principal', 'Terraza Colonial', 'Ludoteca & Juegos']],
      [CALVARIO, ['Salón Acogedor', 'Barra Express & Sala']]
    ]) {
      for (const nombre of nombres) zona[nombre] = await insertar('zonas', { sucursal_id: sucursal, nombre });
    }

    // ----------------------------------------------------------------------
    // Personal (los que tienen email entran al panel con PASSWORD_DEMO)
    // ----------------------------------------------------------------------

    const persona = {};
    for (const p of [
      { clave: 'sofia', nombre: 'Sofía Valenzuela', email: 'admin@cafemarfil.mx', rol: 'admin', puesto: 'Gerente de Sucursal', sucursal: PORRAS, turno: ['07:30', '16:00'], encargado: 1 },
      { clave: 'mateo', nombre: 'Mateo Nevárez', puesto: 'Head Barista & Métodos', sucursal: PORRAS, turno: ['07:30', '15:30'] },
      { clave: 'alejandro', nombre: 'Alejandro Morales', email: 'ludoteca@cafemarfil.mx', rol: 'host', puesto: 'Anfitrión de Ludoteca', sucursal: PORRAS, turno: ['10:00', '19:00'] },
      { clave: 'valeria', nombre: 'Valeria Siqueiros', email: 'host@cafemarfil.mx', rol: 'host', puesto: 'Hostess de Recepción', sucursal: PORRAS, turno: ['08:00', '16:30'] },
      { clave: 'erick', nombre: 'Erick Rentería', puesto: 'Cocinero de Línea Caliente', sucursal: PORRAS, turno: ['07:00', '15:30'] },
      { clave: 'camila', nombre: 'Camila Rosales', email: 'calvario@cafemarfil.mx', rol: 'gerente', puesto: 'Supervisora de Piso', sucursal: CALVARIO, turno: ['08:00', '16:30'], encargado: 1 }
    ]) {
      persona[p.clave] = await insertar('personal', {
        nombre: p.nombre,
        email: p.email ?? null,
        password_hash: p.email ? passwordHash : null,
        rol: p.rol ?? 'staff',
        puesto: p.puesto,
        sucursal_id: p.sucursal,
        turno_inicio: p.turno[0],
        turno_fin: p.turno[1],
        es_encargado: p.encargado ?? 0,
        creado_en: ahoraISO
      });
    }

    // ----------------------------------------------------------------------
    // Menú
    // ----------------------------------------------------------------------

    const categoria = {};
    const categorias = [
      ['salado', 'Brunch & Cocina Salada'],
      ['frappes', 'Frappés & Bebidas Frías'],
      ['especialidad', 'Barra de Especialidad'],
      ['postres', 'Postres & Indulgencia'],
      ['bar', 'Bebidas Sociales & Noches']
    ];
    for (const [orden, [slug, nombre]] of categorias.entries()) {
      categoria[slug] = await insertar('categorias_menu', { slug, nombre, orden });
    }

    const PAPAS = 'Plato individual con papas';
    const productos = [
      {
        slug: 'chilaquiles-boneless', cat: 'salado', nombre: 'Chilaquiles con Boneless Crujientes', nombre_corto: 'CHILAQUILES',
        etiqueta: 'Cocina Salada Contundente', porcion: 'Plato Fuerte (180g Boneless)', precio: 175,
        descripcion: 'Totopos nixtamalizados, salsa verde martajada o chipotle dulce, crema de rancho, queso asadero y boneless dorados.',
        imagen: '/images/desayunos_marfil.jpg', badge: 'TOP 1 VENTAS', stock: 45, vendidos: 28, prep: 14, destacado: 1,
        ingredientes: ['Totopos de maíz nixtamalizado.', 'Salsa verde martajada o chipotle dulce.', 'Crema de rancho y queso asadero.', '180g de boneless de pechuga crujiente.'],
        alergenos: ['Lácteos', 'Gluten']
      },
      {
        slug: 'mollete-mamut', cat: 'salado', nombre: 'Mollete Monumental "Mamut" (28cm)', nombre_corto: 'MAMUT',
        etiqueta: 'Desayunos All-Day', porcion: 'Para Compartir (28cm)', precio: 155,
        descripcion: 'Pan de masa madre untado con frijoles puercos de la casa, abundante costra dorada de queso asadero y chorizo artesanal.',
        imagen: '/images/desayunos_marfil.jpg', badge: 'MONUMENTAL', stock: 35, vendidos: 22, prep: 12, destacado: 1,
        ingredientes: ['Pan rústico de masa madre de 28cm.', 'Frijoles puercos de la casa.', 'Costra dorada de queso asadero duranguense.', 'Chorizo artesanal dorado.', 'Pico de gallo y chiles toreados.'],
        alergenos: ['Gluten', 'Lácteos']
      },
      {
        slug: 'burger-doble-marfil', cat: 'salado', nombre: 'Hamburguesa Doble Carne Marfil con Asadero Duranguense', nombre_corto: 'DOBLE MARFIL',
        etiqueta: 'Cocina Salada Contundente', porcion: PAPAS, precio: 185, calorias: 720, color: '#D1A56A',
        descripcion: 'Pan brioche tostado con mantequilla, carne angus a la plancha, queso asadero fundido, tocino caramelizado y papas gajo.',
        imagen: '/images/Menu/Hamburguesa.png', badge: 'ESTRELLA', stock: 25, vendidos: 14, prep: 18,
        ingredientes: [
          '200g de carne de res selecta molida al día y sazonada con sales de autor.',
          'Pan brioche rústico de masa madre dorado a la plancha con mantequilla.',
          'Generosa costra dorada de queso asadero artesanal de Durango.',
          'Tocino ahumado en madera de manzano súper crujiente.',
          'Cebolla morada caramelizada lentamente en azúcar mascabado.',
          'Salsa especial tártara de la casa con pepinillos agridulces.',
          'Acompañada de generosa porción de papas gajo sazonadas con paprika y romero.'
        ],
        alergenos: ['Gluten', 'Lácteos', 'Huevo']
      },
      {
        slug: 'burger-boneless-bbq', cat: 'salado', nombre: 'Hamburguesa Boneless Crujientes BBQ', nombre_corto: 'BURGER BONELESS',
        etiqueta: 'Pollo Crujiente', porcion: PAPAS, precio: 165, calorias: 680, color: '#E58370',
        descripcion: 'Boneless de pechuga extra crujientes bañados en BBQ ahumada con miel de agave, queso asadero y coleslaw en pan brioche.',
        imagen: '/images/Menu/Hamburguesa.png', badge: 'CRISPY', stock: 20, vendidos: 9, prep: 16,
        ingredientes: [
          '180g de boneless de pechuga de pollo extra crujientes.',
          'Bañados en salsa BBQ ahumada con miel de agave artesanal.',
          'Queso asadero fundido de la región.',
          'Ensalada fresca de col morada con aderezo cremoso (coleslaw).',
          'Pan brioche tostado con ajonjolí negro tostado.',
          'Servida con papas a la francesa crujientes.'
        ],
        alergenos: ['Gluten', 'Lácteos', 'Sésamo']
      },
      {
        slug: 'burger-clasica-urban', cat: 'salado', nombre: 'Hamburguesa Clásica Urban con Queso Cheddar Madurado', nombre_corto: 'BURGER CLÁSICA',
        etiqueta: 'Clásicos Urban Brunch', porcion: PAPAS, precio: 150, calorias: 590, color: '#E5B757',
        descripcion: 'Carne de res a la parrilla con doble cheddar madurado, jitomate, lechuga, pepinillos y mayonesa de ajo asado.',
        imagen: '/images/Menu/Hamburguesa.png', badge: 'TRADICIONAL', stock: 20, vendidos: 7, prep: 15,
        ingredientes: [
          '150g de carne de res jugosa a la parrilla.',
          'Doble lámina de queso cheddar madurado fundido.',
          'Jitomate bola fresco y hojas de lechuga orejona crujiente.',
          'Pepinillos encurtidos al estilo tradicional.',
          'Mayonesa de ajo asado y mostaza dijon suave.',
          'Papas fritas sazonadas al punto de sal marina.'
        ],
        alergenos: ['Gluten', 'Lácteos', 'Huevo']
      },
      {
        slug: 'burger-smash-melt', cat: 'salado', nombre: 'Hamburguesa Smash con Triple Queso & Cebolla Crispy', nombre_corto: 'BURGER SMASH',
        etiqueta: 'Estilo Smash Burger', porcion: PAPAS, precio: 160, calorias: 640, color: '#CFA065',
        descripcion: 'Doble medallón smash de bordes caramelizados, triple queso americano, cebolla crispy y salsa secreta Marfil en pan de papa.',
        imagen: '/images/Menu/Hamburguesa.png', badge: 'SMASH CRAFT', stock: 20, vendidos: 10, prep: 15,
        ingredientes: [
          'Doble medallón smash con bordes ultra crujientes caramelizados.',
          'Triple queso americano fundido entre las carnes.',
          'Cebolla frita crujiente con toque de pimienta negra.',
          'Salsa secreta Marfil con matices ahumados y relish.',
          'Pan de papa artesanal esponjoso dorado en mantequilla.',
          'Papas gajo crujientes con aderezo chipotle de cortesía.'
        ],
        alergenos: ['Gluten', 'Lácteos', 'Huevo']
      },
      {
        slug: 'pizza-cuatro-quesos', cat: 'salado', nombre: 'Pizza Rústica Cuatro Quesos & Miel Picante', nombre_corto: 'PIZZA 4 QUESOS',
        etiqueta: 'Cocina Contundente', porcion: 'Individual 26cm', precio: 165,
        descripcion: 'Masa madre madurada 48h, salsa pomodoro casera, mozzarella, provolone, queso asadero de Durango y drizzle de miel habanero.',
        imagen: '/images/desayunos_marfil.jpg', badge: 'NOCHES', stock: 20, vendidos: 11, prep: 16,
        alergenos: ['Gluten', 'Lácteos']
      },
      {
        slug: 'frappe-kinder-bueno', cat: 'frappes', nombre: 'Frappé de Confitería: Kinder Bueno', nombre_corto: 'KINDER BUENO',
        etiqueta: 'Barra de Confitería', porcion: '16 oz', precio: 98, calorias: 450, color: '#D8B288',
        descripcion: 'Base de avellana y cacao blanco, crema batida artesanal, jarabe de chocolate semiamargo y barra completa de Kinder Bueno.',
        imagen: '/images/Menu/vaso-cafe.png', badge: 'FAVORITO JOVEN', stock: 60, vendidos: 41, prep: 5, destacado: 1,
        ingredientes: [
          'Crema suave de chocolate con leche y avellana Kinder.',
          'Barra entera de chocolate Kinder Bueno crocante.',
          'Shot de café espresso para equilibrar dulzor.',
          'Crema batida fresca y lluvia de trocitos de oblea con chocolate.',
          'Salsa tibia de avellana derretida al servir.'
        ],
        alergenos: ['Lácteos', 'Avellana', 'Gluten']
      },
      {
        slug: 'frappe-mazapan', cat: 'frappes', nombre: 'Frappé Mazapán Artesanal Duranguense', nombre_corto: 'MAZAPÁN ARTESANAL',
        etiqueta: 'Sabor Mexicano', porcion: '16 oz', precio: 85, calorias: 390, color: '#E0BC83',
        descripcion: 'Cremoso frappé con dos piezas completas de mazapán tradicional, leche evaporada, canela y toque de miel de mezquite.',
        imagen: '/images/Menu/vaso-principal.png', badge: 'AGOTADO TEMPORAL', stock: 0, vendidos: 12, prep: 5, disponible: 0,
        ingredientes: [
          'Dos piezas completas de mazapán de cacahuate artesanal.',
          'Toque sutil de canela de Ceilán molida.',
          'Base láctea cremosa con leche condensada.',
          'Corona de crema chantilly con cacahuates tostados triturados.',
          'Medio mazapán coronando la copa.'
        ],
        alergenos: ['Lácteos', 'Cacahuate']
      },
      {
        slug: 'frappe-moka', cat: 'frappes', nombre: 'Frappé Moka Avellana & Caramelo', nombre_corto: 'MOKA AVELLANA',
        etiqueta: 'Frappé de Autor', porcion: '16 oz', precio: 98, calorias: 410, color: '#C6A686',
        descripcion: 'Doble espresso chiapaneco con crema de avellanas tostadas, cacao belga, chantilly de la casa y drizzle de chocolate.',
        imagen: '/images/Menu/vaso-cafe.png', badge: 'TOP SELLER', stock: 50, vendidos: 26, prep: 5,
        ingredientes: [
          'Doble shot de espresso chiapaneco 100% Arábica de especialidad.',
          'Crema artesanal de avellanas tostadas y cacao belga.',
          'Leche entera o deslactosada al vapor frío con textura frappeada.',
          'Corona abundante de crema chantilly batida en casa.',
          'Drizzle espeso de chocolate fundido y jarabe de avellana silvestre.',
          'Topping crujiente de barquillo de canela.'
        ],
        alergenos: ['Lácteos', 'Avellana', 'Gluten']
      },
      {
        slug: 'frappe-fresa-dubai', cat: 'frappes', nombre: 'Frappé Fresa Estilo Dubái con Pistache & Kataifi', nombre_corto: 'FRESA DUBÁI',
        etiqueta: 'Edición Especial Dubái', porcion: '16 oz', precio: 145, calorias: 430, color: '#F48B89',
        descripcion: 'Fresas machacadas al momento con crema de pistache siciliano, kataifi dorado en mantequilla y chocolate semi-amargo.',
        imagen: '/images/Menu/vaso-principal.png', badge: 'TENDENCIA DUBÁI', stock: 40, vendidos: 18, prep: 6,
        ingredientes: [
          'Fresas orgánicas frescas machacadas al momento con toque cítrico.',
          'Crema untuosa de pistache siciliano puro 100% importado.',
          'Lluvia crocante de pasta kataifi dorada lentamente en mantequilla.',
          'Chocolate semi-amargo derretido en las paredes del vaso.',
          'Crema chantilly montada con pistache molido espolvoreado.',
          'Topping de fresa natural entera bañada en chocolate.'
        ],
        alergenos: ['Lácteos', 'Pistache', 'Gluten']
      },
      {
        slug: 'frappe-velvet-lavanda', cat: 'frappes', nombre: 'Frappé Velvet Lavanda & Frutos del Bosque', nombre_corto: 'VELVET LAVANDA',
        etiqueta: 'Coctelería Lúdica de Sala', porcion: '16 oz', precio: 105, calorias: 340, color: '#BFA5E5',
        descripcion: 'Infusión de lavanda francesa con coulis de moras silvestres, base cremosa de taro y perlas explosivas de fruta.',
        imagen: '/images/Menu/vaso-morado.png', badge: 'NUEVO', stock: 35, vendidos: 9, prep: 6,
        ingredientes: [
          'Infusión artesanal de flores de lavanda francesa orgánica.',
          'Coulis concentrado de moras silvestres, zarzamora y frambuesa.',
          'Base cremosa de taro dulce y leche a elegir.',
          'Perlas explosivas de fruta natural con jugo de moras.',
          'Crema chantilly ligera con toques de pétalos comestibles.',
          'Toque de menta fresca perfumada al momento.'
        ],
        alergenos: ['Lácteos']
      },
      {
        slug: 'cold-brew-tonic-romero', cat: 'especialidad', nombre: 'Cold Brew Tonic con Romero & Naranja', nombre_corto: 'COLD BREW TONIC',
        etiqueta: 'Autor Marfil', porcion: '14 oz', precio: 78,
        descripcion: 'Extracción en frío durante 18 horas de café Chiapas arábica, agua tónica premium, rodaja de naranja deshidratada y romero flameado.',
        imagen: '/images/specialty_coffee.jpg', badge: 'AUTOR MARFIL', stock: 30, vendidos: 19, prep: 4, destacado: 1
      },
      {
        slug: 'flat-white-chiapas', cat: 'especialidad', nombre: 'Flat White Chiapas 100% Arábica', nombre_corto: 'FLAT WHITE',
        etiqueta: 'Café de Especialidad', porcion: '8 oz (Doble Ristretto)', precio: 65,
        descripcion: 'Doble ristretto de café de especialidad de origen Chiapas con microespuma sedosa de leche entera pasteurizada localmente.',
        imagen: '/images/marfil_latte_art.jpg', badge: 'ESPECIALIDAD', stock: 80, vendidos: 36, prep: 3,
        alergenos: ['Lácteos']
      },
      {
        slug: 'fresas-estilo-dubai', cat: 'postres', nombre: 'Fresas Estilo Dubái con Pistache & Kataifi', nombre_corto: 'FRESAS DUBÁI',
        etiqueta: 'Indulgencia Dulce', porcion: 'Copa Doble', precio: 145,
        descripcion: 'Fresas seleccionadas bañadas en crema pura de pistache siciliano, chocolate belga fundido y lluvia de pasta kataifi tostada.',
        imagen: '/images/marfil_dubai_pistache.jpg', badge: 'TENDENCIA DUBÁI', stock: 50, vendidos: 34, prep: 6, destacado: 1,
        alergenos: ['Lácteos', 'Pistache', 'Gluten']
      },
      {
        slug: 'shot-mezcal-nombre-de-dios', cat: 'bar', nombre: 'Shot de Mezcal de Nombre de Dios con Naranja', nombre_corto: 'MEZCAL',
        etiqueta: 'Local Durango', porcion: '1.5 oz', precio: 75,
        descripcion: 'Mezcal artesanal 100% de agave cenizo producido en Nombre de Dios, Durango. Servido con gajos de naranja y sal de gusano.',
        imagen: '/images/live_music.jpg', badge: 'LOCAL DURANGO', stock: 40, vendidos: 15, prep: 2
      }
    ];
    for (const p of productos) {
      await insertar('productos', {
        slug: p.slug,
        nombre: p.nombre,
        nombre_corto: p.nombre_corto,
        categoria_id: categoria[p.cat],
        etiqueta: p.etiqueta,
        descripcion: p.descripcion,
        porcion: p.porcion,
        precio: p.precio,
        imagen: p.imagen,
        badge: p.badge,
        calorias: p.calorias ?? null,
        color_card: p.color ?? null,
        ingredientes: json(p.ingredientes ?? []),
        alergenos: json(p.alergenos ?? []),
        disponible: p.disponible ?? 1,
        stock_diario: p.stock,
        vendidos_hoy: p.vendidos,
        tiempo_prep_min: p.prep,
        destacado: p.destacado ?? 0,
        creado_en: ahoraISO
      });
    }

    // ----------------------------------------------------------------------
    // Clientes del Club Marfil (Sofía Navarro es la cuenta demo de la PWA)
    // ----------------------------------------------------------------------

    const cliente = {};
    for (const c of [
      { clave: 'paola', codigo: 'MF-CLUB-77312', nombre: 'Paola Santillán', telefono: '618-912-3344', sellos: 7, puntos: 420, visitas: 23, ultima: hace(120), habitual: PORRAS },
      { clave: 'fernando', codigo: 'MF-CLUB-88410', nombre: 'Fernando Quiñones', telefono: '618-456-7890', sellos: 8, puntos: 510, visitas: 16, ultima: hace(22 * 60), habitual: CALVARIO },
      { clave: 'mariana', codigo: 'MF-CLUB-33109', nombre: 'Mariana Corrales', telefono: '618-234-5678', sellos: 3, puntos: 120, visitas: 4, ultima: haceDias(5), habitual: CALVARIO },
      {
        clave: 'sofia', codigo: 'MF-CLUB-51420', nombre: 'Sofía Navarro Morales', telefono: '(618) 154-8920',
        email: 'sofia.navarro@gmail.com', ciudad: 'Durango, Dgo.', sellos: 6, puntos: 380, visitas: 14, ultima: haceDias(3), habitual: PORRAS,
        preferencias: {
          platilloFavorito: 'Chilaquiles con boneless verdes',
          frappeFavorito: 'Frappé Kinder Bueno 16oz',
          bebidaFavorita: 'Flat White 12oz',
          lechePreferida: 'Leche de avena'
        }
      }
    ]) {
      cliente[c.clave] = await insertar('clientes', {
        codigo_club: c.codigo,
        nombre: c.nombre,
        email: c.email ?? null,
        telefono: c.telefono,
        password_hash: c.email ? passwordHash : null,
        ciudad: c.ciudad ?? null,
        sellos_actuales: c.sellos,
        puntos: c.puntos,
        visitas_totales: c.visitas,
        ultima_visita: c.ultima,
        sucursal_habitual_id: c.habitual,
        preferencias: json(c.preferencias ?? {}),
        creado_en: haceDias(150)
      });
      // Historial de sellos: una visita por renglón, la última coincide con ultima_visita.
      for (let i = 0; i < c.visitas; i += 1) {
        await insertar('movimientos_club', {
          cliente_id: cliente[c.clave],
          tipo: 'sello',
          sellos: 1,
          puntos: 50,
          descripcion: 'Sello por visita',
          sucursal_id: c.habitual,
          personal_id: persona.valeria,
          creado_en: i === 0 ? c.ultima : new Date(new Date(c.ultima).getTime() - entero(1, 120) * DIA).toISOString()
        });
      }
    }

    for (const b of [
      { cliente: 'sofia', codigo: 'MF-FRAPPE-992', titulo: 'Frappé de Confitería Gratis (16oz)', subtitulo: 'A elegir: Kinder Bueno, Moka Avellana, Fresa Dubái o Mazapán', icono: 'Sparkles', vence: sumarDias(hoy, 14) },
      { cliente: 'sofia', codigo: 'MF-MAMUT-418', titulo: 'Mollete Mamut con 50% de Descuento', subtitulo: 'Aplica en tu siguiente visita a Café Marfil', icono: 'Utensils', vence: sumarDias(hoy, 45) },
      { cliente: 'sofia', codigo: 'MF-LUDO-880', titulo: 'Pase Prioritario a Noche de Juegos de Mesa', subtitulo: 'Entrada y mesa asegurada sin costo de ludoteca', icono: 'Dices', usado: haceDias(20) },
      { cliente: 'fernando', codigo: 'MF-DUBAI-410', titulo: 'Copa Doble de Fresas Estilo Dubái GRATIS', subtitulo: 'Premio por completar tus 8 sellos de visita', icono: 'Gift', origen: 'sellos' }
    ]) {
      await insertar('beneficios', {
        cliente_id: cliente[b.cliente],
        codigo: b.codigo,
        titulo: b.titulo,
        subtitulo: b.subtitulo,
        icono: b.icono,
        origen: b.origen ?? 'manual',
        estado: b.usado ? 'usado' : 'disponible',
        vence_en: b.vence ?? null,
        usado_en: b.usado ?? null,
        creado_en: haceDias(25)
      });
    }

    // ----------------------------------------------------------------------
    // Mesas
    // ----------------------------------------------------------------------

    const mesa = {}; // 'P-M01' -> { id, capacidad }
    const definirMesas = async (prefijo, sucursal, filas) => {
      for (const [numero, zonaNombre, capacidad, forma, notas] of filas) {
        const id = await insertar('mesas', {
          sucursal_id: sucursal, zona_id: zona[zonaNombre], numero, capacidad, forma, notas: notas ?? null
        });
        mesa[`${prefijo}-${numero}`] = { id, capacidad };
      }
    };
    await definirMesas('P', PORRAS, [
      ['M01', 'Salón Principal', 2, 'squircle'],
      ['M02', 'Salón Principal', 4, 'squircle'],
      ['M03', 'Salón Principal', 4, 'circle'],
      ['M04', 'Salón Principal', 6, 'rectangle_horizontal'],
      ['M05', 'Terraza Colonial', 2, 'circle', 'Zona pet friendly'],
      ['M06', 'Terraza Colonial', 4, 'squircle'],
      ['M07', 'Terraza Colonial', 4, 'circle', 'Excelente vista a fuente colonial'],
      ['M08', 'Terraza Colonial', 8, 'rectangle_horizontal'],
      ['L01', 'Ludoteca & Juegos', 4, 'squircle'],
      ['L02', 'Ludoteca & Juegos', 6, 'rectangle_vertical'],
      ['L03', 'Ludoteca & Juegos', 4, 'squircle', 'Mesa con tapete de fieltro para cartas'],
      ['L04', 'Ludoteca & Juegos', 8, 'rectangle_horizontal']
    ]);
    await definirMesas('C', CALVARIO, [
      ['M01', 'Salón Acogedor', 2, 'circle'],
      ['M02', 'Salón Acogedor', 4, 'squircle'],
      ['M03', 'Barra Express & Sala', 4, 'squircle'],
      ['M04', 'Barra Express & Sala', 6, 'rectangle_horizontal', 'Mesa comunal de madera']
    ]);

    // ----------------------------------------------------------------------
    // Actividades (fechas relativas a hoy)
    // ----------------------------------------------------------------------

    const actividad = {};
    const actividades = [
      {
        slug: 'noche-cine', nombre: 'Noche de Cine & Proyección Especial', categoria: 'Cine & Proyecciones', cat: 'cine',
        sucursal: PORRAS, enDias: 2, horas: ['20:00', '23:00'], duracion: '3 horas', imagen: '/images/live_music.jpg',
        cupo: 40, ocupados: 28, precio: 80,
        resumen: 'Proyección en pantalla grande con snacks y bebidas de la barra. Películas de culto, estrenos indie y ciclos temáticos en un ambiente único.',
        descripcion: 'Disfruta del cine en la terraza superior de Café Marfil Porras. Cada sesión incluye una selección curada de películas —desde clásicos de culto hasta estrenos indie— acompañadas de nuestra barra completa de frappés, bebidas artesanales y snacks de la cocina.',
        incluye: ['Proyección en pantalla grande', 'Snack de bienvenida', 'Acceso a barra completa'],
        requisitos: 'Apto para todas las edades según la película. Consumo mínimo recomendado.'
      },
      {
        slug: 'glow-paint', nombre: 'Glow & Paint: Pintura Neón con Luz Negra', categoria: 'Talleres Creativos', cat: 'talleres',
        sucursal: CALVARIO, enDias: 3, horas: ['19:00', '22:00'], duracion: '3 horas', imagen: '/images/marfil_latte_art.jpg',
        cupo: 20, ocupados: 16, precio: 250,
        resumen: 'Pinta un cuadro con pinturas neón que brillan bajo luz negra, con música, snacks y bebidas incluidas. Sin experiencia necesaria.',
        descripcion: 'Una noche creativa y luminosa: pinturas fluorescentes, luz negra ambiental y música de fondo para que expreses tu lado artístico. Recibirás tu lienzo, pinceles y pinturas neón. Incluye snacks y una bebida de la barra Marfil.',
        incluye: ['Lienzo, pinceles y pinturas neón', 'Una bebida de la barra incluida', 'Snacks durante la sesión', 'Te llevas tu obra terminada'],
        requisitos: 'No se requiere experiencia previa. Ropa cómoda recomendada (las pinturas pueden manchar).'
      },
      {
        slug: 'pinta-planta-florece', nombre: 'Pinta, Planta y Florece', categoria: 'Talleres Creativos', cat: 'talleres',
        sucursal: CALVARIO, enDias: 4, horas: ['11:00', '13:30'], duracion: '2.5 horas', imagen: '/images/marfil_dubai_pistache.jpg',
        cupo: 16, ocupados: 10, precio: 220,
        resumen: 'Decora y pinta tu propia maceta de barro y al terminar te llevas una planta o flores de temporada. Un taller relajante con café y desayuno.',
        descripcion: 'Un taller matutino y creativo: recibirás una maceta de barro virgen, pinturas acrílicas y todo el material para personalizarla. Al concluir, elige una planta de temporada o un ramo de flores para llevarte a casa. Incluye café de especialidad y un desayuno ligero.',
        incluye: ['Maceta de barro y materiales de pintura', 'Planta o flores para llevar', 'Café de especialidad y desayuno ligero'],
        requisitos: 'Apto para todas las edades. Perfecto para ir en pareja, con amigas o en familia.'
      },
      {
        slug: 'cafe-y-tinta', nombre: 'Café y Tinta: Flash Tattoos & Música en Vivo', categoria: 'Talleres Creativos', cat: 'talleres',
        sucursal: PORRAS, enDias: 9, horas: ['19:00', '23:00'], duracion: '4 horas', imagen: '/images/marfil_hero_cup.jpg',
        cupo: 30, ocupados: 22, precio: 100, precioTexto: 'Consumo mínimo $100',
        resumen: 'Música en vivo, bebidas artesanales y sesiones de flash tattoos con artistas locales de Durango. Una noche de arte, café y adrenalina.',
        descripcion: 'La noche más cool de Marfil: artistas del tatuaje locales ofrecen diseños flash a precio fijo mientras disfrutas de música acústica en vivo y la barra completa de bebidas. Agenda tu turno al llegar o aparta el tuyo por adelantado.',
        incluye: ['Música en vivo toda la noche', 'Acceso a barra completa', 'Flash tattoos disponibles por separado'],
        requisitos: 'Mayores de 18 años para tatuajes. Consumo mínimo de $100 MXN en barra.'
      },
      {
        slug: 'musica-en-vivo', nombre: 'Sesión Acústica en Vivo', categoria: 'Música en Vivo', cat: 'musica',
        sucursal: PORRAS, enDias: 10, horas: ['20:00', '22:30'], duracion: '2.5 horas', imagen: '/images/live_music.jpg',
        cupo: 50, ocupados: 38, precio: 0, gratis: 1,
        resumen: 'Cantautores y ensambles locales de Durango en la terraza de Marfil Porras. Pizzas de masa madre, mezcal artesanal y buenas vibras.',
        descripcion: 'Las noches de música en vivo son parte del alma de Café Marfil. Disfruta de cantautores y ensambles acústicos locales en nuestra terraza superior, acompañado de pizzas recién horneadas, cócteles de café y mezcal artesanal de Nombre de Dios, Durango.',
        incluye: ['Concierto acústico en vivo', 'Mesa asegurada con reservación'],
        requisitos: 'Consumo de alimentos o bebidas. Se recomienda reservar con anticipación.'
      },
      {
        slug: 'juegos-de-mesa', nombre: 'Tarde & Noche de Juegos de Mesa', categoria: 'Juegos de Mesa', cat: 'juegos',
        sucursal: PORRAS, fechaTexto: 'Todos los días', horas: ['12:00', '23:00'], duracion: 'Sin límite de tiempo', imagen: '/images/board_games.jpg',
        cupo: 60, precio: 0, gratis: 1, precioTexto: 'Acceso con consumo',
        resumen: 'Más de 60 juegos de mesa disponibles para pasar el rato con amigos mientras consumes. Catan, Dixit, Dobble, UNO y muchos más.',
        descripcion: 'Nuestra ludoteca está disponible todos los días para que vengas con amigos, pareja o familia. Elige entre más de 60 títulos: juegos de estrategia, de fiesta, cooperativos y clásicos. Un anfitrión puede explicarte las reglas si es tu primera vez.',
        incluye: ['+60 juegos de mesa disponibles', 'Anfitrión disponible para explicar reglas', 'Sin límite de tiempo con tu consumo'],
        requisitos: 'Consumo mínimo en alimentos o bebidas para acceder a la ludoteca.'
      },
      {
        slug: 'casitas-jengibre', nombre: 'Arma tu Casita Navideña de Jengibre', categoria: 'Actividad de Temporada', cat: 'temporada',
        sucursal: CALVARIO, fechaTexto: 'Temporada navideña', horarioTexto: 'Por confirmar', duracion: '2 horas', imagen: '/images/marfil_caramel_ribbon.jpg',
        cupo: 18, precio: 0, precioTexto: 'Por confirmar',
        resumen: 'Arma y decora tu propia casita navideña de jengibre con glaseado, dulces y chocolates. La actividad perfecta para llevar a los pequeños.',
        descripcion: 'Una tradición navideña en Café Marfil: cada año abrimos inscripciones para armar y decorar casitas de jengibre con toda la familia. Incluye la casita pre-horneada, glaseado real, dulces surtidos y chocolates para decorar. ¡Te la llevas a casa!',
        incluye: ['Casita de jengibre pre-horneada', 'Glaseado y dulces de decoración', 'Bebida caliente de temporada incluida', 'Te llevas tu casita terminada'],
        requisitos: 'Apto para todas las edades. Disponible solo en temporada navideña (diciembre).'
      },
      {
        slug: 'eventos-privados', nombre: 'Eventos Privados: Cumpleaños & Celebraciones', categoria: 'Eventos Privados', cat: 'privados',
        sucursal: CALVARIO, fechaTexto: 'Todo el año — Bajo reservación', horarioTexto: 'A convenir', duracion: 'Según el evento', imagen: '/images/sucursal_calvario.png',
        cupo: 60, precio: 0, precioTexto: 'Cotización personalizada',
        resumen: 'Reserva el espacio de la sucursal Calvario para cumpleaños, reuniones familiares y celebraciones privadas con menú y barra exclusiva.',
        descripcion: 'La Sucursal Calvario ofrece la posibilidad de reservar el salón completo o una sección para eventos privados: cumpleaños, reuniones de empresa, baby showers, despedidas y más. Coordinamos menú personalizado, decoración y música para tu evento.',
        incluye: ['Espacio privado o semi-privado', 'Menú personalizado', 'Coordinación de decoración', 'Barra de bebidas dedicada'],
        requisitos: 'Reservación con mínimo 5 días de anticipación. Sujeto a disponibilidad de fecha.'
      }
    ];
    for (const a of actividades) {
      const fecha = a.enDias !== undefined ? sumarDias(hoy, a.enDias) : null;
      actividad[a.slug] = await insertar('actividades', {
        slug: a.slug,
        nombre: a.nombre,
        categoria: a.categoria,
        categoria_slug: a.cat,
        sucursal_id: a.sucursal,
        fecha,
        fecha_texto: a.fechaTexto ?? null,
        hora_inicio: a.horas?.[0] ?? null,
        hora_fin: a.horas?.[1] ?? null,
        horario_texto: a.horarioTexto ?? null,
        duracion: a.duracion,
        imagen: a.imagen,
        resumen: a.resumen,
        descripcion: a.descripcion,
        cupo_total: a.cupo,
        precio: a.precio,
        precio_texto: a.precioTexto ?? null,
        es_gratis: a.gratis ?? 0,
        incluye: json(a.incluye),
        requisitos: a.requisitos,
        creado_en: ahoraISO
      });
    }

    // ----------------------------------------------------------------------
    // Reservaciones y servicio en sala
    // ----------------------------------------------------------------------

    const foliosUsados = new Set();
    const folioNuevo = () => {
      let folio;
      do folio = `MF-RES-${entero(10000, 99999)}`;
      while (foliosUsados.has(folio));
      foliosUsados.add(folio);
      return folio;
    };

    const reservar = async (r) => {
      foliosUsados.add(r.folio);
      return await insertar('reservaciones', {
        folio: r.folio,
        token_qr: generarTokenQR(),
        cliente_id: r.cliente ?? null,
        nombre_contacto: r.comensal,
        telefono_contacto: r.telefono,
        email_contacto: r.email ?? null,
        sucursal_id: r.sucursal,
        mesa_id: r.mesa ? mesa[r.mesa].id : null,
        actividad_id: r.actividad ?? null,
        tipo: r.tipo ?? 'mesa',
        tipo_nombre: r.tipoNombre ?? null,
        fecha: r.fecha ?? hoy,
        hora: r.hora,
        personas: r.personas,
        estado: r.estado,
        notas: r.notas ?? null,
        origen: r.origen ?? 'app',
        registrada_por: r.origen === 'host' ? persona.valeria : null,
        creado_en: r.creado ?? haceDias(2),
        actualizado_en: ahoraISO
      });
    };

    /** Servicio de mesa. Sin `finHace` queda abierto y la mesa pasa a ocupada. */
    const sentar = async ({ mesa: clave, reservacion = null, comensal, personas, notas = null, ticket = null, inicioHace, finHace, mesero = null }) => {
      await insertar('servicios_mesa', {
        mesa_id: mesa[clave].id,
        reservacion_id: reservacion,
        comensal,
        personas,
        notas,
        ticket_total: ticket,
        atendido_por: mesero,
        inicio: hace(inicioHace),
        fin: finHace === undefined ? null : hace(finHace)
      });
      if (finHace === undefined) await db.ejecutar("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesa[clave].id]);
    };

    // Reservaciones de hoy que ya están en sala: reservación + servicio abierto.
    for (const r of [
      { folio: 'MF-RES-88219', comensal: 'Andrea Garza', telefono: '618-123-4567', email: 'andrea.garza@gmail.com', sucursal: PORRAS, mesa: 'P-M01', personas: 2, tipoNombre: 'Desayuno & Brunch', notas: 'Celebran aniversario de novios. Solicitaron mesa con luz natural.', minutos: 42, ticket: 425, mesero: persona.valeria },
      { folio: 'MF-RES-66231', comensal: 'Javier Domínguez', telefono: '618-333-2211', email: 'javier.d@gmail.com', sucursal: PORRAS, mesa: 'P-L01', personas: 4, tipo: 'juegos', tipoNombre: 'Tarde de Juegos con Anfitrión', notas: 'Solicitaron asesoría para Catan y Carcassonne.', minutos: 95, ticket: 540, mesero: persona.alejandro },
      { folio: 'MF-RES-88301', comensal: 'Mariana Soto', telefono: '618-444-9988', email: 'mariana.soto@live.com', sucursal: PORRAS, mesa: 'P-L02', personas: 5, tipo: 'juegos', tipoNombre: 'Tarde de Juegos con Anfitrión', notas: 'Grupo escolar de preparatoria. Consumo libre.', minutos: 50, ticket: 710, mesero: persona.alejandro },
      { folio: 'MF-RES-77190', comensal: 'Grupo Arquitectura Durango', telefono: '618-555-7766', email: 'contacto@arquidurango.com', sucursal: PORRAS, mesa: 'P-M08', personas: 7, tipoNombre: 'Reunión / Desayuno', notas: 'Requieren factura electrónica y mesa con enchufes para laptops.', minutos: 80, ticket: 1450, mesero: persona.sofia },
      { folio: 'MF-RES-55102', comensal: 'Diana Luna', telefono: '618-222-3344', email: 'diana.luna@gmail.com', sucursal: CALVARIO, mesa: 'C-M03', personas: 3, tipoNombre: 'Café & Dulce Dubái', notas: 'Quieren probar las Fresas Dubái con pistache.', minutos: 40, ticket: 460, mesero: persona.camila },
      { folio: 'MF-RES-44319', comensal: 'Rodrigo Peña', telefono: '618-777-1122', email: 'rodrigo.p@yahoo.com', sucursal: CALVARIO, mesa: 'C-M02', personas: 4, tipoNombre: 'Brunch en Terraza', notas: 'Vienen con niños pequeños, solicitan sillita periquera.', minutos: 55, ticket: 620, mesero: persona.camila }
    ]) {
      const inicio = hace(r.minutos);
      const id = await reservar({ ...r, estado: 'en_curso', fecha: fechaLocal(new Date(inicio)), hora: horaDe(inicio) });
      await sentar({ mesa: r.mesa, reservacion: id, comensal: r.comensal, personas: r.personas, notas: r.notas, ticket: r.ticket, inicioHace: r.minutos, mesero: r.mesero });
    }

    // Reservaciones de hoy que aún no llegan (sus mesas se verán "reservadas").
    await reservar({ folio: 'MF-RES-90142', comensal: 'Familia Rivas', telefono: '618-876-5432', email: 'rivas.fam@outlook.com', sucursal: PORRAS, mesa: 'P-M04', personas: 5, tipoNombre: 'Desayuno & Brunch', estado: 'confirmada', hora: horaHoyEn(45), notas: 'Cumpleaños número 30. Traen pastel propio, solicitan apoyo de velitas.' });
    await reservar({ folio: 'MF-RES-99441', comensal: 'Torneo Exploding Kittens', telefono: '618-999-0011', email: 'torneos@cafemarfil.mx', sucursal: PORRAS, mesa: 'P-L04', personas: 8, tipo: 'juegos', tipoNombre: 'Torneo Oficial de Ludoteca', estado: 'confirmada', hora: horaHoyEn(420), origen: 'host', notas: 'Mesa reservada para finalistas del torneo.' });

    // Una que ya terminó y una que no llegó.
    const lucia = await reservar({ folio: 'MF-RES-31298', comensal: 'Lucía Benítez', telefono: '618-888-6655', email: 'lucia.b@gmail.com', sucursal: PORRAS, mesa: 'P-M05', personas: 2, tipoNombre: 'Desayuno Temprano', estado: 'asistida', fecha: fechaLocal(new Date(hace(150))), hora: horaDe(hace(150)), notas: 'Pagado con tarjeta.' });
    await sentar({ mesa: 'P-M05', reservacion: lucia, comensal: 'Lucía Benítez', personas: 2, ticket: 360, inicioHace: 150, finHace: 75, mesero: persona.valeria });
    await reservar({ folio: 'MF-RES-20944', comensal: 'Gerardo Villalobos', telefono: '618-111-9900', email: 'gerardo.v@gmail.com', sucursal: PORRAS, personas: 4, tipoNombre: 'Desayuno Monumental', estado: 'no_show', fecha: fechaLocal(new Date(hace(120))), hora: horaDe(hace(120)), notas: 'Pasaron más de 20 minutos de tolerancia sin llamada de aviso.' });

    // Walk-ins en sala y una mesa recién desocupada (queda en limpieza).
    await sentar({ mesa: 'P-M02', comensal: 'Carlos Mendoza', personas: 3, notas: 'Walk-in directo. Pidieron Mollete Mamut.', ticket: 680, inicioHace: 65, mesero: persona.valeria });
    await sentar({ mesa: 'P-M05', comensal: 'Valeria & Daniel', personas: 2, notas: 'Pet friendly con perro beagle.', ticket: 290, inicioHace: 25, mesero: persona.valeria });
    await sentar({ mesa: 'C-M01', comensal: 'Esteban Ortiz', personas: 1, notas: 'Coworking con laptop.', ticket: 180, inicioHace: 35, mesero: persona.camila });
    await sentar({ mesa: 'P-M06', comensal: 'Familia Ontiveros', personas: 3, ticket: 510, inicioHace: 70, finHace: 5, mesero: persona.valeria });
    await db.ejecutar("UPDATE mesas SET estado = 'limpieza' WHERE id = ?", [mesa['P-M06'].id]);

    // Reservaciones de la cuenta demo de la PWA: una próxima y una histórica.
    await reservar({ folio: 'MF-RES-84920', cliente: cliente.sofia, comensal: 'Sofía Navarro Morales', telefono: '(618) 154-8920', email: 'sofia.navarro@gmail.com', sucursal: PORRAS, personas: 4, tipo: 'juegos', estado: 'confirmada', fecha: sumarDias(hoy, 1), hora: '19:30', creado: hace(120), notas: 'Queremos mesa cerca de la ludoteca. Pediremos combo Mamut y frappés.' });
    await reservar({ folio: 'MF-RES-73190', cliente: cliente.sofia, comensal: 'Sofía Navarro Morales', telefono: '(618) 154-8920', email: 'sofia.navarro@gmail.com', sucursal: CALVARIO, personas: 2, tipoNombre: 'Desayunos & Degustación All-Day', estado: 'asistida', fecha: sumarDias(hoy, -28), hora: '11:00', creado: haceDias(32), notas: 'Celebración de cumpleaños de mi amiga.' });

    // Afluencia de hoy antes de lo anterior: walk-ins ya cerrados, hora por hora,
    // para que el dashboard tenga ventas y distribución horaria que mostrar.
    const AFLUENCIA = { 8: 0.3, 9: 0.55, 10: 0.85, 11: 0.75, 12: 0.45, 13: 0.5, 14: 0.7, 15: 0.5, 16: 0.35, 17: 0.6, 18: 0.7, 19: 0.8, 20: 0.65, 21: 0.5, 22: 0.3 };
    const limite = ahora.getTime() - 160 * MINUTO; // no encimarse con los servicios de arriba
    const meseros = [persona.valeria, persona.sofia, persona.camila];
    for (const [hora, probabilidad] of Object.entries(AFLUENCIA)) {
      const inicioHora = instanteLocal(hoy, `${dos(hora)}:00`).getTime();
      if (inicioHora + 60 * MINUTO > limite) break;
      for (const { id, capacidad } of Object.values(mesa)) {
        if (azar() > probabilidad) continue;
        const personas = entero(1, capacidad);
        const inicio = inicioHora + entero(0, 10) * MINUTO;
        await insertar('servicios_mesa', {
          mesa_id: id,
          comensal: 'Comensal Walk-in',
          personas,
          ticket_total: personas * entero(15, 23) * 10,
          atendido_por: elegir(meseros),
          inicio: new Date(inicio).toISOString(),
          fin: new Date(inicio + entero(35, 48) * MINUTO).toISOString()
        });
      }
    }

    // Lugares ya apartados en las actividades con fecha: grupos pequeños de invitados.
    const NOMBRES = ['Daniela', 'Luis', 'Fernanda', 'Jorge', 'Ximena', 'Ricardo', 'Karla', 'Emilio', 'Regina', 'Hugo', 'Natalia', 'Iván'];
    const APELLIDOS = ['Soto', 'Ávila', 'Gallegos', 'Rentería', 'Favela', 'Nájera', 'Cisneros', 'Meraz', 'Unzueta', 'Salas'];
    for (const a of actividades) {
      let restantes = a.ocupados ?? 0;
      while (restantes > 0) {
        const personas = Math.min(restantes, entero(1, 4));
        restantes -= personas;
        await reservar({
          folio: folioNuevo(),
          comensal: `${elegir(NOMBRES)} ${elegir(APELLIDOS)}`,
          telefono: `618-${entero(100, 999)}-${entero(1000, 9999)}`,
          sucursal: a.sucursal,
          actividad: actividad[a.slug],
          tipo: 'actividad',
          personas,
          estado: 'confirmada',
          fecha: sumarDias(hoy, a.enDias),
          hora: a.horas[0],
          creado: haceDias(entero(1, 6))
        });
      }
    }

    // ----------------------------------------------------------------------
    // Promociones y canjes de hoy
    // ----------------------------------------------------------------------

    const AMBAS = [PORRAS, CALVARIO];
    const promociones = [
      {
        codigo: 'MF-PROMO-2X1', titulo: 'Jueves 2x1 en Frappés de Confitería', categoria: 'Frappés & Indulgencia', slug: 'temporada',
        badge: '2x1 JUEVES', beneficio: 'Segundo frappé de igual o menor precio totalmente gratis',
        descripcion: 'Pide tu frappé favorito de Kinder Bueno, Moka Avellana, Fresa Dubái o Mazapán y el segundo va por nuestra cuenta.',
        vigencia: 'Válido todos los jueves de 4:00 PM a 8:00 PM', imagen: '/images/dubai_frappes.jpg', limite: 50, canjes: 19, sucursales: AMBAS,
        condiciones: ['Válido exclusivamente los días jueves de 4:00 PM a 8:00 PM.', 'Aplica en toda la línea de frappés de confitería de 16 oz.', 'La segunda bebida es de igual o menor precio.'],
        comoUsar: 'Genera tu código digital y muéstralo al barista antes de cerrar tu orden.'
      },
      {
        codigo: 'MF-PROMO-DUBAI', titulo: 'Combo Tarde Dubái: Fresas + Cold Brew', categoria: 'Postres & Especialidad', slug: 'mes',
        badge: '20% OFF', beneficio: 'Fresas Estilo Dubái + Cold Brew Tonic por solo $179 MXN (antes $223)',
        descripcion: 'La dupla de la tarde: copa doble de Fresas Estilo Dubái y un Cold Brew Tonic con romero a precio de combo.',
        vigencia: 'Válido lunes a viernes de 3:00 PM a 7:00 PM', imagen: '/images/marfil_dubai_pistache.jpg', limite: 35, canjes: 14, sucursales: AMBAS,
        condiciones: ['Sujeto a disponibilidad diaria de pasta kataifi artesanal.', 'No acumulable con otras promociones.'],
        comoUsar: 'Muestra tu QR al ordenar tu postre en mostrador.'
      },
      {
        codigo: 'MF-PROMO-BRUNCH', titulo: 'Brunch Amigos: Chilaquiles + Café Refill', categoria: 'Brunch & Desayunos', slug: 'mes',
        badge: 'COMBO ESPECIAL', beneficio: 'Chilaquiles con Boneless + refill ilimitado de café americano Chiapas',
        descripcion: 'Arranca el día con chilaquiles con boneless y café americano de Chiapas con refill ilimitado.',
        vigencia: 'Válido todos los días antes de las 12:00 PM', imagen: '/images/desayunos_marfil.jpg', limite: 60, canjes: 23, sucursales: AMBAS,
        condiciones: ['Aplica solo en consumo en sucursal.', 'El refill es por persona y no se comparte.'],
        comoUsar: 'Presenta tu código al ordenar en mostrador.'
      },
      {
        codigo: 'MF-PROMO-LUDOTECA', titulo: 'Pase Grupal de Juegos: 4 Personas x $299', categoria: 'Juegos de Mesa', slug: 'sucursal',
        badge: 'AHORRO $80', beneficio: 'Acceso a ludoteca para 4 personas + 1 jarra de soda italiana + anfitrión',
        descripcion: 'Arma tu equipo de cuatro y pasen la tarde en la ludoteca con anfitrión y una jarra de soda italiana.',
        vigencia: 'Viernes y sábados a partir de las 5:00 PM', imagen: '/images/board_games.jpg', limite: 15, canjes: 6, sucursales: [PORRAS],
        condiciones: ['Válido solo en Sucursal Porras (Matriz).', 'Sujeto a disponibilidad de mesas en ludoteca.'],
        comoUsar: 'Muestra tu código al anfitrión de ludoteca al llegar.'
      },
      {
        codigo: 'MAMUTMARFIL', titulo: 'Combo Monumental: Mamut + Flat White', categoria: 'Promociones del mes', slug: 'mes',
        badge: 'COMBO $145', beneficio: 'Precio especial combo: $145 MXN (ahorras $75 MXN)',
        descripcion: 'Mollete Mamut de masa madre con costra de queso asadero duranguense y chorizo artesanal más un Flat White doble.',
        vigencia: 'Lunes a domingo de 8:00 AM a 2:00 PM', imagen: '/images/desayunos_marfil.jpg', limite: 40, canjes: 0, sucursales: AMBAS,
        condiciones: ['Aplica en consumo en sucursal y para llevar.', 'Disponible en cualquiera de nuestras dos sucursales en Durango.', 'Puedes cambiar tu Flat White por Cold Brew Tonic sin costo extra.'],
        comoUsar: 'Presiona "Mostrar cupón al barista", presenta tu código al ordenar en mostrador y disfruta tu experiencia.'
      },
      {
        codigo: 'DUBAIMARFIL', titulo: 'Lanzamiento: Fresas Dubái con Pistache 15% OFF', categoria: 'Promociones por sucursal', slug: 'sucursal',
        badge: '15% DTO', beneficio: '15% de descuento directo en cualquier copa de Fresas Estilo Dubái.',
        descripcion: 'Prueba la sensación gastronómica: fresas frescas bañadas en crema pura de pistache siciliano y pasta kataifi tostada en mantequilla.',
        vigencia: 'Válido durante todo el mes', imagen: '/images/dubai_frappes.jpg', limite: 40, canjes: 0, sucursales: AMBAS,
        condiciones: ['Válido en sucursales Porras (Matriz) y Calvario.', 'Sujeto a disponibilidad diaria de pasta kataifi artesanal.', 'Presentar código desde la aplicación web al ordenar.'],
        comoUsar: 'Muestra tu QR al ordenar tu postre en mostrador.'
      },
      {
        codigo: 'ESTUDIAMARFIL', titulo: 'Comunidad Estudiantes & Cowork Durango', categoria: 'Clientes frecuentes', slug: 'frecuentes',
        badge: '15% ALL-DAY', beneficio: 'Descuento del 15% en todo el menú de alimentos, café y ludoteca.',
        descripcion: '15% de descuento en barra de especialidad, chilaquiles con boneless y uso de ludoteca para estudiantes y docentes.',
        vigencia: 'Lunes a viernes todo el ciclo escolar', imagen: '/images/hero_cafe.jpg', limite: 80, canjes: 0, sucursales: AMBAS,
        condiciones: ['Presentar credencial vigente de estudiante o profesor.', 'Válido para consumo individual de lunes a viernes.', 'No acumulable con otras promociones o cupones.'],
        comoUsar: 'Genera el cupón y muéstralo junto con tu credencial.'
      }
    ];
    // Los canjes "de hoy" se reparten entre el inicio del día y este momento.
    const minutosDeHoy = Math.max(1, Math.floor((ahora.getTime() - instanteLocal(hoy).getTime()) / MINUTO));
    for (const p of promociones) {
      const id = await insertar('promociones', {
        codigo: p.codigo,
        titulo: p.titulo,
        categoria: p.categoria,
        categoria_slug: p.slug,
        descuento_badge: p.badge,
        beneficio: p.beneficio,
        descripcion: p.descripcion,
        vigencia: p.vigencia,
        imagen: p.imagen,
        condiciones: json(p.condiciones),
        como_usar: p.comoUsar,
        limite_diario: p.limite,
        creado_en: ahoraISO
      });
      for (const sucursal of p.sucursales) await insertar('promocion_sucursal', { promocion_id: id, sucursal_id: sucursal });
      for (let i = 0; i < p.canjes; i += 1) {
        await insertar('canjes_promocion', {
          promocion_id: id,
          sucursal_id: elegir(p.sucursales),
          personal_id: persona.valeria,
          creado_en: hace(entero(0, Math.min(minutosDeHoy, 360) - 1))
        });
      }
    }

    // ----------------------------------------------------------------------
    // Ludoteca: juegos, dos préstamos abiertos e historial del último mes
    // ----------------------------------------------------------------------

    const mesasLudoteca = ['P-L01', 'P-L02', 'P-L03', 'P-L04'];
    for (const j of [
      { nombre: 'Catan (El Juego Base)', categoria: 'Estrategia & Negociación', jugadores: '3 - 4 jugadores', duracion: '60 - 90 min', dificultad: 'Media', piezas: '100% Completo (Verificado)', jugado: 48, enMesa: 'P-L01', prestadoHace: 90 },
      { nombre: 'Dixit Odyssey', categoria: 'Creatividad & Deducción', jugadores: '3 - 12 jugadores', duracion: '30 - 45 min', dificultad: 'Fácil', piezas: '100% Completo (84 cartas)', jugado: 62, enMesa: 'P-L02', prestadoHace: 45 },
      { nombre: 'Carcassonne', categoria: 'Colocación de Losetas', jugadores: '2 - 5 jugadores', duracion: '35 - 45 min', dificultad: 'Fácil / Media', piezas: '100% Completo', jugado: 39 },
      { nombre: 'Exploding Kittens: Edición NSFW & Original', categoria: 'Party Game & Risas', jugadores: '2 - 5 jugadores', duracion: '15 min', dificultad: 'Muy Fácil', piezas: 'Faltan 2 micas protectoras', jugado: 84, reposicion: 1 },
      { nombre: 'Código Secreto (Codenames)', categoria: 'Palabras & Equipos', jugadores: '4 - 8 jugadores', duracion: '20 min', dificultad: 'Fácil', piezas: '100% Completo', jugado: 55 },
      { nombre: 'Wingspan', categoria: 'Gestión de Recursos & Motor', jugadores: '1 - 5 jugadores', duracion: '60 - 75 min', dificultad: 'Media / Alta', piezas: '100% Completo (Huevos y comederos)', jugado: 22 },
      { nombre: 'Virus! 2 Evolution', categoria: 'Cartas Rápido', jugadores: '2 - 6 jugadores', duracion: '20 min', dificultad: 'Muy Fácil', piezas: '100% Completo', jugado: 71 },
      { nombre: 'Taco Gato Queso Pizza', categoria: 'Reflejos & Caos', jugadores: '3 - 8 jugadores', duracion: '10 - 15 min', dificultad: 'Muy Fácil', piezas: '100% Completo', jugado: 93 }
    ]) {
      const id = await insertar('juegos', {
        nombre: j.nombre,
        categoria: j.categoria,
        jugadores: j.jugadores,
        duracion: j.duracion,
        dificultad: j.dificultad,
        piezas_estado: j.piezas,
        reposicion_requerida: j.reposicion ?? 0,
        sucursal_id: PORRAS,
        creado_en: haceDias(200)
      });
      const pasados = j.enMesa ? j.jugado - 1 : j.jugado;
      for (let i = 0; i < pasados; i += 1) {
        const prestado = ahora.getTime() - entero(1, 29) * DIA - entero(0, 600) * MINUTO;
        await insertar('prestamos_juego', {
          juego_id: id,
          mesa_id: mesa[elegir(mesasLudoteca)].id,
          personal_id: persona.alejandro,
          prestado_en: new Date(prestado).toISOString(),
          devuelto_en: new Date(prestado + entero(30, 120) * MINUTO).toISOString()
        });
      }
      if (j.enMesa) {
        await insertar('prestamos_juego', {
          juego_id: id, mesa_id: mesa[j.enMesa].id, personal_id: persona.alejandro, prestado_en: hace(j.prestadoHace)
        });
      }
    }

    // ----------------------------------------------------------------------
    // Notificaciones de la cuenta demo y bitácora reciente del escáner
    // ----------------------------------------------------------------------

    for (const n of [
      { titulo: '¡Mesa confirmada en Sucursal Porras!', mensaje: 'Tu reservación para 4 personas está lista para mañana a las 7:30 PM (folio MF-RES-84920). Chilaquiles y juegos esperándote.', tipo: 'reservacion', destino: 'mis_reservaciones', creado: hace(120) },
      { titulo: '¡Nuevo beneficio por tus visitas!', mensaje: 'Desbloqueaste "Frappé de Confitería Gratis (16oz)". Válido en cualquier sucursal.', tipo: 'beneficio', destino: 'beneficios', creado: haceDias(1) },
      { titulo: 'Nuevo platillo en carta: Fresas Dubái', mensaje: 'Ya puedes pedir fresas con crema pura de pistache siciliano y kataifi crocante en Porras y Calvario.', tipo: 'promo', destino: 'promociones', leida: 1, creado: haceDias(2) }
    ].reverse()) {
      await insertar('notificaciones', {
        cliente_id: cliente.sofia, titulo: n.titulo, mensaje: n.mensaje, tipo: n.tipo,
        screen_destino: n.destino, leida: n.leida ?? 0, creado_en: n.creado
      });
    }

    for (const e of [
      { codigo: 'MF-CLUB-33109', tipo: 'club', descripcion: 'Mariana Corrales · 3/8 sellos', resultado: 'Sello acreditado (+50 pts)', creado: haceDias(5) },
      { codigo: 'MF-RES-88219', tipo: 'reservacion', descripcion: 'Andrea Garza (2 personas)', resultado: 'Check-in realizado (Mesa M01)', creado: hace(42) },
      { codigo: 'MF-PROMO-2X1', tipo: 'promocion', descripcion: 'Jueves 2x1 en Frappés de Confitería', resultado: 'Descuento aplicado al ticket', creado: hace(12) }
    ]) {
      await insertar('escaneos', {
        codigo: e.codigo, tipo: e.tipo, descripcion: e.descripcion, resultado: e.resultado,
        personal_id: persona.valeria, creado_en: e.creado
      });
    }

    const resumen = {};
    for (const tabla of ['sucursales', 'personal', 'clientes', 'mesas', 'productos', 'actividades', 'reservaciones', 'servicios_mesa', 'promociones', 'juegos']) {
      resumen[tabla] = (await db.uno(`SELECT COUNT(*) AS n FROM ${tabla}`)).n;
    }
    return resumen;
  });
}
