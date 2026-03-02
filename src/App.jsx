import React, { useState } from 'react';
import { FileText, Search, Plus, LogOut, ArrowLeft, Download, Eye } from 'lucide-react';
import { users, getEmployeesByEmail } from './data/users';
import { initialOficios } from './data/oficios';
import './index.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // Login State
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = enter email, 2 = select actual user
  const [possibleUsers, setPossibleUsers] = useState([]);
  const [loginError, setLoginError] = useState('');

  // App State
  const [view, setView] = useState('dashboard'); // 'dashboard', 'new-oficio'
  const [oficios, setOficios] = useState(initialOficios);
  const [searchTerm, setSearchTerm] = useState('');

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
  };

  // --- APP LOGIC ---
  const canEmit = currentUser?.role === 'emisor' || currentUser?.role === 'administrador';

  const filteredOficios = oficios.filter(oficio => {
    const searchLow = searchTerm.toLowerCase();
    return (
      oficio.id.toLowerCase().includes(searchLow) ||
      oficio.materia.toLowerCase().includes(searchLow) ||
      oficio.destinatario.toLowerCase().includes(searchLow) ||
      oficio.emisorNombre.toLowerCase().includes(searchLow)
    );
  });

  const handleCreateOficio = (newOficio) => {
    setOficios([newOficio, ...oficios]);
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
            <h2>Registro de Oficios</h2>
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
            <h1 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Oficios CEIA</h1>
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

      {/* Main Content */}
      <main className="container p-6 animate-fade-in" style={{ flexGrow: 1 }}>

        {view === 'dashboard' && (
          <>
            <div className="flex items-center justify-between mb-8" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar por materia, emisor o número..."
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {canEmit && (
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

        {view === 'new-oficio' && (
          <NewOficioForm
            currentUser={currentUser}
            onCancel={() => setView('dashboard')}
            onSave={handleCreateOficio}
            nextCorrelative={`OF-2026-${(oficios.length + 1).toString().padStart(3, '0')}`}
          />
        )}
      </main>
    </div>
  );
}

// Subcomponent for the Form
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
