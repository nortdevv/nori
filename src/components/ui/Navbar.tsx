import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, UserCog } from 'lucide-react';
import BanorteLogo from '../../assets/images/BanorteLogo.png';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleProfile = () => {
    setOpen(false);
    navigate('/perfil');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const displayName = user?.name || user?.email || 'Usuario';

  return (
    <nav className="navbar-app" aria-label="Principal">
      <img src={BanorteLogo} alt="Banorte" className="navbar-app__logo" />

      <div ref={dropdownRef} className="navbar-app__menu-wrap">
        <button
          id="user-menu-trigger"
          type="button"
          className="navbar-app__trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <div className="navbar-app__avatar" aria-hidden>
            {initials}
          </div>

          <span className="navbar-app__trigger-name">{displayName}</span>

          <ChevronDown
            size={14}
            className={`navbar-app__chevron${open ? ' is-open' : ''}`}
            aria-hidden
          />
        </button>

        {open && (
          <div id="user-dropdown" className="navbar-app__dropdown" role="menu">
            <div className="navbar-app__dropdown-header">
              <div className="navbar-app__dropdown-avatar" aria-hidden>
                {initials}
              </div>
              <div className="navbar-app__dropdown-text">
                <p className="navbar-app__dropdown-name">{user?.name || 'Usuario'}</p>
                <p className="navbar-app__dropdown-email">{user?.email}</p>
              </div>
            </div>

            <button
              id="profile-button"
              type="button"
              className="navbar-app__profile-link"
              onClick={handleProfile}
              role="menuitem"
            >
              <UserCog size={16} aria-hidden />
              Mi Perfil
            </button>

            <button
              id="logout-button"
              type="button"
              className="navbar-app__logout"
              onClick={handleLogout}
              role="menuitem"
            >
              <LogOut size={16} aria-hidden />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
