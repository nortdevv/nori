<div align="center">

<img src="https://dummyimage.com/1200x240/EB0029/ffffff&text=Nori" alt="Nori banner" width="100%" />

<h1>📄 Nori — AI Requirements Assistant 📄</h1>
<h3><i>"Estandarizando requerimientos... una conversación a la vez"</i></h3>

<!-- Badges -->
<a href="#"><img alt="Web" src="https://img.shields.io/badge/App-Web%20App-EB0029"></a>
<a href="#"><img alt="Stack" src="https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-5B6670"></a>
<a href="#"><img alt="AI" src="https://img.shields.io/badge/AI-LLM%20%7C%20RAG-FFB300"></a>
<a href="#"><img alt="Banorte" src="https://img.shields.io/badge/Reto-Banorte%20-%20Ingenier%C3%ADa%20de%20Software-red"></a>

<br/><br/>
</div>

> **Nori** es una aplicación web que utiliza **inteligencia artificial** para apoyar a Grupo Financiero **Banorte** en el **levantamiento estructurado de requerimientos de software**, generando documentación formal lista para usarse en análisis, diseño y arquitectura.

---

## 🔎 Tabla de Contenidos
- [✨ Descripción del Proyecto](#-descripción-del-proyecto)
- [🎯 Problema y Solución](#-problema-y-solución)
- [🧠 Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [🏗️ Arquitectura en Alto Nivel](#️-arquitectura-en-alto-nivel)
- [📅 Roadmap](#-roadmap)
- [👥 Equipo NortDev](#-equipo-nortdev)

---

## ✨ Descripción del Proyecto

### Contexto

En Banorte, la documentación de requerimientos de software suele implicar semanas de iteraciones entre áreas de negocio, TI y arquitectura, generando información dispersa, ambigua y poco estandarizada. Nori se propone como un **asistente virtual especializado** que guía a los usuarios a través de una conversación estructurada, integra conocimiento organizacional y produce automáticamente documentos en la plantilla oficial del banco.

Nori forma parte del **Reto 1 — Ingeniería de Software con IA** de Banorte, enfocado en agilizar la generación de documentos de análisis, diseño y arquitectura de solución.

---

## 🎯 Problema y Solución

### 🔴 Problema Identificado

- Documentos de requerimientos **incompletos, ambiguos y desestructurados**.  
- Dependencia fuerte del conocimiento tácito de expertos, difícil de escalar.  
- Alto tiempo de ciclo para consolidar un documento formal entre múltiples áreas.  
- Falta de **estandarización**, trazabilidad y gobernanza de iniciativas tecnológicas.  

### ✅ Nuestra Solución

Una **aplicación web interna** para Banorte que:

- Ofrece un **asistente conversacional** que guía el levantamiento de requisitos.  
- **Clasifica** automáticamente la solicitud y valida que esté dentro del dominio permitido.  
- Usa **RAG** para consultar información organizacional (departamentos, stack tecnológico, roadmap, lineamientos).  
- Genera automáticamente un **documento de levantamiento de requerimientos** en formato **.docx** con plantilla corporativa.  
- Permite **editar**, versionar y **reanudar** conversaciones y documentos previamente guardados.  
- Incluye historial de proyectos, indicadores de avance y validación de secciones obligatorias antes de exportar.

---

## 🧠 Características Principales

- 💬 Chat IA con **gestión de contexto** y auto-guardado de la conversación.  
- 🗂️ **Dashboard de proyectos** con búsqueda, filtros y estados (En progreso, Completado, Borrador).  
- 🧭 **Clasificador de dominio** para asegurar que la iniciativa pertenece al ámbito de TI / requerimientos.  
- 🏢 Integración con **base de conocimiento RAG**: departamentos, tecnologías actuales y planeadas, estándares internos.  
- 📝 **Editor de documento** con sugerencias de mejora generadas por IA y edición sección por sección.  
- 📦 Exportación a **.docx** siguiendo el formato `NombreCortoIniciativaYYYY-MM-DD.docx` sin pop‑ups.  
- 🔐 Sesiones seguras sobre **HTTPS/TLS**, expiración a los 30 minutos con guardado automático del progreso.  

---

## 🛠️ Tecnologías Utilizadas

| Categoría        | Tecnología           | Propósito                                      |
|------------------|----------------------|------------------------------------------------|
| **Frontend**     | React / Next.js      | Interfaz web responsiva                        |
| **Estilos**      | TailwindCSS          | UI alineada a la Guía de Estilos Banorte       |
| **Backend**      | Node.js / Express    | API REST y orquestación de servicios           |
| **Base de Datos**| PostgreSQL           | Proyectos, usuarios, conversaciones, documentos|
| **IA/LLM**       | Gemini / OpenAI API  | Generación y análisis de texto                 |
| **RAG**          | Vector Store (pgvector / similar) | Búsqueda semántica sobre conocimiento Banorte |
| **Docs**         | python-docx / similar| Generación de archivos .docx                   |
| **Auth**         | OAuth 2.0 / SSO      | Autenticación corporativa                      |
| **Control de versiones** | Git & GitHub | Colaboración del equipo NortDev                |

*(Tecnologías concretas pueden variar según implementación final.)*

---

## 🚀 Instalación y Configuración

> Nota: Este proyecto está pensado como **prototipo interno** para Banorte. Los pasos de instalación pueden ajustarse a la infraestructura objetivo (on‑premise / nube).

### Requisitos Previos

- Node.js 20+  
- npm o pnpm  
- Python 3.11+ (para servicio de documentos y tareas de IA opcionales)  
- PostgreSQL 14+  
- Cuenta / API Key del proveedor de LLM (p. ej. Gemini / OpenAI)  

## 🧑‍💻 Equipo NortDev

<div align="center">

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/rogervdo">
        <img src="https://github.com/rogervdo.png?size=100" width="90px;" alt="Rogelio Villarreal"/><br />
        <b>Rogelio Jesús Villarreal De Ochoa</b>
      </a><br />
      <sub>⚙️ Tech Lead / Frontend</sub><br />
      <sub><code>A00838563</code></sub>
    </td>
    <td align="center">
      <a href="https://github.com/Bryan-Meza">
        <img src="https://github.com/Bryan-Meza.png?size=100" width="90px;" alt="Bryan Lemus"/><br />
        <b>Bryan Alberto Lemus Meza</b>
      </a><br />
      <sub>🤖 Backend / IA</sub><br />
      <sub><code>A00838730</code></sub>
    </td>
    <td align="center">
      <a href="https://github.com/mm1tch">
        <img src="https://github.com/mm1tch.png?size=100" width="90px;" alt="Vania Sánchez"/><br />
        <b>Vania Michelle Sánchez Murillo</b>
      </a><br />
      <sub>🎨 UX / QA</sub><br />
      <sub><code>A00838552</code></sub>
    </td>
    <td align="center">
      <a href="https://github.com/jordygranados">
        <img src="https://github.com/jordygranados.png?size=100" width="90px;" alt="Jordy Granados"/><br />
        <b>Cristian Jordy Granados Castañeda</b>
      </a><br />
      <sub>🐳 DevOps / Integraciones</sub><br />
      <sub><code>A00998753</code></sub>
    </td>
    <td align="center">
      <a href="https://github.com/bashlui">
        <img src="https://github.com/bashlui.png?size=100" width="90px;" alt="Luis Bolaña"/><br />
        <b>Luis Antonio Bolaina Domínguez</b>
      </a><br />
      <sub>📋 Product Owner / Full-Stack</sub><br />
      <sub><code>A01737959</code></sub>
    </td>
  </tr>
</table>

</div>
