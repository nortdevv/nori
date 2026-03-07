import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import React from "react";

const routeNames: Record<string, string> = {
  proyectos: "Proyectos",
  crear: "Crear Proyecto",
};

function BreadcrumbProjects() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <div
        style={{
          backgroundColor: "#ecf0f2",
          display: "flex",
          alignItems: "center",
          padding: "18px 100px",
          width: "100%",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <BreadcrumbList className="text-base">
          <BreadcrumbItem>
            {pathSegments.length === 0 ? (
              <BreadcrumbPage>Home</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>

          {/* Segmentos dinámicos en el path de Breadcrumb*/}
          {pathSegments.map((segment, index) => {
            const path = "/" + pathSegments.slice(0, index + 1).join("/");
            const isLast = index === pathSegments.length - 1;
            const name = routeNames[segment] || segment;

            return (
              <React.Fragment key={path}>
                <BreadcrumbSeparator
                  className={isLast ? "text-[#EC0029] [&>svg]:size-3.5" : ""}
                />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-[#EC0029] font-semibold">
                      {name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={path}>{name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </div>
    </Breadcrumb>
  );
}

export default BreadcrumbProjects;
