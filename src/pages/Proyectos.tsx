import Navbar from "../components/ui/Navbar";
import SubNavbar from "../components/ui/SubNavbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";

function Proyectos() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Navbar />
        <SubNavbar />
        <BreadcrumbProjects />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>Hola</div>
    </div>
  );
}

export default Proyectos;
