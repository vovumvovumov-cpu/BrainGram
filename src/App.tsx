import { useMemo, useState } from "react";
import { Search, Plus, Send, Paperclip, Smile, MoreHorizontal, MessageCircle, Users, Settings, Sparkles, Hash, Headphones, Mic, ChevronDown, Compass, Bell, Pin, Inbox } from "lucide-react";

type Chat = { id: number; name: string; message: string; time: string; initials: string; color: string; unread?: number };
const initialChats: Chat[] = [
  { id: 1, name: "общий", message: "Александр: всем привет!", time: "12:42", initials: "А", color: "violet", unread: 2 },
  { id: 2, name: "разработка", message: "Мария: дизайн уже готов ✨", time: "11:18", initials: "B", color: "blue", unread: 5 },
  { id: 3, name: "идеи", message: "Новые идеи для BrainGram", time: "Вчера", initials: "И", color: "pink" },
  { id: 4, name: "мемы", message: "Денис отправил картинку", time: "Пн", initials: "Д", color: "green" },
];

export default function App() {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Record<number, string[]>>({
    1: ["Добро пожаловать на сервер BrainGram! 👋", "Здесь будет наше главное общение.", "Рассказывайте, как проходит день!"],
    2: ["Работа над BrainGram начинается здесь.", "Мария: дизайн уже готов ✨"],
    3: ["Какие функции добавить следующими?"],
    4: ["Пятничное настроение 😄"],
  });
  const active = chats.find((chat) => chat.id === activeId) ?? chats[0];
  const visibleChats = useMemo(() => chats.filter((chat) => chat.name.toLowerCase().includes(query.toLowerCase())), [chats, query]);

  function sendMessage() {
    const value = draft.trim();
    if (!value || !active) return;
    setMessages((current) => ({ ...current, [active.id]: [...(current[active.id] ?? []), value] }));
    setChats((current) => current.map((chat) => chat.id === active.id ? { ...chat, message: value, time: "Сейчас", unread: 0 } : chat));
    setDraft("");
  }
  function newChat() {
    const id = Math.max(...chats.map((chat) => chat.id)) + 1;
    const chat = { id, name: "новый-канал", message: "Канал создан", time: "Сейчас", initials: "Н", color: "violet" };
    setChats((current) => [...current, chat]);
    setMessages((current) => ({ ...current, [id]: [] }));
    setActiveId(id);
  }

  return (
    <main className="discord-shell">
      <aside className="server-rail">
        <button className="server-icon brand-server" title="BrainGram"><Sparkles size={23}/></button>
        <div className="rail-divider"/>
        <button className="server-icon selected-server" title="BrainGram"><span className="server-letter">B</span></button>
        <button className="server-icon" title="Друзья"><Users size={21}/></button>
        <button className="server-icon add-server" title="Добавить сервер"><Plus size={23}/></button>
        <button className="server-icon explore-server" title="Обзор"><Compass size={21}/></button>
        <div className="server-bottom"><button className="server-icon"><Inbox size={20}/></button></div>
      </aside>

      <aside className="channel-sidebar">
        <button className="server-title">BrainGram <ChevronDown size={17}/></button>
        <div className="channel-scroll">
          <div className="quick-actions"><button><Bell size={17}/> Уведомления</button><button><Pin size={17}/> Закреплённое</button></div>
          <div className="channel-heading"><span>ТЕКСТОВЫЕ КАНАЛЫ</span><button onClick={newChat} title="Создать канал"><Plus size={17}/></button></div>
          <nav className="channel-list">
            {visibleChats.map((chat) => <button key={chat.id} className={`channel-item ${activeId === chat.id ? "active-channel" : ""}`} onClick={() => setActiveId(chat.id)}>
              <Hash size={18}/><span>{chat.name}</span>{chat.unread ? <b>{chat.unread}</b> : null}<MoreHorizontal className="channel-more" size={16}/>
            </button>)}
            {visibleChats.length === 0 && <p className="empty-search">Каналы не найдены</p>}
          </nav>
          <div className="channel-heading voice-heading"><span>ГОЛОСОВЫЕ КАНАЛЫ</span><button title="Добавить голосовой канал"><Plus size={17}/></button></div>
          <button className="channel-item voice-channel"><Headphones size={18}/> <span>Общая комната</span></button>
          <div className="voice-status"><div className="voice-status-top"><i/> Голосовой канал</div><small>Нажми, чтобы подключиться</small></div>
        </div>
        <div className="user-panel"><div className="user-avatar">U<i/></div><div className="user-meta"><strong>Пользователь</strong><small>В сети</small></div><button title="Микрофон"><Mic size={18}/></button><button title="Настройки"><Settings size={18}/></button></div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header"><div className="header-channel"><Hash size={23}/><strong>{active.name}</strong></div><div className="header-tools"><button title="Уведомления"><Bell/></button><button title="Закреплённое"><Pin/></button><button title="Участники"><Users/></button><div className="header-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск"/></div><button title="Входящие"><Inbox/></button><button title="Справка"><MessageCircle/></button></div></header>
        <div className="chat-content">
          <div className="channel-welcome"><div className="hash-welcome"><Hash size={34}/></div><h1>Добро пожаловать в #{active.name}!</h1><p>Это начало канала #{active.name}.</p></div>
          <div className="message-list">{(messages[active.id] ?? []).map((message, index) => <article key={index} className="message-entry"><div className={`message-avatar ${index % 2 ? "avatar-blue" : "avatar-purple"}`}>{index % 2 ? "M" : "U"}</div><div className="message-body"><div className="message-author">{index % 2 ? "Мария" : "Пользователь"} <time>Сегодня в 12:{40 + index}</time></div><p>{message}</p></div></article>)}</div>
        </div>
        <form className="message-composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}><button type="button" title="Прикрепить файл"><Plus size={21}/></button><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Написать в #${active.name}`}/><button type="button" title="Прикрепить файл"><Paperclip size={19}/></button><button type="button" title="Эмодзи"><Smile size={20}/></button><button className="send-message" type="submit" title="Отправить"><Send size={18}/></button></form>
      </section>
      <aside className="member-sidebar"><div className="member-title">УЧАСТНИКИ — 3</div><div className="member-group">В СЕТИ — 3</div><div className="member"><div className="member-avatar purple">U<i/></div><span>Пользователь</span><b>👑</b></div><div className="member"><div className="member-avatar blue">M<i/></div><span>Мария</span></div><div className="member"><div className="member-avatar green">D<i/></div><span>Денис</span></div></aside>
    </main>
  );
}
