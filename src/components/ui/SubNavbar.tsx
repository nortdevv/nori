function SubNavbar() {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        height: '54px',
        padding: '0 110px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontFamily: "'Gotham Book', sans-serif",
          fontWeight: 400,
          fontSize: '17px',
          color: '#5B6670',
          letterSpacing: '0.5px',
        }}
      >
        Nori
      </span>
    </div>
  );
}

export default SubNavbar;

