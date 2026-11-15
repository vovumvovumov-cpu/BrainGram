import { useEffect, useMemo, useState } from "react";
import AuthGate from "./components/AuthGate";
import { Search, Plus, Send, Paperclip, Smile, MoreHorizontal, MessageCircle, Users, Settings, Sparkles, Hash, Headphones, Mic, ChevronDown, Compass, Bell, Pin, Inbox, Trash2, UserRound, Server } from "lucide-react";

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
  const [profileTag, setProfileTag] = useState(() => localStorage.getItem("bg-profile-tag") || "user");
  const [profileStatus, setProfileStatus] = useState(() => localStorage.getItem("bg-profile-status") || "В сети");
  const [profileAbout, setProfileAbout] = useState(() => localStorage.getItem("bg-profile-about") || "Привет! Я пользуюсь BrainGram 👋");
  const [profileSaved, setProfileSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendInvite, setFriendInvite] = useState("");
  const [friendMessage, setFriendMessage] = useState("");
  const [friendRequests, setFriendRequests] = useState<{ id: number; name: string; tag: string; initials: string; color: string; mutual: string }[]>([]);
  const [friends, setFriends] = useState<{ id: number; name: string; tag: string; initials: string; color: string; status: string }[]>([]);
  function acceptFriend(id: number) {
    const request = friendRequests.find((item) => item.id === id);
    if (!request) return;
    setFriends((current) => [...current, { id: request.id, name: request.name, tag: request.tag, initials: request.initials, color: request.color, status: "В сети" }]);
    setFriendRequests((current) => current.filter((item) => item.id !== id));
  }
  function sendFriendInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tag = friendInvite.trim().replace(/^@/, "");
    if (!tag) return;
    if (friends.some((friend) => friend.tag.toLowerCase() === `@${tag.toLowerCase()}`)) { setFriendMessage("Этот пользователь уже в друзьях."); return; }
    if (friendRequests.some((request) => request.tag.toLowerCase() === `@${tag.toLowerCase()}`)) { setFriendMessage("Заявка от этого пользователя уже есть."); return; }
    setFriendMessage("Поиск и отправка заявок станут доступны после подключения серверной части.");
    setFriendInvite("");
  }
  const [notifications, setNotifications] = useState<{ id: number; type: string; title: string; text: string; time: string; unread: boolean; initials: string; color: string }[]>([]);
  const unreadNotifications = notifications.filter((item) => item.unread).length;
  function markAllNotificationsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  }
  const [activeTab, setActiveTab] = useState<"chats" | "servers" | "friends" | "notifications" | "profile">("chats");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [messages, setMessages] = useState<Record<number, string[]>>({});

  useEffect(() => { localStorage.setItem("bg-servers", JSON.stringify(servers)); }, [servers]);
  useEffect(() => { localStorage.setItem("bg-channels", JSON.stringify(channels)); }, [channels]);

  const activeServer = servers.find((server) => server.id === activeServerId) ?? servers[0];
  const serverChannels = useMemo(() => channels.filter((channel) => channel.serverId === activeServerId), [channels, activeServerId]);
  const visibleChannels = useMemo(() => serverChannels.filter((channel) => channel.name.toLowerCase().includes(query.toLowerCase())), [serverChannels, query]);
  const active = channels.find((channel) => channel.id === activeId) ?? serverChannels[0];

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

  if (!activeServer || !active) return <main className="discord-shell"><aside className="server-rail"><button className="server-icon brand-server"><Sparkles/></button><button className="server-icon add-server" onClick={createServer}><Plus/></button></aside><section className="chat-panel"><div className="channel-welcome"><h1>Создай свой первый сервер</h1><button onClick={createServer}>Добавить сервер</button></div></section></main>;

  return (
    <main className="discord-shell">
      <aside className="server-rail">
        <button className="server-icon brand-server" title="BrainGram"><Sparkles size={23}/></button>
        <div className="rail-divider"/>
        {servers.map((server) => <button key={server.id} className={`server-icon ${activeServerId === server.id ? "selected-server" : ""}`} title={server.name} onClick={() => selectServer(server)}><span className="server-letter">{server.letter}</span></button>)}
        <button className="server-icon add-server" title="Добавить сервер" onClick={createServer}><Plus size={23}/></button>
        <button className="server-icon explore-server" title="Обзор"><Compass size={21}/></button>
        <div className="server-bottom"><button className="server-icon"><Inbox size={20}/></button></div>
      </aside>

      <aside className="channel-sidebar">
        <button className="server-title">{activeServer.name} <ChevronDown size={17}/></button>
        <div className="channel-scroll">
          <div className="quick-actions"><button><Bell size={17}/> Уведомления</button><button><Pin size={17}/> Закреплённое</button></div>
          <div className="channel-heading"><span>ТЕКСТОВЫЕ КАНАЛЫ</span><button onClick={createChannel} title="Создать канал"><Plus size={17}/></button></div>
          <nav className="channel-list">
            {visibleChannels.map((channel) => <div key={channel.id} className={`channel-row ${activeId === channel.id ? "active-channel-row" : ""}`}><button className={`channel-item ${activeId === channel.id ? "active-channel" : ""}`} onClick={() => setActiveId(channel.id)}><Hash size={18}/><span>{channel.name}</span>{channel.unread ? <b>{channel.unread}</b> : null}</button><button className="delete-channel" title="Удалить канал" onClick={() => deleteChannel(channel)}><Trash2 size={14}/></button></div>)}
            {visibleChannels.length === 0 && <p className="empty-search">Каналы не найдены</p>}
          </nav>
          <div className="channel-heading voice-heading"><span>ГОЛОСОВЫЕ КАНАЛЫ</span><button title="Добавить голосовой канал"><Plus size={17}/></button></div>
          <button className="channel-item voice-channel"><Headphones size={18}/> <span>Общая комната</span></button>
          <div className="voice-status"><div className="voice-status-top"><i/> Голосовой канал</div><small>Нажми, чтобы подключиться</small></div>
        </div>
        <div className="user-panel"><div className="user-avatar">U<i/></div><div className="user-meta"><strong>Пользователь</strong><small>В сети</small></div><button title="Микрофон"><Mic size={18}/></button><button title="Настройки"><Settings size={18}/></button></div>
      </aside>

      {activeTab === "servers" ? <section className="servers-panel">
        <div className="servers-topbar"><div><Server size={20}/><strong>Серверы</strong></div><span>{servers.length} серверов</span></div>
        <div className="servers-content">
          <div className="servers-hero"><div><h1>Твои сообщества</h1><p>Создавай места для общения или присоединяйся к другим</p></div><div className="servers-hero-icon"><Server size={27}/></div></div>
          <div className="servers-actions"><div><strong>Публичные и приватные серверы</strong><span>Публичные доступны всем, приватные — только по приглашению</span></div><button onClick={createServer}><Plus size={17}/> Создать сервер</button></div>
          <div className="servers-section-title">МОИ СЕРВЕРЫ</div>
          <div className="servers-grid">{servers.map((server) => <article className="my-server-card" key={server.id}>
            <div className="my-server-banner"><div className="my-server-avatar">{server.letter}</div><span className={server.visibility === "private" ? "server-privacy private" : "server-privacy public"}>{server.visibility === "private" ? "🔒 Приватный" : "🌐 Публичный"}</span></div>
            <div className="my-server-info"><strong>{server.name}</strong><span>{channels.filter((channel) => channel.serverId === server.id).length} канал(ов) · локальный сервер</span></div>
            <div className="my-server-actions"><button onClick={() => { selectServer(server); setActiveTab("chats"); }}>Открыть сервер</button><button title="Изменить доступ" onClick={() => toggleServerVisibility(server.id)}>{server.visibility === "private" ? "Сделать публичным" : "Сделать приватным"}</button></div>
          </article>)}</div>
          <p className="servers-note">Пока серверы хранятся только на этом устройстве. Публичный и приватный режимы сейчас показывают выбранный тип доступа; приглашения и поиск серверов подключим вместе с backend.</p>
        </div>
      </section> : activeTab === "friends" ? <section className="friends-panel">
        <div className="friends-topbar"><div><Users size={20}/><strong>Друзья</strong></div><span>{friends.length} друзей</span></div>
        <div className="friends-content">
          <div className="friends-hero"><div><h1>Твои друзья</h1><p>Общайся и оставайся на связи в BrainGram</p></div><div className="friends-hero-icon"><Users size={27}/></div></div>
          <form className="friend-add-form" onSubmit={sendFriendInvite}><div className="friend-add-copy"><strong>Добавить друга</strong><span>Введи его имя пользователя</span></div><div className="friend-add-controls"><div><span>@</span><input value={friendInvite} onChange={(event) => { setFriendInvite(event.target.value); setFriendMessage(""); }} placeholder="username" maxLength={24}/></div><button type="submit" disabled={!friendInvite.trim()}><Plus size={16}/> Добавить</button></div>{friendMessage && <p className="friend-feedback">{friendMessage}</p>}</form>
          <div className="friend-section-heading"><div><h2>Заявки в друзья</h2><span>{friendRequests.length}</span></div></div>
          {friendRequests.length > 0 ? <div className="friend-request-list">{friendRequests.map((friend) => <article className="friend-card request-card" key={friend.id}><div className={`friend-avatar ${friend.color}`}>{friend.initials}</div><div className="friend-details"><strong>{friend.name}</strong><span>{friend.tag} · {friend.mutual}</span></div><div className="friend-card-actions"><button className="friend-accept" onClick={() => acceptFriend(friend.id)} title="Принять заявку"><Users size={15}/></button><button className="friend-decline" onClick={() => setFriendRequests((current) => current.filter((item) => item.id !== friend.id))} title="Отклонить заявку">×</button></div></article>)}</div> : <div className="friends-empty-small">Новых заявок пока нет.</div>}
          <div className="friend-section-heading friends-list-heading"><div><h2>Все друзья</h2><span>{friends.length}</span></div><div className="friend-search"><Search size={15}/><input value={friendSearch} onChange={(event) => setFriendSearch(event.target.value)} placeholder="Поиск друзей"/></div></div>
          <div className="friend-list">{friends.filter((friend) => `${friend.name} ${friend.tag}`.toLowerCase().includes(friendSearch.toLowerCase())).map((friend) => <article className="friend-card" key={friend.id}><div className={`friend-avatar ${friend.color}`}>{friend.initials}<i className={friend.status === "В сети" ? "online" : "idle"}/></div><div className="friend-details"><strong>{friend.name}</strong><span>{friend.tag} · {friend.status}</span></div><button className="friend-more" title="Удалить из друзей" onClick={() => setFriends((current) => current.filter((item) => item.id !== friend.id))}><MoreHorizontal size={20}/></button></article>)}
          {friends.filter((friend) => `${friend.name} ${friend.tag}`.toLowerCase().includes(friendSearch.toLowerCase())).length === 0 && <div className="friends-empty-small">Друзья не найдены.</div>}
          </div>
        </div>
      </section> : activeTab === "notifications" ? <section className="notifications-panel">
        <div className="notifications-topbar"><div><Bell size={20}/><strong>Уведомления</strong>{unreadNotifications > 0 && <span className="notification-count">{unreadNotifications}</span>}</div><button onClick={markAllNotificationsRead} disabled={unreadNotifications === 0}><Inbox size={16}/> Прочитать все</button></div>
        <div className="notifications-content">
          <div className="notifications-heading"><div><h1>Входящие</h1><p>Здесь собраны важные события BrainGram</p></div><span>{notifications.length} всего</span></div>
          <div className="notification-list">
            {notifications.map((item) => <article key={item.id} className={item.unread ? "notification-card unread-notification" : "notification-card"}>
              <div className={`notification-avatar ${item.color}`}>{item.initials}</div>
              <div className="notification-copy"><div className="notification-title-row"><strong>{item.title}</strong>{item.unread && <i/>}</div><p>{item.text}</p><time>{item.time}</time>
                {item.type === "friend" && <div className="notification-actions"><button onClick={() => setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, unread: false } : entry))}>Принять</button><button onClick={() => setNotifications((current) => current.filter((entry) => entry.id !== item.id))}>Отклонить</button></div>}
              </div>
              <button className="notification-dismiss" title="Убрать уведомление" onClick={() => setNotifications((current) => current.filter((entry) => entry.id !== item.id))}>×</button>
            </article>)}
            {notifications.length === 0 && <div className="notifications-empty"><Bell size={32}/><strong>Пока тихо</strong><p>Когда появятся новые события, они будут здесь.</p></div>}
          </div>
        </div>
      </section> : activeTab === "profile" ? <section className="profile-panel">
        <div className="profile-topbar"><UserRound size={20}/><strong>Мой профиль</strong><button className="profile-settings-button" type="button" onClick={() => setShowSettings(true)} aria-label="Открыть настройки" title="Настройки"><Settings size={17}/><span>Настройки</span></button></div>
        <div className="profile-cover"><div className="profile-avatar-large">{(profileName.trim()[0] || "U").toUpperCase()}<span className="profile-online-dot"/></div></div>
        <div className="profile-card">
          <div className="profile-card-heading"><div><h1>{profileName || "Пользователь"}</h1><p>@{profileTag || "user"}</p></div><span className="profile-status-pill"><i/>{profileStatus}</span></div>
          <div className="profile-divider"/>
          <h2>О СЕБЕ</h2><p className="profile-about-preview">{profileAbout || "Расскажи немного о себе..."}</p>
          <div className="profile-divider"/>
          <h2>РЕДАКТИРОВАТЬ ПРОФИЛЬ</h2>
          <form className="profile-form" onSubmit={(event) => { event.preventDefault(); localStorage.setItem("bg-profile-name",profileName.trim() || "Пользователь"); localStorage.setItem("bg-profile-tag",profileTag.trim().replace(/^@/,"") || "user"); localStorage.setItem("bg-profile-status",profileStatus); localStorage.setItem("bg-profile-about",profileAbout.trim()); setProfileSaved(true); window.setTimeout(() => setProfileSaved(false),2200); }}>
            <label htmlFor="profile-name">ИМЯ</label><input id="profile-name" maxLength={32} value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Как тебя называть?"/>
            <label htmlFor="profile-tag">ИМЯ ПОЛЬЗОВАТЕЛЯ</label><div className="profile-tag-input"><span>@</span><input id="profile-tag" maxLength={24} value={profileTag} onChange={(event) => setProfileTag(event.target.value.replace(/\s/g,""))} placeholder="username"/></div>
            <label htmlFor="profile-status">СТАТУС</label><select id="profile-status" value={profileStatus} onChange={(event) => setProfileStatus(event.target.value)}><option>В сети</option><option>Не беспокоить</option><option>Не активен</option><option>Невидимый</option></select>
            <label htmlFor="profile-about">О СЕБЕ</label><textarea id="profile-about" rows={3} maxLength={160} value={profileAbout} onChange={(event) => setProfileAbout(event.target.value)} placeholder="Напиши пару слов о себе..."/>
            <div className="profile-form-footer"><small>{profileAbout.length}/160</small><button type="submit">{profileSaved ? "Сохранено ✓" : "Сохранить изменения"}</button></div>
          </form>
        </div>
      </section> : <section className="chat-panel">
        <header className="chat-header"><div className="header-channel"><Hash size={23}/><strong>{active.name}</strong></div><div className="header-tools"><button title="Уведомления"><Bell/></button><button title="Закреплённое"><Pin/></button><button title="Участники"><Users/></button><div className="header-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск каналов"/></div><button title="Входящие"><Inbox/></button><button title="Справка"><MessageCircle/></button></div></header>
        <div className="chat-content">
          <div className="channel-welcome"><div className="hash-welcome"><Hash size={34}/></div><h1>Добро пожаловать в #{active.name}!</h1><p>Это начало канала #{active.name}.</p></div>
          <div className="message-list">{(messages[active.id] ?? []).map((message, index) => <article key={index} className="message-entry"><div className={`message-avatar ${index % 2 ? "avatar-blue" : "avatar-purple"}`}>{index % 2 ? "M" : "U"}</div><div className="message-body"><div className="message-author">{profileName} <time>Сегодня</time></div><p>{message}</p></div></article>)}</div>
        </div>
        <form className="message-composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}><button type="button" title="Прикрепить файл"><Plus size={21}/></button><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Написать в #${active.name}`}/><button type="button" title="Прикрепить файл"><Paperclip size={19}/></button><button type="button" title="Эмодзи"><Smile size={20}/></button><button className="send-message" type="submit" title="Отправить"><Send size={18}/></button></form>
      </section>}
      <aside className="member-sidebar"><div className="member-title">УЧАСТНИКИ — 1</div><div className="member-group">В СЕТИ — 1</div><div className="member"><div className="member-avatar purple">U<i/></div><span>{profileName}</span><b>👑</b></div></aside>
      <div className="bottom-nav user-name-bar" aria-label="Имя пользователя"><span>@{profileTag || "user"}</span></div>
      {showSettings && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSettings(false); }}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button className="modal-close" type="button" aria-label="Закрыть" onClick={() => setShowSettings(false)}>×</button><div className="modal-icon"><Settings size={23}/></div><h2 id="settings-title">Настройки</h2><p className="modal-subtitle">Управление твоим профилем BrainGram</p><div className="settings-row"><div><strong>Имя пользователя</strong><span>@{profileTag || "user"}</span></div><UserRound size={18}/></div><div className="settings-row"><div><strong>Статус</strong><span>{profileStatus}</span></div><span className="settings-status-dot"/></div><div className="settings-info"><strong>Приватность и безопасность</strong><p>Дополнительные настройки приватности, входа и защиты аккаунта появятся после подключения backend.</p></div><div className="modal-actions"><button type="button" className="create-modal" onClick={() => setShowSettings(false)}>Готово</button></div></section></div>}
      {showChannelModal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowChannelModal(false); }}>
        <section className="channel-modal" role="dialog" aria-modal="true" aria-labelledby="channel-modal-title">
          <button className="modal-close" type="button" aria-label="Закрыть" onClick={() => setShowChannelModal(false)}>×</button>
          <div className="modal-icon"><Hash size={24}/></div>
          <h2 id="channel-modal-title">Создать канал</h2>
          <p className="modal-subtitle">Канал появится на сервере <strong>{activeServer.name}</strong>.</p>
          <form onSubmit={submitNewChannel}>
            <label htmlFor="new-channel-name">НАЗВАНИЕ КАНАЛА</label>
            <div className="channel-name-input"><Hash size={19}/><input id="new-channel-name" autoFocus maxLength={40} value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder="например, обсуждение" required /></div>
            <label htmlFor="new-channel-description">ТЕМА КАНАЛА <span>НЕОБЯЗАТЕЛЬНО</span></label>
            <textarea id="new-channel-description" rows={3} maxLength={120} value={newChannelDescription} onChange={(event) => setNewChannelDescription(event.target.value)} placeholder="О чём будем говорить?"/>
            <div className="modal-hint"><Hash size={14}/> Текстовый канал · Видят участники сервера</div>
            <div className="modal-actions"><button type="button" className="cancel-modal" onClick={() => setShowChannelModal(false)}>Отмена</button><button type="submit" className="create-modal" disabled={!newChannelName.trim()}>Создать канал</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}

export default function App() {
  return <AuthGate><AppContent /></AuthGate>;
}
