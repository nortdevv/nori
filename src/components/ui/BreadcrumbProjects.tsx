import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const raw = location.pathname.split('/').filter(Boolean);
  const pathSegments = raw[0] === 'chat' && raw[1] ? [raw[1], raw[0]] : raw;
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { conversations } = await chatApi.getConversations();
        const displayProjects = conversations.map(toProjectDisplay);
        setProjects(displayProjects);
      } catch (err) {
        console.error('Error loading projects for breadcrumb:', err);
      }
    };
    loadProjects();
  }, []);

  function getSegmentName(segment: string) {
    if (routeNames[segment]) return routeNames[segment];

    const project = projects.find((p) => p.project_id === segment);
    if (project) return project.name;

    return segment;
  }

  return (
    <Breadcrumb>
      <div
        style={{
          backgroundColor: '#EBF0F2',
          display: 'flex',
          alignItems: 'center',
          padding: '15px 110px',
          width: '100%',
        }}
      >
        <BreadcrumbList style={{ fontFamily: "'Gotham Medium', sans-serif", fontSize: '14px', color: '#323E48' }}>
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
            const path = '/' + pathSegments.slice(0, index + 1).join('/');
            const isLast = index === pathSegments.length - 1;
            const name = getSegmentName(segment);

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

