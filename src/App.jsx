import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, LogOut, ArrowLeft, Download, Eye, Calendar } from 'lucide-react';
import { users, getEmployeesByEmail } from './data/users';
import { initialOficios } from './data/oficios';
import { initialPermisos } from './data/permisos';
import './index.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // Login State
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = enter email, 2 = select actual user
  const [possibleUsers, setPossibleUsers] = useState([]);
  const [loginError, setLoginError] = useState('');

  // App State
  const [module, setModule] = useState('oficios'); // 'oficios' or 'permisos'
  const [view, setView] = useState('dashboard'); // 'dashboard', 'new-oficio', 'new-permiso'

  // Persisted Data State
  const [oficios, setOficios] = useState(() => {
    const saved = localStorage.getItem('oficios');
    return saved ? JSON.parse(saved) : initialOficios;
  });

  const [permisos, setPermisos] = useState(() => {
    const saved = localStorage.getItem('permisos');
    return saved ? JSON.parse(saved) : initialPermisos;
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('oficios', JSON.stringify(oficios));
  }, [oficios]);

  useEffect(() => {
    localStorage.setItem('permisos', JSON.stringify(permisos));
  }, [permisos]);

  // --- LOGIN LOGIC ---
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    const matchedUsers = getEmployeesByEmail(email.trim().toLowerCase());

    if (matchedUsers.length === 0) {
      setLoginError('Correo no encontrado en la base de datos.');
    } else if (matchedUsers.length === 1) {
      setCurrentUser(matchedUsers[0]);
    } else {
      setPossibleUsers(matchedUsers);
      setStep(2);
    }
  };

  const handleUserSelect = (user) => {
    setCurrentUser(user);
    setStep(1);
    setPossibleUsers([]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmail('');
    setView('dashboard');
    setModule('oficios');
  };

  // --- APP LOGIC ---
  const canEmitOficio = currentUser?.role === 'emisor' || currentUser?.role === 'administrador';

  const filteredOficios = oficios.filter(oficio => {
    const searchLow = searchTerm.toLowerCase();
    return (
      oficio.id.toLowerCase().includes(searchLow) ||
      oficio.materia.toLowerCase().includes(searchLow) ||
      oficio.destinatario.toLowerCase().includes(searchLow) ||
      oficio.emisorNombre.toLowerCase().includes(searchLow)
    );
  });

  const filteredPermisos = permisos.filter(perm => {
    const searchLow = searchTerm.toLowerCase();
    return (
      perm.id.toLowerCase().includes(searchLow) ||
      perm.funcionarioNombre.toLowerCase().includes(searchLow) ||
      perm.tipoPermiso.toLowerCase().includes(searchLow)
    );
  });

  const handleCreateOficio = (newOficio) => {
    setOficios([newOficio, ...oficios]);
    setView('dashboard');
  };

  const handleCreatePermiso = (newPermiso) => {
    setPermisos([newPermiso, ...permisos]);
    setView('dashboard');
  };

  // --- SCREENS ---
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#f0f4f8' }}>
        <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="text-center mb-4">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', marginBottom: '1rem' }}>
              <FileText size={32} />
            </div>
            <h2>Portal Administrativo</h2>
            <p className="text-muted">CEIA Ilustre Municipalidad de Parral</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Correo Institucional</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="ejemplo@eduilustreparral.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {loginError && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{loginError}</p>}
              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>Ingresar</button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p className="font-semibold text-center mb-2">Se encontraron varios funcionarios asociados a este correo. Seleccione su nombre:</p>
              {possibleUsers.map(user => (
                <button
                  key={user.id}
                  className="btn btn-outline w-full"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => handleUserSelect(user)}
                >
                  {user.name} {user.sub_role ? `(${user.sub_role})` : ''}
                </button>
              ))}
              <button
                className="btn text-muted mt-4"
                style={{ justifyContent: 'center', fontSize: '0.875rem' }}
                onClick={() => setStep(1)}
              >
                Volver
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem 0', boxShadow: 'var(--shadow-md)' }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={24} />
            <h1 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Portal CEIA</h1>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ fontSize: '0.875rem', textAlign: 'right' }}>
              <div className="font-semibold">{currentUser.name}</div>
              <div style={{ opacity: 0.8 }}>Rol: {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</div>
            </div>
            <button onClick={handleLogout} style={{ color: 'white', opacity: 0.8 }} title="Cerrar Sesión">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      {view === 'dashboard' && (
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border)' }}>
          <div className="container flex gap-4" style={{ padding: '0.5rem 1.5rem' }}>
            <button
              onClick={() => setModule('oficios')}
              className={`btn ${module === 'oficios' ? 'btn-primary' : 'text-muted'}`}
              style={module !== 'oficios' ? { background: 'transparent', color: 'var(--text-color)' } : {}}
            >
              <FileText size={18} />
              Registro de Oficios
            </button>
            <button
              onClick={() => setModule('permisos')}
              className={`btn ${module === 'permisos' ? 'btn-primary' : 'text-muted'}`}
              style={module !== 'permisos' ? { background: 'transparent', color: 'var(--text-color)' } : {}}
            >
              <Calendar size={18} />
              Permisos Administrativos
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container p-6 animate-fade-in" style={{ flexGrow: 1 }}>

        {view === 'dashboard' && module === 'oficios' && (
          <>
            <div className="flex items-center justify-between mb-8" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar oficios por materia, número..."
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {canEmitOficio && (
                <button className="btn btn-primary" onClick={() => setView('new-oficio')}>
                  <Plus size={20} />
                  Nuevo Oficio
                </button>
              )}
            </div>

            <div className="card table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nº Oficio</th>
                    <th>Fecha</th>
                    <th>Emisor</th>
                    <th>Destinatario</th>
                    <th>Materia</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOficios.length > 0 ? filteredOficios.map(oficio => (
                    <tr key={oficio.id}>
                      <td className="font-semibold">{oficio.id}</td>
                      <td>{oficio.fechaEmision}</td>
                      <td>{oficio.emisorNombre}</td>
                      <td>{oficio.destinatario}</td>
                      <td>{oficio.materia}</td>
                      <td>
                        <span className={`badge ${oficio.estado === 'Vigente' ? 'badge-green' : 'badge-gray'}`}>
                          {oficio.estado}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Ver Detalle">
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Descargar PDF">
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center p-6 text-muted">
                        No se encontraron oficios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'dashboard' && module === 'permisos' && (
          <>
            <div className="flex items-center justify-between mb-8" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar por nombre, número o tipo..."
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={() => setView('new-permiso')}>
                <Plus size={20} />
                Solicitar Permiso
              </button>
            </div>

            <div className="card table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID Permiso</th>
                    <th>Fecha Solicitud</th>
                    <th>Funcionario</th>
                    <th>Tipo</th>
                    <th>Inicio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermisos.length > 0 ? filteredPermisos.map(permiso => (
                    <tr key={permiso.id}>
                      <td className="font-semibold">{permiso.id}</td>
                      <td>{permiso.fechaSolicitud}</td>
                      <td>{permiso.funcionarioNombre}</td>
                      <td>{permiso.tipoPermiso}</td>
                      <td>{permiso.fechaInicio}</td>
                      <td>
                        <span className={`badge ${permiso.estado === 'Aprobado' ? 'badge-green' :
                            permiso.estado === 'Rechazado' ? 'badge-gray' : 'badge-gray'
                          }`} style={permiso.estado === 'Pendiente' ? { backgroundColor: '#fef08a', color: '#854d0e' } : {}}>
                          {permiso.estado}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Ver Detalle">
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Descargar PDF">
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center p-6 text-muted">
                        No se encontraron permisos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'new-oficio' && (
          <NewOficioForm
            currentUser={currentUser}
            onCancel={() => setView('dashboard')}
            onSave={handleCreateOficio}
            nextCorrelative={`OF-2026-${(oficios.length + 1).toString().padStart(3, '0')}`}
          />
        )}

        {view === 'new-permiso' && (
          <NewPermisoForm
            currentUser={currentUser}
            onCancel={() => setView('dashboard')}
            onSave={handleCreatePermiso}
            nextCorrelative={`PA-2026-${(permisos.length + 1).toString().padStart(3, '0')}`}
          />
        )}
      </main>
    </div>
  );
}

// Subcomponent for the Oficio Form
function NewOficioForm({ currentUser, onCancel, onSave, nextCorrelative }) {
  const [formData, setFormData] = useState({
    destinatario: '',
    materia: '',
    descripcion: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newOficio = {
      id: nextCorrelative,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaRegistro: new Date().toISOString().split('T')[0],
      emisorId: currentUser.id,
      emisorNombre: currentUser.name,
      destinatario: formData.destinatario,
      materia: formData.materia,
      descripcion: formData.descripcion,
      estado: 'Vigente',
      archivo: 'pendiente.pdf'
    };
    onSave(newOficio);
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={onCancel} className="btn" style={{ padding: 0, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={20} />
        <span style={{ marginLeft: '0.25rem' }}>Volver al Panel</span>
      </button>

      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Registrar Nuevo Oficio</h2>

      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="text-muted">Correlativo Asignado:</span>
          <span className="font-semibold" style={{ color: 'var(--primary)' }}>{nextCorrelative}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">Emisor:</span>
          <span className="font-semibold">{currentUser.name}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="input-label">Destinatario</label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej. DAEM, Ministerio, Apoderado..."
            required
            value={formData.destinatario}
            onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
          />
        </div>

        <div>
          <label className="input-label">Materia o Asunto</label>
          <input
            type="text"
            className="input-field"
            placeholder="Título breve del documento"
            required
            value={formData.materia}
            onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
          />
        </div>

        <div>
          <label className="input-label">Descripción</label>
          <textarea
            className="input-field"
            rows="4"
            placeholder="Resumen del contenido del oficio..."
            required
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
        </div>

        <div>
          <label className="input-label">Archivo PDF (Opcional en esta maqueta)</label>
          <input type="file" className="input-field" accept="application/pdf" />
        </div>

        <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Registrar y Guardar</button>
        </div>
      </form>
    </div>
  );
}

// Subcomponent for the Permiso Form
function NewPermisoForm({ currentUser, onCancel, onSave, nextCorrelative }) {
  const [formData, setFormData] = useState({
    tipoPermiso: 'Día Administrativo',
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPermiso = {
      id: nextCorrelative,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      funcionarioId: currentUser.id,
      funcionarioNombre: currentUser.name,
      tipoPermiso: formData.tipoPermiso,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      motivo: formData.motivo,
      estado: 'Pendiente'
    };
    onSave(newPermiso);
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={onCancel} className="btn" style={{ padding: 0, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={20} />
        <span style={{ marginLeft: '0.25rem' }}>Volver al Panel</span>
      </button>

      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Solicitar Permiso Administrativo</h2>

      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="text-muted">ID Solicitud:</span>
          <span className="font-semibold" style={{ color: 'var(--primary)' }}>{nextCorrelative}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted">Funcionario:</span>
          <span className="font-semibold">{currentUser.name}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="input-label">Tipo de Permiso</label>
          <select
            className="input-field"
            value={formData.tipoPermiso}
            onChange={(e) => setFormData({ ...formData, tipoPermiso: e.target.value })}
            required
          >
            <option value="Día Administrativo">Día Administrativo</option>
            <option value="Día de Cumpleaños">Día de Cumpleaños</option>
            <option value="Permiso por Matrimonio / Unión Civil">Permiso por Matrimonio / Unión Civil</option>
            <option value="Permiso por Fallecimiento">Permiso por Fallecimiento (Familiar Directo)</option>
            <option value="Otro">Otro (Especificar en motivo)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Fecha Inicio</label>
            <input
              type="date"
              className="input-field"
              required
              value={formData.fechaInicio}
              onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Fecha Fin</label>
            <input
              type="date"
              className="input-field"
              required
              value={formData.fechaFin}
              onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Motivo o Justificación</label>
          <textarea
            className="input-field"
            rows="3"
            placeholder="Breve justificación de la solicitud..."
            required
            value={formData.motivo}
            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
          />
        </div>

        <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Enviar Solicitud</button>
        </div>
      </form>
    </div>
  );
}
