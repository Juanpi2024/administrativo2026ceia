import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Gift, Calendar, User, Users, X } from 'lucide-react';
import { alumnosBirthdays, funcionariosBirthdays } from '../data/birthdays';

const BirthdayModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('alumnos'); // 'alumnos' or 'funcionarios'

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const isToday = (fechaNac) => {
    if (!fechaNac) return false;
    const parts = fechaNac.split('-');
    if (parts.length !== 3) return false;
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return month === currentMonth && day === currentDay;
  };

  const getProcessedData = (data) => {
    const todayBirthdays = data.filter(person => isToday(person.fechaNac));
    const upcomingBirthdays = data
      .filter(person => !isToday(person.fechaNac) && person.fechaNac)
      .sort((a, b) => {
        const monthA = parseInt(a.fechaNac.split('-')[1], 10);
        const dayA = parseInt(a.fechaNac.split('-')[2], 10);
        const monthB = parseInt(b.fechaNac.split('-')[1], 10);
        const dayB = parseInt(b.fechaNac.split('-')[2], 10);

        if (monthA !== monthB) {
          const diffA = (monthA - currentMonth + 12) % 12;
          const diffB = (monthB - currentMonth + 12) % 12;
          return diffA - diffB;
        }
        return dayA - dayB;
      });

    return { todayBirthdays, upcomingBirthdays };
  };

  const { todayBirthdays, upcomingBirthdays } = useMemo(() => 
    getProcessedData(activeTab === 'alumnos' ? alumnosBirthdays : funcionariosBirthdays),
    [activeTab]
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="birthday-overlay" onClick={onClose}>
      <div className="birthday-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="birthday-header">
          <div className="flex items-center gap-5">
            <div className="birthday-icon-circle">
              <Gift size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold m-0" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'white' }}>Social & Onomásticos</h2>
              <p className="text-sm opacity-90 m-0" style={{ fontSize: '0.9375rem', color: 'white' }}>Fortaleciendo el clima organizacional CEIA 2026</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={28} />
          </button>
        </div>

        <div className="birthday-tabs-wrapper">
          <div className="birthday-tabs">
            <button 
              className={`tab-btn ${activeTab === 'alumnos' ? 'active' : ''}`}
              onClick={() => setActiveTab('alumnos')}
            >
              <Users size={18} />
              Estudiantes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'funcionarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('funcionarios')}
            >
              <User size={18} />
              Cuerpo Laboral
            </button>
          </div>
        </div>

        <div className="birthday-body">
          {todayBirthdays.length > 0 && (
            <div className="section-today" style={{ marginBottom: '2.5rem' }}>
              <div className="flex items-center gap-2 mb-6">
                <div style={{ width: '8px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                <h3 className="section-title m-0">Celebraciones de Hoy</h3>
                <span className="badge-today">{todayBirthdays.length}</span>
              </div>
              <div className="today-grid">
                {todayBirthdays.map((person, index) => (
                  <div key={index} className="today-card">
                    <div className="sparkle">✨</div>
                    <div className="flex items-center gap-4">
                      <div className="avatar-placeholder">
                        {person.nombre.charAt(0)}
                      </div>
                      <div className="person-info">
                        <p className="person-name">{person.nombre}</p>
                        <p className="person-sub">
                          {activeTab === 'alumnos' ? `Curso: ${person.curso}` : person.cargo}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="section-upcoming">
            <div className="flex items-center gap-2 mb-6">
              <div style={{ width: '8px', height: '24px', background: '#94a3b8', borderRadius: '4px' }}></div>
              <h3 className="section-title m-0">Calendario Próximo</h3>
            </div>
            <div className="table-container custom-table">
              <table>
                <thead>
                  <tr>
                    <th>Identidad</th>
                    <th>{activeTab === 'alumnos' ? 'Nivel / Curso' : 'Departamento / Cargo'}</th>
                    <th style={{ textAlign: 'right' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBirthdays.slice(0, 15).map((person, index) => {
                    const parts = person.fechaNac.split('-');
                    return (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>{person.nombre} {person.apellidoPat || ''}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{activeTab === 'alumnos' ? person.curso : person.cargo}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{`${parts[2]} de ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(parts[1], 10) - 1]}`}</td>
                      </tr>
                    );
                  })}
                  {upcomingBirthdays.length === 0 && (
                    <tr><td colSpan="3" className="text-center p-12 text-muted">No se registran onomásticos próximos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .birthday-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 1rem;
        }

        .birthday-content {
          background: white;
          width: 100%;
          max-width: 820px;
          height: auto;
          max-height: 85vh;
          border-radius: 32px;
          box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .birthday-header {
          background: linear-gradient(135deg, hsl(221, 83%, 45%) 0%, hsl(221, 83%, 35%) 100%);
          color: white;
          padding: 2.5rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .birthday-icon-circle {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: white;
          opacity: 0.6;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        .birthday-tabs-wrapper {
          background: white;
          padding: 1rem 3rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .birthday-tabs {
          display: flex;
          background: #f1f5f9;
          padding: 0.35rem;
          border-radius: 16px;
          gap: 0.25rem;
        }

        .tab-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: 12px;
          font-weight: 700;
          color: #64748b;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
        }

        .tab-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .birthday-body {
          padding: 3rem;
          overflow-y: auto;
          background: white;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .badge-today {
          background: hsl(20, 100%, 94%);
          color: hsl(20, 100%, 30%);
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.8125rem;
          font-weight: 800;
          border: 1px solid hsl(20, 100%, 90%);
        }

        .today-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .today-card {
          position: relative;
          padding: 1.75rem;
          background: linear-gradient(135deg, hsla(20, 100%, 98%, 0.5) 0%, white 100%);
          border: 2px solid hsl(20, 100%, 90%);
          border-radius: 24px;
          box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.08);
          transition: transform 0.2s;
        }
        
        .today-card:hover {
          transform: translateY(-4px);
        }

        .sparkle {
          position: absolute;
          top: -12px;
          right: -12px;
          font-size: 1.75rem;
        }

        .avatar-placeholder {
          width: 52px;
          height: 52px;
          background: var(--primary);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 900;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .person-name {
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
          font-size: 1.0625rem;
        }

        .person-sub {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0.25rem 0 0;
        }

        .custom-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .custom-table th {
          background: #f8fafc;
          padding: 1rem 1.5rem;
          color: #64748b;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: left;
        }

        .custom-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.9375rem;
        }

        @media (max-width: 600px) {
          .birthday-header { padding: 2rem; }
          .birthday-body { padding: 1.5rem; }
          .birthday-tabs-wrapper { padding: 1rem 1.5rem; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default BirthdayModal;
