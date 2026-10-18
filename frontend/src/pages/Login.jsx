import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import Brand from '../components/Brand.jsx';

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    setError(onLogin(email, password));
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <Brand />

        <div className="login-intro">
          <span className="eyebrow">REPOSITORIO COMPARTIDO</span>
          <h1>Iniciar sesión</h1>
          <p>Ingresa con el correo y la contraseña de tu cuenta.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label htmlFor="login-email">Correo electrónico</label>
          <div className="input-field">
            <Mail size={17} />
            <input
              autoComplete="username"
              autoFocus
              id="login-email"
              onChange={(event) => { setEmail(event.target.value); setError(''); }}
              placeholder="nombre@ejemplo.com"
              required
              type="email"
              value={email}
            />
          </div>

          <label htmlFor="login-password">Contraseña</label>
          <div className="input-field">
            <LockKeyhole size={17} />
            <input
              autoComplete="current-password"
              id="login-password"
              onChange={(event) => { setPassword(event.target.value); setError(''); }}
              placeholder="Escribe tu contraseña"
              required
              type="password"
              value={password}
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="button button-primary login-submit" type="submit">
            Ingresar <ArrowRight size={17} />
          </button>
        </form>

        <p className="register-prompt">
          ¿Aún no tienes cuenta?{' '}
          <button className="text-link" onClick={onRegister} type="button">Autoregistrarme</button>
        </p>
      </section>

      <aside className="login-aside">
        <div className="aside-orbit orbit-one" />
        <div className="aside-orbit orbit-two" />
        <div className="aside-content">
          <div className="hero-folder"><Brand compact /></div>
          <span className="eyebrow">TUS DOCUMENTOS, EN ORDEN</span>
          <h2>Un espacio claro para los archivos de tu equipo.</h2>
          <p>Guarda, organiza y encuentra tus documentos desde un solo lugar.</p>
        </div>
      </aside>
    </main>
  );
}

export default Login;
