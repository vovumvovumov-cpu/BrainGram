import { useEffect, useMemo, useState } from "react";
import AuthGate from "./components/AuthGate";
import { Search, Plus, Send, Paperclip, Smile, MoreHorizontal, MessageCircle, Users, Settings, Sparkles, Hash, Headphones, Mic, ChevronDown, Compass, Bell, Pin, Inbox, Trash2, UserRound, Server } from "lucide-react";

type Server = { id: number; name: string; letter: string; visibility?: "public" | "private" };
type Channel = { id: number; serverId: number; name: string; message: string; time: string; initials: string; color: string; unread?: number };

const starterServers: Server[] = [{ id: 1, name: "BrainGram", letter: "B" }];
const starterChannels: Channel[] = [
  { id: 1, serverId: 1, name: "общий", message: "Канал для общего общения", time: "", initials: "О", color: "violet" },
  { id: 2, serverId: 1, name: "разработка", message: "Обсуждение разработки", time: "", initials: "Р", color: "blue" },
  { id: 3, serverId: 1, name: "идеи", message: "Новые идеи для BrainGram", time: "Вчера", initials: "И", color: "pink" },
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
