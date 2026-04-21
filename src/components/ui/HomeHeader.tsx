import Navbar from "./Navbar";
import BreadcrumbProjects from "./BreadcrumbProjects";

function HomeHeader() {
  return (
    <div style={{ flexShrink: 0 }}>
      <Navbar />
      <BreadcrumbProjects />
    </div>
  );
}

export default HomeHeader;
