import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import multer from 'multer';
import { requiereStaff } from '../middleware/auth.js';
import { cloudinaryConfigurado, normalizarCarpeta, subirACloudinary } from '../servicios/cloudinary.js';
import { solicitudInvalida } from '../utils/errores.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DIR_UPLOADS = path.resolve(__dirname, '../../uploads');

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MIME_PERMITIDOS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);

function detectarExtensionReal(buffer) {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  // WEBP: RIFF....WEBP
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp';
  }
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 }
});

const router = Router();
const soloGerencia = requiereStaff('admin', 'gerente');

router.post(
  '/imagen',
  soloGerencia,
  (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(solicitudInvalida('La imagen supera el límite máximo de 2 MB.'));
        }
        return next(solicitudInvalida('Error al procesar el archivo enviado.'));
      }
      if (err) return next(err);
      return next();
    });
  },
  async (req, res) => {
    const archivo = req.file;
    if (!archivo) throw solicitudInvalida('Debes adjuntar un archivo en el campo "imagen".');
    if (!MIME_PERMITIDOS.has(archivo.mimetype)) {
      throw solicitudInvalida('Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.');
    }
    const extReal = detectarExtensionReal(archivo.buffer);
    if (!extReal) {
      throw solicitudInvalida('El archivo no corresponde a una imagen JPG, PNG o WebP válida.');
    }

    const carpeta = normalizarCarpeta(req.query.carpeta || req.body?.carpeta);

    if (carpeta === 'menu' && (archivo.mimetype !== 'image/png' || extReal !== 'png')) {
      throw solicitudInvalida('Para el menú solo se permiten imágenes en formato PNG.');
    }

    if (cloudinaryConfigurado()) {
      const subida = await subirACloudinary({
        buffer: archivo.buffer,
        mimetype: archivo.mimetype,
        nombreArchivo: `${crypto.randomUUID()}.${extReal}`,
        carpeta
      });
      return res.status(201).json({
        url: subida.url,
        publicId: subida.publicId,
        carpeta,
        proveedor: 'cloudinary',
        tamano: archivo.size,
        tipo: archivo.mimetype
      });
    }

    await fs.mkdir(DIR_UPLOADS, { recursive: true });
    const nombre = `${crypto.randomUUID()}.${extReal}`;
    await fs.writeFile(path.join(DIR_UPLOADS, nombre), archivo.buffer);

    return res.status(201).json({
      url: `/uploads/${nombre}`,
      archivo: nombre,
      carpeta,
      proveedor: 'local',
      tamano: archivo.size,
      tipo: archivo.mimetype
    });
  }
);

export default router;
