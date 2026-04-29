import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Clock3,
  CheckCircle2,
  FileText,
  Loader2,
  UserCog,
  Mail,
  ShieldCheck,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HomeHeader from '../components/ui/HomeHeader';
import { chatApi } from '../services/api';
import { getStatusLabel } from '../types/project';
import type { ProjectDisplay } from '../types/project';
import { toProjectDisplay } from '../types/project';
import './Perfil.css';

function Perfil() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Mi Perfil — Nori';
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { conversations } = await chatApi.getConversations();
      setProjects(conversations.map(toProjectDisplay));
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const displayName = user?.name || user?.email || 'Usuario';

  const roleLabel = user?.role === 'admin' ? 'Administrador' : 'Usuario';

  // Compute stats
  const totalProjects = projects.length;
  const inProgress = projects.filter((p) => p.status === 'in_progress').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const drafts = projects.filter((p) => p.status === 'draft').length;

  return (
    <div className="profile-page">
      <HomeHeader />

      {/* Hero banner */}
      <section className="profile-hero">
        <div className="profile-hero__inner">
          <div className="profile-avatar" aria-hidden>
            {initials}
          </div>
          <div className="profile-hero__info">
            <span className="profile-hero__role">
              <ShieldCheck size={13} style={{ marginRight: 4, verticalAlign: '-2px' }} />
              {roleLabel}
            </span>
            <h1 className="profile-hero__name">{displayName}</h1>
            <p className="profile-hero__email">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-card__icon profile-stat-card__icon--projects">
            <FolderKanban size={20} />
          </div>
          <span className="profile-stat-card__value">{totalProjects}</span>
          <span className="profile-stat-card__label">Proyectos totales</span>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-card__icon profile-stat-card__icon--progress">
            <Loader2 size={20} />
          </div>
          <span className="profile-stat-card__value">{inProgress}</span>
          <span className="profile-stat-card__label">En progreso</span>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-card__icon profile-stat-card__icon--completed">
            <CheckCircle2 size={20} />
          </div>
          <span className="profile-stat-card__value">{completed}</span>
          <span className="profile-stat-card__label">Completados</span>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-card__icon profile-stat-card__icon--drafts">
            <FileText size={20} />
          </div>
          <span className="profile-stat-card__value">{drafts}</span>
          <span className="profile-stat-card__label">Borradores</span>
        </div>
      </div>

      <main className="profile-content">
        {/* Account info */}
        <h2 className="profile-section-title">
          <span className="profile-section-title__icon">
            <UserCog size={18} />
          </span>
          Información de la cuenta
        </h2>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <p className="profile-info-item__label">
              <Mail size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} />
              Correo electrónico
            </p>
            <p className="profile-info-item__value">{user?.email ?? '—'}</p>
          </div>
          <div className="profile-info-item">
            <p className="profile-info-item__label">
              <ShieldCheck size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} />
              Rol
            </p>
            <p className="profile-info-item__value">{roleLabel}</p>
          </div>
          <div className="profile-info-item">
            <p className="profile-info-item__label">
              <Building2 size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} />
              Departamento
            </p>
            <p className="profile-info-item__value">Tecnología e Innovación</p>
          </div>
          <div className="profile-info-item">
            <p className="profile-info-item__label">
              <CalendarDays size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} />
              Miembro desde
            </p>
            <p className="profile-info-item__value">Abril 2026</p>
          </div>
        </div>

        {/* Projects list */}
        <h2 className="profile-section-title">
          <span className="profile-section-title__icon">
            <FolderKanban size={18} />
          </span>
          Mis proyectos
        </h2>

        {isLoading ? (
          <div className="profile-loading" aria-busy="true" aria-label="Cargando proyectos">
            <div className="profile-loading__bar" />
            <div className="profile-loading__bar" />
            <div className="profile-loading__bar" />
          </div>
        ) : projects.length === 0 ? (
          <div className="profile-empty">
            <h3>Aún no tienes proyectos</h3>
            <p>Crea tu primer proyecto desde la página principal.</p>
          </div>
        ) : (
          <div className="profile-projects-list">
            {projects.map((project) => (
              <Link
                key={project.project_id}
                to={`/${project.project_id}`}
                className="profile-project-row"
              >
                <span className="profile-project-row__name">{project.name}</span>

                <div className="profile-project-row__tags">
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="profile-project-row__tag">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="profile-project-row__tag">Sin categorías</span>
                  )}
                </div>

                <span
                  className={`project-status-badge ${getStatusBadgeClass(project.status)}`}
                >
                  {getStatusLabel(project.status)}
                </span>

                <span className="profile-project-row__date">
                  <Clock3 size={13} />
                  {project.lastUpdatedLabel}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  if (status === 'completed') return 'project-status-badge--completed';
  if (status === 'draft') return 'project-status-badge--draft';
  return 'project-status-badge--progress';
}

export default Perfil;
