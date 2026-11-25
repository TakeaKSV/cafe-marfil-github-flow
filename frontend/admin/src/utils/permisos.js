// Control de acceso por rol para el Panel de Administración Café Marfil.
// Roles permitidos en el panel: 'admin', 'gerente', 'host'.

export const TABS_POR_ROL = {
  admin: ['dashboard', 'reservations', 'floorplan', 'scanner', 'menu', 'activities', 'promotions', 'ludoteca', 'staff'],
  gerente: ['dashboard', 'reservations', 'floorplan', 'scanner', 'menu', 'activities', 'promotions', 'ludoteca'],
  host: ['dashboard', 'reservations', 'floorplan', 'scanner', 'menu', 'ludoteca']
};

export const ETIQUETA_ROL = {
  admin: 'Administrador',
  gerente: 'Gerente',
  host: 'Host / Sala',
  staff: 'Sin acceso'
};

export function puedeVerTab(rol, tabId) {
  const permitidas = TABS_POR_ROL[rol] || [];
  return permitidas.includes(tabId);
}

export function esAdmin(usuario) {
  return usuario?.rol === 'admin';
}

export function esGerencia(usuario) {
  return usuario?.rol === 'admin' || usuario?.rol === 'gerente';
}
