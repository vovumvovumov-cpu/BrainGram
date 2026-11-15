import { useMemo, useState } from "react";
import { Search, Plus, Send, Paperclip, Smile, MoreHorizontal, MessageCircle, Users, Settings, Sparkles } from "lucide-react";

type Chat = { id: number; name: string; message: string; time: string; initials: string; color: string; unread?: number };

const initialChats: Chat[] = [
  { id: 1, name: "Александр", message: "Привет! Как дела?", time: "12:42", initials: "А", color: "violet", unread: 2 },
  { id: 2, name: "Команда BrainGram", message: "Мария: дизайн уже готов ✨", time: "11:18", initials: "B", color: "blue", unread: 5 },
  { id: 3, name: "Мама", message: "Не забудь позвонить ❤️", time: "Вчера", initials: "М", color: "pink" },
  { id: 4, name: "Денис", message: "Отправил тебе фото", time: "Пн", initials: "Д", color: "green" },
];

export default function App() {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Record<number, string[]>>({
    1: ["Йо! 👋", "Привет! Как дела?"],
    2: ["Добро пожаловать в рабочий чат BrainGram!", "Мария: дизайн уже готов ✨"],
    3: ["Как ты? Береги себя ❤️"],
    4: ["Отправил тебе фото"],
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
    const chat = { id, name: "Новый диалог", message: "Начните общение", time: "Сейчас", initials: "Н", color: "violet" };
    setChats((current) => [chat, ...current]);
    setMessages((current) => ({ ...current, [id]: [] }));
    setActiveId(id);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark"><Sparkles size={21} /></div><span>Brain<span>Gram</span></span><button className="icon-button settings" aria-label="Настройки"><Settings size={19} /></button></div>
        <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" /></div>
        <div className="section-heading"><span>СООБЩЕНИЯ</span><button className="icon-button add" onClick={newChat} aria-label="Новый чат"><Plus size={19} /></button></div>
        <nav className="chat-list">
          {visibleChats.map((chat) => <button key={chat.id} className={`chat-item ${activeId === chat.id ? "selected" : ""}`} onClick={() => setActiveId(chat.id)}>
            <div className={`avatar ${chat.color}`}>{chat.initials}</div><div className="chat-copy"><div className="chat-top"><strong>{chat.name}</strong><time>{chat.time}</time></div><div className="chat-bottom"><span>{chat.message}</span>{chat.unread ? <b>{chat.unread}</b> : null}</div></div>
          </button>)}
          {visibleChats.length === 0 && <p className="empty-search">Ничего не найдено</p>}
        </nav>
        <div className="sidebar-footer"><div className="profile-avatar">U</div><div><strong>Мой профиль</strong><small>В сети</small></div><MoreHorizontal size={20} /></div>
      </aside>
      <section className="conversation">
        <header className="conversation-header"><div className={`avatar ${active.color}`}>{active.initials}</div><div className="person-info"><strong>{active.name}</strong><span><i /> в сети</span></div><button className="icon-button header-more" aria-label="Дополнительно"><MoreHorizontal /></button></header>
        <div className="messages-area"><div className="date-pill">Сегодня</div>{(messages[active.id] ?? []).map((message, index) => <div key={index} className={`message-row ${index === (messages[active.id] ?? []).length - 1 && active.id === 1 ? "mine" : index % 2 ? "theirs" : "mine"}`}><div className="bubble">{message}<time>{index === (messages[active.id] ?? []).length - 1 ? "12:42" : "12:40"} {index % 2 === 0 ? "✓✓" : ""}</time></div></div>)}<div className="welcome-hint"><MessageCircle size={16} /> Это начало вашей истории общения</div></div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}><button type="button" className="icon-button attach" aria-label="Прикрепить файл"><Paperclip size={20} /></button><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Написать сообщение..." /><button type="button" className="icon-button smile" aria-label="Эмодзи"><Smile size={20} /></button><button className="send-button" type="submit" aria-label="Отправить"><Send size={18} /></button></form>
      </section>
      <aside className="right-rail"><div className="rail-icon active"><MessageCircle size={19} /></div><div className="rail-icon"><Users size={19} /></div><div className="rail-spacer" /><div className="rail-icon"><Settings size={19} /></div></aside>
    </main>
  );
}
