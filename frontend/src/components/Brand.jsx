import { FolderOpen } from 'lucide-react';

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-icon" aria-hidden="true">
        <FolderOpen size={21} />
      </span>
      <span className="brand-copy">
        <strong>Draib</strong>
        <small>REPOSITORIO DE ARCHIVOS</small>
      </span>
    </div>
  );
}

export default Brand;
