import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Calendar, LayoutDashboard, ArrowLeft, Search, Plus, Save, Download, Eye, AlertCircle, Edit2, Trash2, MessageCircle, Mail, BarChart2, PieChart as PieChartIcon, Cake, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { users } from './data/users';
import { alumnosBirthdays, funcionariosBirthdays } from './data/birthdays';
import BirthdayModal from './components/BirthdayModal';
import Selector from './components/Selector';
import { loadOficios, loadPermisos, saveOficio, savePermiso, checkPermisosDays, deleteOficio, deletePermiso, updateOficio, updatePermiso, saveLicencia, loadLicencias, deleteLicencia, updateLicencia } from './services/db';
import { sendPermisoEmail, sendAdminEmail } from './services/email';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import './index.css';

const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name, 'es'));
// IDs autorizados para emitir oficios
const authorizedOficioIds = [36, 7, 16, 23, 17, 19, 10];
const oficioEmitters = sortedUsers.filter(u => authorizedOficioIds.includes(u.id));

export default function App() {
  const [view, setViewInternal] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['home', 'oficio', 'permiso', 'licencia', 'dashboard'].includes(hash) ? hash : 'home';
  });

  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [selector, setSelector] = useState({ isOpen: false, title: '', subtitle: '', items: [], onSelect: () => {} });

  // Verificar si hay cumpleaños hoy para la notificación
  const hasBirthdaysToday = React.useMemo(() => {
    const today = new Date();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const check = (list) => list.some(p => {
      if (!p.fechaNac) return false;
      const parts = p.fechaNac.split('-');
      return parseInt(parts[1]) === m && parseInt(parts[2]) === d;
    });
    return check(alumnosBirthdays) || check(funcionariosBirthdays);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setViewInternal(['home', 'oficio', 'permiso', 'licencia', 'dashboard'].includes(hash) ? hash : 'home');
    };

    window.addEventListener('hashchange', handleHashChange);

    // Si no hay hash aseguramos el #home en la historia inicial sin afectar la pila de retroceso
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#home');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setView = (newView) => {
    window.location.hash = newView;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <header className="header-glass" style={{
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-xl)',
        marginBottom: '2.5rem',
        maxWidth: '1240px',
        margin: '1rem auto 2.5rem auto',
        width: '100%',
        position: 'sticky',
        top: '1rem',
        zIndex: 100
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
            {/* Botón de Cumpleaños */}
            <button 
              onClick={() => setIsBirthdayModalOpen(true)}
              className="flex items-center gap-2"
              style={{ 
                background: hasBirthdaysToday ? 'linear-gradient(135deg, #fb923c, #f97316)' : 'rgba(255,255,255,0.1)', 
                padding: '0.5rem 1rem', 
                borderRadius: '99px',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                transition: 'var(--transition)',
                boxShadow: hasBirthdaysToday ? '0 0 15px rgba(251, 146, 60, 0.4)' : 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Cake size={18} className={hasBirthdaysToday ? 'animate-bounce' : ''} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cumpleaños</span>
              {hasBirthdaysToday && <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', display: 'inline-block' }}></span>}
            </button>

            <div style={{ background: 'white', borderRadius: '8px', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center' }}>
              <img src="./logos.png" alt="Logos CEIA" style={{ height: '40px', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>

            <div style={{ fontSize: '0.8rem', opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem', borderRadius: '99px' }} className="hidden sm:block">
              Sistema Administrativo
            </div>
          </div>
        </div>
      </header>

      <BirthdayModal isOpen={isBirthdayModalOpen} onClose={() => setIsBirthdayModalOpen(false)} />
      
      <Selector 
        isOpen={selector.isOpen} 
        onClose={() => setSelector({ ...selector, isOpen: false })}
        title={selector.title}
        subtitle={selector.subtitle}
        items={selector.items}
        onSelect={selector.onSelect}
      />

      <main className="container p-6 animate-fade-in" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {view === 'home' && <HomeScreen setView={setView} />}
        {view === 'oficio' && <OficioForm setView={setView} setSelector={setSelector} />}
        {view === 'permiso' && <PermisoForm setView={setView} setSelector={setSelector} />}
        {view === 'licencia' && <LicenciaForm setView={setView} setSelector={setSelector} />}
        {view === 'dashboard' && <Dashboard setView={setView} setSelector={setSelector} />}
      </main>
    </div>
  );
}

function HomeScreen({ setView }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '4rem 0' }}>
      <div className="text-center mb-12 animate-fade-in">
        <h2 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--primary), #1e3a8a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.04em', fontWeight: 800 }}>Bienvenido al Portal</h2>
        <p className="text-muted" style={{ fontSize: '1.25rem', fontWeight: 500 }}>¿Qué trámite deseas realizar hoy?</p>
      </div>

      <div className="flex gap-8 flex-wrap justify-center w-full" style={{ maxWidth: '1000px' }}>
        <button
          className="card animate-fade-in"
          style={{ 
            flex: '1 1 340px', 
            padding: '3.5rem 2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            cursor: 'pointer',
            transition: 'var(--transition-slow)'
          }}
          onClick={() => setView('oficio')}
        >
          <div style={{ 
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
            color: '#1e40af', 
            padding: '2rem', 
            borderRadius: '28px', 
            marginBottom: '2rem', 
            boxShadow: '0 8px 20px rgba(30, 64, 175, 0.15), inset 0 2px 4px rgba(255,255,255,0.8)' 
          }}>
            <FileText size={56} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>Registro de Oficios</h3>
          <p className="text-muted" style={{ fontSize: '1rem', lineHeight: 1.6 }}>Generar documentos oficiales y asignar números correlativos en tiempo real.</p>
        </button>

        <button
          className="card animate-fade-in"
          style={{ 
            flex: '1 1 340px', 
            padding: '3.5rem 2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            cursor: 'pointer',
            transition: 'var(--transition-slow)'
          }}
          onClick={() => setView('permiso')}
        >
          <div style={{ 
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
            color: '#166534', 
            padding: '2rem', 
            borderRadius: '28px', 
            marginBottom: '2rem', 
            boxShadow: '0 8px 20px rgba(22, 101, 52, 0.15), inset 0 2px 4px rgba(255,255,255,0.8)' 
          }}>
            <Calendar size={56} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>Permisos Administrativos</h3>
          <p className="text-muted" style={{ fontSize: '1rem', lineHeight: 1.6 }}>Gestión de días y medios días para funcionarios con control de cupos.</p>
        </button>

        <button
          className="card animate-fade-in"
          style={{ 
            flex: '1 1 340px', 
            padding: '3.5rem 2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            cursor: 'pointer',
            transition: 'var(--transition-slow)'
          }}
          onClick={() => setView('licencia')}
        >
          <div style={{ 
            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', 
            color: '#be185d', 
            padding: '2rem', 
            borderRadius: '28px', 
            marginBottom: '2rem', 
            boxShadow: '0 8px 20px rgba(190, 24, 93, 0.15), inset 0 2px 4px rgba(255,255,255,0.8)' 
          }}>
            <Activity size={56} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>Licencias Médicas</h3>
          <p className="text-muted" style={{ fontSize: '1rem', lineHeight: 1.6 }}>Registro continuo de ausencias por salud y control de sumatorias anuales.</p>
        </button>
      </div>

      <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <button
          className="btn btn-outline"
          style={{ 
            gap: '0.75rem', 
            padding: '1rem 2.5rem', 
            borderRadius: '99px', 
            fontWeight: 700, 
            fontSize: '1rem',
            background: 'rgba(255,255,255,0.8)',
            border: '2px solid var(--border)'
          }}
          onClick={() => setView('dashboard')}
        >
          <LayoutDashboard size={20} />
          Panel de Control Administrativo
        </button>
      </div>
    </div>
  );
}

function OficioForm({ setView, setSelector }) {
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
      await sendAdminEmail('Registro de Oficio', emisor.name, emisor.email, saved);
      setSuccessId(saved.id);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="card text-center animate-fade-in" style={{ maxWidth: '480px', margin: '4rem auto', padding: '4rem 3rem', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', 
          color: '#166534', 
          width: '96px', 
          height: '96px', 
          borderRadius: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 2rem',
          boxShadow: '0 8px 16px rgba(22, 101, 52, 0.15)'
        }}>
          <Save size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Oficio Registrado</h2>
        <p className="text-muted mb-8" style={{ fontSize: '1.05rem' }}>El documento oficial ha sido generado y archivado correctamente con el correlativo:</p>
        
        <div style={{ 
          background: 'hsl(210, 40%, 98%)', 
          padding: '1.5rem', 
          borderRadius: '20px', 
          fontSize: '2.5rem', 
          fontWeight: 900, 
          letterSpacing: '4px', 
          color: 'var(--primary)', 
          marginBottom: '2.5rem',
          border: '2px dashed var(--border)',
          display: 'inline-block',
          width: '100%'
        }}>
          {successId}
        </div>
        
        <button className="btn btn-primary w-full" onClick={() => setView('home')} style={{ padding: '1rem', fontSize: '1.125rem' }}>Finalizar y Volver</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <button onClick={() => setView('home')} className="btn" style={{ padding: 0, marginBottom: '2rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={18} /><span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>Volver a la selección de trámites</span>
      </button>

      <div className="card" style={{ padding: '3rem' }}>
        <div className="flex items-center gap-4 mb-8">
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '16px' }}>
            <FileText size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Registro de Oficios</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Cerrando ciclo administrativo 2026</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="input-label">Emisor Responsable</label>
            <div 
              className="input-field flex items-center justify-between cursor-pointer" 
              onClick={() => setSelector({
                isOpen: true,
                title: 'Seleccionar Emisor',
                subtitle: 'Elija su identidad autorizada para este documento',
                items: oficioEmitters,
                onSelect: (item) => setFormData({ ...formData, emisorId: item.id.toString() })
              })}
              style={{ background: 'var(--background)' }}
            >
              <span style={{ color: formData.emisorId ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {formData.emisorId 
                  ? sortedUsers.find(u => u.id === parseInt(formData.emisorId))?.name 
                  : '-- Presione para seleccionar --'}
              </span>
              <Search size={18} />
            </div>
          </div>
          <div>
            <label className="input-label">Institución o Persona Destinataria</label>
            <input type="text" className="input-field" placeholder="Ej: Dirección Regional de Educación..." required value={formData.destinatario} onChange={e => setFormData({ ...formData, destinatario: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Materia o Asunto Principal</label>
            <input type="text" className="input-field" placeholder="Ej: Solicitud de insumos pedagógicos..." required value={formData.materia} onChange={e => setFormData({ ...formData, materia: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Resumen del Contenido</label>
            <textarea className="input-field" rows="4" placeholder="Describa brevemente el objetivo del documento..." required value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
          </div>

          <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setView('home')} disabled={loading}>Descartar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '220px' }}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                  Registrando...
                </div>
              ) : 'Generar Correlativo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const handleOficioSubmission = async (formData, users, setLoading, setSuccessId) => {
  setLoading(true);
  try {
    const saved = await saveOficio(formData);
    const emisor = users.find(u => String(u.id) === String(formData.emisorId));
    if (emisor && emisor.email) {
      await sendAdminEmail('Registro de Oficio', emisor.name, emisor.email, saved);
    }
    setSuccessId(saved.id);
  } catch (error) {
    alert("Error al guardar: " + error.message);
  } finally {
    setLoading(false);
  }
};

function PermisoForm({ setView, setSelector }) {
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
      checkPermisosDays(formData.funcionarioId).then(info => {
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
      <div className="card text-center animate-fade-in" style={{ maxWidth: '480px', margin: '4rem auto', padding: '4rem 3rem', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', 
          color: '#166534', 
          width: '96px', 
          height: '96px', 
          borderRadius: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 2rem',
          boxShadow: '0 8px 16px rgba(22, 101, 52, 0.15)'
        }}>
          <Calendar size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Permiso Registrado</h2>
        <p className="text-muted mb-8" style={{ fontSize: '1.05rem' }}>Se ha generado el comprobante <strong>#{successId}</strong>. El funcionario recibirá un correo con el detalle y balance actualizado.</p>
        
        <button className="btn btn-primary w-full" onClick={() => setView('home')} style={{ padding: '1rem', fontSize: '1.125rem' }}>Finalizar y Volver</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <button onClick={() => setView('home')} className="btn" style={{ padding: 0, marginBottom: '2rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={18} /><span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>Volver a la selección de trámites</span>
      </button>

      <div className="card" style={{ padding: '3rem' }}>
        <div className="flex items-center gap-4 mb-2">
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: '16px' }}>
            <Calendar size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Registro de Permisos</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Gestión de ausencias justificadas 2026</p>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, hsl(20, 100%, 97%), hsl(20, 100%, 94%))', border: '1px solid hsl(20, 100%, 90%)', color: 'hsl(20, 100%, 30%)', padding: '1.25rem', borderRadius: '20px', marginBottom: '2rem', marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AlertCircle size={24} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
            <strong>IMPORTANTE:</strong> Registro de permisos <u>pre-aprobados</u>. El sistema valida automáticamente el tope de 6 días anuales.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="input-label">Nombre del Funcionario</label>
            <div 
              className="input-field flex items-center justify-between cursor-pointer" 
              onClick={() => setSelector({
                isOpen: true,
                title: 'Seleccionar Funcionario',
                subtitle: 'Busque el nombre del funcionario que solicita el permiso',
                items: sortedUsers,
                onSelect: (item) => setFormData({ ...formData, funcionarioId: item.id.toString() })
              })}
              style={{ background: 'var(--background)' }}
            >
              <span style={{ color: formData.funcionarioId ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {formData.funcionarioId 
                  ? sortedUsers.find(u => String(u.id) === String(formData.funcionarioId))?.name 
                  : '-- Buscar por nombre --'}
              </span>
              <Search size={18} />
            </div>
          </div>

          {loadingDays && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
              <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Verificando balance administrativo...</span>
            </div>
          )}

          {daysInfo && (
            <div className="flex gap-4 animate-fade-in">
              <div style={{ flex: 1, padding: '1.25rem', backgroundColor: 'hsl(210, 40%, 98%)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Días Utilizados</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{daysInfo.taken}</p>
              </div>
              <div style={{ flex: 1, padding: '1.25rem', backgroundColor: 'hsla(221, 83%, 53%, 0.05)', borderRadius: '16px', border: '1px solid hsla(221, 83%, 53%, 0.1)' }}>
                <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Días Disponibles</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{daysInfo.left}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="input-label">Categoría de Permiso</label>
              <select className="input-field" value={formData.tipoPermiso} onChange={(e) => setFormData({ ...formData, tipoPermiso: e.target.value })} required>
                <option value="Día Administrativo">Día Administrativo</option>
                <option value="Día de Cumpleaños">Día de Cumpleaños</option>
                <option value="Permiso por Matrimonio">Matrimonio / Unión Civil</option>
                <option value="Permiso por Fallecimiento">Fallecimiento</option>
                <option value="Permiso sin goce de sueldo">Sin goce de sueldo</option>
                <option value="Permiso por Especialidad">Especialidad</option>
                <option value="Justificación Médica">Justificación Médica</option>
              </select>
            </div>
            <div>
              <label className="input-label">Jornada</label>
              <select className="input-field" value={formData.jornada} onChange={(e) => {
                const newJornada = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  jornada: newJornada,
                  fechaFin: newJornada.includes('Medio Día') ? prev.fechaInicio : prev.fechaFin
                }));
              }} required>
                <option value="Completa">Completa</option>
                <option value="Medio Día (Mañana)">M. Mañana</option>
                <option value="Medio Día (Tarde)">M. Tarde</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="input-label">Fecha de Inicio</label>
              <input type="date" className="input-field" required value={formData.fechaInicio} onChange={(e) => {
                const newStart = e.target.value;
                setFormData(prev => ({ ...prev, fechaInicio: newStart, fechaFin: prev.jornada.includes('Medio Día') ? newStart : prev.fechaFin }));
              }} />
            </div>
            <div>
              <label className="input-label">Fecha de Término</label>
              <input type="date" className="input-field" required value={formData.fechaFin} disabled={formData.jornada.includes('Medio Día')} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="input-label">Detalles u Observaciones</label>
            <textarea className="input-field" rows="3" placeholder="Indique brevemente el motivo..." required value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} />
          </div>

          <div className="flex gap-4 mt-6" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setView('home')} disabled={loading}>Descartar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || (formData.tipoPermiso === 'Día Administrativo' && daysInfo && daysInfo.left <= 0)} style={{ minWidth: '240px' }}>
              {loading ? (
                 <div className="flex items-center gap-2">
                 <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                 Procesando...
               </div>
              ) : 'Registrar Ausencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LicenciaForm({ setView, setSelector }) {
  const [formData, setFormData] = useState({
    funcionarioId: localStorage.getItem('lastLicenciaUser') || '',
    tipoLicencia: 'Enfermedad Común',
    jornada: 'Completa',
    fechaInicio: '',
    fechaFin: '',
    motivo: ''
  });
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.funcionarioId) return alert('Debes seleccionar un funcionario.');

    localStorage.setItem('lastLicenciaUser', formData.funcionarioId);

    setLoading(true);
    try {
      const func = sortedUsers.find(u => u.id === parseInt(formData.funcionarioId));
      const licenciaData = {
        funcionarioId: func.id,
        funcionarioNombre: func.name,
        funcionarioEmail: func.email,
        tipoLicencia: formData.tipoLicencia,
        jornada: formData.jornada,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        motivo: formData.motivo,
        estado: 'Registrada'
      };

      const saved = await saveLicencia(licenciaData);
      await sendAdminEmail('Registro de Licencia Médica', func.name, func.email, saved);
      setSuccessId(saved.id);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="card text-center animate-fade-in" style={{ maxWidth: '480px', margin: '4rem auto', padding: '4rem 3rem', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', 
          color: '#be185d', 
          width: '96px', 
          height: '96px', 
          borderRadius: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 2rem',
          boxShadow: '0 8px 16px rgba(190, 24, 93, 0.15)'
        }}>
          <Activity size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Licencia Registrada</h2>
        <p className="text-muted mb-8" style={{ fontSize: '1.05rem' }}>Se ha generado y guardado la licencia en el historial, bajo el correlativo <strong>#{successId}</strong>.</p>
        
        <button className="btn btn-primary w-full" onClick={() => setView('home')} style={{ padding: '1rem', fontSize: '1.125rem' }}>Finalizar y Volver</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <button onClick={() => setView('home')} className="btn" style={{ padding: 0, marginBottom: '2rem', color: 'var(--text-muted)' }}>
        <ArrowLeft size={18} /><span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>Volver a la selección de trámites</span>
      </button>

      <div className="card" style={{ padding: '3rem' }}>
        <div className="flex items-center gap-4 mb-8">
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#be185d', padding: '0.75rem', borderRadius: '16px' }}>
            <Activity size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Registro de Licencias Médicas</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Ingreso al expediente de salud laboral</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="input-label">Nombre del Funcionario</label>
            <div 
              className="input-field flex items-center justify-between cursor-pointer" 
              onClick={() => setSelector({
                isOpen: true,
                title: 'Seleccionar Funcionario',
                subtitle: 'Busque el funcionario correspondiente a esta licencia médica',
                items: sortedUsers,
                onSelect: (item) => setFormData({ ...formData, funcionarioId: item.id.toString() })
              })}
              style={{ background: 'var(--background)' }}
            >
              <span style={{ color: formData.funcionarioId ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {formData.funcionarioId 
                  ? sortedUsers.find(u => u.id === parseInt(formData.funcionarioId))?.name 
                  : '-- Buscar por nombre --'}
              </span>
              <Search size={18} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="input-label">Tipo de Licencia</label>
              <select className="input-field" value={formData.tipoLicencia} onChange={(e) => setFormData({ ...formData, tipoLicencia: e.target.value })} required>
                <option value="Enfermedad Común">Enfermedad Común</option>
                <option value="Licencia Maternal">Licencia Maternal</option>
                <option value="Accidente Laboral / Trayecto">Accidente Laboral / Trayecto</option>
                <option value="Enfermedad Profesional">Enfermedad Profesional</option>
                <option value="Otra justificación médica">Otra justificación médica</option>
              </select>
            </div>
            <div>
              <label className="input-label">Jornada</label>
              <select className="input-field" value={formData.jornada} onChange={(e) => {
                const newJornada = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  jornada: newJornada,
                  fechaFin: newJornada.includes('Medio Día') ? prev.fechaInicio : prev.fechaFin
                }));
              }} required>
                <option value="Completa">Completa</option>
                <option value="Medio Día (Mañana)">M. Mañana</option>
                <option value="Medio Día (Tarde)">M. Tarde</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="input-label">Fecha de Inicio</label>
              <input type="date" className="input-field" required value={formData.fechaInicio} onChange={(e) => {
                const newStart = e.target.value;
                setFormData(prev => ({ ...prev, fechaInicio: newStart, fechaFin: prev.jornada.includes('Medio Día') ? newStart : prev.fechaFin }));
              }} />
            </div>
            <div>
              <label className="input-label">Fecha de Término</label>
              <input type="date" className="input-field" required value={formData.fechaFin} disabled={formData.jornada.includes('Medio Día')} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="input-label">Detalles / Diagnóstico Opcional</label>
            <textarea className="input-field" rows="3" placeholder="Información complementaria (opcional)..." value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} />
          </div>

          <div className="flex gap-4 mt-6" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => setView('home')} disabled={loading}>Descartar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '240px' }}>
              {loading ? (
                 <div className="flex items-center gap-2">
                 <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                 Guardando...
               </div>
              ) : 'Registrar Licencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MONTH_OPTIONS = [
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

function Dashboard({ setView, setSelector }) {
  const [tab, setTab] = useState('oficios');
  const [oficios, setOficios] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState([3, 4, 5]); // Meses seleccionados para el reporte

  const [editingOficio, setEditingOficio] = useState(null);
  const [editingPermiso, setEditingPermiso] = useState(null);
  const [editingLicencia, setEditingLicencia] = useState(null);
  const [historyFuncionario, setHistoryFuncionario] = useState(null);
  const [permisoViewMode, setPermisoViewMode] = useState('table'); // 'table' or 'calendar'
  const [licenciaViewMode, setLicenciaViewMode] = useState('table');

  const toggleMonth = (monthVal) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthVal)) {
        // No permitir deseleccionar todos
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== monthVal);
      }
      return [...prev, monthVal].sort((a, b) => a - b);
    });
  };

  const selectedMonthsLabel = selectedMonths.map(m => MONTH_OPTIONS.find(o => o.value === m)?.label).filter(Boolean).join('_');

  const isAnyModalOpen = Boolean(editingOficio || editingPermiso || editingLicencia || historyFuncionario);

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setEditingOficio(null);
        setEditingPermiso(null);
        setEditingLicencia(null);
        setHistoryFuncionario(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    async function fetchData() {
      const [o, p, l] = await Promise.all([loadOficios(), loadPermisos(), loadLicencias()]);
      setOficios(o);
      setPermisos(p);
      setLicencias(l);
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
    try {
      await updateOficio(editingOficio.id, editingOficio);
      setOficios(oficios.map(o => o.id === editingOficio.id ? editingOficio : o));
      setEditingOficio(null);
    } catch (error) {
      alert('No se pudo guardar el oficio: ' + error.message);
    }
  };

  const handleDeletePermiso = async (id) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar el Permiso Administrativo ${id}? Se devolverán los días al funcionario.`)) {
      await deletePermiso(id);
      setPermisos(permisos.filter(p => p.id !== id));
    }
  };

  const handleEditPermisoSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePermiso(editingPermiso.id, editingPermiso);
      const p = await loadPermisos();
      setPermisos(p);
      setEditingPermiso(null);
    } catch (error) {
      alert('No se pudo guardar el permiso: ' + error.message);
    }
  };

  const handleDeleteLicencia = async (id) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar la Licencia Médica ${id}?`)) {
      await deleteLicencia(id);
      setLicencias(licencias.filter(l => l.id !== id));
    }
  };

  const handleEditLicenciaSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateLicencia(editingLicencia.id, editingLicencia);
      const l = await loadLicencias();
      setLicencias(l);
      setEditingLicencia(null);
    } catch (error) {
      alert('No se pudo guardar la licencia: ' + error.message);
    }
  };

  const filterByDate = (dateString) => {
    if (!dateString) return false;
    // Try parsing YYYY-MM-DD directly first
    const parts = String(dateString).split('-');
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      return selectedMonths.includes(m);
    }
    const date = new Date(dateString);
    if (isNaN(date)) return false;
    const m = date.getMonth() + 1;
    return selectedMonths.includes(m);
  };

  // --- Helper: construir datos para exportar permisos ---
  const buildPermisosData = () => {
    const filteredPermisos = permisos.filter(p => filterByDate(p.fechaInicio || p.createdAt));
    const rows = [];
    users.forEach(u => {
      const userPermisos = filteredPermisos.filter(p => p.funcionarioId === u.id || String(p.funcionarioId) === String(u.id));
      const totalUsados = userPermisos.reduce((acc, p) => acc + (p.diasUsados || 0), 0);
      if (userPermisos.length > 0) {
        userPermisos.forEach((p, index) => {
          rows.push([
            u.name,
            u.rut || 'Sin Registro',
            `${p.fechaInicio}${p.fechaInicio !== p.fechaFin ? ' al ' + p.fechaFin : ''}`,
            p.jornada || 'Completa',
            index === 0 ? totalUsados : ''
          ]);
        });
      } else {
        rows.push([u.name, u.rut || 'Sin Registro', 'Ninguno', '-', 0]);
      }
    });
    rows.sort((a, b) => a[0].localeCompare(b[0], 'es'));
    return rows;
  };

  // --- EXPORTAR EXCEL CON FORMATO PROFESIONAL ---
  const exportToExcel = () => {
    const filename = `reporte_${tab}_CEIA_${selectedMonthsLabel}.xlsx`;

    // Estilos comunes
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
      fill: { fgColor: { rgb: '2563EB' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
    const cellStyle = {
      font: { sz: 10, name: 'Calibri' },
      alignment: { vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
    const numberStyle = {
      ...cellStyle,
      alignment: { ...cellStyle.alignment, horizontal: 'center' }
    };

    let headers = [];
    let dataRows = [];
    let colWidths = [];

    if (tab === 'oficios') {
      const filteredOficios = oficios.filter(o => filterByDate(o.createdAt || o.fechaEmision));
      headers = ['ID', 'Fecha', 'Emisor', 'Destinatario', 'Materia'];
      dataRows = filteredOficios.map(o => [
        o.id,
        new Date(o.createdAt || o.fechaEmision).toLocaleDateString(),
        o.emisorNombre,
        o.destinatario,
        o.materia
      ]);
      colWidths = [{ wch: 8 }, { wch: 14 }, { wch: 42 }, { wch: 40 }, { wch: 50 }];
    } else if (tab === 'permisos') {
      headers = ['Nombre', 'RUT', 'Día del Permiso', 'Jornada', 'Total'];
      dataRows = buildPermisosData();
      colWidths = [{ wch: 45 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 8 }];
    } else if (tab === 'licencias') {
      const filteredLicencias = licencias.filter(l => filterByDate(l.fechaInicio || l.createdAt));
      headers = ['ID', 'Fecha Registro', 'Funcionario', 'Fecha Inicio', 'Fecha Fin', 'Días Usados', 'Jornada', 'Tipo'];
      dataRows = filteredLicencias.map(l => [
        l.id,
        new Date(l.createdAt || new Date()).toLocaleDateString(),
        l.funcionarioNombre,
        l.fechaInicio,
        l.fechaFin,
        l.diasUsados,
        l.jornada || 'Completa',
        l.tipoLicencia
      ]);
      colWidths = [{ wch: 8 }, { wch: 16 }, { wch: 42 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 28 }];
    }

    // Construir el worksheet manualmente para aplicar estilos
    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Aplicar anchos de columna
    ws['!cols'] = colWidths;

    // Aplicar estilos a cada celda
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;
        if (R === 0) {
          // Fila de encabezado
          ws[cellRef].s = headerStyle;
        } else {
          // Celdas de datos - detectar si es numérico para centrar
          const val = ws[cellRef].v;
          if (typeof val === 'number') {
            ws[cellRef].s = numberStyle;
          } else {
            ws[cellRef].s = cellStyle;
          }
        }
      }
    }

    // Altura de fila para encabezado
    ws['!rows'] = [{ hpx: 28 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab.toUpperCase());
    XLSX.writeFile(wb, filename);
  };

  // --- EXPORTAR PDF ---
  const exportToPDF = async () => {
    try {
      const monthsTitle = selectedMonths.map(m => MONTH_OPTIONS.find(o => o.value === m)?.label).filter(Boolean).join(', ');
      const doc = new jsPDF({ orientation: tab === 'licencias' ? 'landscape' : 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Intentar cargar el logo del colegio
      let logoLoaded = false;
      try {
        const logoImg = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('No se pudo cargar el logo'));
          img.src = './logo_ceia.jpg';
        });
        // Agregar logo: x=14, y=10, ancho=22, alto=22
        doc.addImage(logoImg, 'JPEG', 14, 10, 22, 22);
        logoLoaded = true;
      } catch (imgError) {
        console.warn("No se pudo cargar el logo para el PDF, continuando sin él:", imgError);
      }

      // Dibujar membrete escolar formal para SLEP Los Álamos
      const startTextX = logoLoaded ? 40 : 14;
      
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(37, 99, 235); // Color azul principal
      doc.text("CEIA JUANITA ZÚÑIGA FUENTES", startTextX, 15);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text("Servicio Local de Educación Pública Los Álamos", startTextX, 20);

      let reportTitle = "";
      if (tab === 'permisos') reportTitle = "Reporte Consolidado de Permisos Administrativos";
      else if (tab === 'oficios') reportTitle = "Reporte Consolidado de Oficios Cursados";
      else if (tab === 'licencias') reportTitle = "Reporte Consolidado de Licencias Médicas";
      else reportTitle = `Reporte Consolidado de ${tab.charAt(0).toUpperCase() + tab.slice(1)}`;

      doc.text(reportTitle, startTextX, 25);
      doc.text(`Periodo: ${monthsTitle} 2026  |  Generado: ${new Date().toLocaleDateString('es-CL')}`, startTextX, 30);
      
      // Línea divisoria
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 35, pageWidth - 14, 35);

      let head = [];
      let body = [];

      if (tab === 'oficios') {
        const filteredOficios = oficios.filter(o => filterByDate(o.createdAt || o.fechaEmision));
        head = [['ID', 'Fecha', 'Emisor', 'Destinatario', 'Materia']];
        body = filteredOficios.map(o => [
          o.id,
          new Date(o.createdAt || o.fechaEmision).toLocaleDateString(),
          o.emisorNombre,
          o.destinatario,
          o.materia
        ]);
      } else if (tab === 'permisos') {
        head = [['Nombre', 'RUT', 'Día del Permiso', 'Jornada', 'Total']];
        body = buildPermisosData();
      } else if (tab === 'licencias') {
        const filteredLicencias = licencias.filter(l => filterByDate(l.fechaInicio || l.createdAt));
        head = [['ID', 'Funcionario', 'Inicio', 'Fin', 'Días', 'Jornada', 'Tipo']];
        body = filteredLicencias.map(l => [
          l.id,
          l.funcionarioNombre,
          l.fechaInicio,
          l.fechaFin,
          l.diasUsados,
          l.jornada || 'Completa',
          l.tipoLicencia
        ]);
      }

      autoTable(doc, {
        head: head,
        body: body,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [0, 0, 0],
          lineWidth: 0.25
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: tab === 'permisos' ? {
          0: { cellWidth: 55 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 15, halign: 'center' }
        } : undefined
      });

      // Pie de firma del Director (última página)
      let currentY = doc.lastAutoTable.finalY + 20;
      
      // Si no hay suficiente espacio para la firma (necesita ~40mm), agregar una página nueva
      if (currentY + 40 > pageHeight - 15) {
        doc.addPage();
        currentY = 30;
      }
      
      const lineWidth = 80;
      const lineStartX = (pageWidth - lineWidth) / 2;
      const lineEndX = lineStartX + lineWidth;
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(lineStartX, currentY, lineEndX, currentY);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text("JUAN JOSÉ ARAYA", pageWidth / 2, currentY + 5, { align: 'center' });
      doc.setFont(undefined, 'normal');
      doc.text("Director", pageWidth / 2, currentY + 10, { align: 'center' });
      doc.text("CEIA Juanita Zúñiga Fuentes", pageWidth / 2, currentY + 15, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Servicio Local de Educación Pública Los Álamos", pageWidth / 2, currentY + 20, { align: 'center' });

      // Pie de página con numeración
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }

      doc.save(`reporte_${tab}_CEIA_${selectedMonthsLabel}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF: ' + error.message);
    }
  };

  // --- EXPORTAR PDF INDIVIDUAL POR FUNCIONARIO (Solo Permisos) ---
  const exportFuncionarioPDF = (funcionarioId, funcionarioNombre) => {
    try {
      const func = users.find(u => u.id === funcionarioId || String(u.id) === String(funcionarioId));
      const funcionarioRut = func?.rut || 'Sin Registro';
      const funcionarioPermisos = permisos.filter(p => 
        String(p.funcionarioId) === String(funcionarioId)
      );

      if (funcionarioPermisos.length === 0) {
        return alert('Este funcionario no tiene permisos registrados.');
      }

      const doc = new jsPDF({ orientation: 'portrait' });

      // Encabezado con fondo azul
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 38, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Reporte Individual de Permisos Administrativos', 14, 16);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Funcionario: ${funcionarioNombre}`, 14, 24);
      doc.text(`RUT: ${funcionarioRut}`, 14, 30);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 36);

      // Resetear color de texto
      doc.setTextColor(0, 0, 0);

      // Construir datos de la tabla
      const head = [['#', 'Fecha Registro', 'Periodo de Ausencia', 'Jornada', 'Días']];
      const body = funcionarioPermisos.map((p, idx) => [
        idx + 1,
        new Date(p.createdAt || new Date()).toLocaleDateString('es-CL'),
        `${p.fechaInicio}${p.fechaInicio !== p.fechaFin ? ' al ' + p.fechaFin : ''}`,
        p.jornada || 'Completa',
        p.diasUsados
      ]);

      // Calcular totales
      const totalDias = funcionarioPermisos.reduce((sum, p) => sum + (p.diasUsados || 0), 0);
      const diasAdmin = funcionarioPermisos.filter(p => 
        p.tipoPermiso === 'Día Administrativo' && 
        new Date(p.fechaInicio).getFullYear() === 2026
      ).reduce((sum, p) => sum + (p.diasUsados || 0), 0);

      // Fila de total
      body.push(['', '', '', { content: 'TOTAL DÍAS:', styles: { fontStyle: 'bold', halign: 'right' } }, { content: String(totalDias), styles: { fontStyle: 'bold', halign: 'center' } }]);

      autoTable(doc, {
        head: head,
        body: body,
        startY: 44,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.25
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 32 },
          2: { cellWidth: 55 },
          3: { cellWidth: 40 },
          4: { cellWidth: 20, halign: 'center' }
        }
      });

      // Resumen después de la tabla
      const finalY = doc.lastAutoTable?.finalY || 120;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalY + 8, 182, 28, 3, 3, 'F');
      doc.setDrawColor(37, 99, 235);
      doc.roundedRect(14, finalY + 8, 182, 28, 3, 3, 'S');

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(`Total Permisos Registrados: ${funcionarioPermisos.length}`, 20, finalY + 18);
      doc.text(`Total Días Usados: ${totalDias}`, 20, finalY + 26);
      doc.text(`Días Administrativos 2026: ${diasAdmin} / 6`, 120, finalY + 18);
      doc.text(`Saldo Disponible: ${Math.max(0, 6 - diasAdmin)} días`, 120, finalY + 26);

      // Pie de página
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} — CEIA Los Álamos`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }

      const safeName = funcionarioNombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]/g, '');
      doc.save(`Permisos_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF individual:', error);
      alert('Error al generar el PDF individual. Revisa la consola.');
    }
  };

  const shareWhatsApp = () => {
    const today = new Date().toLocaleDateString();
    let text = `*Reporte Diario CEIA* (${today})\n\n`;

    if (tab === 'oficios') {
      text += `*Total Oficios Registrados: ${oficios.length}*\n`;
      const recientes = oficios.slice(0, 5);
      recientes.forEach(o => { text += `- [#${o.id}] De: ${o.emisorNombre} Para: ${o.destinatario}\n`; });
      if (oficios.length > 5) text += `...y ${oficios.length - 5} más.\n`;
    } else if (tab === 'permisos') {
      text += `*Total Permisos: ${permisos.length}*\n`;
      const recientes = permisos.slice(0, 5);
      recientes.forEach(p => { text += `- [#${p.id}] ${p.funcionarioNombre} (${p.diasUsados} días)\n`; });
      if (permisos.length > 5) text += `...y ${permisos.length - 5} más.\n`;
    } else if (tab === 'licencias') {
      text += `*Total Licencias: ${licencias.length}*\n`;
      const recientes = licencias.slice(0, 5);
      recientes.forEach(l => { text += `- [#${l.id}] ${l.funcionarioNombre} (${l.diasUsados} días)\n`; });
      if (licencias.length > 5) text += `...y ${licencias.length - 5} más.\n`;
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, white, #f8fafc)', 
          borderLeft: '6px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '1.75rem'
        }}>
          <div style={{ 
            background: 'rgba(37, 99, 235, 0.1)', 
            color: 'var(--primary)', 
            padding: '1rem', 
            borderRadius: '18px' 
          }}>
            <FileText size={32} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Oficios Emitidos</p>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{oficios.length}</h3>
          </div>
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, white, #f8fafc)', 
          borderLeft: '6px solid #10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '1.75rem'
        }}>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            color: '#10b981', 
            padding: '1rem', 
            borderRadius: '18px' 
          }}>
            <Calendar size={32} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Permisos Registrados</p>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{permisos.length}</h3>
          </div>
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, white, #f8fafc)', 
          borderLeft: '6px solid #ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '1.75rem'
        }}>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            padding: '1rem', 
            borderRadius: '18px' 
          }}>
            <Activity size={32} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Licencias Médicas</p>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{licencias.length}</h3>
          </div>
        </div>
      </div>

      {/* ZONA DE GRÁFICOS (Solo se muestra cuando hay algo de datos) */}
      {!loading && (oficios.length > 0 || permisos.length > 0) && (
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {/* Gráfico 1: Top Emisores de Oficios */}
          {oficios.length > 0 && (
            <div className="card" style={{ flex: '1 1 300px', padding: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-color)', fontWeight: 600 }}>
                <BarChart2 size={18} color="var(--primary)" /> Emisores más activos (Oficios)
              </h4>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    Object.entries(oficios.reduce((acc, o) => {
                      acc[o.emisorNombre] = (acc[o.emisorNombre] || 0) + 1;
                      return acc;
                    }, {})).map(([name, count]) => ({ name: name.split(' ')[0], count })).sort((a, b) => b.count - a.count).slice(0, 5)
                  } margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico 2: Distribución de Permisos */}
          {permisos.length > 0 && (
            <div className="card" style={{ flex: '1 1 300px', padding: '1.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-color)', fontWeight: 600 }}>
                <PieChartIcon size={18} color="#166534" /> Distribución de Jornadas (Permisos)
              </h4>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        Object.entries(permisos.reduce((acc, p) => {
                          const j = p.jornada || 'Completa';
                          acc[j] = (acc[j] || 0) + 1;
                          return acc;
                        }, {})).map(([name, value]) => ({ name, value }))
                      }
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      {Object.entries(permisos.reduce((acc, p) => {
                        const j = p.jornada || 'Completa';
                        acc[j] = (acc[j] || 0) + 1;
                        return acc;
                      }, {})).map(([name], index) => {
                        const colors = { 'Completa': '#10b981', 'Medio Día (Mañana)': '#3b82f6', 'Medio Día (Tarde)': '#f59e0b' };
                        return <Cell key={`cell-${index}`} fill={colors[name] || '#8b5cf6'} />;
                      })}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        background: 'rgba(255,255,255,0.5)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)', 
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1.5rem',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-sm)'
      }}>
        <div className="flex gap-2">
          <button 
            onClick={() => setTab('oficios')} 
            className="btn"
            style={{ 
              background: tab === 'oficios' ? 'var(--primary)' : 'transparent', 
              color: tab === 'oficios' ? 'white' : 'var(--text-muted)',
              boxShadow: tab === 'oficios' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
              borderRadius: '12px',
              padding: '0.625rem 1.25rem'
            }}
          >
            <FileText size={18} />
            Oficios
          </button>
          <button 
            onClick={() => setTab('permisos')} 
            className="btn"
            style={{ 
              background: tab === 'permisos' ? 'var(--primary)' : 'transparent', 
              color: tab === 'permisos' ? 'white' : 'var(--text-muted)',
              boxShadow: tab === 'permisos' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
              borderRadius: '12px',
              padding: '0.625rem 1.25rem'
            }}
          >
            <Calendar size={18} />
            Permisos
          </button>
          <button 
            onClick={() => setTab('licencias')} 
            className="btn"
            style={{ 
              background: tab === 'licencias' ? 'var(--primary)' : 'transparent', 
              color: tab === 'licencias' ? 'white' : 'var(--text-muted)',
              boxShadow: tab === 'licencias' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
              borderRadius: '12px',
              padding: '0.625rem 1.25rem'
            }}
          >
            <Activity size={18} />
            Licencias Médicas
          </button>
        </div>
        
        {tab === 'permisos' && (
          <div className="flex bg-gray-100 p-1 rounded-lg gap-1" style={{ background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px' }}>
            <button 
              onClick={() => setPermisoViewMode('table')} 
              className="btn" 
              style={{ 
                padding: '0.4rem 1rem', 
                fontSize: '0.8125rem', 
                background: permisoViewMode === 'table' ? 'white' : 'transparent',
                boxShadow: permisoViewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                color: permisoViewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: '8px'
              }}
            >
              Lista
            </button>
            <button 
              onClick={() => setPermisoViewMode('calendar')} 
              className="btn" 
              style={{ 
                padding: '0.4rem 1rem', 
                fontSize: '0.8125rem', 
                background: permisoViewMode === 'calendar' ? 'white' : 'transparent',
                boxShadow: permisoViewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
                color: permisoViewMode === 'calendar' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: '8px'
              }}
            >
              Calendario
            </button>
          </div>
        )}

        {tab === 'licencias' && (
          <div className="flex bg-gray-100 p-1 rounded-lg gap-1" style={{ background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px' }}>
            <button 
              onClick={() => setLicenciaViewMode('table')} 
              className="btn" 
              style={{ 
                padding: '0.4rem 1rem', 
                fontSize: '0.8125rem', 
                background: licenciaViewMode === 'table' ? 'white' : 'transparent',
                boxShadow: licenciaViewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                color: licenciaViewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: '8px'
              }}
            >
              Lista
            </button>
            <button 
              onClick={() => setLicenciaViewMode('calendar')} 
              className="btn" 
              style={{ 
                padding: '0.4rem 1rem', 
                fontSize: '0.8125rem', 
                background: licenciaViewMode === 'calendar' ? 'white' : 'transparent',
                boxShadow: licenciaViewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
                color: licenciaViewMode === 'calendar' ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: '8px'
              }}
            >
              Calendario
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={exportToExcel} className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem', borderRadius: '12px' }} title="Descargar como Excel">
            <Download size={18} /> <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button onClick={exportToPDF} className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem', borderRadius: '12px', borderColor: '#ef4444', color: '#ef4444' }} title="Descargar como PDF">
            <FileText size={18} /> <span className="hidden sm:inline">Exportar PDF</span>
          </button>
          <button onClick={shareWhatsApp} className="btn" style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem', background: '#22c55e', color: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)' }} title="Enviar Reporte por WhatsApp">
            <MessageCircle size={18} /> <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* SELECTOR DE MESES PARA REPORTE */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Meses del Reporte:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {MONTH_OPTIONS.map(mo => {
            const isSelected = selectedMonths.includes(mo.value);
            return (
              <button
                key={mo.value}
                onClick={() => toggleMonth(mo.value)}
                className="btn"
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  borderRadius: '99px',
                  background: isSelected
                    ? 'linear-gradient(135deg, var(--primary), #1e40af)'
                    : 'white',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  border: isSelected ? 'none' : '1px solid #cbd5e1',
                  boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                {mo.label}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: 'auto' }}>
          {selectedMonths.length === 1 ? '1 mes seleccionado' : `${selectedMonths.length} meses seleccionados`}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }}></div>
          <p className="text-muted">Sincronizando con la base de datos...</p>
        </div>
      ) : tab === 'oficios' ? (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>Correlativo</th>
                <th>Fecha Emisión</th>
                <th>Emisor Responsable</th>
                <th>Destinatario</th>
                <th>Materia / Asunto</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {oficios.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>#{o.id}</td>
                  <td>{new Date(o.createdAt || o.fechaEmision).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{o.emisorNombre}</td>
                  <td>{o.destinatario}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.materia}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex justify-end gap-2">
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', borderRadius: '10px', color: '#10b981' }} 
                        onClick={async (e) => {
                          e.preventDefault();
                          const emisor = users.find(u => String(u.id) === String(o.emisorId));
                          if (!emisor || !emisor.email) return alert('El emisor no tiene un correo configurado.');
                          
                          if (window.confirm(`¿Enviar copia de este oficio a ${emisor.email}?`)) {
                            try {
                              const res = await sendAdminEmail('Registro de Oficio', emisor.name, emisor.email, o);
                              if (res.success) {
                                alert(res.mock ? 'MODO SIMULACIÓN: Los datos se mostraron en la consola (F12).' : '✅ Correo enviado exitosamente.');
                              } else {
                                alert('❌ Error al enviar: ' + (res.error?.text || res.error?.message || 'Revisa tu configuración de EmailJS.'));
                              }
                            } catch (err) {
                              alert('Error al realizar la operación: ' + err.message);
                            }
                          }
                        }}
                        title="Notificar por Correo"
                      >
                        <Mail size={16} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '10px' }} onClick={() => setEditingOficio(o)} title="Editar Oficio">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '10px', color: '#ef4444', border: '1px solid #fee2e2' }} onClick={() => handleDeleteOficio(o.id)} title="Eliminar Permanente">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {oficios.length === 0 && <tr><td colSpan="6" className="text-center p-12 text-muted">No se han encontrado registros de oficios.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : tab === 'permisos' ? (
        permisoViewMode === 'calendar' ? (
          <PermissionCalendar permisos={permisos} />
        ) : (
          <div className="table-container animate-fade-in">
            <table>
              <thead>
                <tr>
                  <th>Nº Ticket</th>
                  <th>Registro</th>
                  <th>Funcionario</th>
                  <th>Periodo de Ausencia</th>
                  <th>Días</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {permisos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>#{p.id}</td>
                    <td>{new Date(p.createdAt || new Date()).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn"
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.9375rem',
                          color: 'var(--primary)', 
                          fontWeight: 600,
                          background: 'rgba(37, 99, 235, 0.05)',
                          border: '1px solid rgba(37, 99, 235, 0.1)',
                          borderRadius: '8px'
                        }}
                        onClick={() => setHistoryFuncionario({ id: p.funcionarioId, nombre: p.funcionarioNombre, type: 'permiso' })}
                        title="Ver historial completo"
                      >
                        {p.funcionarioNombre}
                      </button>
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.fechaInicio} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>→</span> {p.fechaFin}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569', width: 'fit-content' }}>{p.diasUsados} días</span>
                        {p.jornada && p.jornada.includes('Medio') && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{p.jornada}</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem', borderRadius: '10px', color: '#2563eb', border: '1px solid #dbeafe' }} 
                          onClick={() => exportFuncionarioPDF(p.funcionarioId, p.funcionarioNombre)}
                          title="Descargar PDF Individual"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem', borderRadius: '10px', color: '#10b981' }} 
                          onClick={async (e) => {
                            e.preventDefault();
                            const func = users.find(u => String(u.id) === String(p.funcionarioId));
                            if (!func || !func.email) return alert('El funcionario no tiene un correo configurado.');

                            const msg = `¿Enviar notificación de este permiso a ${func.email}?\n\nDetalles:\n- Días usados: ${p.diasUsados}\n- Periodo: ${p.fechaInicio} al ${p.fechaFin}`;
                            
                            if (window.confirm(msg)) {
                              try {
                                const { taken, left } = await checkPermisosDays(func.id);
                                const res = await sendPermisoEmail(func.email, func.name, taken, left, p);
                                if (res.success) {
                                  alert(res.mock ? 'MODO SIMULACIÓN: Datos en consola.' : '✅ Correo enviado exitosamente.');
                                } else {
                                  alert('❌ Error al enviar: ' + (res.error?.text || res.error?.message || 'Revisa tu configuración de EmailJS.'));
                                }
                              } catch (err) {
                                alert('Error al realizar la operación: ' + err.message);
                              }
                            }
                          }}
                          title="Notificar por Correo"
                        >
                          <Mail size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '10px' }} onClick={() => setEditingPermiso(p)} title="Modificar Permiso">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '10px', color: '#ef4444', border: '1px solid #fee2e2' }} onClick={() => handleDeletePermiso(p.id)} title="Eliminar Registro">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {permisos.length === 0 && <tr><td colSpan="6" className="text-center p-12 text-muted">No se han encontrado registros de permisos.</td></tr>}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'licencias' ? (
        licenciaViewMode === 'calendar' ? (
          <LicenciaCalendar licencias={licencias} />
        ) : (
          <div className="table-container animate-fade-in">
            <table>
              <thead>
                <tr>
                  <th>Nº Licencia</th>
                  <th>Registro</th>
                  <th>Funcionario</th>
                  <th>Periodo M. L.</th>
                  <th>Días</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {licencias.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>#{l.id}</td>
                    <td>{new Date(l.createdAt || new Date()).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn"
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.9375rem',
                          color: 'var(--primary)', 
                          fontWeight: 600,
                          background: 'rgba(37, 99, 235, 0.05)',
                          border: '1px solid rgba(37, 99, 235, 0.1)',
                          borderRadius: '8px'
                        }}
                        onClick={() => setHistoryFuncionario({ id: l.funcionarioId, nombre: l.funcionarioNombre, type: 'licencia' })}
                        title="Ver historial de licencias"
                      >
                        {l.funcionarioNombre}
                      </button>
                    </td>
                    <td style={{ fontWeight: 500 }}>{l.fechaInicio} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>→</span> {l.fechaFin}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569', width: 'fit-content' }}>{l.diasUsados} días</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{l.tipoLicencia}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem', borderRadius: '10px', color: '#10b981' }} 
                          onClick={async (e) => {
                            e.preventDefault();
                            const func = users.find(u => String(u.id) === String(l.funcionarioId));
                            if (!func || !func.email) return alert('El funcionario no tiene un correo configurado.');
                            
                            if (window.confirm(`¿Enviar comprobante de esta licencia a ${func.email}?`)) {
                              try {
                                const res = await sendAdminEmail('Registro de Licencia Médica', func.name, func.email, l);
                                if (res.success) {
                                  alert(res.mock ? 'MODO SIMULACIÓN: Datos en consola.' : '✅ Correo enviado exitosamente.');
                                } else {
                                  alert('❌ Error al enviar: ' + (res.error?.text || res.error?.message || 'Revisa tu configuración de EmailJS.'));
                                }
                              } catch (err) {
                                alert('Error al realizar la operación: ' + err.message);
                              }
                            }
                          }}
                          title="Enviar Comprobante"
                        >
                          <Mail size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '10px' }} onClick={() => setEditingLicencia(l)} title="Modificar Licencia">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '10px', color: '#ef4444', border: '1px solid #fee2e2' }} onClick={() => handleDeleteLicencia(l.id)} title="Eliminar Registro">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {licencias.length === 0 && <tr><td colSpan="6" className="text-center p-12 text-muted">No se han encontrado registros de licencias.</td></tr>}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {/* MODAL DE EDICIÓN OFICIO */}
      {editingOficio && createPortal(
        <div onClick={() => setEditingOficio(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '1rem' }}>

          <div onClick={(e) => e.stopPropagation()} className="card" style={{ position: 'relative', zIndex: 1000000, width: '100%', maxWidth: '540px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.8)', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
            <div className="flex justify-between items-center mb-8">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Editar Oficio #{editingOficio.id}</h3>
              <button onClick={() => setEditingOficio(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            
            <form onSubmit={handleEditOficioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label">Emisor Responsable</label>
                <div 
                  className="input-field flex items-center justify-between cursor-pointer" 
                  onClick={() => setSelector({
                    isOpen: true,
                    title: 'Cambiar Emisor',
                    subtitle: 'Seleccione el nuevo responsable para este oficio',
                    items: oficioEmitters,
                    onSelect: (item) => setEditingOficio({ ...editingOficio, emisorId: item.id, emisorNombre: item.name })
                  })}
                  style={{ background: 'var(--background)' }}
                >
                  <span style={{ color: 'var(--text-main)' }}>
                    {editingOficio.emisorNombre || '-- Seleccionar --'}
                  </span>
                  <Search size={18} />
                </div>
              </div>
              <div>
                <label className="input-label">Destinatario</label>
                <input type="text" className="input-field" required value={editingOficio.destinatario} onChange={(e) => setEditingOficio({ ...editingOficio, destinatario: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Materia o Asunto</label>
                <input type="text" className="input-field" required value={editingOficio.materia} onChange={(e) => setEditingOficio({ ...editingOficio, materia: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Descripción Detallada</label>
                <textarea className="input-field" rows="4" required value={editingOficio.descripcion} onChange={(e) => setEditingOficio({ ...editingOficio, descripcion: e.target.value })} />
              </div>
              <div className="flex gap-4 mt-6" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingOficio(null)}>Descartar</button>
                <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE EDICIÓN PERMISO */}
      {editingPermiso && createPortal(
        <div onClick={() => setEditingPermiso(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ position: 'relative', zIndex: 1000000, width: '100%', maxWidth: '540px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.8)', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
            <div className="flex justify-between items-center mb-8">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Editar Permiso #{editingPermiso.id}</h3>
              <button onClick={() => setEditingPermiso(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>

            <form onSubmit={handleEditPermisoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label">Funcionario</label>
                <div 
                  className="input-field flex items-center justify-between cursor-pointer" 
                  onClick={() => setSelector({
                    isOpen: true,
                    title: 'Cambiar Funcionario',
                    subtitle: 'Modifique el titular de este permiso administrativo',
                    items: sortedUsers,
                    onSelect: (item) => setEditingPermiso({ ...editingPermiso, funcionarioId: item.id, funcionarioNombre: item.name, funcionarioEmail: item.email })
                  })}
                  style={{ background: 'var(--background)' }}
                >
                  <span style={{ color: 'var(--text-main)' }}>
                    {editingPermiso.funcionarioNombre || '-- Seleccionar --'}
                  </span>
                  <Search size={18} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Tipo de Permiso</label>
                  <select className="input-field" value={editingPermiso.tipoPermiso} onChange={(e) => setEditingPermiso({ ...editingPermiso, tipoPermiso: e.target.value })} required>
                    <option value="Día Administrativo">Día Administrativo</option>
                    <option value="Día de Cumpleaños">Día de Cumpleaños</option>
                    <option value="Permiso por Matrimonio">Matrimonio / Unión Civil</option>
                    <option value="Permiso por Fallecimiento">Fallecimiento</option>
                    <option value="Permiso sin goce de sueldo">Sin goce de sueldo</option>
                    <option value="Justificación Médica">Justificación Médica</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Jornada</label>
                  <select className="input-field" value={editingPermiso.jornada || 'Completa'} onChange={(e) => {
                    const newJornada = e.target.value;
                    setEditingPermiso(prev => ({
                      ...prev,
                      jornada: newJornada,
                      fechaFin: newJornada.includes('Medio Día') ? prev.fechaInicio : prev.fechaFin
                    }));
                  }} required>
                    <option value="Completa">Día Completo</option>
                    <option value="Medio Día (Mañana)">Medio Día (Mañana)</option>
                    <option value="Medio Día (Tarde)">Medio Día (Tarde)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              </div>
              <div>
                <label className="input-label">Motivo Justificado</label>
                <textarea className="input-field" rows="2" required value={editingPermiso.motivo} onChange={(e) => setEditingPermiso({ ...editingPermiso, motivo: e.target.value })} />
              </div>
              {editingPermiso.tipoPermiso === 'Día Administrativo' && (
                <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', marginTop: '0.25rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                    Balance Proyectado para este Funcionario (2026): {
                      permisos
                        .filter(p => 
                          String(p.funcionarioId) === String(editingPermiso.funcionarioId) && 
                          p.tipoPermiso === 'Día Administrativo' &&
                          new Date(p.fechaInicio).getFullYear() === 2026 &&
                          p.id !== editingPermiso.id // Excluimos la versión actual que estamos editando
                        )
                        .reduce((sum, curr) => sum + curr.diasUsados, 0) + 
                      (calculateDays(editingPermiso.fechaInicio, editingPermiso.fechaFin, editingPermiso.jornada || 'Completa'))
                    } / 6 días
                  </p>
                </div>
              )}
               <div className="flex gap-4 mt-6" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingPermiso(null)}>Descartar</button>
                <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE EDICIÓN LICENCIA */}
      {editingLicencia && createPortal(
        <div onClick={() => setEditingLicencia(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ position: 'relative', zIndex: 1000000, width: '100%', maxWidth: '540px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.8)', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
            <div className="flex justify-between items-center mb-8">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>Editar Licencia #{editingLicencia.id}</h3>
              <button onClick={() => setEditingLicencia(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>

            <form onSubmit={handleEditLicenciaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label">Funcionario</label>
                <div 
                  className="input-field flex items-center justify-between cursor-pointer" 
                  onClick={() => setSelector({
                    isOpen: true,
                    title: 'Cambiar Funcionario',
                    subtitle: 'Modifique el titular de esta licencia médica',
                    items: sortedUsers,
                    onSelect: (item) => setEditingLicencia({ ...editingLicencia, funcionarioId: item.id, funcionarioNombre: item.name })
                  })}
                  style={{ background: 'var(--background)' }}
                >
                  <span style={{ color: 'var(--text-main)' }}>
                    {editingLicencia.funcionarioNombre || '-- Seleccionar --'}
                  </span>
                  <Search size={18} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Tipo de Licencia</label>
                  <select className="input-field" value={editingLicencia.tipoLicencia} onChange={(e) => setEditingLicencia({ ...editingLicencia, tipoLicencia: e.target.value })} required>
                    <option value="Enfermedad Comun">Enfermedad Común</option>
                    <option value="Maternal">Maternal</option>
                    <option value="Enfermedad Profesional">Enfermedad Profesional / Accidente</option>
                    <option value="Enfermedad Hijo Menor">Enfermedad Hijo Menor</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Jornada</label>
                  <select className="input-field" value={editingLicencia.jornada || 'Completa'} onChange={(e) => {
                    const newJornada = e.target.value;
                    setEditingLicencia(prev => ({
                      ...prev,
                      jornada: newJornada,
                      fechaFin: newJornada.includes('Medio Día') ? prev.fechaInicio : prev.fechaFin
                    }));
                  }} required>
                    <option value="Completa">Día Completo</option>
                    <option value="Medio Día (Mañana)">Medio Día (Mañana)</option>
                    <option value="Medio Día (Tarde)">Medio Día (Tarde)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Fecha Inicio</label>
                  <input type="date" className="input-field" required value={editingLicencia.fechaInicio} onChange={(e) => {
                    const newStart = e.target.value;
                    setEditingLicencia(prev => ({ ...prev, fechaInicio: newStart, fechaFin: prev.jornada?.includes('Medio Día') ? newStart : prev.fechaFin }));
                  }} />
                </div>
                <div>
                  <label className="input-label">Fecha Fin</label>
                  <input type="date" className="input-field" required value={editingLicencia.fechaFin} disabled={editingLicencia.jornada?.includes('Medio Día')} onChange={(e) => setEditingLicencia({ ...editingLicencia, fechaFin: e.target.value })} />
                </div>
              </div>
               <div className="flex gap-4 mt-6" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingLicencia(null)}>Descartar</button>
                <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', background: '#ef4444', borderColor: '#ef4444' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE HISTORIAL POR FUNCIONARIO */}
            {historyFuncionario && createPortal(
        <div onClick={() => setHistoryFuncionario(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ 
            position: 'relative', 
            zIndex: 1000000, 
            width: '100%', 
            maxWidth: '820px', 
            padding: 0, 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
            border: '1px solid rgba(255,255,255,0.8)', 
            maxHeight: '90vh', 
            overflow: 'hidden', 
            background: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* CABECERA FIJA */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'white', zIndex: 2 }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div style={{ background: historyFuncionario.type === 'licencia' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)', color: historyFuncionario.type === 'licencia' ? '#ef4444' : 'var(--primary)', padding: '0.625rem', borderRadius: '14px' }}>
                    {historyFuncionario.type === 'licencia' ? <Activity size={24} /> : <Calendar size={24} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Historial de {historyFuncionario.type === 'licencia' ? 'Licencias' : 'Permisos'}</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Funcionario: {historyFuncionario.nombre}</p>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '12px' }} onClick={() => setHistoryFuncionario(null)}>Cerrar</button>
              </div>
            </div>

            {/* CUERPO DESPLAZABLE */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2.5rem' }}>
              <div className="table-container" style={{ margin: 0, boxShadow: 'none', background: 'transparent', border: 'none' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>#</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Fecha Registro</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Rango de Fechas</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{historyFuncionario.type === 'licencia' ? 'Tipo' : 'Detalle'}</th>
                      <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Días</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(historyFuncionario.type === 'licencia' ? licencias : permisos)
                      .filter(p => String(p.funcionarioId) === String(historyFuncionario.id))
                      .map(p => (
                      <tr key={`history-${p.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: historyFuncionario.type === 'licencia' ? '#ef4444' : 'var(--primary)' }}>{p.id}</td>
                        <td style={{ padding: '1rem' }}>{new Date(p.createdAt || new Date()).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{p.fechaInicio} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>→</span> {p.fechaFin}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{historyFuncionario.type === 'licencia' ? p.tipoLicencia : (p.tipoPermiso || 'Administrativo')}</span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span className="badge" style={{ background: '#f1f5f9', color: '#444' }}>{p.diasUsados} d</span>
                            {p.jornada && p.jornada.includes('Medio') && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.jornada}</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(historyFuncionario.type === 'licencia' ? licencias : permisos)
                      .filter(p => String(p.funcionarioId) === String(historyFuncionario.id)).length === 0 && (
                      <tr><td colSpan="5" className="text-center p-12 text-muted">No se registran ocurrencias para este funcionario.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* PIE DE PÃGINA FIJO */}
            <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
              <div style={{ 
                padding: '1.25rem', 
                background: historyFuncionario.type === 'licencia' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(37, 99, 235, 0.05)', 
                borderRadius: '16px', 
                border: historyFuncionario.type === 'licencia' ? '1px solid rgba(239, 68, 68, 0.1)' : '1px solid rgba(37, 99, 235, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Cómputo Total Anual:</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: historyFuncionario.type === 'licencia' ? '#ef4444' : 'var(--primary)' }}>
                    {(historyFuncionario.type === 'licencia' ? licencias : permisos)
                      .filter(p => String(p.funcionarioId) === String(historyFuncionario.id))
                      .reduce((sum, current) => sum + current.diasUsados, 0)} días
                  </span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Historial Total Acumulado</p>
                  
                  {historyFuncionario.type === 'permiso' && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb' }}>
                        Días Administrativos (2026): {
                          permisos.filter(p => 
                            String(p.funcionarioId) === String(historyFuncionario.id) && 
                            p.tipoPermiso === 'Día Administrativo' &&
                            new Date(p.fechaInicio).getFullYear() === 2026
                          ).reduce((sum, curr) => sum + curr.diasUsados, 0)
                        } / 6
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function PermissionCalendar({ permisos }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Pre-process permissions to counts per day
  const counts = React.useMemo(() => {
    const map = {};
    permisos.forEach(p => {
      const start = new Date(p.fechaInicio);
      const end = new Date(p.fechaFin);
      if (isNaN(start) || isNaN(end)) return;

      const curr = new Date(start);
      while (curr <= end) {
        const dateStr = curr.toISOString().split('T')[0];
        if (!map[dateStr]) map[dateStr] = { count: 0, names: [] };
        map[dateStr].count += 1;
        map[dateStr].names.push(p.funcionarioNombre);
        curr.setDate(curr.getDate() + 1);
      }
    });
    return map;
  }, [permisos]);

  const daysArr = [];
  const totalDays = daysInMonth(year, month);
  const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust for Monday start

  // Padding
  for (let i = 0; i < startDay; i++) {
    daysArr.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArr.push(d);
  }

  return (
    <div className="card animate-fade-in" style={{ padding: '2.5rem', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div className="flex items-center gap-4">
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '0.625rem', borderRadius: '14px' }}>
            <Calendar size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Disponibilidad de Personal <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>{monthNames[month]} {year}</span>
          </h3>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1" style={{ background: '#f1f5f9' }}>
          <button onClick={handlePrevMonth} className="btn" style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>Hoy</button>
          <button onClick={handleNextMonth} className="btn" style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
          <div key={d} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', paddingBottom: '1rem' }}>{d.slice(0, 3)}</div>
        ))}

        {daysArr.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} style={{ height: '100px', background: 'rgba(248, 250, 252, 0.5)', borderRadius: '16px' }}></div>;
          
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const info = counts[dateStr];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div 
              key={day} 
              style={{ 
                minHeight: '100px', 
                background: isToday ? 'hsla(221, 83%, 53%, 0.03)' : 'white', 
                border: isToday ? '2px solid var(--primary)' : '1px solid #eef2f6',
                borderRadius: '16px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: isToday ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none'
              }}
            >
              <div style={{ 
                fontWeight: 800, 
                fontSize: '0.875rem', 
                color: isToday ? 'var(--primary)' : '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {day}
                {isToday && <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>}
              </div>
              
              {info && info.count > 0 && (
                <div 
                  className="animate-fade-in"
                  title={info.names.join(', ')}
                  style={{ 
                    background: info.count >= 3 ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                    color: info.count >= 3 ? '#991b1b' : '#475569',
                    fontSize: '0.7rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  {info.count} {info.count === 1 ? 'Ausente' : 'Ausentes'}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        <div className="flex items-center gap-2">
          <span style={{ width: '10px', height: '10px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0' }}></span> 
          <span>Dotación Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ width: '10px', height: '10px', background: '#fee2e2', borderRadius: '4px', border: '1px solid #fecaca' }}></span> 
          <span>Alerta de Personal (3+)</span>
        </div>
      </div>
    </div>
  );
}

function LicenciaCalendar({ licencias }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const counts = React.useMemo(() => {
    const map = {};
    licencias.forEach(p => {
      const start = new Date(p.fechaInicio);
      const end = new Date(p.fechaFin);
      if (isNaN(start) || isNaN(end)) return;

      const curr = new Date(start);
      while (curr <= end) {
        const dateStr = curr.toISOString().split('T')[0];
        if (!map[dateStr]) map[dateStr] = { count: 0, names: [] };
        map[dateStr].count += 1;
        map[dateStr].names.push(p.funcionarioNombre);
        curr.setDate(curr.getDate() + 1);
      }
    });
    return map;
  }, [licencias]);

  const daysArr = [];
  const totalDays = daysInMonth(year, month);
  const startDay = (firstDayOfMonth(year, month) + 6) % 7; 

  for (let i = 0; i < startDay; i++) {
    daysArr.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArr.push(d);
  }

  return (
    <div className="card animate-fade-in" style={{ padding: '2.5rem', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div className="flex items-center gap-4">
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.625rem', borderRadius: '14px' }}>
            <Activity size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Calendario Licencias Médicas <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>{monthNames[month]} {year}</span>
          </h3>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1" style={{ background: '#f1f5f9' }}>
          <button onClick={handlePrevMonth} className="btn" style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>Hoy</button>
          <button onClick={handleNextMonth} className="btn" style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
          <div key={d} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', paddingBottom: '1rem' }}>{d.slice(0, 3)}</div>
        ))}

        {daysArr.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} style={{ height: '100px', background: 'rgba(248, 250, 252, 0.5)', borderRadius: '16px' }}></div>;
          
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const info = counts[dateStr];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div 
              key={day} 
              style={{ 
                minHeight: '100px', 
                background: isToday ? 'rgba(239, 68, 68, 0.03)' : 'white', 
                border: isToday ? '2px solid #ef4444' : '1px solid #eef2f6',
                borderRadius: '16px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: isToday ? '0 4px 12px rgba(239, 68, 68, 0.1)' : 'none'
              }}
            >
              <div style={{ 
                fontWeight: 800, 
                fontSize: '0.875rem', 
                color: isToday ? '#ef4444' : '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {day}
                {isToday && <div style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }}></div>}
              </div>
              
              {info && info.count > 0 && (
                <div 
                  className="animate-fade-in"
                  title={info.names.join(', ')}
                  style={{ 
                    background: info.count >= 2 ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                    color: '#991b1b',
                    fontSize: '0.7rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  {info.count} {info.count === 1 ? 'Licencia' : 'Licencias'}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        <div className="flex items-center gap-2">
          <span style={{ width: '10px', height: '10px', background: '#fef2f2', borderRadius: '4px', border: '1px solid #fee2e2' }}></span> 
          <span>1 Licencia Médica</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ width: '10px', height: '10px', background: '#fee2e2', borderRadius: '4px', border: '1px solid #fecaca' }}></span> 
          <span>Múltiples Licencias (2+)</span>
        </div>
      </div>
    </div>
  );
}


// Deployment trigger: 04/20/2026 10:21:31
