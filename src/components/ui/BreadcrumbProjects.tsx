import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../services/api';
import type { ProjectDisplay } from '../../types/project';
import { toProjectDisplay } from '../../types/project';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './Breadcrumb';

// En este vector se lleva el mapeo de la ruta dentro de la URL y como se verá
// escrito dentro del Breadcrumb

// Ejemplo: localhost/detalle
// Breadcrumb: Proyectos > Detalle osea /detalle == Detalle

const routeNames: Record<string, string> = {
  proyectos: 'Proyectos',
  crear: 'Crear Proyecto',
  detalle: 'Detalle',
  chat: 'Chat',
};

function BreadcrumbProjects() {
  const { user } = useAuth();
  const location = useLocation();
  const raw = location.pathname.split('/').filter(Boolean);
  const activeProjectId = location.state?.projectId || sessionStorage.getItem("nori_active_project_id");

  let pathSegments = raw;
  if (raw[0] === 'chat' && raw[1]) {
    pathSegments = [raw[1], 'chat'];
  } else if (raw[0] === 'chat') {
    pathSegments = activeProjectId ? [activeProjectId, 'chat'] : ['chat'];
  } else if (raw[0] === 'proyecto') {
    pathSegments = activeProjectId ? [activeProjectId] : ['proyecto'];
  } else if (raw.length === 1 && raw[0] !== 'perfil' && raw[0] !== 'crear') {
    pathSegments = [raw[0]];
  }

  const [projects, setProjects] = useState<ProjectDisplay[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const loadProjects = async () => {
      try {
        const { conversations } = await chatApi.getConversations(user?.id);
        const displayProjects = conversations.map(toProjectDisplay);
        setProjects(displayProjects);
      } catch (err) {
        console.error('Error loading projects for breadcrumb:', err);
      }
    };
    loadProjects();
  }, [user?.id]);

  function getSegmentName(segment: string) {
    if (routeNames[segment]) return routeNames[segment];

    const project = projects.find((p) => p.project_id === segment);
    if (project) return project.name;

    return segment;
  }

  return (
    <Breadcrumb>
      <div className="breadcrumb-projects-strip">
        <BreadcrumbList className="breadcrumb-projects-strip__list">
          <BreadcrumbItem>
            {pathSegments.length === 0 ? (
              <BreadcrumbPage className="font-semibold">Proyectos</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild className="font-semibold">
                <Link to="/">Proyectos</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>

          {/* Segmentos dinámicos en el path de Breadcrumb*/}
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const name = getSegmentName(segment);

            let path = '/';
            if (segment === 'chat') {
              path = `/chat/${pathSegments[0]}`;
            } else if (segment === 'crear') {
              path = '/crear';
            } else if (segment === 'perfil') {
              path = '/perfil';
            } else {
              path = `/${segment}`;
            }

            return (
              <React.Fragment key={path}>
                <BreadcrumbSeparator className={isLast ? 'text-[#EB0029] [&>svg]:size-3.5' : ''} />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-[#EB0029] font-semibold">{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild className="font-semibold">
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

