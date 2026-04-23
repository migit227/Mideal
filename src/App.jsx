import { useEffect, useState, useRef } from "react";
import { db } from "./firebase";
import {
    collection, addDoc, getDocs, query, orderBy, doc, setDoc, getDoc,
    updateDoc, deleteDoc, onSnapshot, where, limit
} from "firebase/firestore";
import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, signOut, GoogleAuthProvider,
    signInWithPopup, deleteUser
} from "firebase/auth";
import {
    getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "firebase/storage";

const translations = {
    ru: {
        games: "Игры", profile: "Профиль", settings: "Настройки", logout: "Выйти",
        friends: "Друзья", feed: "Лента", search: "Найти", save: "Сохранить",
        theme: "Тема", lang: "Язык", age: "Возраст", steamId: "Steam ID64",
        nickname: "Никнейм", uploadPhoto: "Загрузить фото", matchCS2: "Подбор CS2",
        hours: "Часов в CS2", skill: "Скилл", hasPrime: "Прайм-статус",
        joinQueue: "В очередь", leaveQueue: "Покинуть очередь", back: "Назад",
        privacy: "Приватность", status: "Статус", statusReady: "Готов",
        ranks: ["Silver", "Gold Nova", "Master Guardian", "Global Elite", "1000-5000 ELO", "5000-15000 ELO", "20000+ ELO"]
    }
};

export default function App() {
    const auth = getAuth();
    const storage = getStorage();
    const [user, setUser] = useState(null);
    const [step, setStep] = useState("loading");
    const [activeTab, setActiveTab] = useState("games");
    const [selectedGame, setSelectedGame] = useState(null);
    const [settingsSubTab, setSettingsSubTab] = useState("general");

    // Данные профиля и настроек
    const [lang, setLang] = useState("ru");
    const [theme, setTheme] = useState("dark");
    const [nick, setNick] = useState("");
    const [steamID, setSteamID] = useState("");
    const [age, setAge] = useState("");
    const [avatar, setAvatar] = useState("");
    const [userStatus, setUserStatus] = useState("ready");
    const [privacyAge, setPrivacyAge] = useState(false);

    // Социалка (Посты, Комменты, Друзья)
    const [posts, setPosts] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [friends, setFriends] = useState([]);
    const [friendQuery, setFriendQuery] = useState('');
    const [commentsMap, setCommentsMap] = useState({});
    const [commentInputs, setCommentInputs] = useState({});

    // Подбор CS2
    const [csSkill, setCsSkill] = useState("Silver");
    const [csHours, setCsHours] = useState("");
    const [hasPrime, setHasPrime] = useState(true);
    const [steamData, setSteamData] = useState(null);
    const [showSteamGuide, setShowSteamGuide] = useState(false);
    const [lobby, setLobby] = useState([]);
    const [myQueueId, setMyQueueId] = useState(null);

    // Модалки и загрузка
    const [uploading, setUploading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const t = translations[lang] || translations.ru;

    useEffect(() => {
        const id = 'mideal-full-v5';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.innerHTML = `
            :root { --bg: #0b0e11; --card: #15191c; --border: #2d3339; --text: #fff; --accent: #4f9aff; }
            * { transition: 0.3s ease; box-sizing: border-box; font-family: 'Inter', sans-serif; }
            body { margin: 0; background: var(--bg); color: var(--text); overflow: hidden; }
            .app-grid { display: grid; grid-template-columns: 280px 1fr 300px; height: 100vh; }
            .sidebar { background: var(--card); border-right: 1px solid var(--border); padding: 25px; display: flex; flex-direction: column; overflow-y: auto; }
            .main-view { padding: 40px; overflow-y: auto; background: var(--bg); display: flex; flex-direction: column; align-items: center; }
            .card { background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 24px; margin-bottom: 20px; width: 100%; }
            .menu-btn { padding: 14px 18px; border-radius: 16px; cursor: pointer; margin-bottom: 5px; color: #8e959e; display: flex; align-items: center; gap: 12px; }
            .menu-btn.active { background: var(--accent); color: white; }
            .game-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; width: 100%; }
            .game-card { cursor: pointer; text-align: center; background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 15px; }
            .game-card:hover { border-color: var(--accent); transform: translateY(-5px); }
            .btn { padding: 12px 20px; border-radius: 12px; border: none; cursor: pointer; font-weight: bold; background: var(--accent); color: white; }
            .btn-gray { background: var(--border); color: var(--text); }
            .btn-danger { background: #ff4f4f; }
            input, select { width: 100%; padding: 12px; margin: 8px 0; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: white; }
            .post-card { background: var(--card); border-radius: 20px; padding: 20px; margin-bottom: 15px; }
            .avatar-img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
            /* Animations and improved visuals */
            .fade-in { animation: fadeIn 350ms ease both; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            .btn { transition: transform 160ms ease, box-shadow 160ms ease; }
            .btn:active { transform: translateY(1px); }
            .menu-btn { transition: background 220ms ease, transform 160ms ease; }
            .menu-btn:hover { transform: translateX(6px); }
            .game-card { transition: transform 260ms cubic-bezier(.2,.9,.2,1), box-shadow 260ms; }
            .game-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
            .list-item { padding: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
            .list-item + .list-item { margin-top: 8px; }
            .small-muted { font-size: 12px; opacity: 0.7; }
        `;
        document.head.appendChild(style);
    }, []);

    // Инициализация пользователя и подгрузка данных
    useEffect(() => {
        return onAuthStateChanged(auth, async (u) => {
            if (u) {
                const uRef = doc(db, "users", u.uid);
                const snap = await getDoc(uRef);
                if (!snap.exists()) {
                    await setDoc(uRef, { uid: u.uid, nickname: u.displayName || "Gamer", email: u.email, status: "ready", createdAt: Date.now() });
                } else {
                    const d = snap.data();
                    setNick(d.nickname || ""); setSteamID(d.gamingID || ""); setAge(d.age || "");
                    setAvatar(d.avatar || ""); setLang(d.lang || "ru"); setTheme(d.theme || "dark");
                    setUserStatus(d.status || "ready"); setPrivacyAge(d.hideAge || false);
                    setSteamData(d.steam || null);
                    // prefill CS hours and prime from linked Steam if available
                    if (d.steam && d.steam.games) {
                        const g = d.steam.games[730] || d.steam.games['730'];
                        if (g) setCsHours(Math.round(g.playtime_hours || g.playtime / 60 || 0));
                        if (typeof d.steam.hasPrime !== 'undefined') setHasPrime(!!d.steam.hasPrime);
                    }
                }
                setUser(u); setStep("main_menu");
                loadPosts(); // Загружаем ленту при входе
                loadFriends();
            } else setStep("auth");
        });
    }, []);

    const loadFriends = async () => {
        // simple friends list: users where isFriendWith current user (field friends: [uid]) OR we can implement searching
        const q = query(collection(db, 'users'), orderBy('nickname'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFriends(list.filter(u => u.uid !== user?.uid));
    };

    // Fetch Steam data using Steam Web API. Requires REACT_APP_STEAM_API_KEY to be set in env.
    const fetchSteamData = async (steamIdInput) => {
        const proxy = process.env.REACT_APP_STEAM_PROXY || 'http://localhost:3001';
        if (!user) return alert('Сначала войдите в аккаунт');
        if (!steamIdInput) return alert('Укажите Steam ID64 или vanity URL в профиле');
        try {
            let steamId64 = steamIdInput.trim();
            // If input is not numeric, try to resolve vanity URL via proxy
            if (!/^\d+$/.test(steamId64)) {
                const rv = await fetch(`${proxy}/resolveVanity?vanity=${encodeURIComponent(steamId64)}`).then(r => r.json());
                if (rv.response && rv.response.success === 1) steamId64 = rv.response.steamid;
                else return alert('Не удалось преобразовать vanity URL в SteamID64. Введите числовой SteamID64 или убедитесь, что vanity корректен.');
            }

            // Get player summary via proxy
            const ps = await fetch(`${proxy}/getPlayerSummaries?steamids=${steamId64}`).then(r => r.json());
            const player = ps.response.players && ps.response.players[0];

            // Get owned games via proxy
            const og = await fetch(`${proxy}/getOwnedGames?steamid=${steamId64}`).then(r => r.json());
            const gamesArr = (og.response && og.response.games) || [];

            if (!gamesArr.length) {
                const steamInfoBasic = { steamId: steamId64, persona: player?.personaname || null, avatar: player?.avatarfull || player?.avatar || null, games: {}, hasPrime: false, fetchedAt: Date.now(), cs_hours: 0 };
                await updateDoc(doc(db, 'users', user.uid), { steam: steamInfoBasic });
                setSteamData(steamInfoBasic);
                return alert('Профиль Steam приватный или нет доступных данных о играх. Сделайте профиль открытым и попробуйте снова.');
            }

            const games = {};
            gamesArr.forEach(g => { games[g.appid] = { appid: g.appid, name: g.name, playtime: g.playtime_forever || 0, playtime_hours: Math.round((g.playtime_forever||0)/60) }; });

            let prime = false;
            for (const k of Object.keys(games)) {
                const n = (games[k].name||'').toLowerCase();
                if (n.includes('prime')) { prime = true; break; }
            }

            const steamInfo = {
                steamId: steamId64,
                persona: player?.personaname || null,
                avatar: player?.avatarfull || player?.avatar || null,
                games,
                hasPrime: prime,
                fetchedAt: Date.now()
            };

            const cs = games[730];
            steamInfo.cs_hours = cs ? (cs.playtime_hours || Math.round((cs.playtime||0)/60)) : 0;

            await updateDoc(doc(db, 'users', user.uid), { steam: steamInfo });
            setSteamData(steamInfo);
            if (steamInfo.cs_hours) setCsHours(steamInfo.cs_hours);
            setHasPrime(!!steamInfo.hasPrime);
            alert('Steam аккаунт привязан. Данные загружены.');
        } catch (err) {
            console.error(err);
            alert('Ошибка при обращении к Steam API через прокси');
        }
    };

    // Try to automatically find SteamID64 by display name using Steam community search as a best-effort.
    // Note: Steam may block cross-origin requests; this function will handle failures and show a helpful message.
    const autoFindSteamId = async (name) => {
        if (!name || !name.trim()) return alert('Введите никнейм для поиска');
        const proxy = process.env.REACT_APP_STEAM_PROXY || 'http://localhost:3001';
        try {
            const maybeVanity = name.trim();
            // try vanity via proxy
            if (!/^\d+$/.test(maybeVanity)) {
                const rv = await fetch(`${proxy}/resolveVanity?vanity=${encodeURIComponent(maybeVanity)}`).then(r => r.json());
                if (rv.response && rv.response.success === 1) {
                    const steamid = rv.response.steamid;
                    setSteamID(steamid);
                    return fetchSteamData(steamid);
                }
            }

            // If vanity resolution didn't help, attempt search via Steam proxy (note: steamcommunity scraping via proxy not implemented)
            alert('Автоматический поиск ограничен: попробуйте вставить vanity или SteamID64 вручную. Для полной автоматизации настрою серверный поиск.');
        } catch (err) {
            console.error(err);
            alert('Автоматический поиск через прокси не удался. Вручную вставьте SteamID64 или vanity.');
        }
    };

    // Подгрузка ленты постов (из оригинального кода)
    const loadPosts = () => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        onSnapshot(q, (s) => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        onSnapshot(collection(db, "users"), (s) => {
            const m = {}; s.forEach(d => m[d.id] = d.data()); setUsersMap(m);
        });
    };

    // Подписка на лобби CS2
    useEffect(() => {
        if (selectedGame === "cs2") {
            const q = query(collection(db, "matchmaking_cs2"), orderBy("createdAt", "desc"));
            return onSnapshot(q, s => {
                const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
                setLobby(list);
                setMyQueueId(list.find(p => p.uid === user?.uid)?.id || null);
            });
        }
    }, [selectedGame]);

    // Обработка загрузки аватарки (Файлом)
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fRef = storageRef(storage, `avatars/${user.uid}`);
            await uploadBytes(fRef, file);
            const url = await getDownloadURL(fRef);
            await updateDoc(doc(db, "users", user.uid), { avatar: url });
            setAvatar(url);
        } catch (err) { alert("Ошибка загрузки"); }
        setUploading(false);
    };

    // Функции подбора
    const enterQueue = async () => {
        if (!nick) return alert("Сначала укажите ник в профиле!");
        // Enforce Steam linking and anti-smurf check: require minimum hours in the selected game
        const minHours = 15; // минимальное количество часов в игре для использования подборa
        if (!steamData) {
            return alert('Требуется привязать Steam аккаунт для проверки часов (чтобы избежать смурфинга)');
        }
        const hours = steamData.cs_hours || 0;
        if (hours < minHours) {
            return alert(`Недостаточно часов в CS: требуется минимум ${minHours} часов в игре для использования подбора.`);
        }
        await addDoc(collection(db, "matchmaking_cs2"), {
            uid: user.uid, nickname: nick, skill: csSkill, hours: csHours,
            prime: hasPrime, avatar, createdAt: Date.now()
        });
    };

    const exitQueue = async () => {
        if (myQueueId) await deleteDoc(doc(db, "matchmaking_cs2", myQueueId));
    };

    if (step === "loading") return <div style={{ color: 'white', padding: 50 }}>Загрузка...</div>;

    if (step === "auth") return (
        <div className="main-view" style={{ justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
                <h1>Mideal Play</h1>
                <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                <button className="btn" style={{ width: '100%' }} onClick={() => signInWithEmailAndPassword(auth, email, password)}>Войти</button>
                <button className="btn btn-gray" style={{ width: '100%', marginTop: 10 }} onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}>Google</button>
            </div>
        </div>
    );

    return (
        <div className="app-grid">
            {/* ЛЕВАЯ ПАНЕЛЬ */}
            <div className="sidebar">
                <h2 style={{ color: 'var(--accent)' }}>MIDEAL</h2>
                <div className={`menu-btn ${activeTab === 'games' ? 'active' : ''}`} onClick={() => setActiveTab('games')}>🎮 {t.games}</div>
                <div className={`menu-btn ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>📰 {t.feed}</div>
                <div className={`menu-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>👥 {t.friends}</div>
                <div className={`menu-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>👥 {t.friends}</div>
                <div className={`menu-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 {t.profile}</div>
                <div className={`menu-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ {t.settings}</div>

                <div style={{ marginTop: 'auto' }}>
                    <select value={userStatus} onChange={(e) => { setUserStatus(e.target.value); updateDoc(doc(db, "users", user.uid), { status: e.target.value }) }}>
                        <option value="ready">🟢 {t.statusReady}</option>
                        <option value="dnd">🔴 Не беспокоить</option>
                    </select>
                    <div className="menu-btn" onClick={() => signOut(auth)}>🚪 {t.logout}</div>
                </div>
            </div>

            {/* ЦЕНТРАЛЬНЫЙ БЛОК */}
            <div className="main-view">
                {activeTab === "games" && !selectedGame && (
                    <div className="game-grid">
                        <div className="game-card" onClick={() => setSelectedGame("cs2")}>
                            <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/CS2_Cover_Art.jpg" style={{ width: '100%', borderRadius: 15 }} />
                            <h3>Counter-Strike 2</h3>
                        </div>
                        <div className="game-card">
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR07fJ06_Y_4KxW9B97f0i6B7jR6_lU8_vXrg&s" style={{ width: '100%', borderRadius: 15 }} />
                            <h3>Dota 2</h3>
                        </div>
                    </div>
                )}

                {activeTab === "friends" && (
                    <div style={{ width: '100%', maxWidth: 700 }} className="fade-in">
                        <div className="card">
                            <h2>{t.friends}</h2>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <input placeholder="Поиск по никнейму" value={friendQuery} onChange={e => setFriendQuery(e.target.value)} />
                                <button className="btn" onClick={() => loadFriends()}>Обновить</button>
                            </div>
                        </div>
                        <div className="card">
                            {friends.filter(f => f.nickname && f.nickname.toLowerCase().includes(friendQuery.toLowerCase())).map(f => (
                                <div key={f.uid || f.id} className="list-item" style={{ border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <img src={f.avatar || 'https://via.placeholder.com/48'} style={{ width: 48, height: 48, borderRadius: 12 }} />
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{f.nickname || 'User'}</div>
                                            <div className="small-muted">{f.gamingID ? `Steam: ${f.gamingID}` : ''}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-gray" onClick={async () => { alert('Запрос в друзья отправлен (заглушка)'); }}>Добавить</button>
                                        <button className="btn" onClick={() => { setActiveTab('profile'); setNick(f.nickname || ''); }}>Открыть профиль</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "games" && selectedGame === "cs2" && (
                    <div style={{ width: '100%', maxWidth: 700 }}>
                        <button className="btn btn-gray" onClick={() => setSelectedGame(null)}>← {t.back}</button>
                        <div className="card" style={{ marginTop: 20 }}>
                            <h2>{t.matchCS2}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <select value={csSkill} onChange={e => setCsSkill(e.target.value)}>
                                    {t.ranks.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <input type="number" placeholder={t.hours} value={csHours} onChange={e => setCsHours(e.target.value)} />
                            </div>
                            <div style={{ margin: '15px 0' }}>
                                <input type="checkbox" checked={hasPrime} onChange={e => setHasPrime(e.target.checked)} /> {t.hasPrime}
                            </div>
                            {!myQueueId ? (
                                <button className="btn" style={{ width: '100%' }} onClick={enterQueue}>{t.joinQueue}</button>
                            ) : (
                                <button className="btn btn-danger" style={{ width: '100%' }} onClick={exitQueue}>{t.leaveQueue}</button>
                            )}
                        </div>
                        <div className="card">
                            <h3>Активные лобби</h3>
                            {lobby.map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <img src={p.avatar || "https://via.placeholder.com/40"} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                        <div><b>{p.nickname}</b><br /><small>{p.skill} • {p.hours}ч</small></div>
                                    </div>
                                    <button className="btn btn-gray" style={{ fontSize: 11 }}>{p.prime ? "⭐ Prime" : "No Prime"}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "feed" && (
                    <div style={{ width: '100%', maxWidth: 600 }}>
                        <div className="card">
                            <input placeholder="Что нового?" onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    await addDoc(collection(db, "posts"), { text: e.target.value, uid: user.uid, createdAt: Date.now(), likes: [] });
                                    e.target.value = "";
                                }
                            }} />
                        </div>
                        {posts.map(p => (
                            <div key={p.id} className="post-card">
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <img src={usersMap[p.uid]?.avatar || ""} className="avatar-img" />
                                    <div><b>{usersMap[p.uid]?.nickname || "User"}</b><br /><small>{new Date(p.createdAt).toLocaleString()}</small></div>
                                </div>
                                <p>{p.text}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "profile" && (
                    <div className="card" style={{ maxWidth: 600, textAlign: 'center' }}>
                        <h1>{t.profile}</h1>
                        <img src={avatar || "https://via.placeholder.com/100"} style={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid var(--accent)' }} />
                        <input type="file" id="fAva" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                        <div style={{ marginTop: 15 }}>
                            <button className="btn btn-gray" onClick={() => document.getElementById('fAva').click()}>{uploading ? "..." : t.uploadPhoto}</button>
                        </div>
                        <div style={{ textAlign: 'left', marginTop: 25 }}>
                            <label>{t.nickname}</label><input value={nick} onChange={e => setNick(e.target.value)} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t.steamId}
                                <button className="btn btn-gray" style={{ padding: '6px 8px', fontSize: 12 }} onClick={() => setShowSteamGuide(s => !s)}>Как привязать Steam</button>
                            </label>
                            <input value={steamID} onChange={e => setSteamID(e.target.value)} placeholder="Пример: 76561198... или vanity (напр. username)" />
                            <label>{t.age}</label><input type="number" value={age} onChange={e => setAge(e.target.value)} />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn" style={{ flex: 1 }} onClick={async () => {
                                    await updateDoc(doc(db, "users", user.uid), { nickname: nick, gamingID: steamID, age: age });
                                    alert("Данные сохранены!");
                                }}>{t.save}</button>
                                <button className="btn btn-gray" style={{ width: 180 }} onClick={() => {
                                    // If Steam button not working for user, show a short guide
                                    if (!process.env.REACT_APP_STEAM_API_KEY) {
                                        setShowSteamGuide(true);
                                    } else {
                                        fetchSteamData(steamID);
                                    }
                                }}>{t.save === 'Сохранить' ? 'Привязать Steam' : 'Привязать Steam'}</button>
                            </div>
                            {showSteamGuide && (
                                <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8 }}>
                                    <h4 style={{ margin: '6px 0' }}>Как привязать Steam</h4>
                                    <ol style={{ paddingLeft: 18, marginTop: 6 }}>
                                        <li>Откройте свой профиль в Steam и скопируйте SteamID64 (числовой) или vanity (адрес после /id/).</li>
                                        <li>Если у вас vanity (напр. "username"), можно использовать кнопку «Привязать Steam» — сайт попытается преобразовать vanity в SteamID64 автоматически.</li>
                                        <li>Вставьте полученный SteamID64 или vanity в поле "Steam ID64" и нажмите «Привязать Steam».</li>
                                        <li>Если данные о играх не подтянулись — убедитесь, что профиль публичный: Профиль → Редактировать профиль → Сделать профиль публичным.</li>
                                        <li>После успешной привязки сайт загрузит часы в играх; для входа в подбор требуется минимум 15 часов в соответствующей игре.</li>
                                    </ol>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                        <button className="btn" onClick={() => { if (!process.env.REACT_APP_STEAM_API_KEY) { alert('Для прямой привязки Steam API ключ не настроен. См. документацию или используйте vanity/SteamID64 и попробуйте снова.'); } else fetchSteamData(steamID); }}>Привязать Steam</button>
                                        <button className="btn" style={{ background: '#6b6bff' }} onClick={() => autoFindSteamId(nick)}>Найти по нику</button>
                                        <button className="btn btn-gray" onClick={() => setShowSteamGuide(false)}>Закрыть</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="card" style={{ maxWidth: 600 }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <button className="btn" onClick={() => setSettingsSubTab("general")}>Общие</button>
                            <button className="btn btn-gray" onClick={() => setSettingsSubTab("privacy")}>Приватность</button>
                        </div>
                        {settingsSubTab === "general" ? (
                            <select value={lang} onChange={(e) => setLang(e.target.value)}>
                                <option value="ru">Русский</option>
                                <option value="ua">Українська</option>
                            </select>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Скрыть возраст</span>
                                <input type="checkbox" checked={privacyAge} onChange={e => { setPrivacyAge(e.target.checked); updateDoc(doc(db, "users", user.uid), { hideAge: e.target.checked }) }} style={{ width: 20 }} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ (Краткий инфо-блок) */}
            <div className="sidebar" style={{ borderLeft: '1px solid var(--border)', borderRight: 'none' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <img src={avatar} style={{ width: 100, height: 100, borderRadius: 25 }} />
                    <h3 style={{ margin: '10px 0' }}>{nick || "Gamer"}</h3>
                    <div style={{ fontSize: 12, color: 'var(--accent)' }}>{userStatus === 'ready' ? '● В сети' : '○ Не в сети'}</div>
                </div>
                <div className="card" style={{ fontSize: 13, opacity: 0.8, padding: 15 }}>
                    {age && !privacyAge && <p>🎂 Возраст: {age}</p>}
                    {steamID && <p>🎮 Steam ID: {steamID}</p>}
                </div>
                <div style={{ padding: 15 }}>
                    <h4>Друзья онлайн</h4>
                    <p style={{ fontSize: 12, opacity: 0.5 }}>У вас пока нет друзей в списке.</p>
                </div>
            </div>
        </div>
    );
}