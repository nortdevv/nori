import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../../pages/Chat.css";

export interface Message {
  id: number;
  from: "nori" | "user";
  text: string;
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.from === "user";

  return (
    <div className={`chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--nori"}`}>
      <div className={`chat-bubble__text ${isUser ? "chat-bubble__text--user" : "chat-bubble__text--nori"}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ChatBubble;
