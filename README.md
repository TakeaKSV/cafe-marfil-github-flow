# Café Marfil - práctica de Git

Prototipo académico mínimo del módulo de reservaciones. No es la plataforma completa ni un sistema desplegado. Los módulos previstos son menú, reservaciones, eventos y administración.

## Ejecutar en Windows

Instala Git y Node.js 22 o posterior. Abre PowerShell en esta carpeta y ejecuta `node --test --test-reporter=spec`. No se requiere `npm install`. Para ver ejemplos usa `node demo.mjs`.

## Alcance

La base 1.0.0 solo verifica nombre y cantidad positiva. La práctica agrega la regla académica de 1 a 12 personas enteras; no representa una capacidad confirmada por el restaurante. No hay base de datos, autenticación, pagos ni persistencia.

Las operaciones se ejecutan automáticamente con identidad técnica neutral. No se atribuyen commits ni aprobaciones a estudiantes. La revisión mediante Pull Request y el despliegue remoto están pendientes si se solicitan.
