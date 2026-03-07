function SubNavbar() {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        padding: "15px 100px",
        width: "100%",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        position: "relative",
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 350,
          fontSize: "18px",
          color: "#7B868B",
          letterSpacing: "0.5px",
        }}
      >
        Nori
      </span>
    </div>
  );
}

export default SubNavbar;
