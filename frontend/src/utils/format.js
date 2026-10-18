export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileType(fileName = '') {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') return 'PDF';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return 'Imagen';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'Hoja de cálculo';
  if (['ppt', 'pptx'].includes(extension)) return 'Presentación';
  if (['zip', 'rar', '7z'].includes(extension)) return 'Comprimido';
  return 'Documento';
}
