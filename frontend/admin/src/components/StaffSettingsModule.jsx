import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  BellRing,
  CheckCircle2,
  UserPlus,
  X,
  Mail,
  RefreshCw,
  Trash2,
  Clock
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';
import { reglas } from '../utils/validacion';

const ROLES_OPCIONES = [
  { id: 'host', label: 'Host (Recepción, mesas y escáner)', puestoDefault: 'Host de Piso' },
  { id: 'gerente', label: 'Gerente (Menú, actividades y cupones)', puestoDefault: 'Gerente de Sucursal' },
  { id: 'admin', label: 'Administrador (Control total)', puestoDefault: 'Administrador' },
  { id: 'staff', label: 'Staff operativo (Sin acceso al panel)', puestoDefault: 'Barista / Cocina' }
];

export const StaffSettingsModule = ({
  staff = [],
  sucursales = [],
  usuario,
  invitaciones = [],
  onInvitarEmpleado,
  onCancelarInvitacion,
  soundEnabled
}) => {
  const esAdmin = usuario?.rol === 'admin';

  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastError, setBroadcastError] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const [modalInvitar, setModalInvitar] = useState(false);
  const [invForm, setInvForm] = useState({
    email: '',
    rol: 'host',
    puesto: 'Host de Piso',
    sucursalId: sucursales[0]?.id || ''
  });
  const [invErrors, setInvErrors] = useState({});
  const [enviandoInv, setEnviandoInv] = useState(false);

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    const err = reglas.texto(broadcastMessage, { min: 5, max: 240, etiqueta: 'El mensaje' });
    if (err) {
      setBroadcastError(err);
      if (soundEnabled) playSound('alert');
      return;
    }
    setBroadcastError('');
    setBroadcastSent(true);
    if (soundEnabled) playSound('alert');
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage('');
    }, 4000);
  };

  const abrirModalInvitar = () => {
    setInvForm({
      email: '',
      rol: 'host',
      puesto: 'Host de Piso',
      sucursalId: sucursales[0]?.id || ''
    });
    setInvErrors({});
    setModalInvitar(true);
    if (soundEnabled) playSound('toggle');
  };

  const handleEnviarInvitacion = async (e) => {
    e.preventDefault();
    const errs = {
      email: reglas.email(invForm.email),
      puesto: reglas.texto(invForm.puesto, { min: 2, max: 80, etiqueta: 'El puesto' })
    };
    setInvErrors(errs);
    if (Object.values(errs).some(Boolean) || enviandoInv) {
      if (soundEnabled) playSound('alert');
      return;
    }
    setEnviandoInv(true);
    try {
      const ok = await onInvitarEmpleado({
        email: invForm.email.trim().toLowerCase(),
        rol: invForm.rol,
        puesto: invForm.puesto.trim(),
        sucursalId: invForm.sucursalId || null
      });
      if (ok) {
        if (soundEnabled) playSound('success');
        setModalInvitar(false);
      }
    } finally {
      setEnviandoInv(false);
    }
  };

  const handleReenviarInv = async (inv) => {
    await onInvitarEmpleado({
      email: inv.email,
      rol: inv.rol,
      puesto: inv.puesto,
      sucursalId: inv.sucursalId || null
    });
    if (soundEnabled) playSound('success');
  };

  return (
    <div className="space-y-6 animate-menu-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Personal en Turno & Altas por Invitación
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Invita empleados por correo (enlace válido 12 horas) para que completen su nombre y contraseña
          </p>
        </div>

        {esAdmin && (
          <button
            type="button"
            onClick={abrirModalInvitar}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-full shadow-xs cursor-pointer transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invitar empleado
          </button>
        )}
      </div>

      {/* Grid: Personal en Piso y Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Equipo + Invitaciones Pendientes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10">
              <h2 className="font-display font-bold text-base text-[#1F1410]">
                Equipo Activo
              </h2>
              <span className="text-xs font-mono text-[#1F1410]/60">
                {staff.length} Colaboradores
              </span>
            </div>

            <div className="divide-y divide-[#1F1410]/10">
              {staff.map((person, idx) => (
                <div
                  key={person.id}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className="py-3 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-[#FAF7F5] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FAF7F5] border border-[#1F1410]/15 flex items-center justify-center font-mono font-bold text-xs text-[#E12927]">
                      {person.nombre
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F1410]">{person.nombre}</h3>
                      <p className="text-xs text-[#1F1410]/60 font-mono">
                        {person.rol} · {person.sucursal}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                      ACTIVO
                    </span>
                    {person.turno && (
                      <div className="text-[11px] text-[#1F1410]/60 mt-0.5">{person.turno}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invitaciones pendientes (solo admin) */}
          {esAdmin && (
            <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#E12927]" />
                  <h2 className="font-display font-bold text-base text-[#1F1410]">
                    Invitaciones Pendientes
                  </h2>
                </div>
                <span className="text-xs font-mono text-[#1F1410]/60">
                  {invitaciones.length} pendiente(s) · vigencia 12 h
                </span>
              </div>

              {invitaciones.length === 0 ? (
                <p className="text-xs text-[#1F1410]/55 font-body py-2">
                  No hay invitaciones pendientes. Usa el botón <strong>Invitar empleado</strong> para enviar un enlace de registro por correo.
                </p>
              ) : (
                <div className="divide-y divide-[#1F1410]/10">
                  {invitaciones.map((inv) => (
                    <div key={inv.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-[#1F1410] truncate">{inv.email}</div>
                        <div className="text-[11px] text-[#1F1410]/60 flex items-center gap-2 mt-0.5">
                          <span className="uppercase font-mono font-bold text-[#E12927]">{inv.rol}</span>
                          <span>· {inv.puesto}</span>
                          {inv.sucursalNombre && <span>· {inv.sucursalNombre}</span>}
                        </div>
                        <div className="text-[10px] font-mono text-[#1F1410]/50 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Expira: {new Date(inv.expiraEn).toLocaleString('es-MX')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReenviarInv(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF7F5] hover:bg-[#FCEAE9] text-xs font-mono font-bold text-[#1F1410] hover:text-[#E12927] cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reenviar
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelarInvitacion(inv.id)}
                          title="Cancelar invitación"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Parámetros de Aforo y Aviso */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-[#1F1410] pb-2 border-b border-[#1F1410]/10">
              Aforos & Tolerancia de Reserva
            </h2>
            <div className="space-y-3 font-mono text-xs">
              {sucursales.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-[#FAF7F5] border border-[#1F1410]/10 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <strong className="text-[#1F1410] block font-body text-xs font-semibold">{s.nombre}</strong>
                    <span className="text-[#1F1410]/60 text-[11px]">Tolerancia no-show: 15 min</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#E12927] font-bold">{s.aforoMax} comensales</span>
                    <span className="text-[10px] text-[#1F1410]/50 block">Capacidad máxima</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#E12927]" />
              <h2 className="font-display font-bold text-base text-[#1F1410]">
                Aviso a Terminales en Sucursales
              </h2>
            </div>
            <p className="text-xs text-[#1F1410]/60 font-body">
              Envía un anuncio inmediato a las pantallas de comandera, recepción y cocina en piso.
            </p>

            <form onSubmit={handleSendBroadcast} noValidate className="space-y-2">
              <input
                type="text"
                maxLength={240}
                placeholder="Ej. Cambio de turno de barra a las 15:30..."
                value={broadcastMessage}
                onChange={(e) => {
                  setBroadcastMessage(e.target.value);
                  setBroadcastError('');
                }}
                aria-invalid={Boolean(broadcastError)}
                className={`w-full px-3.5 py-2 text-xs border rounded-xl focus:outline-hidden ${
                  broadcastError ? 'border-[#E12927]' : 'border-[#1F1410]/20 focus:border-[#E12927]'
                }`}
              />
              {broadcastError && (
                <p role="alert" className="text-[11px] font-semibold text-[#E12927]">
                  {broadcastError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-mono font-bold rounded-full cursor-pointer transition-colors"
              >
                Transmitir Alerta a Sala
              </button>
            </form>

            {broadcastSent && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Mensaje transmitido a las sucursales.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Invitar Empleado */}
      {modalInvitar &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-[#1F1410]/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setModalInvitar(false)}
          >
            <div
              className="bg-white rounded-3xl border border-[#1F1410]/10 max-w-md w-full p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F1410]">Invitar nuevo empleado</h3>
                  <p className="text-xs text-[#1F1410]/60">
                    Recibirá un correo con botón para completar su registro (válido 12 horas).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalInvitar(false)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F5] flex items-center justify-center text-[#1F1410]/60 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEnviarInvitacion} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Correo electrónico del empleado *
                  </label>
                  <input
                    type="email"
                    placeholder="empleado@correo.com"
                    value={invForm.email}
                    onChange={(e) => {
                      setInvForm({ ...invForm, email: e.target.value });
                      setInvErrors((p) => ({ ...p, email: null }));
                    }}
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                      invErrors.email ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                    }`}
                  />
                  {invErrors.email && <p className="text-xs font-semibold text-[#E12927] mt-1">{invErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">Rol *</label>
                  <select
                    value={invForm.rol}
                    onChange={(e) => {
                      const rol = e.target.value;
                      const opt = ROLES_OPCIONES.find((r) => r.id === rol);
                      setInvForm({ ...invForm, rol, puesto: opt?.puestoDefault || invForm.puesto });
                    }}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl bg-white focus:outline-hidden focus:border-[#E12927]"
                  >
                    {ROLES_OPCIONES.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">Puesto *</label>
                    <input
                      type="text"
                      value={invForm.puesto}
                      onChange={(e) => {
                        setInvForm({ ...invForm, puesto: e.target.value });
                        setInvErrors((p) => ({ ...p, puesto: null }));
                      }}
                      className="w-full px-3.5 py-2 text-xs border border-[#1F1410]/15 rounded-xl focus:outline-hidden focus:border-[#E12927]"
                    />
                    {invErrors.puesto && <p className="text-xs font-semibold text-[#E12927] mt-1">{invErrors.puesto}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">Sucursal</label>
                    <select
                      value={invForm.sucursalId}
                      onChange={(e) => setInvForm({ ...invForm, sucursalId: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-[#1F1410]/15 rounded-xl bg-white"
                    >
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalInvitar(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#1F1410]/70 hover:bg-[#FAF7F5] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoInv}
                    className="px-5 py-2 rounded-full bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-50 text-white text-xs font-mono font-bold cursor-pointer"
                  >
                    {enviandoInv ? 'Enviando correo...' : 'Enviar invitación'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
