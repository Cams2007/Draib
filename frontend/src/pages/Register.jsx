import { useState } from 'react';
import { ArrowLeft, Mail, UserRound } from 'lucide-react';
import Brand from '../components/Brand.jsx';

function Register({ onBack, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function submit(event) {
    event.preventDefault();

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const result = onSubmit({
      id: `user-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      birthDate: form.birthDate,
    });

    if (result) setError(result);
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <Brand />
        <button className="back-button" onClick={onBack} type="button">
          <ArrowLeft size={17} /> Volver al inicio de sesión
        </button>

        <div className="login-intro">
          <span className="eyebrow">SOLICITUD DE ACCESO</span>
          <h1>Autoregistro</h1>
          <p>Completa tus datos. Un administrador deberá activar tu cuenta antes de que puedas ingresar.</p>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label htmlFor="register-name">Nombre de usuario</label>
          <div className="input-field">
            <UserRound size={17} />
            <input
              autoComplete="name"
              id="register-name"
              name="name"
              onChange={updateField}
              placeholder="Escribe tu nombre completo"
              required
              value={form.name}
            />
          </div>

          <label htmlFor="register-email">Correo electrónico</label>
          <div className="input-field">
            <Mail size={17} />
            <input
              autoComplete="email"
              id="register-email"
              name="email"
              onChange={updateField}
              placeholder="nombre@ejemplo.com"
              required
              type="email"
              value={form.email}
            />
          </div>

          <label htmlFor="register-birth-date">Fecha de nacimiento</label>
          <input
            className="text-input"
            id="register-birth-date"
            max={new Date().toISOString().slice(0, 10)}
            name="birthDate"
            onChange={updateField}
            required
            type="date"
            value={form.birthDate}
          />

          <label htmlFor="register-password">Contraseña</label>
          <input
            autoComplete="new-password"
            className="text-input"
            id="register-password"
            minLength={8}
            name="password"
            onChange={updateField}
            required
            type="password"
            value={form.password}
          />

          <label htmlFor="register-confirm-password">Confirmar contraseña</label>
          <input
            autoComplete="new-password"
            className="text-input"
            id="register-confirm-password"
            minLength={8}
            name="confirmPassword"
            onChange={updateField}
            required
            type="password"
            value={form.confirmPassword}
          />

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="button button-primary" type="submit">
            Enviar solicitud
          </button>
        </form>
      </section>
    </main>
  );
}

export default Register;
