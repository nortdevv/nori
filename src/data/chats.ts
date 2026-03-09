import type { Message } from "../components/ui/ChatBubble";
import type { DocSection } from "../components/ui/DocSectionItem";

export interface ChatData {
  projectId: number;
  messages: Message[];
  sections: DocSection[];
}

const BASE_SECTIONS: Omit<DocSection, "completed" | "expanded">[] = [
  { id: 1, title: "1. Introducción" },
  { id: 2, title: "2. Alcance del proyecto" },
  { id: 3, title: "3. Requerimientos funcionales" },
  { id: 4, title: "4. Requerimientos no funcionales" },
  {
    id: 5,
    title: "5. Beneficios",
    subsections: [{ id: "5.1", title: "5.1 Otros Beneficios" }],
  },
  {
    id: 6,
    title: "6. Participación de otras áreas",
    subsections: [
      {
        id: "6.1",
        title: "6.1 Riesgos",
        badge: "Obligatorio",
        badgeColor: "red",
        hasRiskTable: true,
      },
    ],
  },
  {
    id: 7,
    title: "7. Exclusiones",
    badge: "Únicamente si aplica",
    badgeColor: "cyan",
  },
  {
    id: 8,
    title: "8. Supuestos",
    badge: "Únicamente si aplica",
    badgeColor: "cyan",
  },
  {
    id: 9,
    title: "9. Restricciones",
    badge: "Únicamente si aplica",
    badgeColor: "cyan",
  },
  { id: 10, title: "10. Anexos", badge: "Opcional", badgeColor: "navy" },
];

function makeSections(completedUpTo: number): DocSection[] {
  return BASE_SECTIONS.map((s, i) => ({
    ...s,
    completed: s.id <= completedUpTo,
    expanded: i !== 0,
  }));
}

export const chats: ChatData[] = [
  {
    projectId: 1,
    messages: [
      {
        id: 1,
        from: "nori",
        text: '¡Hola! Soy Nori. Veo que trabajarás en "Sistema de Captura de Datos". ¿Puedes contarme el objetivo principal del proyecto?',
      },
      {
        id: 2,
        from: "user",
        text: "Necesitamos capturar datos de campo de forma automática con validación en tiempo real.",
      },
      {
        id: 3,
        from: "nori",
        text: "Entendido. ¿Qué tipo de datos se capturarán y desde qué dispositivos operarán los usuarios en campo?",
      },
      {
        id: 4,
        from: "user",
        text: "Formularios de inspección desde tablets y móviles, con sincronización offline.",
      },
      {
        id: 5,
        from: "nori",
        text: "Perfecto. ¿Quiénes son los usuarios principales del sistema y cuáles son sus roles?",
      },
      {
        id: 6,
        from: "user",
        text: "Inspectores de campo, supervisores y administradores del sistema.",
      },
    ],
    sections: makeSections(2),
  },

  {
    projectId: 2,
    messages: [
      {
        id: 1,
        from: "nori",
        text: '¡Hola! Trabajaremos en "Portal de Autoservicio Clientes". ¿Cuál es el objetivo central del portal?',
      },
      {
        id: 2,
        from: "user",
        text: "Que los clientes puedan gestionar sus cuentas, ver historial y solicitar servicios sin contactar soporte.",
      },
      {
        id: 3,
        from: "nori",
        text: "Excelente. ¿Qué funcionalidades son prioritarias para el lanzamiento inicial?",
      },
      {
        id: 4,
        from: "user",
        text: "Consulta de saldo, descarga de estados de cuenta y solicitud de productos.",
      },
      {
        id: 5,
        from: "nori",
        text: "¿Hay requerimientos de seguridad específicos como autenticación multifactor o cifrado?",
      },
      {
        id: 6,
        from: "user",
        text: "Sí, autenticación en dos pasos y cifrado TLS para todas las transacciones.",
      },
      {
        id: 7,
        from: "nori",
        text: "Entendido. ¿Cuáles son las restricciones técnicas o de compatibilidad a considerar?",
      },
      {
        id: 8,
        from: "user",
        text: "Debe integrarse con el core bancario existente vía API REST y soportar los navegadores principales.",
      },
      {
        id: 9,
        from: "nori",
        text: "Perfecto. He recopilado suficiente información. El documento de requerimientos está casi completo.",
      },
    ],
    sections: makeSections(6),
  },

  {
    projectId: 3,
    messages: [
      {
        id: 1,
        from: "nori",
        text: '¡Hola! Trabajaremos en "Dashboard Ejecutivo de Métricas". ¿Qué problema busca resolver este dashboard?',
      },
      {
        id: 2,
        from: "user",
        text: "Los directivos necesitan visibilidad en tiempo real de los KPIs del negocio para tomar decisiones rápidas.",
      },
      {
        id: 3,
        from: "nori",
        text: "¿Qué KPIs son prioritarios y con qué frecuencia deben actualizarse?",
      },
      {
        id: 4,
        from: "user",
        text: "Ventas, cartera vencida y eficiencia operativa, actualizados cada 15 minutos.",
      },
      {
        id: 5,
        from: "nori",
        text: "¿Quiénes son los usuarios del dashboard y qué nivel de detalle necesita cada uno?",
      },
    ],
    sections: makeSections(2),
  },

  {
    projectId: 4,
    messages: [
      {
        id: 1,
        from: "nori",
        text: '¡Hola! Comenzamos con "App Móvil de Gestión de Inventarios". ¿Cuál es el problema principal que busca resolver?',
      },
      {
        id: 2,
        from: "user",
        text: "El control de inventario es manual y genera errores. Queremos automatizarlo con escaneo de códigos de barras.",
      },
    ],
    sections: makeSections(0),
  },

  {
    projectId: 5,
    messages: [
      {
        id: 1,
        from: "nori",
        text: '¡Hola! Trabajaremos en "Plataforma de Capacitación Online". ¿Cuál es el objetivo del LMS?',
      },
      {
        id: 2,
        from: "user",
        text: "Gestionar la formación interna del personal con cursos, evaluaciones y certificaciones digitales.",
      },
      {
        id: 3,
        from: "nori",
        text: "¿Qué módulos o tipos de contenido debe soportar la plataforma?",
      },
      {
        id: 4,
        from: "user",
        text: "Video, documentos PDF, quizzes y rutas de aprendizaje con gamificación.",
      },
      {
        id: 5,
        from: "nori",
        text: "¿Cuáles son los roles de usuario dentro del sistema?",
      },
      {
        id: 6,
        from: "user",
        text: "Administrador de contenido, instructor y empleado-alumno.",
      },
      {
        id: 7,
        from: "nori",
        text: "¿Hay integraciones requeridas con sistemas de RRHH existentes?",
      },
      {
        id: 8,
        from: "user",
        text: "Sí, integración con el sistema de nómina para validar empleados activos.",
      },
      {
        id: 9,
        from: "nori",
        text: "Excelente. ¿Qué métricas de seguimiento necesita el área de Recursos Humanos?",
      },
      {
        id: 10,
        from: "user",
        text: "Tasa de completación, tiempo promedio por curso y resultados de evaluaciones.",
      },
      {
        id: 11,
        from: "nori",
        text: "¡Perfecto! Toda la información ha sido recopilada. El documento de requerimientos está completo.",
      },
    ],
    sections: makeSections(8),
  },

  {
    projectId: 6,
    messages: [
      {
        id: 1,
        from: "nori",
        text: '¡Hola! Comenzamos con "Sistema de Gestión Documental". ¿Qué necesidad del negocio cubre este sistema?',
      },
      {
        id: 2,
        from: "user",
        text: "Centralizar todos los documentos corporativos con control de versiones y flujos de aprobación.",
      },
      {
        id: 3,
        from: "nori",
        text: "¿Qué tipos de documentos se gestionarán y quiénes serán los principales usuarios?",
      },
    ],
    sections: makeSections(1),
  },
];

export function getChatData(projectId: number): ChatData | undefined {
  return chats.find((c) => c.projectId === projectId);
}
