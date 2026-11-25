import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const COSTO = 12;
const HASH_AUSENTE = bcrypt.hashSync(randomBytes(32).toString('hex'), COSTO);

export const cifrarPassword = (password) => bcrypt.hash(password, COSTO);
export async function verificarPassword(password, hash) {
  const coincide = await bcrypt.compare(password, hash || HASH_AUSENTE);
  return Boolean(hash) && coincide;
}
