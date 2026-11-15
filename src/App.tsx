import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Send, Paperclip, Smile, MoreHorizontal, MessageCircle, Users, Settings, Sparkles, Hash, Headphones, Mic, ChevronDown, Compass, Bell, Pin, Inbox, Trash2 } from "lucide-react";

type Server = { id: number; name: string; letter: string };
type Channel = { id: number; serverId: number; name: string; message: string; time: string; initials: string; color: string; unread?: number };

const starterServers: Server[] = [{ id: 1, name: "BrainGram", letter: "B" }];
const starterChannels: Channel[] = [
  { id: 1, serverId: 1, name: "общий", message: "Александр: всем привет!", time: "12:42", initials: "А", color: "violet", unread: 2 },
  { id: 2, serverId: 1, name: "разработка", message: "Мария: дизайн уже готов ✨", time: "11:18", initials: "В", color: "blue", unread: 5 },
  { id: 3, serverId: 1, name: "идеи", message: "Новые идеи для BrainGram", time: "Вчера", initials: "И", color: "pink" },
  { id: 4, serverId: 1, name: "мемы", message: "Денис отправил картинку", time: "Пн", initials: "Д", color: "green" },
];

export default function App() {
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
  const [messages, setMessages] = useState<Record<number, string[]>>({
    1: ["Добро пожаловать на сервер BrainGram! 👋", "Здесь будет наше главное общение.", "Рассказывайте, как проходит день!"],
    2: ["Работа над BrainGram начинается здесь.", "Мария: дизайн уже готов ✨"],
    3: ["Какие функции добавить следующими?"],
    4: ["Пятничное настроение 😄"],
  });

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
    const server = { id, name: name.trim(), letter: name.trim().charAt(0).toUpperCase() };
    setServers((current) => [...current, server]);
    const channelId = Math.max(0, ...channels.map((channel) => channel.id)) + 1;
    setChannels((current) => [...current, { id: channelId, serverId: id, name: "общий", message: "Канал создан", time: "Сейчас", initials: "О", color: "violet" }]);
    setMessages((current) => ({ ...current, [channelId]: ["Добро пожаловать на новый сервер! 👋"] }));
    setActiveServerId(id);
    setActiveId(channelId);
  }
  function createChannel() {
    const name = window.prompt("Название текстового канала:");
    if (!name?.trim() || !activeServer) return;
    const id = Math.max(0, ...channels.map((channel) => channel.id)) + 1;
    setChannels((current) => [...current, { id, serverId: activeServer.id, name: name.trim().replace(/^#+/, "").replace(/\s+/g, "-"), message: "Канал создан", time: "Сейчас", initials: "Н", color: "violet" }]);
    setMessages((current) => ({ ...current, [id]: ["Это начало нового канала. 👋"] }));
    setActiveId(id);
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

      <section className="chat-panel">
        <header className="chat-header"><div className="header-channel"><Hash size={23}/><strong>{active.name}</strong></div><div className="header-tools"><button title="Уведомления"><Bell/></button><button title="Закреплённое"><Pin/></button><button title="Участники"><Users/></button><div className="header-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск каналов"/></div><button title="Входящие"><Inbox/></button><button title="Справка"><MessageCircle/></button></div></header>
        <div className="chat-content">
          <div className="channel-welcome"><div className="hash-welcome"><Hash size={34}/></div><h1>Добро пожаловать в #{active.name}!</h1><p>Это начало канала #{active.name}.</p></div>
          <div className="message-list">{(messages[active.id] ?? []).map((message, index) => <article key={index} className="message-entry"><div className={`message-avatar ${index % 2 ? "avatar-blue" : "avatar-purple"}`}>{index % 2 ? "M" : "U"}</div><div className="message-body"><div className="message-author">{index % 2 ? "Мария" : "Пользователь"} <time>Сегодня</time></div><p>{message}</p></div></article>)}</div>
        </div>
        <form className="message-composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}><button type="button" title="Прикрепить файл"><Plus size={21}/></button><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Написать в #${active.name}`}/><button type="button" title="Прикрепить файл"><Paperclip size={19}/></button><button type="button" title="Эмодзи"><Smile size={20}/></button><button className="send-message" type="submit" title="Отправить"><Send size={18}/></button></form>
      </section>
      <aside className="member-sidebar"><div className="member-title">УЧАСТНИКИ — 3</div><div className="member-group">В СЕТИ — 3</div><div className="member"><div className="member-avatar purple">U<i/></div><span>Пользователь</span><b>👑</b></div><div className="member"><div className="member-avatar blue">M<i/></div><span>Мария</span></div><div className="member"><div className="member-avatar green">D<i/></div><span>Денис</span></div></aside>
    </main>
  );
}
