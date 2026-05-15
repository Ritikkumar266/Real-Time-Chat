import { useState, useRef, useCallback } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import { Paperclip, Send, Smile, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
  const { user } = useAuthStore();
  const { activeChat, sendMessage, emitTyping, emitStopTyping } = useChatStore();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef(null);
  const typingTimeout = useRef(null);

  const handleTyping = useCallback(() => {
    emitTyping(activeChat._id, user._id, user.username);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitStopTyping(activeChat._id, user._id);
    }, 2000);
  }, [activeChat?._id, user]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    emitStopTyping(activeChat._id, user._id);
    await sendMessage(activeChat._id, text.trim(), file);
    setText("");
    setFile(null);
    setShowEmoji(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) { alert("File too large (max 10MB)"); return; }
      setFile(f);
    }
  };

  return (
    <>
      {file && (
        <div className="file-preview-bar">
          <span>📎 {file.name}</span>
          <button onClick={() => setFile(null)}><X size={16} /></button>
        </div>
      )}
      <div className="message-input-area">
        <button className="icon-btn" onClick={() => setShowEmoji(!showEmoji)}>
          <Smile size={22} />
        </button>
        {showEmoji && (
          <div className="emoji-picker-container">
            <EmojiPicker theme="dark" onEmojiClick={(e) => setText(t => t + e.emoji)} width={320} height={400} />
          </div>
        )}
        <button className="icon-btn" onClick={() => fileRef.current?.click()}>
          <Paperclip size={22} />
        </button>
        <input type="file" ref={fileRef} hidden onChange={handleFile} />
        <div className="message-input-wrapper">
          <textarea
            rows={1}
            placeholder="Type a message"
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="send-btn" onClick={handleSend}>
          <Send size={20} />
        </button>
      </div>
    </>
  );
};

export default MessageInput;
