import BanorteLogo from '../../assets/images/BanorteLogo.png';

function Navbar() {
  return (
    <nav
      style={{
        backgroundColor: '#EC0029',
        display: 'flex',
        alignItems: 'center',
        padding: '15px 95px',
        width: '100%',
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 11,
      }}
    >
      <img src={BanorteLogo} alt="Banorte" style={{ height: '33px' }} />
    </nav>
  );
}

export default Navbar;

