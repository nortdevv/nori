<div align="center">

<img width="900" alt="Nori_Github" src="https://github.com/user-attachments/assets/3e8f9179-4179-4a34-89e4-622aef43383c" />

<h1>📄 Nori — AI Requirements Assistant 📄</h1>
<h3><i>"Estandarizando requerimientos... una conversación a la vez"</i></h3>

<!-- Badges -->

<a href="#"><img alt="Web" src="https://img.shields.io/badge/App-Web%20App-EB0029"></a>
<a href="#"><img alt="Stack" src="https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-5B6670"></a>
<a href="#"><img alt="AI" src="https://img.shields.io/badge/AI-LLM%20%7C%20RAG-FFB300"></a>

<br/><br/>

</div>

> **Nori** es una aplicación web que utiliza **inteligencia artificial** para apoyar a Grupo Financiero **Banorte** en el **levantamiento estructurado de requerimientos de software**, generando documentación formal lista para usarse en análisis, diseño y arquitectura.

Este directorio (`nori/`) es el **frontend**: React 19, TypeScript, Vite 7, React Router 7 y Tailwind CSS 4. Los microservicios (auth, chat, documentos, RAG, etc.) viven en el proyecto complementario **`nori-demo`**.

---

## 🔎 Tabla de Contenidos

- [📄 Descripción del Proyecto](#descripción-del-proyecto)
- [🎯 Problema y Solución](#problema-y-solución)
- [🧠 Características Principales](#características-principales)
- [🛠️ Tecnologías Utilizadas](#tecnologías-utilizadas)
- [🚀 Instalación y Configuración](#instalación-y-configuración)
- [🧪 Pruebas E2E (Playwright)](#pruebas-e2e-playwright)
- [📚 Documentación para contribuidores](#documentación-para-contribuidores)
- [👥 Equipo NortDev](#equipo-nortdev)

---

## 📄 Descripción del Proyecto

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
- 📦 Exportación a **.docx** siguiendo el formato `NombreCortoIniciativaYYYY-MM-DD.docx` sin pop-ups.
- 🔐 **Login** contra el servicio de auth (JWT); rutas principales protegidas. _(La capa HTTP del cliente aún puede evolucionar para enviar el Bearer en todas las llamadas cuando el backend lo exija de forma uniforme; ver [AGENTS.md](./AGENTS.md).)_

---

## 🛠️ Tecnologías Utilizadas

| Categoría                | Tecnología                                      | Propósito                                            |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| **Frontend (este repo)** | React, TypeScript, Vite, React Router, Tailwind | SPA y UI responsiva                                  |
| **Backend**              | Node.js / Express (`nori-demo`)                 | APIs REST por microservicio                          |
| **Base de Datos**        | PostgreSQL                                      | Proyectos, usuarios, conversaciones, documentos      |
| **IA/LLM**               | Gemini / OpenAI API (`nori-demo`)               | Generación y análisis de texto                       |
| **RAG**                  | Vector Store (p. ej. pgvector)                  | Búsqueda semántica sobre conocimiento                |
| **Docs**                 | Generación DOCX / HTML preview (servicio docs)  | Salida formal y previsualización                    |
| **Auth**                 | JWT vía servicio dedicado                      | Login email/contraseña y sesión en cliente           |
| **Control de versiones** | Git & GitHub                                    | Colaboración del equipo NortDev                      |

_(Los detalles de despliegue y versiones concretas pueden variar; el frontend prioriza las variables `VITE_*` descritas abajo.)_

---

## 🚀 Instalación y Configuración

> **Frontend:** este proyecto. **APIs y BD:** aloja el stack en **`nori-demo`** (puertos y README de ese repo).

### Requisitos previos (frontend)

- Node.js 20+
- npm (o pnpm)

Para ejecutar el **producto completo** (chat, documentos, auth), también necesitas el entorno de `nori-demo` (Node, PostgreSQL, claves de LLM, etc.), según su documentación.

### Arranque rápido — solo UI

```bash
cd nori
npm install
npm run dev
```

Vite sirve la app (por defecto `http://localhost:5173`).

### Variables de entorno

Crea `nori/.env.local` si los servicios no están en los valores por defecto de `src/config/api.ts`:

```
VITE_AUTH_SERVICE_URL=http://localhost:3003
VITE_CHAT_SERVICE_URL=http://localhost:3001
VITE_DOCUMENT_SERVICE_URL=http://localhost:3004
```

---

## 🧪 Pruebas E2E (Playwright)

Las pruebas viven en `e2e/`. El comando `test:e2e` puede levantar Vite automáticamente (`webServer` en `playwright.config.ts`).

**Primera vez (sin `node_modules`):**

```bash
cd nori
npm install
npm run test:e2e:install
npm run test:e2e
```

- `npm install` — dependencias de la app y de Playwright.
- `test:e2e:install` — descarga Chromium para Playwright (una vez por máquina o tras actualizar Playwright).
- `test:e2e` — ejecuta las pruebas.

**Cuando ya tienes dependencias instaladas:**

```bash
cd nori
npm run test:e2e
```

Vuelve a ejecutar `npm run test:e2e:install` si Playwright se actualizó o falta el navegador.

**Opcional:** `npm run test:e2e:ui` abre la UI interactiva de Playwright.

Las pruebas de humo que solo cargan login **no requieren** levantar todo `nori-demo`. Escenarios que llamen a auth, chat u otros APIs necesitan los servicios en marcha y las `VITE_*` acordes.

---

## 📚 Documentación para contribuidores

- **[AGENTS.md](./AGENTS.md)** — rutas, clientes API (`authApi`, `chatApi`, `documentApi`), flujo de documento/chat, notas de autenticación y patrones de UI.

---

## 👥 Equipo NortDev

<div align="center">

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/rogervdo">
        <img src="https://github.com/rogervdo.png?size=100" width="90px;" alt="Rogelio Villarreal"/><br />
        <b>Rogelio Jesús Villarreal De Ochoa</b>
      </a><br />
      <sub>⚙️ Tech Lead / Full-Stack</sub><br />
      <sub><code>A00838563</code></sub>
    </td>
    <td align="center">
      <a href="https://github.com/Bryan-Meza">
        <img src="https://github.com/Bryan-Meza.png?size=100" width="90px;" alt="Bryan Lemus"/><br />
        <b>Bryan Alberto Lemus Meza</b>
      </a><br />
      <sub>🤖 Backend / Full-Stack</sub><br />
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
