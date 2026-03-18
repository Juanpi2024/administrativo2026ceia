import React, { useState, useMemo } from 'react';
import { alumnosBirthdays, funcionariosBirthdays } from '../data/birthdays';

const BirthdayModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('alumnos'); // 'alumnos' or 'funcionarios'

  // Obtener fecha actual
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // getMonth() es 0-11
  const currentDay = today.getDate();

  // Función para normalizar y comparar fechas
  const isToday = (fechaNac) => {
    if (!fechaNac) return false;
    // Manejar ambos formatos: YYYY-MM-DD o DD-MM-YYYY (aunque ya los normalizamos en birthdays.js)
    const parts = fechaNac.split('-');
    if (parts.length !== 3) return false;
    
    // Suponiendo formato YYYY-MM-DD tras la normalización
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    return month === currentMonth && day === currentDay;
  };

  // Filtrar cumpleañeros de hoy y próximos
  const getProcessedData = (data) => {
    const todayBirthdays = data.filter(person => isToday(person.fechaNac));
    const upcomingBirthdays = data
      .filter(person => !isToday(person.fechaNac) && person.fechaNac)
      .sort((a, b) => {
        const monthA = parseInt(a.fechaNac.split('-')[1], 10);
        const dayA = parseInt(a.fechaNac.split('-')[2], 10);
        const monthB = parseInt(b.fechaNac.split('-')[1], 10);
        const dayB = parseInt(b.fechaNac.split('-')[2], 10);

        // Lógica de ordenamiento por cercanía al mes actual
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

  return (
    <div className="birthday-overlay" onClick={onClose}>
      <div className="birthday-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="birthday-header">
          <div className="flex items-center gap-4">
            <div className="birthday-icon-circle">🎂</div>
            <div>
              <h2 className="text-xl">Cumpleaños de la Comunidad</h2>
              <p className="text-sm text-white opacity-80">Celebrando a nuestra comunidad </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="birthday-tabs">
          <button 
            className={`tab-btn ${activeTab === 'alumnos' ? 'active' : ''}`}
            onClick={() => setActiveTab('alumnos')}
          >
            Alumnos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'funcionarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('funcionarios')}
          >
            Funcionarios
          </button>
        </div>

        <div className="birthday-body">
          {/* Seccion Hoy */}
          {todayBirthdays.length > 0 && (
            <div className="section-today">
              <h3 className="section-title">✨ Cumpleaños de hoy ({todayBirthdays.length})</h3>
              <div className="today-grid">
                {todayBirthdays.map((person, index) => (
                  <div key={index} className="today-card card">
                    <div className="medal">🏆</div>
                    <div className="person-info">
                      <p className="person-name">{person.nombre}</p>
                      <p className="person-sub">
                        {activeTab === 'alumnos' ? person.curso : person.cargo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proximos */}
          <div className="section-upcoming mt-8">
            <h3 className="section-title">📅 Próximos Cumpleaños</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>{activeTab === 'alumnos' ? 'Curso' : 'Cargo'}</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBirthdays.slice(0, 15).map((person, index) => {
                    const parts = person.fechaNac.split('-');
                    return (
                      <tr key={index}>
                        <td>{person.nombre} {person.apellidoPat || ''}</td>
                        <td>{activeTab === 'alumnos' ? person.curso : person.cargo}</td>
                        <td>{`${parts[2]}/${parts[1]}`}</td>
                      </tr>
                    );
                  })}
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
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }

        .birthday-content {
          background: var(--surface);
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          border-radius: var(--radius);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .birthday-header {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .birthday-icon-circle {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .close-btn {
          font-size: 2rem;
          color: white;
          opacity: 0.7;
          transition: var(--transition);
        }

        .close-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .birthday-tabs {
          display: flex;
          background: var(--background);
          padding: 0.5rem;
          gap: 0.5rem;
        }

        .tab-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          color: var(--text-muted);
          transition: var(--transition);
        }

        .tab-btn.active {
          background: var(--surface);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .birthday-body {
          padding: 2rem;
          overflow-y: auto;
          flex-grow: 1;
        }

        .section-title {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: var(--text-main);
          border-left: 4px solid var(--primary);
          padding-left: 1rem;
        }

        .today-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .today-card {
          position: relative;
          padding: 1.5rem !important;
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          border: 2px solid #fb923c !important;
        }

        .medal {
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 1.5rem;
          background: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
        }

        .person-name {
          font-weight: 700;
          color: var(--text-main);
        }

        .person-sub {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .birthday-header {
            padding: 1.5rem;
          }
          .birthday-body {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BirthdayModal;
