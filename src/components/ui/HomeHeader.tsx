import Navbar from "./Navbar";
import SubNavbar from "./SubNavbar";
import BreadcrumbProjects from "./BreadcrumbProjects";

function HomeHeader() {
  return (
    <div style={{ flexShrink: 0 }}>
      <Navbar />
      <SubNavbar />
      <BreadcrumbProjects />
    </div>
  );
}

export default HomeHeader;
