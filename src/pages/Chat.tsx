import { ChevronLeft, ChevronRight, FileText, GitBranch, RefreshCw, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BreadcrumbProjects from '../components/ui/BreadcrumbProjects';
import ChatBubble, { type Message as ChatBubbleMessage } from '../components/ui/ChatBubble';
import DiagramModal from '../components/ui/DiagramModal';
import DocPreviewModal from '../components/ui/DocPreviewModal';
import DocSectionItem, { type DocSection } from '../components/ui/DocSectionItem';
import Navbar from '../components/ui/Navbar';
import SubNavbar from '../components/ui/SubNavbar';
import { chatApi, documentApi } from '../services/api';
import './Chat.css';

const INITIAL_SECTIONS = [
  { id: 0, title: '0. Información General del Solicitante' },
  { id: 1, title: '1. Descripción General y Justificación' },
  { id: 2, title: '2. Objetivos de la Iniciativa' },
  { id: 3, title: '3. Áreas Impactadas' },
  { id: 4, title: '4. Requerimientos de Negocio' },
  { id: 5, title: '5. Beneficios' },
  { id: 6, title: '6. Participación de Otras Áreas' },
  { id: 7, title: '7. Riesgos' },
  { id: 8, title: '8. Exclusiones' },
  { id: 9, title: '9. Supuestos' },
  { id: 10, title: '10. Restricciones' },
];

function getProgressColor(progress: number) {
  if (progress === 100) return '#16a34a';
  return '#ec0029';
}

function calculateProgress(sections: DocSection[]): number {
  // Only count sections 1-10 (exclude section 0)
  const relevantSections = sections.filter(s => s.id >= 1 && s.id <= 10);
  const completedSections = relevantSections.filter(s => s.completed).length;
  return Math.round((completedSections / relevantSections.length) * 100);
}

function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSend,
  progress,
  isSending,
}: {
  messages: ChatBubbleMessage[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  progress: number;
  isSending: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <div>
          <div className="chat-panel__title">Asistente Conversacional</div>
          <div className="chat-panel__subtitle">Responde las preguntas de Nori</div>
        </div>
        <div className="chat-panel__progress">
          <span className="chat-panel__progress-label">Progreso</span>
          <div className="chat-panel__progress-track">
            <div
              className="chat-panel__progress-bar"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressColor(progress),
              }}
            />
          </div>
          <span className="chat-panel__progress-percent" style={{ color: getProgressColor(progress) }}>
            {progress}%
          </span>
        </div>
      </div>

      <div className="chat-panel__messages">
        {messages.map((msg, idx) => (
          <ChatBubble key={`${msg.from}-${idx}`} message={msg} />
        ))}
        {isSending && (
          <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Nori está escribiendo...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-panel__quick-actions">
        {['Continuar', 'Agregar más detalles'].map((label) => (
          <button key={label} className="chat-panel__quick-btn" onClick={() => onInputChange(label)}>
            {label}
          </button>
        ))}
      </div>

      <div className="chat-panel__input-row">
        <textarea
          ref={textareaRef}
          className="chat-panel__input"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isSending) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Describe tu proyecto o responde a Nori..."
          disabled={isSending}
          rows={1}
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
  onGenerate,
  onGenerateDiagram,
  progress,
}: {
  sections: DocSection[];
  onToggle: (id: number) => void;
  onGenerate: () => void;
  onGenerateDiagram: () => void;
  progress: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(sections.length / PAGE_SIZE);
  const visible = sections.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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
          <DocSectionItem key={section.id} section={section} onToggle={onToggle} />
        ))}
      </div>

      <div className="doc-panel__pagination">
        <button className="doc-panel__page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
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
        {progress === 100 && (
          <button
            className="doc-panel__generate-btn"
            style={{ backgroundColor: '#1a1a1a' }}
            onClick={onGenerateDiagram}
          >
            <GitBranch size={16} />
            Generar Diagrama
          </button>
        )}
        <button className="doc-panel__generate-btn" onClick={onGenerate}>
          <FileText size={16} />
          Generar Documento
        </button>
      </div>
    </div>
  );
}

function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('Proyecto');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [sections, setSections] = useState<DocSection[]>(
    INITIAL_SECTIONS.map((s) => ({
      ...s,
      completed: false,
      expanded: true, // All sections expanded by default
    })),
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  // Diagram state
  const [showDiagram, setShowDiagram] = useState(false);
  const [diagramSource, setDiagramSource] = useState<string | null>(null);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [diagramError, setDiagramError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!id) return;

    // Abre el modal de inmediato — el skeleton se muestra mientras espera el back
    setPreviewBlob(null);
    setShowPreview(true);

    try {
      const blob = await documentApi.generateDocument(id);
      setPreviewBlob(blob);
    } catch (err: any) {
      console.error('Error al generar el documento:', err);
      setError(err.message || 'Failed to generate document');
      setShowPreview(false);
    }
  };

  const handleDownload = () => {
    if (!previewBlob) return;
    const url = URL.createObjectURL(previewBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateDiagram = async () => {
    if (!id) return;

    setDiagramSource(null);
    setDiagramError(null);
    setIsGeneratingDiagram(true);
    setShowDiagram(true);

    try {
      const result = await chatApi.generateDiagram(id);
      setDiagramSource(result.source);
    } catch (err: any) {
      console.error('Error generating diagram:', err);
      setDiagramError(err.message || 'Error al generar el diagrama');
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  const handleSaveDiagramSource = (newSource: string) => {
    setDiagramSource(newSource);
  };

  useEffect(() => {
    document.title = 'Chat — Nori';
    if (!id) {
      navigate('/');
      return;
    }
    loadHistory();
  }, [id]);

  const loadHistory = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const { messages: history } = await chatApi.getHistory(id);

      // Convert backend messages to ChatBubble format
      const chatMessages: ChatBubbleMessage[] = history.map((msg, idx) => ({
        id: idx + 1,
        from: msg.role === 'user' ? 'user' : 'nori',
        text: msg.content,
      }));

      setMessages(chatMessages);

      // Try to get project name from conversations list
      const { conversations } = await chatApi.getConversations();
      const project = conversations.find((p) => p.project_id === id);
      if (project) {
        setProjectName(project.name);
      }

      // Load document sections
      try {
        const { sections: backendSections } = await chatApi.getDocumentSections(id);

        // Merge backend sections with INITIAL_SECTIONS
        const mergedSections = INITIAL_SECTIONS.map((initialSection) => {
          const backendSection = backendSections.find((bs: any) => bs.section_no === initialSection.id);

          return {
            ...initialSection,
            completed: backendSection?.is_complete ?? false,
            content: backendSection?.content ?? null,
            expanded: true, // All sections expanded by default
          };
        });

        setSections(mergedSections);
      } catch (sectionErr) {
        console.error('Error loading document sections:', sectionErr);
        // Keep default sections if loading fails
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load chat history');
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !id || isSending) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Optimistically add user message
    const userMessage: ChatBubbleMessage = {
      id: messages.length + 1,
      from: 'user',
      text: messageText,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await chatApi.sendMessage({
        projectId: id,
        message: messageText,
      });

      // Add AI response
      const aiMessage: ChatBubbleMessage = {
        id: messages.length + 2,
        from: 'nori',
        text: response.reply,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // If a document section was updated, reload all sections to get latest content
      if (response.documentSectionUpdated !== null) {
        try {
          const { sections: backendSections } = await chatApi.getDocumentSections(id);

          setSections((prev) =>
            prev.map((section) => {
              const backendSection = backendSections.find((bs: any) => bs.section_no === section.id);

              return {
                ...section,
                completed: backendSection?.is_complete ?? section.completed,
                content: backendSection?.content ?? section.content,
              };
            }),
          );
        } catch (sectionErr) {
          console.error('Error reloading document sections:', sectionErr);
          // Fallback to just marking as completed
          setSections((prev) =>
            prev.map((s) => (s.id === response.documentSectionUpdated ? { ...s, completed: true } : s)),
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="chat-page">
        <div className="chat-nav">
          <Navbar />
          <SubNavbar />
          <BreadcrumbProjects />
        </div>
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <p style={{ fontSize: '1.125rem' }}>Cargando conversación...</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(sections);

  return (
    <div className="chat-page">
      <div className="chat-nav">
        <Navbar />
        <SubNavbar />
        <BreadcrumbProjects />
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            color: '#dc262',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <div className="chat-split">
        <ChatPanel
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          progress={progress}
          isSending={isSending}
        />
        <DocumentPanel
          sections={sections}
          onToggle={(id) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s)))}
          onGenerate={handleGenerate}
          onGenerateDiagram={handleGenerateDiagram}
          progress={progress}
        />
      </div>

      {showPreview && (
        <DocPreviewModal docxBlob={previewBlob} onCancel={() => setShowPreview(false)} onDownload={handleDownload} />
      )}

      {showDiagram && (
        <DiagramModal
          source={diagramSource}
          isGenerating={isGeneratingDiagram}
          error={diagramError}
          onClose={() => setShowDiagram(false)}
          onRegenerate={handleGenerateDiagram}
          onSaveSource={handleSaveDiagramSource}
        />
      )}
    </div>
  );
}

export default Chat;

