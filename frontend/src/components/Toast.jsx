import { CheckCircle2 } from 'lucide-react';

function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <CheckCircle2 size={18} />
      <span>{message}</span>
    </div>
  );
}

export default Toast;
