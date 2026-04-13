import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import BanorteLogo from '../../assets/images/BanorteLogo.png';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Build initials from name or email
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const displayName = user?.name || user?.email || 'Usuario';

  return (
    <nav
      style={{
        backgroundColor: '#EC0029',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px clamp(1rem, 5vw, 95px)',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 4px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 11,
      }}
    >
      {/* Logo */}
      <img src={BanorteLogo} alt="Banorte" style={{ height: '33px' }} />

      {/* User dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Trigger button */}
        <button
          id="user-menu-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '999px',
            padding: '5px 12px 5px 5px',
            cursor: 'pointer',
            color: 'white',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          {/* Avatar circle */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'white', color: '#EC0029',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>

          {/* Name — hidden on very small screens */}
          <span style={{
            fontSize: '0.85rem', fontWeight: 600,
            maxWidth: 'clamp(0px, 20vw, 140px)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </span>

          <ChevronDown
            size={15}
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            id="user-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              minWidth: '220px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              zIndex: 100,
              animation: 'fadeSlideDown 0.15s ease',
            }}
          >
            {/* User info header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#EC0029', color: 'white', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  margin: 0, fontWeight: 700, fontSize: '0.88rem',
                  color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.name || 'Usuario'}
                </p>
                <p style={{
                  margin: 0, fontSize: '0.75rem', color: '#64748b',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              id="logout-button"
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', color: '#dc2626', fontSize: '0.88rem', fontWeight: 600,
                textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fff1f2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* Dropdown animation keyframes */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;


