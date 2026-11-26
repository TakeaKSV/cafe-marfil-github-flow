import React from 'react';
import { BLUEPRINT_WIDTH, BLUEPRINT_HEIGHT } from './floorPlanLayouts';

/**
 * Fondo arquitectónico SVG de alta precisión para cada piso.
 */
export const FloorPlanArchitecturalSvg = ({ variant = 'planta_baja', floorLabel }) => {
  const isPlantaBaja = variant === 'planta_baja';

  return (
    <svg
      viewBox={`0 0 ${BLUEPRINT_WIDTH} ${BLUEPRINT_HEIGHT}`}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      preserveAspectRatio="none"
      aria-label={`Plano arquitectónico ${floorLabel || ''}`}
    >
      <defs>
        {/* Cuadrícula arquitectónica sutil */}
        <pattern id="marfil-cad-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="#1F1410"
            strokeOpacity="0.045"
            strokeWidth="1"
          />
        </pattern>
        {/* Textura sutil de loseta para el patio / balcón */}
        <pattern id="marfil-patio-tile" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#FCF6F2" />
          <path
            d="M 28 0 L 0 0 0 28"
            fill="none"
            stroke="#E12927"
            strokeOpacity="0.06"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* Piso del Salón Principal */}
      <rect x="18" y="16" width="880" height="508" fill="#FFFDFB" />
      <rect x="18" y="16" width="880" height="508" fill="url(#marfil-cad-grid)" />

      {/* Piso del Patio / Balcón lateral */}
      <rect x="912" y="16" width="170" height="508" fill="url(#marfil-patio-tile)" />

      {/* =====================================================================
          MUROS ESTRUCTURALES EXTERIORES (idénticos en Planta Baja y Planta Alta)
          ===================================================================== */}
      <g fill="#5C534E" stroke="#362E2A" strokeWidth="1.2">
        {/* Muro izquierdo */}
        <rect x="0" y="0" width="18" height="540" />
        {/* Muro derecho */}
        <rect x="1082" y="0" width="18" height="540" />

        {/* Muro superior (sección izquierda más gruesa, como en el plano de referencia) */}
        <rect x="0" y="0" width="536" height="26" />
        {/* Muro superior derecho con vanos de ventanas */}
        <rect x="536" y="0" width="38" height="16" />
        <rect x="644" y="0" width="126" height="16" />
        <rect x="854" y="0" width="150" height="16" />
        <rect x="1056" y="0" width="44" height="16" />

        {/* Muro inferior con 3 ventanas + vano de puerta de entrada */}
        <rect x="0" y="522" width="106" height="18" />
        <rect x="224" y="522" width="132" height="18" />
        <rect x="476" y="522" width="76" height="18" />
        <rect x="670" y="522" width="118" height="18" />
        <rect x="854" y="522" width="246" height="18" />

        {/* Muro divisorio interior entre Salón y Patio / Balcón */}
        <rect x="898" y="16" width="14" height="20" />
        <rect x="898" y="114" width="14" height="410" />
      </g>

      {/* =====================================================================
          VENTANAS ARQUITECTÓNICAS (doble línea de vidrio + marcos)
          ===================================================================== */}
      <g stroke="#362E2A" strokeWidth="1.4" fill="#FFFFFF">
        {/* Ventanas superiores */}
        {[
          { x: 574, w: 70 },
          { x: 770, w: 84 },
          { x: 1004, w: 52 }
        ].map((win, idx) => (
          <g key={`win-top-${idx}`}>
            <rect x={win.x} y="3" width={win.w} height="10" />
            <line x1={win.x} y1="8" x2={win.x + win.w} y2="8" stroke="#9A8F88" strokeWidth="1" />
          </g>
        ))}

        {/* Ventanas inferiores */}
        {[
          { x: 106, w: 118 },
          { x: 356, w: 120 },
          { x: 552, w: 118 }
        ].map((win, idx) => (
          <g key={`win-bot-${idx}`}>
            <rect x={win.x} y="526" width={win.w} height="10" />
            <line x1={win.x} y1="531" x2={win.x + win.w} y2="531" stroke="#9A8F88" strokeWidth="1" />
          </g>
        ))}
      </g>

      {/* =====================================================================
          PUERTA PRINCIPAL DE ENTRADA (abajo derecha, abre hacia adentro)
          ===================================================================== */}
      <g>
        {/* Umbral */}
        <rect x="788" y="524" width="66" height="12" fill="#FFFDFB" />
        {/* Arco de batiente de 90° */}
        <path
          d="M 790 524 A 62 62 0 0 1 852 462"
          fill="none"
          stroke="#1F1410"
          strokeOpacity="0.38"
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />
        {/* Hoja de la puerta */}
        <rect x="849" y="462" width="5" height="62" rx="1" fill="#FFFFFF" stroke="#1F1410" strokeWidth="1.5" />
        <text
          x="818"
          y="514"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="1.2"
          fill="#1F1410"
          fillOpacity="0.48"
          style={{ fontFamily: 'Fraunces, Georgia, serif' }}
        >
          ENTRADA
        </text>
      </g>

      {/* =====================================================================
          PUERTAS DOBLES HACIA PATIO / BALCÓN (pared divisoria arriba)
          ===================================================================== */}
      <g>
        {/* Hoja superior + arco */}
        <rect x="912" y="38" width="36" height="4" rx="1" fill="#FFFFFF" stroke="#1F1410" strokeWidth="1.3" />
        <path
          d="M 948 42 A 36 36 0 0 1 912 75"
          fill="none"
          stroke="#1F1410"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        {/* Hoja inferior + arco */}
        <rect x="912" y="108" width="36" height="4" rx="1" fill="#FFFFFF" stroke="#1F1410" strokeWidth="1.3" />
        <path
          d="M 948 108 A 36 36 0 0 0 912 75"
          fill="none"
          stroke="#1F1410"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
      </g>

      {/* =====================================================================
          MOBILIARIO ARQUITECTÓNICO FIJO · PLANTA BAJA (Referencia Imagen 1)
          ===================================================================== */}
      {isPlantaBaja && (
        <g>
          {/* Zona BAR (arriba a la izquierda, barra en U + 9 bancos redondos) */}
          <g>
            <text
              x="54"
              y="50"
              fontSize="12"
              fontWeight="700"
              letterSpacing="1.4"
              fill="#1F1410"
              fillOpacity="0.58"
              style={{ fontFamily: 'Fraunces, Georgia, serif' }}
            >
              BAR
            </text>

            {/* Barra principal en forma de U/J */}
            <path
              d="M 76 70 H 148 A 8 8 0 0 1 156 78 V 188 A 8 8 0 0 1 148 196 H 116 V 180 H 140 V 86 H 92 V 164 H 76 Z"
              fill="#FCEAE9"
              fillOpacity="0.7"
              stroke="#1F1410"
              strokeOpacity="0.55"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Isla interna de preparación / cafetera */}
            <rect
              x="108"
              y="102"
              width="16"
              height="60"
              rx="3"
              fill="#FFFFFF"
              stroke="#1F1410"
              strokeOpacity="0.38"
              strokeWidth="1.3"
            />

            {/* 9 bancos de barra (2 arriba, 3 izquierda, 4 derecha) */}
            {[
              { cx: 98, cy: 56 },
              { cx: 132, cy: 56 },
              { cx: 60, cy: 88 },
              { cx: 60, cy: 118 },
              { cx: 60, cy: 148 },
              { cx: 170, cy: 88 },
              { cx: 170, cy: 118 },
              { cx: 170, cy: 148 },
              { cx: 170, cy: 178 }
            ].map((stool, idx) => (
              <circle
                key={`stool-${idx}`}
                cx={stool.cx}
                cy={stool.cy}
                r="7.5"
                fill="#FFFFFF"
                stroke="#1F1410"
                strokeOpacity="0.45"
                strokeWidth="1.4"
              />
            ))}
          </g>

          {/* ÁREA DE ESPERA (sofá de 3 plazas contra el muro divisorio, abajo derecha) */}
          <g>
            <rect
              x="864"
              y="366"
              width="34"
              height="104"
              rx="7"
              fill="#FCEAE9"
              fillOpacity="0.72"
              stroke="#1F1410"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            {/* Respaldo pegado a la pared */}
            <rect
              x="888"
              y="372"
              width="8"
              height="92"
              rx="3"
              fill="#FFFFFF"
              stroke="#1F1410"
              strokeOpacity="0.35"
              strokeWidth="1.1"
            />
            {/* División de 3 cojines */}
            <line x1="864" y1="401" x2="888" y2="401" stroke="#1F1410" strokeOpacity="0.35" strokeWidth="1.2" />
            <line x1="864" y1="435" x2="888" y2="435" stroke="#1F1410" strokeOpacity="0.35" strokeWidth="1.2" />

            <text
              x="853"
              y="418"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              letterSpacing="1"
              fill="#1F1410"
              fillOpacity="0.52"
              transform="rotate(-90 853 418)"
              style={{ fontFamily: 'Fraunces, Georgia, serif' }}
            >
              ÁREA DE ESPERA
            </text>
          </g>

          {/* Etiqueta arquitectónica de PATIO */}
          <text
            x="1058"
            y="62"
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            letterSpacing="2"
            fill="#E12927"
            fillOpacity="0.72"
            transform="rotate(90 1058 62)"
            style={{ fontFamily: 'Fraunces, Georgia, serif' }}
          >
            PATIO
          </text>

          {/* Marca de agua sutil de Salón Principal */}
          <text
            x="456"
            y="50"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="700"
            letterSpacing="2.4"
            fill="#1F1410"
            fillOpacity="0.22"
            style={{ fontFamily: 'Fraunces, Georgia, serif' }}
          >
            SALÓN PRINCIPAL · PLANTA BAJA
          </text>
        </g>
      )}

      {/* =====================================================================
          MOBILIARIO ARQUITECTÓNICO FIJO · PLANTA ALTA (Referencia Imagen 2)
          ===================================================================== */}
      {!isPlantaBaja && (
        <g>
          {/* Estantería de Ludoteca sobre el muro superior grueso */}
          <g>
            <rect
              x="44"
              y="30"
              width="240"
              height="24"
              rx="6"
              fill="#FCEAE9"
              fillOpacity="0.75"
              stroke="#1F1410"
              strokeOpacity="0.45"
              strokeWidth="1.4"
            />
            <line x1="104" y1="30" x2="104" y2="54" stroke="#1F1410" strokeOpacity="0.22" strokeWidth="1" />
            <line x1="164" y1="30" x2="164" y2="54" stroke="#1F1410" strokeOpacity="0.22" strokeWidth="1" />
            <line x1="224" y1="30" x2="224" y2="54" stroke="#1F1410" strokeOpacity="0.22" strokeWidth="1" />
            <text
              x="164"
              y="45"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="700"
              letterSpacing="1.3"
              fill="#1F1410"
              fillOpacity="0.6"
              style={{ fontFamily: 'Fraunces, Georgia, serif' }}
            >
              LUDOTECA · +60 JUEGOS
            </text>
          </g>

          {/* Estación de servicio / lavabos pegada al muro divisorio (como en Imagen 2) */}
          <g>
            <rect
              x="864"
              y="376"
              width="34"
              height="100"
              rx="4"
              fill="#FFFFFF"
              stroke="#1F1410"
              strokeOpacity="0.45"
              strokeWidth="1.4"
            />
            {[392, 424, 456].map((cy, idx) => (
              <g key={`sink-${idx}`}>
                <rect
                  x="870"
                  y={cy - 10}
                  width="22"
                  height="20"
                  rx="4"
                  fill="#FAF7F5"
                  stroke="#1F1410"
                  strokeOpacity="0.32"
                  strokeWidth="1.1"
                />
                <circle cx="876" cy={cy} r="2.2" fill="#1F1410" fillOpacity="0.4" />
              </g>
            ))}
            <text
              x="853"
              y="426"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="700"
              letterSpacing="1"
              fill="#1F1410"
              fillOpacity="0.45"
              transform="rotate(-90 853 426)"
              style={{ fontFamily: 'Fraunces, Georgia, serif' }}
            >
              SERVICIO
            </text>
          </g>

          {/* Trazos arquitectónicos decorativos del Balcón / Terraza Alta (fiel a Imagen 2) */}
          <g stroke="#1F1410" strokeOpacity="0.28" strokeWidth="1.3" fill="#FFFFFF" fillOpacity="0.65">
            {/* Mesa bistro decorativa superior izquierda */}
            <ellipse cx="944" cy="186" rx="14" ry="11" />
            <circle cx="944" cy="166" r="6" />
            <circle cx="944" cy="206" r="6" />

            {/* Mesa bistro decorativa superior derecha */}
            <rect x="1024" y="152" width="32" height="36" rx="4" />
            <circle cx="1040" cy="138" r="6.5" />
            <circle cx="1040" cy="202" r="6.5" />

            {/* Mesa bistro decorativa inferior derecha */}
            <circle cx="1044" cy="468" r="12" />
            <circle cx="1044" cy="445" r="6" />
            <circle cx="1044" cy="491" r="6" />
          </g>

          {/* Etiqueta arquitectónica de BALCÓN */}
          <text
            x="1058"
            y="68"
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="700"
            letterSpacing="2"
            fill="#E12927"
            fillOpacity="0.72"
            transform="rotate(90 1058 68)"
            style={{ fontFamily: 'Fraunces, Georgia, serif' }}
          >
            BALCÓN
          </text>

          {/* Marca de agua sutil de Planta Alta */}
          <text
            x="530"
            y="50"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="700"
            letterSpacing="2.4"
            fill="#1F1410"
            fillOpacity="0.22"
            style={{ fontFamily: 'Fraunces, Georgia, serif' }}
          >
            PLANTA ALTA · SALÓN LUDOTECA
          </text>
        </g>
      )}
    </svg>
  );
};
