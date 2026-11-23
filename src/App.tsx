import { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "./components/AuthGate";
import { supabase } from "./lib/supabase";
import { searchUsersByUsername, type UserSearchResult } from "./lib/userSearch";
import { getOrCreateDirectConversation, loadDirectMessages, loadDirectConversationSummaries, sendDirectMessage, subscribeToDirectMessages, subscribeToDirectMessageActivity, type DirectConversationSummary, type DirectMessage } from "./lib/directMessages";
import { Search, Plus, Send, Paperclip, Smile, MoreHorizontal, MessageCircle, Users, Settings, Sparkles, Hash, Headphones, Mic, ChevronDown, Compass, Bell, Pin, Inbox, Trash2, UserRound, Server, ArrowLeft, Camera, Pencil, QrCode, Music2, Gift, Archive, Phone, UserPlus, ArrowDownWideNarrow } from "lucide-react";
import NftGifts from "./components/NftGifts";

type Server = { id: number; name: string; letter: string; visibility?: "public" | "private" };
type Channel = { id: number; serverId: number; name: string; message: string; time: string; initials: string; color: string; unread?: number };

const starterServers: Server[] = [{ id: 1, name: "BrainGram", letter: "B" }];
const starterChannels: Channel[] = [
  { id: 1, serverId: 1, name: "общий", message: "Канал для общего общения", time: "", initials: "О", color: "violet" },
  { id: 2, serverId: 1, name: "разработка", message: "Обсуждение разработки", time: "", initials: "Р", color: "blue" },
  { id: 3, serverId: 1, name: "идеи", message: "Новые идеи для BrainGram", time: "", initials: "И", color: "pink" },
  { id: 4, serverId: 1, name: "мемы", message: "Канал для мемов", time: "", initials: "М", color: "green" },
];

function AppContent() {
  const [servers, setServers] = useState<Server[]>(() => {
    try { const saved = localStorage.getItem("bg-servers"); return saved ? JSON.parse(saved) as Server[] : starterServers; } catch { return starterServers; }
  });
  const [channels, setChannels] = useState<Channel[]>(() => {
    try { const saved = localStorage.getItem("bg-channels"); return saved ? JSON.parse(saved) as Channel[] : starterChannels; } catch { return starterChannels; }
  });
  const [activeServerId, setActiveServerId] = useState(1);
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [profileName, setProfileName] = useState(() => localStorage.getItem("bg-profile-name") || "Пользователь");
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem("bg-profile-avatar") || "");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [profileTag, setProfileTag] = useState(() => localStorage.getItem("bg-profile-tag") || "user");
  const [profileStatus, setProfileStatus] = useState(() => localStorage.getItem("bg-profile-status") || "В сети");
  const [profileAbout, setProfileAbout] = useState(() => localStorage.getItem("bg-profile-about") || "Привет! Я пользуюсь BrainGram 👋");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSection, setProfileSection] = useState<"posts" | "archive" | "gifts">("posts");
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function loadAccountProfile() {
      if (!supabase) return;
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username, status, about, avatar_url")
        .eq("id", authData.user.id)
        .maybeSingle();
      if (error) {
        console.error("Не удалось загрузить профиль BrainGram:", error.message);
        return;
      }
      if (cancelled || !data) return;

      const name = data.display_name || authData.user.user_metadata?.display_name || "Пользователь";
      const username = data.username || "user";
      const status = data.status || "В сети";
      const about = typeof data.about === "string" ? data.about : "Привет! Я пользуюсь BrainGram 👋";
      const avatarUrl = typeof data.avatar_url === "string" && data.avatar_url
        ? `${data.avatar_url}?v=${Date.now()}`
        : "";

      setCurrentUserId(authData.user.id);
      setProfilePhone(authData.user.phone || "");
      setProfileName(name);
      setProfileTag(username);
      setProfileStatus(status);
      setProfileAbout(about);
      setProfileAvatar(avatarUrl);
      localStorage.setItem("bg-profile-name", name);
      localStorage.setItem("bg-profile-tag", username);
      localStorage.setItem("bg-profile-status", status);
      localStorage.setItem("bg-profile-about", about);
      if (avatarUrl) localStorage.setItem("bg-profile-avatar", avatarUrl);
      else localStorage.removeItem("bg-profile-avatar");
    }

    void loadAccountProfile();
    return () => { cancelled = true; };
  }, []);

  async function persistProfileAvatar(optimizedAvatar: string) {
    setAvatarUploading(true);
    try {
      if (!supabase) throw new Error("Supabase не настроен.");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Сессия пользователя не найдена.");

      const imageResponse = await fetch(optimizedAvatar);
      const imageBlob = await imageResponse.blob();
      const objectPath = `${authData.user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(objectPath, imageBlob, {
          cacheControl: "3600",
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(objectPath);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicData.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", authData.user.id);
      if (profileError) throw profileError;

      const avatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;
      localStorage.setItem("bg-profile-avatar", avatarUrl);
      setProfileAvatar(avatarUrl);
    } catch (error) {
      try { localStorage.setItem("bg-profile-avatar", optimizedAvatar); } catch { /* Browser storage may be full. */ }
      setProfileAvatar(optimizedAvatar);
      console.error("Не удалось синхронизировать аватар BrainGram:", error);
      window.alert("Аватар сохранён на этом устройстве. Для синхронизации проверь, что SQL-миграция Supabase для аватаров выполнена и есть подключение к интернету.");
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleProfileAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { window.alert("Выбери файл изображения."); return; }
    if (file.size > 8 * 1024 * 1024) { window.alert("Изображение должно быть меньше 8 МБ."); return; }

    const reader = new FileReader();
    reader.onerror = () => window.alert("Не удалось прочитать изображение.");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => window.alert("Не удалось открыть это изображение.");
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d");
        if (!context) { window.alert("Не удалось обработать изображение."); return; }
        const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
        const cropX = (image.naturalWidth - cropSize) / 2;
        const cropY = (image.naturalHeight - cropSize) / 2;
        context.fillStyle = "#28243a";
        context.fillRect(0, 0, 512, 512);
        context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, 512, 512);
        void persistProfileAvatar(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
  const [showSettings, setShowSettings] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendInvite, setFriendInvite] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedDirectUser, setSelectedDirectUser] = useState<UserSearchResult | null>(null);
  const [directConversationId, setDirectConversationId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directDraft, setDirectDraft] = useState("");
  const [directLoading, setDirectLoading] = useState(false);
  const [directSending, setDirectSending] = useState(false);
  const [directError, setDirectError] = useState("");
  const [recentChats, setRecentChats] = useState<DirectConversationSummary[]>([]);
  const [recentChatsLoading, setRecentChatsLoading] = useState(true);
  const [recentChatsError, setRecentChatsError] = useState("");
  const directOpenRequestRef = useRef(0);
  const [friendRequests, setFriendRequests] = useState<{ id: number; name: string; tag: string; initials: string; color: string; mutual: string }[]>([]);
  const [friends, setFriends] = useState<{ id: number; name: string; tag: string; initials: string; color: string; status: string }[]>([]);
  function acceptFriend(id: number) {
    const request = friendRequests.find((item) => item.id === id);
    if (!request) return;
    setFriends((current) => [...current, { id: request.id, name: request.name, tag: request.tag, initials: request.initials, color: request.color, status: "В сети" }]);
    setFriendRequests((current) => current.filter((item) => item.id !== id));
  }
  const [notifications, setNotifications] = useState<{ id: number; type: string; title: string; text: string; time: string; unread: boolean; initials: string; color: string }[]>([]);
  const unreadNotifications = notifications.filter((item) => item.unread).length;
  function markAllNotificationsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  }
  const [activeTab, setActiveTab] = useState<"chats" | "servers" | "friends" | "notifications" | "profile">("chats");
  const [chatFilter, setChatFilter] = useState<"all" | "games">("all");
  const [contactsSort, setContactsSort] = useState<"alphabetical" | "recent">("alphabetical");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [messages, setMessages] = useState<Record<number, string[]>>({});

  useEffect(() => { localStorage.setItem("bg-servers", JSON.stringify(servers)); }, [servers]);
  useEffect(() => { localStorage.setItem("bg-channels", JSON.stringify(channels)); }, [channels]);

  useEffect(() => {
    const term = friendInvite.trim().replace(/^@/, "");
    if (term.length < 3) {
      setUserSearchResults([]);
      setUserSearchLoading(false);
      setUserSearchError("");
      return;
    }

    let cancelled = false;
    setUserSearchLoading(true);
    setUserSearchError("");
    const timer = window.setTimeout(() => {
      void searchUsersByUsername(term)
        .then((results) => {
          if (!cancelled) setUserSearchResults(results);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setUserSearchResults([]);
          setUserSearchError(error instanceof Error ? error.message : "Не удалось выполнить поиск.");
        })
        .finally(() => {
          if (!cancelled) setUserSearchLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [friendInvite]);

  useEffect(() => {
    if (!supabase) {
      setRecentChatsLoading(false);
      setRecentChatsError("Список переписок появится после подключения Supabase.");
      return;
    }

    let cancelled = false;
    const refreshRecentChats = async () => {
      try {
        const items = await loadDirectConversationSummaries();
        if (!cancelled) {
          setRecentChats(items);
          setRecentChatsError("");
        }
      } catch (error) {
        if (!cancelled) {
          setRecentChatsError(error instanceof Error ? error.message : "Не удалось загрузить недавние чаты.");
        }
      } finally {
        if (!cancelled) setRecentChatsLoading(false);
      }
    };

    void refreshRecentChats();
    const unsubscribe = subscribeToDirectMessageActivity(() => { void refreshRecentChats(); });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!directConversationId) return;
    return subscribeToDirectMessages(directConversationId, (incoming) => {
      setDirectMessages((current) => current.some((message) => message.id === incoming.id)
        ? current
        : [...current, incoming].sort((a, b) => a.created_at.localeCompare(b.created_at)));
    });
  }, [directConversationId]);

  const activeServer = servers.find((server) => server.id === activeServerId) ?? servers[0];
  const serverChannels = useMemo(() => channels.filter((channel) => channel.serverId === activeServerId), [channels, activeServerId]);
  const visibleChannels = useMemo(() => serverChannels.filter((channel) => channel.name.toLowerCase().includes(query.toLowerCase())), [serverChannels, query]);
  const active = channels.find((channel) => channel.id === activeId) ?? serverChannels[0];

  async function openDirectChat(user: UserSearchResult) {
    const requestId = ++directOpenRequestRef.current;
    setSelectedDirectUser(user);
    setActiveTab("chats");
    setDirectConversationId(null);
    setDirectMessages([]);
    setDirectDraft("");
    setDirectError("");
    setDirectLoading(true);

    try {
      const conversationId = await getOrCreateDirectConversation(user.id);
      if (requestId !== directOpenRequestRef.current) return;
      void loadDirectConversationSummaries().then(setRecentChats).catch(() => undefined);
      setDirectConversationId(conversationId);
      const history = await loadDirectMessages(conversationId);
      if (requestId !== directOpenRequestRef.current) return;
      setDirectMessages((current) => {
        const merged = new Map<string, DirectMessage>();
        [...history, ...current].forEach((message) => merged.set(message.id, message));
        return [...merged.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
    } catch (error) {
      if (requestId === directOpenRequestRef.current) {
        setDirectError(error instanceof Error ? error.message : "Не удалось открыть переписку.");
      }
    } finally {
      if (requestId === directOpenRequestRef.current) setDirectLoading(false);
    }
  }

  function closeDirectChat() {
    directOpenRequestRef.current += 1;
    setSelectedDirectUser(null);
    setDirectConversationId(null);
    setDirectMessages([]);
    setDirectDraft("");
    setDirectError("");
    setDirectLoading(false);
    setActiveTab("friends");
  }

  async function submitDirectMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!directConversationId || !directDraft.trim() || directSending) return;
    setDirectSending(true);
    setDirectError("");
    try {
      const sent = await sendDirectMessage(directConversationId, directDraft);
      setDirectMessages((current) => current.some((message) => message.id === sent.id)
        ? current
        : [...current, sent].sort((a, b) => a.created_at.localeCompare(b.created_at)));
      void loadDirectConversationSummaries().then(setRecentChats).catch(() => undefined);
      setDirectDraft("");
    } catch (error) {
      setDirectError(error instanceof Error ? error.message : "Не удалось отправить сообщение.");
    } finally {
      setDirectSending(false);
    }
  }

  function selectServer(server: Server) {
    setActiveServerId(server.id);
    const first = channels.find((channel) => channel.serverId === server.id);
    if (first) setActiveId(first.id);
    setQuery("");
  }
  function createServer() {
    const name = window.prompt("Название нового сервера:");
    if (!name?.trim()) return;
    const id = Math.max(0, ...servers.map((server) => server.id)) + 1;
    const visibility: Server["visibility"] = window.confirm("Сделать сервер публичным?\n\nОК — публичный, Отмена — приватный.") ? "public" : "private";
    const server = { id, name: name.trim(), letter: name.trim().charAt(0).toUpperCase(), visibility };
    setServers((current) => [...current, server]);
    const channelId = Math.max(0, ...channels.map((channel) => channel.id)) + 1;
    setChannels((current) => [...current, { id: channelId, serverId: id, name: "общий", message: "Канал создан", time: "Сейчас", initials: "О", color: "violet" }]);
    setMessages((current) => ({ ...current, [channelId]: ["Добро пожаловать на новый сервер! 👋"] }));
    setActiveServerId(id);
    setActiveId(channelId);
  }
  function toggleServerVisibility(serverId: number) {
    setServers((current) => current.map((server) => server.id === serverId ? { ...server, visibility: server.visibility === "private" ? "public" : "private" } : server));
  }
  function createChannel() {
    setNewChannelName("");
    setNewChannelDescription("");
    setShowChannelModal(true);
  }
  function submitNewChannel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newChannelName.trim().replace(/^#+/, "").replace(/\\s+/g, "-").toLowerCase();
    if (!name || !activeServer) return;
    const id = Math.max(0, ...channels.map((channel) => channel.id)) + 1;
    setChannels((current) => [...current, { id, serverId: activeServer.id, name, message: "Канал создан", time: "Сейчас", initials: "Н", color: "violet" }]);
    setMessages((current) => ({ ...current, [id]: [newChannelDescription.trim() || "Это начало нового канала. 👋"] }));
    setActiveId(id);
    setShowChannelModal(false);
  }
  function deleteChannel(channel: Channel) {
    if (!window.confirm(`Удалить канал #${channel.name}?`)) return;
    const remaining = channels.filter((item) => item.id !== channel.id);
    setChannels(remaining);
    if (activeId === channel.id) {
      const next = remaining.find((item) => item.serverId === activeServerId);
      if (next) setActiveId(next.id);
    }
  }
  function sendMessage() {
    const value = draft.trim();
    if (!value || !active) return;
    setMessages((current) => ({ ...current, [active.id]: [...(current[active.id] ?? []), value] }));
    setChannels((current) => current.map((channel) => channel.id === active.id ? { ...channel, message: value, time: "Сейчас", unread: 0 } : channel));
    setDraft("");
  }


  const isMobileChat = Boolean(selectedDirectUser);
  const chatSearchTerm = friendInvite.trim().replace(/^@/, "").toLocaleLowerCase();
  const visibleRecentChats = recentChats.filter((chat) =>
    !chatSearchTerm || chat.display_name.toLocaleLowerCase().includes(chatSearchTerm) || chat.username.toLocaleLowerCase().includes(chatSearchTerm) || chat.last_message.toLocaleLowerCase().includes(chatSearchTerm),
  );
  const visibleContacts = recentChats
    .filter((chat) => !chatSearchTerm || chat.display_name.toLocaleLowerCase().includes(chatSearchTerm) || chat.username.toLocaleLowerCase().includes(chatSearchTerm))
    .slice()
    .sort((left, right) => contactsSort === "alphabetical"
      ? left.display_name.localeCompare(right.display_name, "ru")
      : (right.last_message_at || "").localeCompare(left.last_message_at || ""));
  return (
    <main className={`telegram-app ${activeTab === "profile" ? "tg-profile-mode" : ""}`}>
      <aside className={`tg-sidebar ${isMobileChat ? "tg-sidebar-hidden-mobile" : ""}`}>
        <header className="tg-sidebar-header">
          <div className="tg-brand-mark" aria-hidden="true"><Send size={25} fill="currentColor"/></div>
          <strong>BrainGram</strong>
          <button className="tg-menu-button" type="button" aria-label="Дополнительно" onClick={() => setShowSettings(true)}><MoreHorizontal size={25}/></button>
        </header>
        <div className="tg-search-wrap">
          <Search size={21}/>
          <input id="tg-search" value={friendInvite} onChange={(event) => setFriendInvite(event.target.value)} placeholder="Поиск чатов" autoComplete="off"/>
          {friendInvite && <button type="button" onClick={() => setFriendInvite("")}>×</button>}
        </div>
        <div className="tg-chat-filter" role="tablist" aria-label="Фильтр чатов">
          <button type="button" role="tab" aria-selected={chatFilter === "all"} className={chatFilter === "all" ? "active" : ""} onClick={() => setChatFilter("all")}>Все чаты</button>
          <button type="button" role="tab" aria-selected={chatFilter === "games"} className={chatFilter === "games" ? "active" : ""} onClick={() => setChatFilter("games")}>Игры</button>
        </div>
        <div className="tg-chat-list">
          {userSearchLoading && <div className="tg-list-empty">Ищем пользователей…</div>}
          {userSearchError && <div className="tg-list-empty tg-error">{userSearchError}</div>}
          {!userSearchLoading && userSearchResults.map((user) => (
            <button type="button" key={user.id} className={`tg-chat-row ${selectedDirectUser?.id === user.id ? "tg-chat-row-active" : ""}`} onClick={() => void openDirectChat(user)}>
              <span className="tg-avatar">{user.avatar_url ? <img src={user.avatar_url} alt=""/> : (user.display_name.trim()[0] || user.username[0] || "U").toUpperCase()}</span>
              <span className="tg-chat-row-copy"><strong>{user.display_name}</strong><small>@{user.username}</small></span>
            </button>
          ))}
          {!friendInvite.trim() && recentChatsLoading && <div className="tg-list-empty">Загружаем недавние переписки…</div>}
          {!friendInvite.trim() && recentChatsError && recentChats.length === 0 && <div className="tg-list-empty tg-error">{recentChatsError}</div>}
          {visibleRecentChats.map((chat) => (
            <button
              type="button"
              key={chat.conversation_id}
              className={`tg-chat-row ${selectedDirectUser?.id === chat.peer_id ? "tg-chat-row-active" : ""}`}
              onClick={() => void openDirectChat({
                id: chat.peer_id,
                username: chat.username,
                display_name: chat.display_name,
                avatar_url: chat.avatar_url,
              })}
            >
              <span className="tg-avatar">{chat.avatar_url ? <img src={chat.avatar_url} alt="" /> : (chat.display_name.trim()[0] || chat.username[0] || "U").toUpperCase()}</span>
              <span className="tg-chat-row-copy">
                <strong>{chat.display_name}</strong>
                <small>{chat.last_message ? (chat.last_sender_id === currentUserId ? `Вы: ${chat.last_message}` : chat.last_message) : `@${chat.username}`}</small>
              </span>
              <time className="tg-chat-row-time">{chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</time>
            </button>
          ))}
          {!friendInvite.trim() && !recentChatsLoading && !recentChatsError && recentChats.length === 0 && friends.length === 0 && <div className="tg-list-empty tg-list-hint">Здесь пока нет переписок.<br/><br/>Найди человека через поиск выше, чтобы начать общение. После первого сообщения чат появится здесь.</div>}
          {chatSearchTerm.length > 0 && chatSearchTerm.length < 3 && visibleRecentChats.length === 0 && <div className="tg-list-empty">В недавних чатах совпадений нет. Введи ещё символы, чтобы найти пользователя.</div>}
          {chatSearchTerm.length >= 3 && visibleRecentChats.length === 0 && userSearchResults.length === 0 && !userSearchLoading && !userSearchError && <div className="tg-list-empty">Ничего не найдено.</div>}
          {!userSearchLoading && !userSearchError && friendInvite.trim().length >= 3 && userSearchResults.length === 0 && <div className="tg-list-empty">Никого не нашли. Проверь имя пользователя.</div>}
        </div>
        <nav className="tg-sidebar-bottom" aria-label="Основная навигация">
          <button type="button" className={!selectedDirectUser && activeTab === "chats" ? "tg-nav-active" : ""} onClick={() => { setFriendInvite(""); setSelectedDirectUser(null); setActiveTab("chats"); }}><MessageCircle size={34} strokeWidth={1.9}/><span>Чаты</span></button>
          <button type="button" className={activeTab === "friends" ? "tg-nav-active" : ""} onClick={() => { setSelectedDirectUser(null); setActiveTab("friends"); document.getElementById("tg-search")?.focus(); }}><UserRound size={34} strokeWidth={1.9}/><span>Контакты</span></button>
          <button type="button" className={showSettings ? "tg-nav-active" : ""} onClick={() => setShowSettings(true)}><Settings size={34} strokeWidth={1.9}/><span>Настройки</span></button>
          <button type="button" className={activeTab === "profile" ? "tg-nav-active" : ""} onClick={() => { setSelectedDirectUser(null); setActiveTab("profile"); }}><span className="tg-nav-profile-avatar">{profileAvatar ? <img src={profileAvatar} alt=""/> : (profileName[0] || "U").toUpperCase()}</span><span>Профиль</span></button>
        </nav>
      </aside>

      <section className={`tg-conversation ${isMobileChat ? "tg-conversation-visible-mobile" : ""}`}>
        {activeTab === "friends" && !selectedDirectUser ? <div className="tg-contacts-page">
          <header className="tg-contacts-header">
            <h1>Контакты</h1>
            <div className="tg-contacts-tools">
              <label className="tg-contacts-search" aria-label="Поиск контактов"><Search size={23}/><input value={friendInvite} onChange={(event) => setFriendInvite(event.target.value)} placeholder="Поиск"/></label>
              <button type="button" aria-label="Изменить сортировку" onClick={() => setContactsSort((current) => current === "alphabetical" ? "recent" : "alphabetical")}><ArrowDownWideNarrow size={24}/></button>
            </div>
          </header>
          <section className="tg-contacts-shortcuts">
            <button type="button" onClick={() => {
              const inviteUrl = window.location.origin + window.location.pathname;
              if (navigator.share) void navigator.share({ title: "BrainGram", text: "Присоединяйся ко мне в BrainGram!", url: inviteUrl }).catch(() => undefined);
              else if (navigator.clipboard) void navigator.clipboard.writeText(inviteUrl).then(() => window.alert("Ссылка BrainGram скопирована."));
            }}>
              <span className="tg-contacts-shortcut-icon invite"><UserPlus size={25}/></span><strong>Пригласить друзей</strong>
            </button>
            <button type="button" onClick={() => window.alert("История звонков появится, когда в BrainGram будут доступны звонки.")}>
              <span className="tg-contacts-shortcut-icon calls"><Phone size={25} fill="currentColor"/></span><strong>Недавние звонки</strong>
            </button>
          </section>
          <section className="tg-contacts-list-card">
            <div className="tg-contacts-list-title">{contactsSort === "alphabetical" ? "По алфавиту" : "Недавно были в сети"}</div>
            {recentChatsLoading && <div className="tg-contacts-empty">Загружаем контакты…</div>}
            {recentChatsError && visibleContacts.length === 0 && <div className="tg-contacts-empty">{recentChatsError}</div>}
            {!recentChatsLoading && visibleContacts.map((contact, index) => {
              const initial = (contact.display_name.trim()[0] || contact.username[0] || "U").toUpperCase();
              const previousInitial = index > 0 ? (visibleContacts[index - 1].display_name.trim()[0] || visibleContacts[index - 1].username[0] || "U").toLocaleUpperCase("ru") : "";
              const currentInitial = initial.toLocaleUpperCase("ru");
              const lastSeen = contact.last_message_at ? new Date(contact.last_message_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "давно";
              return <React.Fragment key={contact.conversation_id}>
                {contactsSort === "alphabetical" && currentInitial !== previousInitial && <div className="tg-contact-letter">{currentInitial}</div>}
                <button type="button" className="tg-contact-item" onClick={() => void openDirectChat({ id: contact.peer_id, username: contact.username, display_name: contact.display_name, avatar_url: contact.avatar_url })}>
                  <span className="tg-contact-avatar">{contact.avatar_url ? <img src={contact.avatar_url} alt=""/> : initial}</span>
                  <span className="tg-contact-copy"><strong>{contact.display_name}</strong><small>был(а) {lastSeen}</small></span>
                </button>
              </React.Fragment>;
            })}
            {!recentChatsLoading && !recentChatsError && visibleContacts.length === 0 && <div className="tg-contacts-empty">{friendInvite ? "Контакты не найдены" : "Пока нет контактов. Начни переписку, чтобы они появились здесь."}</div>}
          </section>
          <button type="button" className="tg-contacts-add" aria-label="Добавить контакт" onClick={() => { document.querySelector<HTMLInputElement>(".tg-contacts-search input")?.focus(); }}><UserPlus size={30}/></button>
        </div> : activeTab === "profile" && !selectedDirectUser ? <div className="tg-profile-page">
          <div className="tg-profile-topbar">
            <button type="button" aria-label="QR-код" onClick={() => window.alert("QR-код профиля скоро появится.")}><QrCode size={24}/></button>
            <button type="button" aria-label="Дополнительно" onClick={() => setShowSettings(true)}><MoreHorizontal size={25}/></button>
          </div>
          <div className="tg-profile-hero">
            <button className="tg-profile-page-avatar" type="button" onClick={() => avatarInputRef.current?.click()} aria-label="Выбрать фото профиля">
              {profileAvatar ? <img src={profileAvatar} alt=""/> : (profileName[0] || "U").toUpperCase()}
            </button>
            <input ref={avatarInputRef} className="tg-hidden-input" type="file" accept="image/*" onChange={handleProfileAvatarChange}/>
            <strong>{profileName}</strong>
            <span className="tg-profile-status"><span className="tg-profile-online-dot"/> {profileStatus || "В сети"}</span>
          </div>
          <div className="tg-profile-actions">
            <button type="button" onClick={() => avatarInputRef.current?.click()}><Camera size={25}/><span>Выбрать фото</span></button>
            <button type="button" onClick={() => setShowProfileEditor(true)}><Pencil size={25}/><span>Изменить</span></button>
            <button type="button" onClick={() => setShowSettings(true)}><Settings size={25}/><span>Настройки</span></button>
          </div>
          <div className="tg-profile-music"><Music2 size={18}/><span>Добавить музыку в профиль</span><span className="tg-profile-music-arrow">›</span></div>
          <section className="tg-profile-info">
            {profilePhone && <div className="tg-profile-info-row"><strong>{profilePhone}</strong><span>Телефон</span></div>}
            <div className="tg-profile-info-row"><strong>@{profileTag}</strong><span>Имя пользователя</span></div>
            <div className="tg-profile-info-row"><strong>{profileAbout || "Не указано"}</strong><span>О себе</span></div>
          </section>
          <div className="tg-profile-sections">
            <button type="button" className={profileSection === "posts" ? "active" : ""} onClick={() => setProfileSection("posts")}>Публикации</button>
            <button type="button" className={profileSection === "archive" ? "active" : ""} onClick={() => setProfileSection("archive")}><Archive size={16}/> Архив публикаций</button>
            <button type="button" className={profileSection === "gifts" ? "active" : ""} onClick={() => setProfileSection("gifts")}><Gift size={16}/> Подарки</button>
          </div>
          {profileSection === "gifts" ? <NftGifts /> : <div className="tg-profile-feed">
            <div className="tg-profile-feed-line"/>
            <button type="button" className="tg-profile-add" onClick={() => window.alert("Публикации BrainGram скоро появятся.")}><Plus size={22}/><span>Добавить</span></button>
            <p>{profileSection === "posts" ? "Пока нет публикаций" : "Архив публикаций пуст"}</p>
          </div>}
        </div> : selectedDirectUser ? <>
          <header className="tg-chat-header">
            <button className="tg-back" type="button" onClick={closeDirectChat} aria-label="Назад"><ArrowLeft size={21}/></button>
            <button className="tg-avatar tg-header-avatar" type="button" aria-label="Открыть профиль" onClick={() => setShowProfileEditor(true)}>{selectedDirectUser.avatar_url ? <img src={selectedDirectUser.avatar_url} alt=""/> : (selectedDirectUser.display_name.trim()[0] || "U").toUpperCase()}</button>
            <div className="tg-peer"><strong>{selectedDirectUser.display_name}</strong><small>@{selectedDirectUser.username}</small></div>
            <button className="tg-header-action" type="button" title="Поиск" onClick={() => setFriendInvite(selectedDirectUser.username)}><Search size={20}/></button>
            <button className="tg-header-action" type="button" title="Ещё" onClick={() => setShowSettings(true)}><MoreHorizontal size={22}/></button>
          </header>
          <div className="tg-message-area">
            {directLoading && <div className="tg-center-note">Загружаем сообщения…</div>}
            {directError && <div className="tg-error-banner">{directError}</div>}
            {!directLoading && !directError && directMessages.length === 0 && <div className="tg-empty-chat"><div className="tg-empty-icon"><MessageCircle size={30}/></div><strong>Это начало переписки</strong><span>Напиши @{selectedDirectUser.username} первое сообщение</span></div>}
            <div className="tg-messages">
              {directMessages.map((message) => {
                const mine = message.sender_id === currentUserId;
                return <article key={message.id} className={`tg-bubble ${mine ? "tg-bubble-out" : "tg-bubble-in"}`}>
                  <p>{message.body}</p>
                  <span className="tg-bubble-meta"><time>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>{mine && <span className="tg-message-checks" aria-label="Отправлено">✓✓</span>}</span>
                </article>;
              })}
            </div>
          </div>
          <form className="tg-composer" onSubmit={submitDirectMessage}>
            <button type="button" className="tg-attach" title="Прикрепить файл"><Paperclip size={21}/></button>
            <input value={directDraft} onChange={(event) => setDirectDraft(event.target.value)} placeholder="Сообщение…" maxLength={4000} disabled={!directConversationId || directLoading || directSending}/>
            <button type="button" className="tg-attach" title="Эмодзи"><Smile size={21}/></button>
            <button className="tg-send" type="submit" title="Отправить" disabled={!directDraft.trim() || !directConversationId || directSending}><Send size={19}/></button>
          </form>
        </> : <div className="tg-welcome">
          <div className="tg-welcome-card"><div className="tg-welcome-logo"><MessageCircle size={36}/></div><h1>BrainGram</h1><p>Выбери переписку или найди пользователя, чтобы начать общение.</p></div>
        </div>}
      </section>

      {showSettings && <div className="tg-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSettings(false); }}>
        <section className="tg-modal" role="dialog" aria-modal="true" aria-labelledby="tg-settings-title">
          <button className="tg-modal-close" type="button" onClick={() => setShowSettings(false)}>×</button>
          <h2 id="tg-settings-title">Настройки</h2>
          <div className="tg-settings-user"><span className="tg-avatar">{profileAvatar ? <img src={profileAvatar} alt=""/> : (profileName[0] || "U").toUpperCase()}</span><div><strong>{profileName}</strong><small>@{profileTag}</small></div></div>
          <p>Статус: {profileStatus}</p><p>{profileAbout}</p>
          <button className="tg-primary" type="button" onClick={() => { setShowSettings(false); setShowProfileEditor(true); }}>Изменить профиль</button>
        </section>
      </div>}
      {showProfileEditor && <div className="tg-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowProfileEditor(false); }}>
        <section className="tg-modal" role="dialog" aria-modal="true" aria-labelledby="tg-profile-title">
          <button className="tg-modal-close" type="button" onClick={() => setShowProfileEditor(false)}>×</button>
          <h2 id="tg-profile-title">Мой профиль</h2>
          <button className="tg-profile-avatar" type="button" onClick={() => avatarInputRef.current?.click()}>{profileAvatar ? <img src={profileAvatar} alt=""/> : (profileName[0] || "U").toUpperCase()}</button>
          <input ref={avatarInputRef} className="tg-hidden-input" type="file" accept="image/*" onChange={handleProfileAvatarChange}/>
          <label className="tg-profile-edit-label">Имя</label>
          <input className="tg-profile-edit-input" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={64}/>
          <label className="tg-profile-edit-label">Имя пользователя</label>
          <input className="tg-profile-edit-input" value={profileTag} onChange={(event) => setProfileTag(event.target.value.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, ""))} maxLength={32}/>
          <label className="tg-profile-edit-label">О себе</label>
          <textarea className="tg-profile-edit-input" value={profileAbout} onChange={(event) => setProfileAbout(event.target.value)} maxLength={160}/>
          <button className="tg-primary" type="button" onClick={async () => {
            const name = profileName.trim();
            const username = profileTag.trim().replace(/^@/, "");
            if (!name || !username) { window.alert("Укажи имя и имя пользователя."); return; }
            setProfileName(name); setProfileTag(username);
            localStorage.setItem("bg-profile-name", name); localStorage.setItem("bg-profile-tag", username); localStorage.setItem("bg-profile-about", profileAbout);
            if (supabase) {
              const { data: authData } = await supabase.auth.getUser();
              if (authData.user) {
                const { error } = await supabase.from("profiles").update({ display_name: name, username, about: profileAbout, updated_at: new Date().toISOString() }).eq("id", authData.user.id);
                if (error) { window.alert("Не удалось сохранить профиль: " + error.message); return; }
              }
            }
            setShowProfileEditor(false);
          }}>Сохранить</button>
        </section>
      </div>}
    </main>
  );

}

export default function App() {
  return <AuthGate><AppContent /></AuthGate>;
}
