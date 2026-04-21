import Navbar from "./Navbar";
import BreadcrumbProjects from "./BreadcrumbProjects";

function HomeHeader() {
  return (
    <div className="dashboard-shell-header">
      <Navbar />
      <BreadcrumbProjects />
    </div>
  );
}

export default HomeHeader;
