import { useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Download, File, FileImage, FileSpreadsheet,
  FileText, Folder, FolderOpen, FolderPlus, Pencil, Search, Trash2, Upload, X,
} from 'lucide-react';
import { formatFileSize, getFileType, getInitials } from '../utils/format.js';

function FilesPage({ entries, setEntries, currentUser, notify }) {
  const [folderId, setFolderId] = useState('root');
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState(null);
  const fileInput = useRef(null);
  const isAdmin = currentUser.role === 'Administrador';

  const folderPath = useMemo(() => {
    const result = [];
    let parent = entries.find((entry) => entry.id === folderId && entry.kind === 'folder');
    while (parent) {
      result.unshift(parent);
      parent = entries.find((entry) => entry.id === parent.parentId && entry.kind === 'folder');
    }
    return result;
  }, [entries, folderId]);

  const visibleEntries = useMemo(() => entries.filter((entry) => {
    if (entry.parentId !== folderId) return false;
    if (search && !entry.name.toLowerCase().includes(search.toLowerCase())) return false;

    if (filterMode === 'type' && filterValue && entry.kind === 'file') {
      if (getFileType(entry.name) !== filterValue) return false;
    }
    if (filterMode === 'type' && filterValue && entry.kind === 'folder') return false;
    if (filterMode === 'date' && filterValue && entry.createdDate !== filterValue) return false;
    if (filterMode === 'owner' && filterValue && entry.ownerId !== filterValue) return false;
    return true;
  }), [entries, folderId, search, filterMode, filterValue]);

  const foldersCount = entries.filter((entry) => entry.kind === 'folder').length;
  const filesCount = entries.filter((entry) => entry.kind === 'file').length;
  const usedBytes = entries.reduce((total, entry) => total + (entry.bytes || 0), 0);
  const totalPages = Math.max(1, Math.ceil(visibleEntries.length / pageSize));
  const pageEntries = visibleEntries.slice((page - 1) * pageSize, page * pageSize);
  const ownerOptions = [...new Map(entries
    .filter((entry) => entry.kind === 'file')
    .map((entry) => [entry.ownerId, { id: entry.ownerId, name: entry.owner }])).values()];

  function changeFilterMode(value) {
    setFilterMode(value);
    setFilterValue('');
    setPage(1);
  }

  function openFolder(folder) {
    setFolderId(folder.id);
    setPage(1);
    setSearch('');
  }

  function saveFolder(name) {
    const duplicate = entries.some((entry) =>
      entry.parentId === folderId
      && entry.kind === 'folder'
      && entry.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) return 'Ya existe un directorio con ese nombre en esta carpeta.';

    setEntries((current) => [{
      id: `folder-${Date.now()}`,
      name,
      kind: 'folder',
      owner: currentUser.name,
      ownerId: currentUser.id,
      parentId: folderId,
      bytes: 0,
      createdAt: new Date().toISOString(),
      createdDate: new Date().toISOString().slice(0, 10),
    }, ...current]);
    setDialog(null);
    notify(`El directorio “${name}” fue creado.`);
    return '';
  }

  function uploadFiles(event) {
    if (folderId === 'root') {
      notify('Abre un directorio antes de subir archivos.');
      event.target.value = '';
      return;
    }

    const selectedFiles = Array.from(event.target.files || []);
    const acceptedFiles = selectedFiles.filter((file) => file.size <= 10 * 1024 * 1024);
    const rejectedCount = selectedFiles.length - acceptedFiles.length;

    if (rejectedCount > 0) {
      notify(`${rejectedCount} archivo${rejectedCount === 1 ? '' : 's'} supera${rejectedCount === 1 ? '' : 'n'} el límite de 10 MB.`);
    }

    const now = new Date();
    const newEntries = acceptedFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      kind: 'file',
      owner: currentUser.name,
      ownerId: currentUser.id,
      parentId: folderId,
      bytes: file.size,
      createdAt: now.toISOString(),
      createdDate: now.toISOString().slice(0, 10),
      blobUrl: URL.createObjectURL(file),
    }));

    if (newEntries.length > 0) {
      setEntries((current) => [...newEntries, ...current]);
      setPage(1);
      notify(`${newEntries.length} archivo${newEntries.length === 1 ? '' : 's'} agregado${newEntries.length === 1 ? '' : 's'}.`);
    }

    event.target.value = '';
  }

  function canManage(entry) {
    return isAdmin || entry.ownerId === currentUser.id;
  }

  function saveRename(name) {
    const entry = dialog.entry;
    const hasPermission = canManage(entry);
    if (!hasPermission) return 'Solo quien creó el elemento o un administrador puede editarlo.';

    const extension = entry.kind === 'file' && entry.name.includes('.')
      ? `.${entry.name.split('.').pop()}`
      : '';
    const cleanName = extension && name.toLowerCase().endsWith(extension.toLowerCase())
      ? name.slice(0, -extension.length)
      : name;
    if (!cleanName.trim()) return 'Escribe un nombre para el elemento.';
    const nextName = `${cleanName.trim()}${extension}`;

    if (entry.kind === 'folder') {
      const duplicate = entries.some((item) => item.id !== entry.id
        && item.parentId === entry.parentId
        && item.kind === 'folder'
        && item.name.toLowerCase() === nextName.toLowerCase());
      if (duplicate) return 'Ya existe un directorio con ese nombre en este nivel.';
    }

    setEntries((current) => current.map((item) => item.id === entry.id
      ? { ...item, name: nextName }
      : item,
    ));
    setDialog(null);
    notify(`El nombre se cambió a “${nextName}”.`);
    return '';
  }

  function deleteEntry(entry) {
    if (!canManage(entry)) {
      notify('Solo quien subió el archivo o creó el directorio, o un administrador, puede eliminarlo.');
      return;
    }

    const childEntries = entries.filter((item) => item.parentId === entry.id);
    if (entry.kind === 'folder' && childEntries.length > 0 && !isAdmin) {
      notify('Un directorio solo se puede eliminar cuando está vacío.');
      return;
    }
    if (!window.confirm(`¿Eliminar “${entry.name}”?`)) return;

    const idsToDelete = new Set([entry.id]);
    if (entry.kind === 'folder' && isAdmin) {
      let foundChildren = true;
      while (foundChildren) {
        foundChildren = false;
        entries.forEach((item) => {
          if (idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) {
            idsToDelete.add(item.id);
            foundChildren = true;
          }
        });
      }
    }

    entries.forEach((item) => {
      if (idsToDelete.has(item.id) && item.blobUrl) URL.revokeObjectURL(item.blobUrl);
    });
    setEntries((current) => current.filter((item) => !idsToDelete.has(item.id)));
    if (folderId === entry.id) setFolderId(entry.parentId || 'root');
    notify(`“${entry.name}” fue eliminado.`);
  }

  function downloadFile(entry) {
    if (!entry.blobUrl) {
      notify('No hay un archivo local disponible para descargar.');
      return;
    }
    const link = document.createElement('a');
    link.href = entry.blobUrl;
    link.download = entry.name;
    link.click();
  }

  function openEntry(entry) {
    if (entry.kind === 'folder') openFolder(entry);
    else downloadFile(entry);
  }

  function dateLabel(isoDate) {
    return isoDate ? new Date(isoDate).toLocaleDateString('es-MX') : '—';
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ESPACIO COMPARTIDO</span>
          <h1>Archivos</h1>
          <p>Consulta, organiza y comparte documentos del repositorio.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={() => setDialog({ type: 'create-folder' })}>
            <FolderPlus size={17} /> Nuevo directorio
          </button>
          <button
            className="button button-primary"
            disabled={folderId === 'root'}
            onClick={() => fileInput.current?.click()}
            title={folderId === 'root' ? 'Abre un directorio para subir archivos' : 'Subir archivo'}
          >
            <Upload size={17} /> Subir archivo
          </button>
          <input ref={fileInput} className="visually-hidden" multiple onChange={uploadFiles} type="file" />
        </div>
      </div>

      <section className="stats-grid" aria-label="Resumen del repositorio">
        <StatCard label="Archivos" value={filesCount} detail="Archivos compartidos" icon={<FileText size={19} />} />
        <StatCard label="Directorios" value={foldersCount} detail="Organización del repositorio" icon={<Folder size={19} />} />
        <StatCard label="Almacenamiento usado" value={formatFileSize(usedBytes)} detail="Límite de 10 MB por archivo" icon={<Upload size={19} />} />
      </section>

      <section className="content-card">
        <div className="file-toolbar">
          <div className="breadcrumbs folder-breadcrumbs">
            <button onClick={() => { setFolderId('root'); setPage(1); }}>Repositorio</button>
            {folderPath.map((folder) => (
              <span className="crumb-segment" key={folder.id}>
                <ChevronRight size={14} />
                <button onClick={() => { setFolderId(folder.id); setPage(1); }}>{folder.name}</button>
              </span>
            ))}
          </div>

          <div className="file-filters">
            <label className="search-box">
              <Search size={16} />
              <input onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nombre" value={search} />
            </label>
            <select aria-label="Tipo de filtro" className="toolbar-select" onChange={(event) => changeFilterMode(event.target.value)} value={filterMode}>
              <option value="all">Todos los filtros</option>
              <option value="type">Tipo</option>
              <option value="date">Fecha de subida</option>
              <option value="owner">Propietario</option>
            </select>
            {filterMode === 'type' && (
              <select aria-label="Filtrar por tipo" className="toolbar-select" onChange={(event) => { setFilterValue(event.target.value); setPage(1); }} value={filterValue}>
                <option value="">Todos los tipos</option>
                <option value="PDF">PDF</option><option value="Imagen">Imagen</option>
                <option value="Hoja de cálculo">Hoja de cálculo</option><option value="Presentación">Presentación</option>
                <option value="Comprimido">Comprimido</option><option value="Documento">Documento</option>
              </select>
            )}
            {filterMode === 'date' && <input aria-label="Filtrar por fecha de subida" className="toolbar-input" onChange={(event) => { setFilterValue(event.target.value); setPage(1); }} type="date" value={filterValue} />}
            {filterMode === 'owner' && (
              <select aria-label="Filtrar por propietario" className="toolbar-select" onChange={(event) => { setFilterValue(event.target.value); setPage(1); }} value={filterValue}>
                <option value="">Todos los propietarios</option>
                {ownerOptions.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {pageEntries.length === 0 ? (
          <div className="empty-state files-empty">
            <span className="empty-icon"><FolderOpen size={22} /></span>
            <strong>{search || filterValue ? 'No encontramos resultados' : 'Este directorio está vacío'}</strong>
            <span>{folderId === 'root' ? 'Crea un directorio para comenzar a organizar tus archivos.' : 'Sube aquí un archivo o crea un subdirectorio.'}</span>
            {folderId === 'root'
              ? <button className="text-link" onClick={() => setDialog({ type: 'create-folder' })}>Crear un directorio</button>
              : <button className="text-link" onClick={() => fileInput.current?.click()}>Subir el primer archivo</button>}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="files-table">
              <thead><tr><th>Nombre</th><th>Propietario</th><th>Fecha de subida</th><th>Tipo</th><th>Tamaño</th><th>Acciones</th></tr></thead>
              <tbody>
                {pageEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td><button className="entry-name" onClick={() => openEntry(entry)}><FileIcon entry={entry} /><span><strong>{entry.name}</strong><small>{entry.kind === 'folder' ? 'Directorio' : getFileType(entry.name)}</small></span></button></td>
                    <td><span className="owner-cell"><span className="avatar">{getInitials(entry.owner)}</span>{entry.owner}</span></td>
                    <td>{dateLabel(entry.createdAt)}</td>
                    <td>{entry.kind === 'folder' ? 'Directorio' : getFileType(entry.name)}</td>
                    <td>{entry.kind === 'folder' ? '—' : formatFileSize(entry.bytes)}</td>
                    <td><div className="row-actions">
                      {entry.kind === 'file' && <button className="icon-button" onClick={() => downloadFile(entry)} title="Descargar" aria-label={`Descargar ${entry.name}`}><Download size={16} /></button>}
                      {canManage(entry) && <button className="icon-button" onClick={() => setDialog({ type: 'rename', entry })} title="Cambiar nombre" aria-label={`Cambiar nombre de ${entry.name}`}><Pencil size={16} /></button>}
                      {canManage(entry) && <button className="icon-button" onClick={() => deleteEntry(entry)} title="Eliminar" aria-label={`Eliminar ${entry.name}`}><Trash2 size={16} /></button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-bottom pagination-bar">
          <span>{visibleEntries.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, visibleEntries.length)} de {visibleEntries.length} elementos</span>
          <div className="pagination-controls">
            <label htmlFor="file-page-size">Filas por página</label>
            <select id="file-page-size" onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} value={pageSize}>
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
            </select>
            <button className="icon-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ChevronLeft size={17} /></button>
            <span>Página {page} de {totalPages}</span>
            <button className="icon-button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ChevronRight size={17} /></button>
          </div>
        </div>
      </section>

      {dialog && <EntryDialog dialog={dialog} onClose={() => setDialog(null)} onSubmit={dialog.type === 'rename' ? saveRename : saveFolder} />}
    </>
  );
}

function StatCard({ label, value, detail, icon }) {
  return <article className="stat-card"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function FileIcon({ entry }) {
  if (entry.kind === 'folder') return <span className="file-icon"><Folder size={20} /></span>;
  const extension = entry.name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return <span className="file-icon"><FileImage size={20} /></span>;
  if (['xls', 'xlsx', 'csv'].includes(extension)) return <span className="file-icon"><FileSpreadsheet size={20} /></span>;
  if (extension === 'pdf') return <span className="file-icon"><FileText size={20} /></span>;
  return <span className="file-icon"><File size={20} /></span>;
}

function EntryDialog({ dialog, onClose, onSubmit }) {
  const [name, setName] = useState(dialog.entry?.name || '');
  const [error, setError] = useState('');
  const isRename = dialog.type === 'rename';

  function submit(event) {
    event.preventDefault();
    const result = onSubmit(name.trim());
    if (result) setError(result);
  }

  const initialExtension = isRename && dialog.entry.kind === 'file' && dialog.entry.name.includes('.')
    ? `.${dialog.entry.name.split('.').pop()}`
    : '';

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="entry-dialog-title" aria-modal="true" className="dialog-card" role="dialog">
        <div className="dialog-heading">
          <div><span className="eyebrow">REPOSITORIO DRAIB</span><h2 id="entry-dialog-title">{isRename ? 'Cambiar nombre' : 'Nuevo directorio'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          <label htmlFor="entry-name">{isRename ? 'Nombre' : 'Nombre del directorio'}</label>
          <div className="name-with-extension">
            <input autoFocus className="text-input" id="entry-name" onChange={(event) => { setName(event.target.value); setError(''); }} required value={initialExtension && name.endsWith(initialExtension) ? name.slice(0, -initialExtension.length) : name} />
            {initialExtension && <span>{initialExtension}</span>}
          </div>
          {isRename && <small className="field-help">La extensión del archivo se conserva.</small>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="button button-secondary" onClick={onClose} type="button">Cancelar</button>
            <button className="button button-primary" type="submit">{isRename ? 'Guardar nombre' : 'Crear directorio'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default FilesPage;
