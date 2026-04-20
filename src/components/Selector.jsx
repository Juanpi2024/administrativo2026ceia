import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, User } from 'lucide-react';

export default function Selector({ isOpen, onClose, title, subtitle, items, onSelect, placeholder = "Buscar..." }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return createPortal(
    <div 
      className="animate-fade-in" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 999999, 
        padding: '1rem' 
      }}
      onClick={onClose}
    >
      <div 
        className="selector-container" 
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <div className="selector-header">
          <button 
            onClick={onClose}
            style={{ 
              position: 'absolute', 
              top: '1.5rem', 
              right: '1.5rem', 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: 'white', 
              padding: '0.5rem', 
              borderRadius: '12px', 
              cursor: 'pointer' 
            }}
          >
            <X size={20} />
          </button>
          
          <div className="selector-icon">
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>{title}</h2>
          <p style={{ fontSize: '0.9375rem', opacity: 0.8 }}>{subtitle}</p>
        </div>

        <div className="selector-search-wrap">
          <div style={{ position: 'absolute', left: '3rem', top: '2.5rem', color: 'var(--text-muted)' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            className="selector-search" 
            placeholder={placeholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="selector-list">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="selector-item"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              <div className="selector-item-avatar">
                {item.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{item.name}</p>
                {item.cargo && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>{item.cargo}</p>}
                {item.curso && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Curso: {item.curso}</p>}
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontraron resultados para "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
