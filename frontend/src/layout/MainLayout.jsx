import { useState } from 'react';
import {
  Bell, ChevronRight, FileText, FolderOpen, LogOut, Menu, ShieldCheck, Users, X,
} from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { getInitials, formatFileSize } from '../utils/format.js';

function MainLayout({ currentUser, activePage, onNavigate, onSignOut, onNotify, entries, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileCount = entries.filter((entry) => entry.kind === 'file').length;
  const folderCount = entries.filter((entry) => entry.kind === 'folder').length;
  const usedBytes = entries
    .filter((entry) => entry.kind === 'file')
    .reduce((total, entry) => total + (entry.bytes || 0), 0);
  const isAdmin = currentUser.role === 'Administrador';

  function navigate(page) {
    onNavigate(page);
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Brand />
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
            <X size={19} />
          </button>
        </div>

        <div className="workspace-card">
          <span className="workspace-avatar">D</span>
          <span><small>Espacio de trabajo</small><strong>Draib</strong></span>
        </div>

        <p className="nav-heading">MENÚ</p>
        <nav className="side-nav" aria-label="Navegación principal">
          <button className={activePage === 'files' ? 'active' : ''} onClick={() => navigate('files')}>
            <FolderOpen size={18} /> Archivos
            {fileCount > 0 && <span className="nav-count">{fileCount}</span>}
          </button>
          {isAdmin && (
            <button className={activePage === 'users' ? 'active' : ''} onClick={() => navigate('users')}>
              <Users size={18} /> Usuarios
              <span className="nav-count">{currentUser ? ' ' : ''}</span>
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="storage-card">
            <div className="storage-line"><FileText size={15} /><span>Elementos del repositorio</span></div>
            <strong>{fileCount + folderCount}</strong>
            <small>{formatFileSize(usedBytes)} usados · máximo 10 MB por archivo</small>
          </div>
          <div className="sidebar-profile">
            <span className="avatar">{getInitials(currentUser.name)}</span>
            <span className="profile-info"><strong>{currentUser.name}</strong><small>{currentUser.role}</small></span>
            <button className="icon-button" onClick={onSignOut} aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Draib</span><ChevronRight size={15} />
            <strong>{activePage === 'users' ? 'Usuarios' : 'Archivos'}</strong>
          </div>
          <div className="topbar-actions">
            <span className="session-label"><ShieldCheck size={15} /> Sesión de {currentUser.role.toLowerCase()}</span>
            <button className="icon-button notification-button" onClick={() => onNotify('No tienes notificaciones pendientes.')} aria-label="Notificaciones">
              <Bell size={18} />
            </button>
            <span className="topbar-divider" />
            <span className="topbar-user"><span className="avatar">{getInitials(currentUser.name)}</span><strong>{currentUser.name}</strong></span>
          </div>
        </header>

        <main className="page-content">{children}</main>

        <footer className="app-footer">
          <span>Draib · Repositorio de archivos</span>
          <span>Archivos de hasta 10 MB</span>
        </footer>
      </section>
    </div>
  );
}

export default MainLayout;
