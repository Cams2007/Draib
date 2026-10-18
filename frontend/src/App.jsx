import { useRef, useState } from 'react';
import { INITIAL_USERS } from './data/initialUsers.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MainLayout from './layout/MainLayout.jsx';
import FilesPage from './pages/FilesPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import Toast from './components/Toast.jsx';

// Clave temporal para probar las pantallas. La autenticación real corresponderá a la API.
const DEMO_PASSWORD = 'Draib2026!';

function App() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [entries, setEntries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState('files');
  const [showRegistration, setShowRegistration] = useState(false);
  const [message, setMessage] = useState('');
  const toastTimer = useRef(null);

  function notify(text) {
    setMessage(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setMessage(''), 3200);
  }

  function signIn(email, password) {
    const requestedEmail = email.trim().toLowerCase();
    const user = users.find((item) => item.email.toLowerCase() === requestedEmail);

    if (!email.trim() || !password) return 'Escribe tu correo y contraseña.';
    if (!user) return 'El correo o la contraseña no son correctos.';
    if (password !== DEMO_PASSWORD) return 'El correo o la contraseña no son correctos.';
    if (!user.active) return 'La cuenta está desactivada. Contacta al administrador.';

    const loggedUser = { ...user, hasRefreshToken: true };
    setUsers((current) => current.map((item) =>
      item.id === user.id ? { ...item, hasRefreshToken: true } : item,
    ));
    setCurrentUser(loggedUser);
    setPage('files');
    return '';
  }

  function signOut() {
    if (currentUser) {
      setUsers((current) => current.map((user) =>
        user.id === currentUser.id ? { ...user, hasRefreshToken: false } : user,
      ));
    }
    setCurrentUser(null);
    setPage('files');
    setShowRegistration(false);
  }

  function submitRegistration(newUser) {
    const emailTaken = users.some((user) => user.email.toLowerCase() === newUser.email.toLowerCase());
    if (emailTaken) return 'Ya existe una cuenta registrada con ese correo.';

    setUsers((current) => [...current, {
      ...newUser,
      role: 'Usuario',
      active: false,
      hasRefreshToken: false,
    }]);
    setShowRegistration(false);
    notify('Solicitud enviada. El administrador revisará y activará la cuenta.');
    return '';
  }

  if (!currentUser) {
    return (
      <>
        {showRegistration ? (
          <Register
            onBack={() => setShowRegistration(false)}
            onSubmit={submitRegistration}
          />
        ) : (
          <Login
            onLogin={signIn}
            onRegister={() => setShowRegistration(true)}
          />
        )}
        <Toast message={message} />
      </>
    );
  }

  const isAdmin = currentUser.role === 'Administrador';

  return (
    <>
      <MainLayout
        currentUser={currentUser}
        activePage={page}
        onNavigate={setPage}
        onSignOut={signOut}
        onNotify={notify}
        entries={entries}
      >
        {page === 'users' && isAdmin ? (
          <UsersPage
            users={users}
            setUsers={setUsers}
            currentUser={currentUser}
            notify={notify}
          />
        ) : (
          <FilesPage
            entries={entries}
            setEntries={setEntries}
            currentUser={currentUser}
            notify={notify}
          />
        )}
      </MainLayout>
      <Toast message={message} />
    </>
  );
}

export default App;
