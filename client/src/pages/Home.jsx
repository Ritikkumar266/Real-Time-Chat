import { useState, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import ChatInfoPanel from "../components/ChatInfoPanel";
import SettingsPanel from "../components/SettingsPanel";
import GroupModal from "../components/GroupModal";

const Home = () => {
  const { user } = useAuthStore();
  const { connectSocket, disconnectSocket, fetchChats, fetchAllUsers, activeChat } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  useEffect(() => {
    if (user) {
      connectSocket(user._id);
      fetchChats();
      fetchAllUsers();
    }
    return () => disconnectSocket();
  }, [user]);

  useEffect(() => {
    if (activeChat) setMobileShowChat(true);
  }, [activeChat]);

  return (
    <div className="app-container">
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <Sidebar
        onOpenSettings={() => setShowSettings(true)}
        onNewGroup={() => setShowGroupModal(true)}
        onBackMobile={() => setMobileShowChat(false)}
      />

      {activeChat ? (
        <ChatArea
          className={mobileShowChat ? "active-mobile" : ""}
          onOpenInfo={() => setShowChatInfo(true)}
          onBackMobile={() => { setMobileShowChat(false); useChatStore.getState().setActiveChat(null); }}
        />
      ) : (
        <div className="empty-chat">
          <div className="empty-chat-icon">💬</div>
          <h2>ZingChat Web</h2>
          <p>Send and receive messages in real-time. Select a chat or start a new conversation to begin.</p>
        </div>
      )}

      {showChatInfo && activeChat && (
        <ChatInfoPanel onClose={() => setShowChatInfo(false)} />
      )}

      {showGroupModal && (
        <GroupModal onClose={() => setShowGroupModal(false)} />
      )}
    </div>
  );
};

export default Home;
