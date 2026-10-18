import { useMemo, useState } from 'react';
import { Search, ShieldCheck, UserPlus, Users, X, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInitials } from '../utils/format.js';

function UsersPage({ users, setUsers, currentUser, notify }) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'birthDate' && filterValue) return user.birthDate === filterValue;
    if (filterMode === 'role' && filterValue) return user.role === filterValue;
    if (filterMode === 'refreshToken' && filterValue === 'assigned') return user.hasRefreshToken;
    if (filterMode === 'refreshToken' && filterValue === 'not-assigned') return !user.hasRefreshToken;
    return true;
  }), [users, search, filterMode, filterValue]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = users.filter((user) => user.active).length;
  const pendingCount = users.length - activeCount;

  function changeFilterMode(value) {
    setFilterMode(value);
    setFilterValue('');
    setPage(1);
  }

  function saveUser(data, passwordChanged) {
    const emailIsUsed = users.some((user) =>
      user.email.toLowerCase() === data.email.toLowerCase() && user.id !== editingUser?.id,
    );
    if (emailIsUsed) return 'Ya existe una cuenta registrada con ese correo.';

    if (creatingUser) {
      const newUser = {
        id: `user-${Date.now()}`,
        ...data,
        role: data.role,
        active: true,
        hasRefreshToken: false,
      };
      setUsers((current) => [...current, newUser]);
      notify(`La cuenta de ${newUser.name} fue creada.`);
    } else {
      setUsers((current) => current.map((user) => user.id === editingUser.id
        ? { ...user, ...data, hasRefreshToken: passwordChanged ? false : user.hasRefreshToken }
        : user,
      ));
      notify(passwordChanged
        ? 'Los datos se actualizaron y el Refresh Token anterior fue revocado.'
        : 'Los datos del usuario fueron actualizados.');
    }

    setEditingUser(null);
    setCreatingUser(false);
    setPage(1);
    return '';
  }

  function toggleStatus(user) {
    if (user.id === currentUser.id) {
      notify('No puedes desactivar la cuenta con la que iniciaste sesión.');
      return;
    }

    const nextStatus = !user.active;
    setUsers((current) => current.map((item) => item.id === user.id
      ? { ...item, active: nextStatus, hasRefreshToken: nextStatus ? item.hasRefreshToken : false }
      : item,
    ));
    notify(nextStatus
      ? `La cuenta de ${user.name} quedó activa.`
      : `La cuenta de ${user.name} fue desactivada y su Refresh Token fue revocado.`);
  }

  function revokeToken(user) {
    if (user.id === currentUser.id) {
      notify('No puedes revocar tu propio Refresh Token desde esta pantalla.');
      return;
    }
    setUsers((current) => current.map((item) =>
      item.id === user.id ? { ...item, hasRefreshToken: false } : item,
    ));
    notify(`El Refresh Token de ${user.name} fue revocado.`);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h1>Usuarios</h1>
          <p>Consulta cuentas, permisos y sesiones activas.</p>
        </div>
        <button className="button button-primary" onClick={() => setCreatingUser(true)}>
          <UserPlus size={17} /> Agregar usuario
        </button>
      </div>

      <section className="user-summary">
        <span className="stat-icon"><Users size={19} /></span>
        <span><strong>{users.length} cuentas registradas</strong><small>{activeCount} activas · {pendingCount} desactivadas o pendientes</small></span>
        <ShieldCheck size={19} />
      </section>

      <section className="content-card users-card">
        <div className="user-toolbar">
          <label className="search-box">
            <Search size={16} />
            <input
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Buscar por nombre o correo"
              value={search}
            />
          </label>

          <select
            aria-label="Tipo de filtro"
            className="toolbar-select"
            onChange={(event) => changeFilterMode(event.target.value)}
            value={filterMode}
          >
            <option value="all">Filtrar por...</option>
            <option value="birthDate">Fecha de nacimiento</option>
            <option value="role">Rol</option>
            <option value="refreshToken">Refresh Token</option>
          </select>

          {filterMode === 'birthDate' && (
            <input
              aria-label="Filtrar por fecha de nacimiento"
              className="toolbar-input"
              onChange={(event) => { setFilterValue(event.target.value); setPage(1); }}
              type="date"
              value={filterValue}
            />
          )}

          {filterMode === 'role' && (
            <select
              aria-label="Filtrar por rol"
              className="toolbar-select"
              onChange={(event) => { setFilterValue(event.target.value); setPage(1); }}
              value={filterValue}
            >
              <option value="">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Usuario">Usuario común</option>
            </select>
          )}

          {filterMode === 'refreshToken' && (
            <select
              aria-label="Filtrar por Refresh Token"
              className="toolbar-select"
              onChange={(event) => { setFilterValue(event.target.value); setPage(1); }}
              value={filterValue}
            >
              <option value="">Todos</option>
              <option value="assigned">Con Refresh Token</option>
              <option value="not-assigned">Sin Refresh Token</option>
            </select>
          )}
        </div>

        {visibleUsers.length === 0 ? (
          <div className="empty-state files-empty"><strong>No encontramos usuarios</strong><span>Prueba con otro nombre, correo o filtro.</span></div>
        ) : (
          <div className="table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th><th>Correo</th><th>Fecha de nacimiento</th>
                  <th>Rol</th><th>Estado</th><th>Refresh Token</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td><span className="user-person"><span className="avatar">{getInitials(user.name)}</span><strong>{user.name}</strong></span></td>
                    <td>{user.email}</td>
                    <td>{user.birthDate || 'No registrada'}</td>
                    <td><span className={`role-tag ${user.role === 'Administrador' ? 'role-admin' : ''}`}>{user.role === 'Usuario' ? 'Usuario común' : user.role}</span></td>
                    <td><span className={`status-tag ${user.active ? 'status-active' : 'status-pending'}`}>{user.active ? 'Activa' : 'Pendiente'}</span></td>
                    <td>
                      <span className={`token-tag ${user.hasRefreshToken ? 'token-assigned' : ''}`}>
                        <KeyRound size={13} /> {user.hasRefreshToken ? 'Asignado' : 'Sin token'}
                      </span>
                    </td>
                    <td className="user-actions">
                      <button className="text-link" onClick={() => setEditingUser(user)}>Editar</button>
                      {user.id !== currentUser.id && (
                        <button className="text-link" onClick={() => toggleStatus(user)}>
                          {user.active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                      {user.hasRefreshToken && (
                        <button
                          className="text-link"
                          disabled={user.id === currentUser.id}
                          onClick={() => revokeToken(user)}
                          title={user.id === currentUser.id ? 'No puedes revocar tu propio token' : 'Revocar Refresh Token'}
                        >
                          Revocar token
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-bottom pagination-bar">
          <span>{filteredUsers.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredUsers.length)} de {filteredUsers.length} usuarios</span>
          <div className="pagination-controls">
            <label htmlFor="user-page-size">Filas por página</label>
            <select
              id="user-page-size"
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
              value={pageSize}
            >
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
            </select>
            <button className="icon-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ChevronLeft size={17} /></button>
            <span>Página {page} de {totalPages}</span>
            <button className="icon-button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ChevronRight size={17} /></button>
          </div>
        </div>
      </section>

      {(creatingUser || editingUser) && (
        <UserForm
          allUsers={users}
          currentUser={currentUser}
          onClose={() => { setCreatingUser(false); setEditingUser(null); }}
          onSave={saveUser}
          user={editingUser}
        />
      )}
    </>
  );
}

function UserForm({ allUsers, currentUser, user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    birthDate: user?.birthDate || '',
    role: user?.role || 'Usuario',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const isEditing = Boolean(user);
  const roleIsLocked = isEditing && user.id === currentUser.id && user.role === 'Administrador';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function submit(event) {
    event.preventDefault();

    const emailExists = allUsers.some((item) =>
      item.email.toLowerCase() === form.email.trim().toLowerCase() && item.id !== user?.id,
    );
    if (emailExists) return setError('Ya existe una cuenta registrada con ese correo.');

    const hasPassword = Boolean(form.password || form.confirmPassword);
    if (!isEditing && (!form.password || !form.confirmPassword)) {
      return setError('Escribe y confirma una contraseña.');
    }
    if (hasPassword && form.password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres.');
    }
    if (hasPassword && form.password !== form.confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }

    const result = onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      birthDate: form.birthDate,
      role: form.role,
    }, hasPassword);
    if (result) setError(result);
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="user-form-title" aria-modal="true" className="dialog-card user-dialog" role="dialog">
        <div className="dialog-heading">
          <div><span className="eyebrow">CUENTA DE USUARIO</span><h2 id="user-form-title">{isEditing ? 'Editar usuario' : 'Agregar usuario'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label htmlFor="user-name">Nombre de usuario</label>
          <input className="text-input" id="user-name" name="name" onChange={updateField} required value={form.name} />

          <label htmlFor="user-email">Correo electrónico</label>
          <input className="text-input" id="user-email" name="email" onChange={updateField} required type="email" value={form.email} />

          <label htmlFor="user-birth-date">Fecha de nacimiento</label>
          <input className="text-input" id="user-birth-date" max={new Date().toISOString().slice(0, 10)} name="birthDate" onChange={updateField} required={!isEditing} type="date" value={form.birthDate} />

          <label htmlFor="user-role">Rol</label>
          <select className="text-input" disabled={roleIsLocked} id="user-role" name="role" onChange={updateField} value={form.role}>
            <option value="Administrador">Administrador</option>
            <option value="Usuario">Usuario común</option>
          </select>
          {roleIsLocked && <small className="field-help">No puedes quitarte tu propio rol de administrador.</small>}

          <label htmlFor="user-password">{isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
          <input autoComplete="new-password" className="text-input" id="user-password" minLength={8} name="password" onChange={updateField} required={!isEditing} type="password" value={form.password} />

          <label htmlFor="user-confirm-password">Confirmar contraseña</label>
          <input autoComplete="new-password" className="text-input" id="user-confirm-password" minLength={8} name="confirmPassword" onChange={updateField} required={!isEditing} type="password" value={form.confirmPassword} />
          {isEditing && <small className="field-help">Deja ambos campos de contraseña vacíos para conservar la actual.</small>}

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="dialog-actions">
            <button className="button button-secondary" onClick={onClose} type="button">Cancelar</button>
            <button className="button button-primary" type="submit">{isEditing ? 'Guardar cambios' : 'Crear usuario'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default UsersPage;
