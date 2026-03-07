import React, { useState, useEffect } from 'react';
import { FileText, Calendar, LayoutDashboard, ArrowLeft, Search, Plus, Save, Download, Eye, AlertCircle, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { users } from './data/users';
import { loadOficios, loadPermisos, saveOficio, savePermiso, checkPermisosDays, deleteOficio, deletePermiso, updateOficio, updatePermiso } from './services/db';
import { sendPermisoEmail } from './services/email';
import './index.css';

const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name, 'es'));

export default function App() {
  const [view, setView] = useState('home'); // home, oficio, permiso, dashboard

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <header style={{
        background: 'rgba(30, 58, 138, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'white',
        padding: '0.875rem 1.5rem',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-lg)',
        marginBottom: '2rem',
        maxWidth: '1200px',
        margin: '1rem auto 2rem auto',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div
            className="flex items-center gap-2"
            style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '0.2rem' }}
            onClick={() => setView('home')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ background: 'white', color: 'var(--primary)', padding: '0.4rem', borderRadius: '8px' }}>
              <FileText size={20} />
            </div>
            <h1 style={{ fontSize: '1.15rem', color: 'white', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>Portal CEIA</h1>
          </div>

          <div className="flex items-center gap-4">
            <div style={{ background: 'white', borderRadius: '8px', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center' }}>
              <img src="./logos.png" alt="Logos CEIA" style={{ height: '40px', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>

            <div style={{ fontSize: '0.8rem', opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem', borderRadius: '99px' }} className="hidden sm:block">
              Sistema Administrativo
            </div>
          </div>
        </div>
      </header>

      <main className="container p-6 animate-fade-in" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {view === 'home' && <HomeScreen setView={setView} />}
        {view === 'oficio' && <OficioForm setView={setView} />}
        {view === 'permiso' && <PermisoForm setView={setView} />}
        {view === 'dashboard' && <Dashboard setView={setView} />}
      </main>
    </div>
  );
}

function HomeScreen({ setView }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '2rem 0' }}>
      <div className="text-center mb-8" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: 'var(--primary)', letterSpacing: '-0.02em', fontWeight: 700 }}>Bienvenido al Portal</h2>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>¿Qué trámite deseas realizar hoy?</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '850px' }}>
        <button
          className="card"
          style={{ width: '300px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setView('oficio')}
        >
          <div style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', padding: '1.75rem', borderRadius: '24px', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
            <FileText size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', fontWeight: 600 }}>Registrar Oficio</h3>
          <p className="text-muted" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>Generar documento y asignar número correlativo automáticamente.</p>
        </button>

        <button
          className="card"
          style={{ width: '300px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setView('permiso')}
        >
          <div style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#166534', padding: '1.75rem', borderRadius: '24px', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
            <Calendar size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', fontWeight: 600 }}>Registrar Permiso</h3>
          <p className="text-muted" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>Solicitar día y medio día administrativo.</p>
        </button>
      </div>

      <div className="mt-8" style={{ marginTop: '3rem' }}>
        <button
          className="btn btn-outline"
          style={{ gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '999px', fontWeight: 600, background: 'var(--surface)' }}
          onClick={() => setView('dashboard')}
        >
          <LayoutDashboard size={18} />
          Ir al Panel de Control Completo
        </button>
      </div>
    </div>
  );
}

function OficioForm({ setView }) {
  const [formData, setFormData] = useState({
    emisorId: localStorage.getItem('lastOficioUser') || '',
    destinatario: '',
    materia: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.emisorId) return alert('Debes seleccionar quién eres.');
    setLoading(true);

    // Guardamos la preferencia en el navegador para auto-completar la próxima vez
    localStorage.setItem('lastOficioUser', formData.emisorId);

    try {
      const emisor = sortedUsers.find(u => u.id === parseInt(formData.emisorId));
      const oficioData = {
        emisorId: emisor.id,
        emisorNombre: emisor.name,
        destinatario: formData.destinatario,
        materia: formData.materia,
        descripcion: formData.descripcion,
        estado: 'Vigente'
      };

      const saved = await saveOficio(oficioData);
      setSuccessId(saved.id);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="card text-center animate-fade-in" style={{ maxWidth: '500px', margin: '3rem auto', padding: '3rem' }}>
        <div style={{ background: '#dcfce7', color: '#166534', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Save size={40} />
        </div>
        <h2 style={{ color: 'var(--primary)' }}>Oficio Registrado Exitosamente</h2>
        <p className="text-muted mb-4">El documento ha sido guardado en los registros.</p>
        <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', color: '#1e3a8a', marginBottom: '2rem' }}>
          {successId}
        </div>
        <button className="btn btn-primary" onClick={() => setView('home')}>Volver al Inicio</button>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => setView('home')} className="btn" style={{ padding: 0, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={20} /><span style={{ marginLeft: '0.25rem' }}>Volver</span>
      </button>

      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Registrar Nuevo Oficio</h2>
      <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>Complete los datos del documento. El correlativo se generará automáticamente al guardar para evitar duplicados.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="input-label">¿Quién emite el oficio?</label>
          <select className="input-field" required value={formData.emisorId} onChange={e => setFormData({ ...formData, emisorId: e.target.value })}>
            <option value="">-- Seleccionar Nombre --</option>
            {sortedUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Destinatario</label>
          <input type="text" className="input-field" placeholder="Ej. Ministerio de Educación..." required value={formData.destinatario} onChange={e => setFormData({ ...formData, destinatario: e.target.value })} />
        </div>
        <div>
          <label className="input-label">Materia o Asunto</label>
          <input type="text" className="input-field" placeholder="Título breve del documento..." required value={formData.materia} onChange={e => setFormData({ ...formData, materia: e.target.value })} />
        </div>
        <div>
          <label className="input-label">Descripción</label>
          <textarea className="input-field" rows="4" placeholder="Breve resumen del contenido..." required value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
        </div>

        <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => setView('home')} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generando...' : 'Generar y Registrar Oficio'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PermisoForm({ setView }) {
  const [formData, setFormData] = useState({
    funcionarioId: localStorage.getItem('lastPermisoUser') || '',
    tipoPermiso: 'Día Administrativo',
    jornada: 'Completa',
    fechaInicio: '',
    fechaFin: '',
    motivo: ''
  });
  const [daysInfo, setDaysInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(false);
  const [successId, setSuccessId] = useState(null);

  // Re-check days automatically when user changes
  useEffect(() => {
    if (formData.funcionarioId) {
      setLoadingDays(true);
      checkPermisosDays(parseInt(formData.funcionarioId)).then(info => {
        setDaysInfo(info);
        setLoadingDays(false);
      });
    } else {
      setDaysInfo(null);
    }
  }, [formData.funcionarioId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.funcionarioId) return alert('Debes seleccionar quién eres.');

    // Guardamos la preferencia de funcionario
    localStorage.setItem('lastPermisoUser', formData.funcionarioId);

    // Validar si es Dia Administrativo y excede 6 dias
    if (formData.tipoPermiso === 'Día Administrativo' && daysInfo) {
      // Calculo burdo para validar (1 día o rango)
      let requested = 0;
      if (formData.jornada.includes('Medio Día')) {
        requested = 0.5;
        if (formData.fechaInicio !== formData.fechaFin) {
          return alert('Si es medio día, la fecha de inicio y de fin deben ser el mismo día.');
        }
      } else {
        const start = new Date(formData.fechaInicio);
        const end = new Date(formData.fechaFin);
        requested = Math.abs(Math.ceil((end - start) / (1000 * 60 * 60 * 24))) + 1;
      }

      if (requested > daysInfo.left) {
        return alert(`¡Error! Estás pidiendo ${requested} día(s), pero solo te quedan ${daysInfo.left} disponibles según nuestros registros.`);
      }
    }

    setLoading(true);
    try {
      const func = sortedUsers.find(u => u.id === parseInt(formData.funcionarioId));
      const permisoData = {
        funcionarioId: func.id,
        funcionarioNombre: func.name,
        funcionarioEmail: func.email,
        tipoPermiso: formData.tipoPermiso,
        jornada: formData.jornada,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        motivo: formData.motivo,
        estado: 'Autorizado' // Segun logica nueva, se registra lo ya autorizado
      };

      const saved = await savePermiso(permisoData);

      // Send Email!
      const finalTaken = (daysInfo?.taken || 0) + saved.diasUsados;
      const finalLeft = 6 - finalTaken;
      await sendPermisoEmail(func.email, func.name, finalTaken, finalLeft, saved);

      setSuccessId(saved.id);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="card text-center animate-fade-in" style={{ maxWidth: '500px', margin: '3rem auto', padding: '3rem' }}>
        <div style={{ background: '#dcfce7', color: '#166534', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Save size={40} />
        </div>
        <h2 style={{ color: 'var(--primary)' }}>Permiso Guardado Exitosamente</h2>
        <p className="text-muted mb-4">El comprobante ha sido registrado y se ha enviado un correo de respaldo incluyendo el balance de tus días.</p>
        <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', color: '#1e3a8a', marginBottom: '2rem' }}>
          {successId}
        </div>
        <button className="btn btn-primary" onClick={() => setView('home')}>Volver al Inicio</button>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => setView('home')} className="btn" style={{ padding: 0, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={20} /><span style={{ marginLeft: '0.25rem' }}>Volver</span>
      </button>

      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Registrar Permiso Administrativo (Autorizado)</h2>

      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.875rem', margin: 0 }}><strong>Nota Importante:</strong> Este módulo es para registrar permisos que <u>ya fueron aprobados</u> previamente. El sistema alertará o bloqueará si se exceden los 6 días anuales permitidos.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="input-label">Funcionario</label>
          <select className="input-field" required value={formData.funcionarioId} onChange={e => setFormData({ ...formData, funcionarioId: e.target.value })}>
            <option value="">-- Seleccionar Funcionario --</option>
            {sortedUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {loadingDays && <p className="text-muted" style={{ fontSize: '0.875rem' }}>Calculando días disponibles...</p>}
        {daysInfo && (
          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>Histórico Días Usados: <strong>{daysInfo.taken}</strong></span>
            <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 'bold' }}>Disponibles: {daysInfo.left}</span>
          </div>
        )}

        <div>
          <label className="input-label">Tipo de Permiso</label>
          <select className="input-field" value={formData.tipoPermiso} onChange={(e) => setFormData({ ...formData, tipoPermiso: e.target.value })} required>
            <option value="Día Administrativo">Día Administrativo (Carga a los 6 días)</option>
            <option value="Día de Cumpleaños">Día de Cumpleaños</option>
            <option value="Permiso por Matrimonio / Unión Civil">Permiso por Matrimonio / Unión Civil</option>
            <option value="Permiso por Fallecimiento">Permiso por Fallecimiento (Familiar Directo)</option>
            <option value="Justificación Médica">Justificación Médica</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Jornada</label>
            <select className="input-field" value={formData.jornada} onChange={(e) => {
              const newJornada = e.target.value;
              setFormData(prev => ({
                ...prev,
                jornada: newJornada,
                // Force end date to be same as start date if it's a half day
                fechaFin: newJornada.includes('Medio Día') ? prev.fechaInicio : prev.fechaFin
              }));
            }} required>
              <option value="Completa">Día Completo</option>
              <option value="Medio Día (Mañana)">Medio Día (Mañana)</option>
              <option value="Medio Día (Tarde)">Medio Día (Tarde)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Fecha Inicio</label>
            <input type="date" className="input-field" required value={formData.fechaInicio} onChange={(e) => {
              const newStart = e.target.value;
              setFormData(prev => ({
                ...prev,
                fechaInicio: newStart,
                // Match end date automatically if half day
                fechaFin: prev.jornada.includes('Medio Día') ? newStart : prev.fechaFin
              }));
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Fecha Fin (inclusive)</label>
            <input type="date" className="input-field" required value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              // Deshabilitar la fecha fin si es medio dia para evitar inconsistencias
              disabled={formData.jornada.includes('Medio Día')}
              // Add a hint title if disabled
              title={formData.jornada.includes('Medio Día') ? "Medio día solo aplica a una misma fecha" : ""}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Motivo u Observación</label>
          <textarea className="input-field" rows="3" placeholder="Información adicional del permiso..." required value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} />
        </div>

        <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => setView('home')} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading || (formData.tipoPermiso === 'Día Administrativo' && daysInfo && daysInfo.left <= 0)}>
            {loading ? 'Guardando y Enviando Correo...' : 'Registrar y Notificar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Dashboard({ setView }) {
  const [tab, setTab] = useState('oficios');
  const [oficios, setOficios] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingOficio, setEditingOficio] = useState(null);
  const [editingPermiso, setEditingPermiso] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const o = await loadOficios();
      const p = await loadPermisos();
      setOficios(o);
      setPermisos(p);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDeleteOficio = async (id) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar el Oficio ${id}? Esta acción es irreversible.`)) {
      await deleteOficio(id);
      setOficios(oficios.filter(o => o.id !== id));
    }
  };

  const handleEditOficioSubmit = async (e) => {
    e.preventDefault();
    await updateOficio(editingOficio.id, editingOficio);
    setOficios(oficios.map(o => o.id === editingOficio.id ? editingOficio : o));
    setEditingOficio(null);
  };

  const handleDeletePermiso = async (id) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar el Permiso Administrativo ${id}? Se devolverán los días al funcionario.`)) {
      await deletePermiso(id);
      setPermisos(permisos.filter(p => p.id !== id));
    }
  };

  const handleEditPermisoSubmit = async (e) => {
    e.preventDefault();
    await updatePermiso(editingPermiso.id, editingPermiso);
    // Recargar permisos para obtener el calculo correcto de diasUsados de la BD
    const p = await loadPermisos();
    setPermisos(p);
    setEditingPermiso(null);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM para Excel

    if (tab === 'oficios') {
      csvContent += "ID,Fecha,Emisor,Destinatario,Materia\n";
      oficios.forEach(o => {
        const row = [o.id, new Date(o.createdAt || o.fechaEmision).toLocaleDateString(), `"${o.emisorNombre}"`, `"${o.destinatario}"`, `"${o.materia}"`].join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "ID,Fecha Registro,Funcionario,Fecha Inicio,Fecha Fin,Dias Usados,Jornada\n";
      permisos.forEach(p => {
        const row = [p.id, new Date(p.createdAt || new Date()).toLocaleDateString(), `"${p.funcionarioNombre}"`, p.fechaInicio, p.fechaFin, p.diasUsados, p.jornada || "Completa"].join(",");
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_${tab}_CEIA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareWhatsApp = () => {
    const today = new Date().toLocaleDateString();
    let text = `*Reporte Diario CEIA* (${today})\n\n`;

    if (tab === 'oficios') {
      text += `*Total Oficios Registrados: ${oficios.length}*\n`;
      const recientes = oficios.slice(0, 5); // Últimos 5
      recientes.forEach(o => { text += `- [#${o.id}] De: ${o.emisorNombre} Para: ${o.destinatario}\n`; });
      if (oficios.length > 5) text += `...y ${oficios.length - 5} más.\n`;
    } else {
      text += `*Total Permisos: ${permisos.length}*\n`;
      const recientes = permisos.slice(0, 5);
      recientes.forEach(p => { text += `- [#${p.id}] ${p.funcionarioNombre} (${p.diasUsados} días)\n`; });
      if (permisos.length > 5) text += `...y ${permisos.length - 5} más.\n`;
    }

    text += `\n_Para mayor detalle revise el Portal Administrativo._`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ flexGrow: 1 }}>
      <button onClick={() => setView('home')} className="btn" style={{ padding: 0, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={20} /><span style={{ marginLeft: '0.25rem' }}>Volver al Menú Principal</span>
      </button>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: 1, borderTop: '4px solid var(--primary)' }}>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Total Oficios Emitidos</p>
          <h3 style={{ fontSize: '2rem' }}>{oficios.length}</h3>
        </div>
        <div className="card" style={{ flex: 1, borderTop: '4px solid #166534' }}>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Total Permisos Registrados</p>
          <h3 style={{ fontSize: '2rem' }}>{permisos.length}</h3>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="flex gap-4">
          <button onClick={() => setTab('oficios')} className={`btn ${tab === 'oficios' ? 'btn-primary' : 'text-muted'}`} style={tab !== 'oficios' ? { background: 'transparent', color: 'var(--text-color)' } : {}}>
            Oficios
          </button>
          <button onClick={() => setTab('permisos')} className={`btn ${tab === 'permisos' ? 'btn-primary' : 'text-muted'}`} style={tab !== 'permisos' ? { background: 'transparent', color: 'var(--text-color)' } : {}}>
            Permisos
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }} title="Descargar como Excel">
            <Download size={16} /> <span className="hidden sm:inline">Descargar CSV</span>
          </button>
          <button onClick={shareWhatsApp} className="btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', background: '#25D366', color: 'white' }} title="Enviar Reporte por WhatsApp">
            <MessageCircle size={16} /> <span className="hidden sm:inline">Enviar Resumen</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted">Cargando base de datos...</p>
      ) : tab === 'oficios' ? (
        <div className="card table-container">
          <table>
            <thead><tr><th>Nº Oficio</th><th>Fecha</th><th>Emisor</th><th>Destinatario</th><th>Materia</th><th className="text-center">Acciones</th></tr></thead>
            <tbody>
              {oficios.map(o => (
                <tr key={o.id}>
                  <td className="font-semibold">{o.id}</td>
                  <td>{new Date(o.createdAt || o.fechaEmision).toLocaleDateString()}</td>
                  <td>{o.emisorNombre}</td>
                  <td>{o.destinatario}</td>
                  <td>{o.materia}</td>
                  <td className="text-center">
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => setEditingOficio(o)} title="Editar Oficio">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', color: '#ef4444', borderColor: '#fee2e2' }} onClick={() => handleDeleteOficio(o.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {oficios.length === 0 && <tr><td colSpan="6" className="text-center">No hay oficios.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card table-container">
          <table>
            <thead><tr><th>Nº Permiso</th><th>Fecha Registro</th><th>Funcionario</th><th>Fechas</th><th>Días</th><th className="text-center">Acciones</th></tr></thead>
            <tbody>
              {permisos.map(p => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.id}</td>
                  <td>{new Date(p.createdAt || new Date()).toLocaleDateString()}</td>
                  <td>{p.funcionarioNombre}</td>
                  <td>{p.fechaInicio} a {p.fechaFin}</td>
                  <td>
                    <span className="badge badge-gray">{p.diasUsados}</span>
                    {p.jornada && p.jornada.includes('Medio') && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{p.jornada}</div>}
                  </td>
                  <td className="text-center">
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => setEditingPermiso(p)} title="Editar Permiso">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', color: '#ef4444', borderColor: '#fee2e2' }} onClick={() => handleDeletePermiso(p.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {permisos.length === 0 && <tr><td colSpan="6" className="text-center">No hay permisos.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE EDICIÓN OFICIO */}
      {editingOficio && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Editar Oficio #{editingOficio.id}</h3>
            <form onSubmit={handleEditOficioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Destinatario</label>
                <input type="text" className="input-field" required value={editingOficio.destinatario} onChange={(e) => setEditingOficio({ ...editingOficio, destinatario: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Materia o Asunto</label>
                <input type="text" className="input-field" required value={editingOficio.materia} onChange={(e) => setEditingOficio({ ...editingOficio, materia: e.target.value })} />
              </div>
              <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingOficio(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN PERMISO */}
      {editingPermiso && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Editar Permiso #{editingPermiso.id}</h3>
            <form onSubmit={handleEditPermisoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Fecha Inicio</label>
                <input type="date" className="input-field" required value={editingPermiso.fechaInicio} onChange={(e) => {
                  const newStart = e.target.value;
                  setEditingPermiso(prev => ({ ...prev, fechaInicio: newStart, fechaFin: prev.jornada?.includes('Medio Día') ? newStart : prev.fechaFin }));
                }} />
              </div>
              <div>
                <label className="input-label">Fecha Fin</label>
                <input type="date" className="input-field" required value={editingPermiso.fechaFin} disabled={editingPermiso.jornada?.includes('Medio Día')} onChange={(e) => setEditingPermiso({ ...editingPermiso, fechaFin: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Motivo</label>
                <textarea className="input-field" rows="2" required value={editingPermiso.motivo} onChange={(e) => setEditingPermiso({ ...editingPermiso, motivo: e.target.value })} />
              </div>
              <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingPermiso(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
