import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Send,
  FileText,
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/ui/Navbar";
import SubNavbar from "../components/ui/SubNavbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";
import StepIndicator from "../components/ui/StepIndicator";
import ChatBubble, { type Message } from "../components/ui/ChatBubble";
import DocSectionItem, {
  type DocSection,
} from "../components/ui/DocSectionItem";
import { projects } from "../data/projects";
import { getChatData } from "../data/chats";
import "./Chat.css";

const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL?.trim() || "http://localhost:3001";
const CHAT_PROJECT_MAP_STORAGE_KEY = "nori-chat-project-map-v1";

type ConversationMap = Record<string, string>;

interface BackendHistoryMessage {
  message_no: number;
  role: "user" | "model";
  content: string;
}

const STEPS = ["Contexto", "Levantamiento", "Revisión"];

const INITIAL_SECTIONS = [
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
        badgeColor: "red" as const,
        hasRiskTable: true,
      },
    ],
  },
  {
    id: 7,
    title: "7. Exclusiones",
    badge: "Únicamente si aplica",
    badgeColor: "cyan" as const,
  },
  {
    id: 8,
    title: "8. Supuestos",
    badge: "Únicamente si aplica",
    badgeColor: "cyan" as const,
  },
  {
    id: 9,
    title: "9. Restricciones",
    badge: "Únicamente si aplica",
    badgeColor: "cyan" as const,
  },
  {
    id: 10,
    title: "10. Anexos",
    badge: "Opcional",
    badgeColor: "navy" as const,
  },
];


function getCurrentStep(msgCount: number): number {
  if (msgCount < 6) return 1;
  if (msgCount < 12) return 2;
  return 3;
}

function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSend,
  currentSection,
  isSending,
}: {
  messages: Message[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  currentSection: string;
  isSending: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <div className="chat-panel__title">Asistente Conversacional</div>
        <div className="chat-panel__subtitle">
          Responde las preguntas de Nori
        </div>
        <div className="chat-panel__badge">
          <MapPin size={13} color="#6B6B6B" />
          <span>Trabajando en: {currentSection}</span>
        </div>
      </div>

      <div className="chat-panel__messages">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-panel__quick-actions">
        {["Continuar", "Agregar más detalles"].map((label) => (
          <button
            key={label}
            className="chat-panel__quick-btn"
            disabled={isSending}
            onClick={() => onInputChange(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="chat-panel__input-row">
        <input
          className="chat-panel__input"
          value={inputValue}
          disabled={isSending}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Describe tu proyecto o responde a Nori..."
        />
        <button className="chat-panel__send-btn" onClick={onSend} disabled={isSending}>
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 5;

function DocumentPanel({
  sections,
  onToggle,
}: {
  sections: DocSection[];
  onToggle: (id: number) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(sections.length / PAGE_SIZE);
  const visible = sections.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="doc-panel">
      <div className="doc-panel__header">
        <div className="doc-panel__header-left">
          <FileText size={18} color="#1A1A1A" />
          <span>Documento de Requerimientos</span>
        </div>
        <RefreshCw size={18} color="#EC0029" className="doc-panel__refresh" />
      </div>

      <div className="doc-panel__sections">
        {visible.map((section) => (
          <DocSectionItem
            key={section.id}
            section={section}
            onToggle={onToggle}
          />
        ))}
      </div>

      <div className="doc-panel__pagination">
        <button
          className="doc-panel__page-btn"
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 0}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="doc-panel__page-label">
          {page + 1} / {totalPages}
        </span>
        <button
          className="doc-panel__page-btn"
          onClick={() => setPage((p) => p + 1)}
          disabled={page === totalPages - 1}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="doc-panel__footer">
        <button className="doc-panel__generate-btn">
          <FileText size={16} />
          Generar Documento
        </button>
      </div>
    </div>
  );
}

function Chat() {
  const { id } = useParams<{ id: string }>();
  const project = projects.find((p) => p.id === Number(id)) ?? projects[0];
  const routeProjectKey = String(project.id);

  const chatData = getChatData(project.id);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [backendProjectId, setBackendProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(
    chatData?.messages ?? [
      {
        id: 1,
        from: "nori",
        text: `¡Hola! Soy Nori, tu asistente para levantar requerimientos de software. Veo que quieres trabajar en "${project.title}". ¿Puedes contarme más sobre el objetivo del proyecto?`,
      },
    ],
  );
  const [sections, setSections] = useState<DocSection[]>(
    chatData?.sections ??
      INITIAL_SECTIONS.map((s, i) => ({
        ...s,
        completed: false,
        expanded: i !== 0,
      })),
  );

  function readConversationMap(): ConversationMap {
    try {
      const raw = localStorage.getItem(CHAT_PROJECT_MAP_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as ConversationMap;
      }
      return {};
    } catch {
      return {};
    }
  }

  function saveConversationMap(map: ConversationMap) {
    localStorage.setItem(CHAT_PROJECT_MAP_STORAGE_KEY, JSON.stringify(map));
  }

  function toUiMessages(history: BackendHistoryMessage[]): Message[] {
    return history.map((msg) => ({
      id: msg.message_no,
      from: msg.role === "user" ? "user" : "nori",
      text: msg.content,
    }));
  }

  async function initializeConversation() {
    try {
      const map = readConversationMap();
      let mappedProjectId = map[routeProjectKey];

      if (!mappedProjectId) {
        const createRes = await fetch(`${CHAT_API_URL}/api/chat/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: project.title,
            description: project.description,
            type: project.category,
          }),
        });

        if (!createRes.ok) {
          throw new Error("No se pudo crear conversación en backend");
        }

        const created = (await createRes.json()) as { projectId?: string };
        if (!created.projectId) {
          throw new Error("Respuesta inválida al crear conversación");
        }

        mappedProjectId = created.projectId;
        map[routeProjectKey] = mappedProjectId;
        saveConversationMap(map);
      }

      setBackendProjectId(mappedProjectId);

      const historyRes = await fetch(
        `${CHAT_API_URL}/api/chat/history/${mappedProjectId}`,
      );
      if (!historyRes.ok) {
        throw new Error("No se pudo cargar historial");
      }

      const historyJson = (await historyRes.json()) as {
        messages?: BackendHistoryMessage[];
      };
      const uiMessages = toUiMessages(historyJson.messages ?? []);

      if (uiMessages.length > 0) {
        setMessages(uiMessages);
      }
    } catch (error) {
      console.error("Error connecting chat to backend:", error);
      // Keep mock data as fallback for local UI development.
    }
  }

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isSending || !backendProjectId) return;

    setMessages((prev) => [...prev, { id: Date.now(), from: "user", text }]);
    setInputValue("");

    setIsSending(true);
    try {
      const sendRes = await fetch(`${CHAT_API_URL}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: backendProjectId,
          message: text,
        }),
      });

      if (!sendRes.ok) {
        throw new Error("No se pudo enviar mensaje");
      }

      const response = (await sendRes.json()) as { reply?: string };

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: "nori",
          text:
            response.reply?.trim() ||
            "No recibí respuesta del asistente. Intenta de nuevo.",
        },
      ]);
    } catch (error) {
      console.error("Error sending message to backend:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: "nori",
          text: "No pude conectar con el backend en este momento.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    document.title = "Chat — Nori";
  }, []);

  useEffect(() => {
    void initializeConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeProjectKey]);

  return (
    <div className="chat-page">
      <div className="chat-nav">
        <Navbar />
        <SubNavbar />
        <BreadcrumbProjects />
      </div>

      <StepIndicator
        steps={STEPS}
        currentStep={getCurrentStep(messages.length)}
      />

      <div className="chat-split">
        <ChatPanel
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          isSending={isSending}
          currentSection={sections.find((s) => !s.completed)?.title ?? sections[sections.length - 1].title}
        />
        <DocumentPanel
          sections={sections}
          onToggle={(id) =>
            setSections((prev) =>
              prev.map((s) =>
                s.id === id ? { ...s, expanded: !s.expanded } : s,
              ),
            )
          }
        />
      </div>
    </div>
  );
}

export default Chat;
