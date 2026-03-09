import { FileText } from "lucide-react";
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
      {!isUser && (
        <div className="chat-bubble__avatar">
          <FileText size={14} color="#fff" />
        </div>
      )}
      <div className={`chat-bubble__text ${isUser ? "chat-bubble__text--user" : "chat-bubble__text--nori"}`}>
        {message.text}
      </div>
    </div>
  );
}

export default ChatBubble;
