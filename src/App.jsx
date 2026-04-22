import { useEffect, useState, useRef } from "react";
import { db } from "./firebase";

import {
    collection,
    addDoc,
    // getDocs,
    getDocs,
    query,
    orderBy,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
} from "firebase/firestore";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    deleteUser,
} from "firebase/auth";

import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";

export default function App() {
    const auth = getAuth();

    // inject minimal styles (avoids adding separate CSS file)
    useEffect(() => {
        const id = 'mideal-styles';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.innerHTML = `
        :root{--bg:#0b0f15;--accent:#4f9aff;--muted:#9aa6b2;--glass:rgba(255,255,255,0.03);}
        *{box-sizing:border-box}
        body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial;background:var(--bg);color:#e6eef8;-webkit-font-smoothing:antialiased}
        .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding:12px 16px;gap:12px}
        .brand{font-weight:800;letter-spacing:1px;font-size:20px}
        .auth-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
        .auth-card{width:100%;max-width:1100px;border-radius:16px;display:grid;grid-template-columns:1fr 1fr;overflow:hidden}
        .auth-left{background:linear-gradient(135deg,#ff7a7a,#7a8bff);padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#111}
        .auth-left .logo-anim{font-size:44px}
        .auth-left p{max-width:220px;text-align:center}
        .auth-left p{opacity:0.9}
        .auth-right{padding:28px;background:linear-gradient(180deg,rgba(255,255,255,0.02),transparent)}
        .auth-form{max-width:360px;margin:0 auto}
        .auth-form input{width:100%;padding:12px;margin:10px 0;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit}
        .auth-actions{display:flex;gap:8px;flex-wrap:wrap}
        .primary{background:var(--accent);color:#fff;padding:10px 14px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 6px 18px rgba(79,154,255,0.12)}
        .ghost{background:transparent;border:1px solid rgba(255,255,255,0.06);padding:8px 10px;border-radius:12px;color:var(--muted);cursor:pointer}
        .loading-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(2,6,23,0.6),rgba(2,6,23,0.85));z-index:60}
        .logo-anim{font-size:42px;font-weight:800;letter-spacing:6px;color:transparent;background:linear-gradient(90deg,#fff,#4f9aff,#fff);-webkit-background-clip:text;background-clip:text;animation:logoPulse 1.8s infinite}
        @keyframes logoPulse{0%{filter:blur(0px);transform:translateY(0)}50%{filter:blur(2px);transform:translateY(-6px)}100%{filter:blur(0px);transform:translateY(0)}}
        .card-glass{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));backdrop-filter: blur(8px);padding:14px;border-radius:14px}
        .overlay{position:fixed;inset:0;background:rgba(2,6,23,0.7);display:flex;align-items:center;justify-content:center;z-index:40}
        .modal{background:#071016;padding:18px;border-radius:12px;width:92%;max-width:760px;animation:pop .18s ease}
        @keyframes pop{from{opacity:0;transform:scale(.98) translateY(6px)}to{opacity:1;transform:none}}
        .settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .toggle{display:flex;align-items:center;gap:8px;padding:10px;border-radius:10px;background:var(--glass)}
        .avatar-large{width:96px;height:96px;border-radius:12px;overflow:hidden;background:#091018;display:flex;align-items:center;justify-content:center}
        .avatar-small,.avatar{width:40px;height:40px;border-radius:10px;overflow:hidden;background:#091018;display:flex;align-items:center;justify-content:center}
        .initial{font-weight:700;color:var(--muted)}
        .newpost{display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;padding:12px;border-radius:12px}
        .newpost textarea{width:100%;min-height:64px;padding:10px;border-radius:10px;border:none;background:rgba(255,255,255,0.02);color:inherit}
        .posts{display:flex;flex-direction:column;gap:12px}
        .post{display:flex;gap:12px;padding:14px;border-radius:14px;transition:transform .28s cubic-bezier(.2,.8,.2,1), box-shadow .28s}
        .post:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(0,0,0,0.55)}
        .post-left{width:64px}
        .post-body{flex:1}
        .post-header{display:flex;justify-content:space-between;align-items:center}
        .post-text{margin:8px 0}
        .actions button,.comment-actions button,.post-controls button{background:transparent;border:none;color:var(--muted);margin-right:6px;cursor:pointer}
        .linkish{background:none;border:none;color:var(--accent);cursor:pointer}
        .comment{display:flex;gap:8px;padding:10px 0;border-top:1px solid rgba(255,255,255,0.02)}
        .comment .comment-left{width:40px}
        .comment-body{flex:1}
        .comment-replies{margin-left:40px}
        .comment-box input{width:100%;padding:8px;border-radius:8px;border:none;background:rgba(255,255,255,0.02);color:inherit}
        .muted.small{font-size:12px;color:var(--muted)}
        .version-note{font-size:12px;color:var(--muted);text-align:center;margin-top:18px}
        .fade-in{animation:fadeIn .25s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media(max-width:1000px){
          .auth-card{grid-template-columns:1fr;}
          .auth-left{padding:22px}
          .topbar{padding:10px}
          .post{flex-direction:column;gap:10px}
          .post-left{width:48px}
        }
        @media(max-width:480px){
          .auth-left{padding:18px}
          .auth-left .logo-anim{font-size:34px}
          .post{padding:10px}
          .post-left{width:44px}
          .newpost textarea{min-height:56px}
        }
        `;
        document.head.appendChild(style);
    }, []);

    const [user, setUser] = useState(null);
    const [mode, setMode] = useState("login");

    const [posts, setPosts] = useState([]);
    const [commentsMap, setCommentsMap] = useState({}); // postId -> [comments]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usersMap, setUsersMap] = useState({});

    const [profileUser, setProfileUser] = useState(null); // viewing other user's profile
    const [editingPostId, setEditingPostId] = useState(null);
    const [editText, setEditText] = useState("");
    const [commentInputs, setCommentInputs] = useState({});
    const [viewTab, setViewTab] = useState('feed'); // 'feed' | 'settings' | 'profile'
    const [miniProfile, setMiniProfile] = useState(null); // small popup for avatar click
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [postText, setPostText] = useState("");

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [lang, setLang] = useState("ru");

    // profile editor
    const [profileOpen, setProfileOpen] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [usernameInput, setUsernameInput] = useState("");
    const [descriptionInput, setDescriptionInput] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const storage = getStorage();

    const postsRef = collection(db, "posts");
    const usersRef = collection(db, "users");

    // AUTH
    useEffect(() => {
        onAuthStateChanged(auth, async (u) => {
            try {
                setUser(u);
                setMode(u ? "app" : "login");

                if (u) {
                    // ensure user profile exists in firestore
                    const userDocRef = doc(db, "users", u.uid);
                    const snap = await getDoc(userDocRef);
                    const name = u.displayName || (u.email ? u.email.split("@")[0] : "Guest");
                    const photoURL = u.photoURL || null;

                    if (!snap.exists()) {
                        await setDoc(userDocRef, {
                            uid: u.uid,
                            email: u.email || null,
                            name,
                            photoURL,
                            createdAt: Date.now(),
                        });
                        setUsersMap((m) => ({ ...m, [u.uid]: { uid: u.uid, name, photoURL } }));
                    } else {
                        const data = snap.data();
                        setUsersMap((m) => ({ ...m, [u.uid]: { uid: u.uid, name: data.name || name, photoURL: data.photoURL || photoURL } }));
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
    }, []);

    // LOAD POSTS (real-time)
    useEffect(() => {
        setLoading(true);
        setError(null);

        const q = query(postsRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(
            q,
            async (snap) => {
                try {
                    const postsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setPosts(postsData);

                    // ensure we have user info for authors
                    const missingUids = Array.from(new Set(postsData.map((p) => p.uid))).filter((uid) => uid && !usersMap[uid]);
                    if (missingUids.length) {
                        for (const uid of missingUids) {
                            try {
                                const uSnap = await getDoc(doc(db, "users", uid));
                                if (uSnap.exists()) {
                                    const data = uSnap.data();
                                    setUsersMap((m) => ({ ...m, [uid]: { uid, name: data.name || null, photoURL: data.photoURL || null } }));
                                }
                            } catch (e) {
                                console.error("failed to load user", uid, e);
                            }
                        }
                    }

                    // load comments for posts (light, one-time)
                    const cm = {};
                    for (const p of postsData) {
                        try {
                            const cSnap = await getDocs(collection(db, "posts", p.id, "comments"));
                            cm[p.id] = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                        } catch (e) {
                            cm[p.id] = [];
                        }
                    }
                    setCommentsMap(cm);

                    setLoading(false);
                } catch (e) {
                    console.error(e);
                    setError("Failed to load posts");
                    setLoading(false);
                }
            },
            (err) => {
                console.error(err);
                setError("Failed to subscribe to posts");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // AUTH ACTIONS
    const login = async () => {
        const e = (email || '').trim();
        const p = password || '';
        if (!e || !p) return alert('Please enter email and password');
        try {
            await signInWithEmailAndPassword(auth, e, p);
        } catch (e) {
            console.error('login error', e);
            if (e.code === 'auth/invalid-credential') alert('Invalid credentials provided. Check your input or try Google login.');
            else alert(e.message || 'Login failed');
        }
    };

    const register = async () => {
        const e = (email || '').trim();
        const p = password || '';
        if (!e || !p) return alert('Please enter email and password');
        if (p.length < 6) return alert('Password must be at least 6 characters');
        try {
            const res = await createUserWithEmailAndPassword(auth, e, p);
            // create user doc handled in onAuthStateChanged
            return res;
        } catch (e) {
            console.error('register error', e);
            // Provide actionable guidance for common misconfiguration errors
            const code = e.code || 'unknown';
            if (code === 'auth/invalid-credential') {
                alert(`Registration failed (${code}): Invalid credential.\nPossible causes: Email/Password provider is disabled in Firebase Console, or OAuth provider misconfiguration.\nCheck Firebase Authentication providers and authorized domains.`);
            } else if (code === 'auth/network-request-failed') {
                alert('Network error. Check your connection and try again.');
            } else {
                alert(`${code}: ${e.message || 'Registration failed'}`);
            }
        }
    };

    const guest = async () => {
        try {
            await signInAnonymously(auth);
        } catch (e) {
            console.error('guest login error', e);
            alert(e.message || 'Guest login failed');
        }
    };

    const googleLogin = async () => {
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
            console.error('google login error', e);
            const code = e.code || 'unknown';
            if (code === 'auth/invalid-credential') {
                alert(`Google login failed (${code}). Possible causes: OAuth client misconfiguration or unauthorized domain.\nOpen Firebase Console -> Authentication -> Sign-in method and ensure Google is enabled and your domain is authorized.`);
            } else {
                alert(`${code}: ${e.message || 'Google login failed'}`);
            }
        }
    };

    const logout = async () => {
        if (!confirm("Are you sure you want to logout?")) return;
        try {
            await signOut(auth);
        } catch (e) {
            alert(e.message);
        }
    };

    const openProfile = () => {
        if (!user) return alert("Not logged in");
        const u = usersMap[user.uid] || {};
        setNameInput(u.name || user.displayName || "");
        setUsernameInput(u.username || "");
        setDescriptionInput(u.description || "");
        setAvatarPreview(u.photoURL || user.photoURL || null);
        setAvatarFile(null);
        setProfileUser({ uid: user.uid, name: u.name || user.displayName || null, username: u.username || null, description: u.description || null, photoURL: u.photoURL || user.photoURL || null });
        setProfileOpen(true);
    };

    const saveProfile = async () => {
        if (!user) return alert("Not logged in");
        setUploading(true);
        try {
            let photoURL = avatarPreview;

            if (avatarFile) {
                const path = `avatars/${user.uid}/${Date.now()}_${avatarFile.name}`;
                const sRef = storageRef(storage, path);
                await uploadBytes(sRef, avatarFile);
                photoURL = await getDownloadURL(sRef);
            }

            // update firestore user doc
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                name: nameInput || null,
                username: usernameInput || null,
                description: descriptionInput || null,
                photoURL: photoURL || null,
            });

            // update auth profile
            try {
                await updateProfile(auth.currentUser, { displayName: nameInput || null, photoURL: photoURL || null });
            } catch (e) {
                console.warn("Failed to update auth profile", e);
            }

            setUsersMap((m) => ({ ...m, [user.uid]: { uid: user.uid, name: nameInput || null, photoURL: photoURL || null, username: usernameInput || null, description: descriptionInput || null } }));
            setProfileOpen(false);
        } catch (e) {
            console.error(e);
            alert("Failed to save profile");
        }
        setUploading(false);
    };

    const handleAvatarChange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        setAvatarFile(f);
        setAvatarPreview(URL.createObjectURL(f));
    };

    const deleteAccount = async () => {
        if (!user) return alert("Not logged in");
        if (!confirm("Delete your account? This action cannot be undone.")) return;
        try {
            // remove user doc
            await deleteDoc(doc(db, "users", user.uid));

            // attempt to delete auth user
            try {
                await deleteUser(auth.currentUser);
            } catch (e) {
                console.error("Failed to delete auth user", e);
                alert("Failed to delete auth user. You may need to re-login and try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete account");
        }
    };

    // POSTS
    const createPost = async () => {
        if (!user) return alert("You must be logged in to post");
        if (!postText.trim()) return;

        try {
            const authorName = usersMap[user.uid]?.name || user.displayName || (user.email ? user.email.split("@")[0] : "Guest");
            const authorPhoto = usersMap[user.uid]?.photoURL || user.photoURL || null;

            await addDoc(postsRef, {
                text: postText,
                uid: user.uid,
                authorName,
                authorPhoto,
                likes: [],
                dislikes: [],
                createdAt: Date.now(),
            });

            setPostText("");
        } catch (e) {
            console.error(e);
            alert("Failed to create post");
        }
    };

    // COMMENTS
    const addComment = async (postId, text, parentId = null) => {
        if (!user) return alert("Login to comment");
        if (!text.trim()) return;
        try {
            const u = usersMap[user.uid] || {};
            await addDoc(collection(db, "posts", postId, "comments"), {
                text,
                uid: user.uid,
                authorName: u.name || user.displayName || "User",
                authorPhoto: u.photoURL || user.photoURL || null,
                likes: [],
                dislikes: [],
                parentId: parentId || null,
                createdAt: Date.now(),
            });

            const cSnap = await getDocs(collection(db, "posts", postId, "comments"));
            setCommentsMap((m) => ({ ...m, [postId]: cSnap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
        } catch (e) {
            console.error(e);
            alert("Failed to add comment");
        }
    };

    const toggleLike = async (post) => {
        if (!user) return alert("Login to like");
        const uid = user.uid;
        let likes = post.likes || [];
        let dislikes = post.dislikes || [];

        if (likes.includes(uid)) {
            likes = likes.filter((x) => x !== uid);
        } else {
            likes.push(uid);
            dislikes = dislikes.filter((x) => x !== uid);
        }

        try {
            await updateDoc(doc(db, "posts", post.id), { likes, dislikes });
        } catch (e) {
            console.error(e);
            alert("Failed to update like");
        }
    };

    const toggleDislike = async (post) => {
        if (!user) return alert("Login to dislike");
        const uid = user.uid;
        let likes = post.likes || [];
        let dislikes = post.dislikes || [];

        if (dislikes.includes(uid)) {
            dislikes = dislikes.filter((x) => x !== uid);
        } else {
            dislikes.push(uid);
            likes = likes.filter((x) => x !== uid);
        }

        try {
            await updateDoc(doc(db, "posts", post.id), { likes, dislikes });
        } catch (e) {
            console.error(e);
            alert("Failed to update dislike");
        }
    };

    const deletePost = async (post) => {
        if (!user) return alert("Login to delete");
        if (post.uid !== user.uid) return alert("You can only delete your own posts");

        if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

        try {
            // delete comments subcollection (best-effort)
            try {
                const cSnap = await getDocs(collection(db, "posts", post.id, "comments"));
                for (const cd of cSnap.docs) await deleteDoc(doc(db, "posts", post.id, "comments", cd.id));
            } catch (e) {
                console.warn("failed to delete comments", e);
            }

            await deleteDoc(doc(db, "posts", post.id));
        } catch (e) {
            console.error(e);
            alert("Failed to delete post");
        }
    };

    const container = {
        minHeight: "100vh",
        padding: '20px 12px',
        maxWidth: 1100,
        margin: "0 auto",
        background: theme === "dark" ? "#0f0f0f" : "#f5f5f5",
        color: theme === "dark" ? "#fff" : "#000",
        fontFamily: "sans-serif",
    };

    // LOGIN SCREEN (redesigned)
    if (mode === "login") {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <div className="auth-left">
                        <div className="logo-anim">Mideal</div>
                        <p style={{marginTop:12}}>Share moments. Connect easily.</p>
                    </div>
                    <div className="auth-right">
                        <div className="auth-form card-glass">
                            <h2 style={{marginTop:0}}>Welcome back</h2>
                            <p className="muted small">Log in to continue</p>
                            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

                            <div style={{display:'flex',gap:8,marginTop:8}} className="auth-actions">
                                <button className="primary" onClick={login}>Log in</button>
                                <button className="ghost" onClick={register}>Register</button>
                                <button className="ghost" onClick={guest}>Guest</button>
                            </div>

                            <div style={{marginTop:12}}>
                                <button className="primary" style={{background:'#fff',color:'#111',width:'100%'}} onClick={googleLogin}>Continue with Google</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{...container, position: 'relative'}}>
            {loading && (
                <div className="loading-overlay">
                    <div style={{textAlign:'center'}}>
                        <div className="logo-anim">Mideal</div>
                        <div className="muted small" style={{marginTop:8}}>Loading...</div>
                    </div>
                </div>
            )}
            {/* HEADER */}
            <div className="topbar card-glass" style={{alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div className="brand">Mideal</div>
                    <div className="muted small">v0.1</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems:'center' }}>
                    <button className="ghost" onClick={() => setViewTab('feed')}>Feed</button>
                    <button className="ghost" onClick={() => setViewTab('profile')}>Profile</button>
                    <button className="ghost" onClick={() => setViewTab('settings')}>Settings</button>
                    <button className="ghost" onClick={logout}>Logout</button>
                </div>
            </div>

            {/* SETTINGS / PROFILE as separate tabs */}
            {viewTab === 'settings' && (
                <div className="overlay">
                    <div className="modal">
                        <h3>Settings</h3>
                        <div className="settings-grid">
                            <div className="toggle">
                                <div style={{fontWeight:700}}>Theme</div>
                                <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                                    <button className="ghost" onClick={() => setTheme('dark')}>Dark</button>
                                    <button className="ghost" onClick={() => setTheme('light')}>Light</button>
                                </div>
                            </div>

                            <div className="toggle">
                                <div style={{fontWeight:700}}>Language</div>
                                <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                                    <button className="ghost" onClick={() => setLang('ru')}>RU</button>
                                    <button className="ghost" onClick={() => setLang('en')}>EN</button>
                                </div>
                            </div>

                            <div className="toggle">
                                <div style={{fontWeight:700}}>Account</div>
                                <div style={{marginLeft:'auto'}}>
                                    <button className="ghost" onClick={() => { setViewTab('profile'); setProfileOpen(true); }}>Profile</button>
                                </div>
                            </div>

                            <div className="toggle">
                                <div style={{fontWeight:700}}>Danger</div>
                                <div style={{marginLeft:'auto'}}>
                                    <button className="ghost" style={{color:'#f55'}} onClick={deleteAccount}>Delete Account</button>
                                </div>
                            </div>
                        </div>

                        <div style={{marginTop:12, textAlign:'right'}}>
                            <button onClick={() => setViewTab('feed')} className="ghost">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {profileOpen && profileUser && (
                <div className="overlay">
                    <div className="modal" style={{ maxWidth: 600 }}>
                        <h3>Profile</h3>

                        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                            <div style={{ width: 140 }}>
                                <div style={{ width: 120, height: 120, borderRadius: 12, overflow: "hidden", background: "#eee" }}>
                                    {profileUser.photoURL ? (
                                        <img src={profileUser.photoURL} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>{(profileUser.name||profileUser.username||'U')[0]}</div>
                                    )}
                                </div>
                                {profileUser.uid === user?.uid && (
                                    <div style={{ marginTop: 8 }}>
                                        <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: "block", fontSize: 14, color: "#fff", fontWeight:700 }}>{profileUser.name || 'User'}</div>
                                    <div className="muted small">@{profileUser.username || profileUser.uid}</div>
                                </div>

                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontSize: 13, color: '#ddd' }}>{profileUser.description || 'No description'}</div>
                                </div>

                                {profileUser.uid === user?.uid ? (
                                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                        <button className="primary" onClick={saveProfile} disabled={uploading}>{uploading ? "Saving..." : "Save"}</button>
                                        <button onClick={() => setProfileOpen(false)} className="ghost">Close</button>
                                        <button onClick={deleteAccount} className="ghost" style={{ marginLeft: "auto", color: "#900" }}>Delete account</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                        <button className="primary" onClick={() => alert('Follow not implemented')}>Follow</button>
                                        <button className="ghost" onClick={() => setProfileOpen(false)}>Close</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE POST */}
            <div className="newpost card-glass">
                <div className="newpost-left">
                    <div className="avatar-small">
                        {user && (usersMap[user.uid]?.photoURL || user.photoURL) ? <img src={usersMap[user.uid]?.photoURL || user.photoURL} alt="me" /> : <div className="initial">{(user?.displayName||"G")[0]}</div>}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <textarea placeholder={user && !user.isAnonymous ? "Share something..." : "Guest — view only"} value={postText} onChange={(e) => setPostText(e.target.value)} disabled={!user || user.isAnonymous} />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button className="primary" onClick={createPost} disabled={!user || user.isAnonymous}>Post</button>
                    </div>
                </div>
            </div>

            {loading && <p>Loading posts...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* POSTS */}
            <div className="posts">
                {posts.map((p) => (
                    <div key={p.id} className="post card-glass fade-in">
                        <div className="post-left">
                            <div className="avatar">
                                {p.authorPhoto ? <img src={p.authorPhoto} alt="a" /> : <div className="initial">{(p.authorName||"U")[0]}</div>}
                            </div>
                        </div>
                        <div className="post-body">
                        <div className="post-header">
                                <div>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                            <button className="linkish" onClick={async () => { const uSnap = await getDoc(doc(db, 'users', p.uid)); if (uSnap.exists()) setMiniProfile({ uid: p.uid, ...uSnap.data() }); }}>{p.authorName || usersMap[p.uid]?.name || "User"}</button>
                                            <div className="muted small">{new Date(p.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="post-controls">
                                    <button onClick={() => toggleLike(p)}>👍 {p.likes?.length || 0}</button>
                                    <button onClick={() => toggleDislike(p)}>👎 {p.dislikes?.length || 0}</button>
                                    {p.uid === user?.uid ? <button onClick={() => { setEditingPostId(p.id); setEditText(p.text); }}>edit</button> : null}
                                    {p.uid === user?.uid ? <button onClick={() => deletePost(p)}>delete</button> : null}
                                </div>
                            </div>

                            <div className="post-content">
                                {editingPostId === p.id ? (
                                    <div>
                                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: '100%' }} />
                                        <div style={{ textAlign: 'right', marginTop: 6 }}>
                                            <button className="primary" onClick={async () => { await updateDoc(doc(db, 'posts', p.id), { text: editText }); setEditingPostId(null); }}>Save</button>
                                            <button onClick={() => setEditingPostId(null)}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="post-text">{p.text}</div>
                                )}
                            </div>

                            <div className="comments-section">
                                <div className="comments-list">
                                    {(commentsMap[p.id] || []).filter(c=>!c.parentId).map((c) => (
                                        <div key={c.id} className="comment">
                                            <div className="comment-left">
                                                <div className="avatar-small">
                                                    {c.authorPhoto ? <img src={c.authorPhoto} alt="a" /> : <div className="initial">{(c.authorName||"U")[0]}</div>}
                                                </div>
                                            </div>
                                            <div className="comment-body">
                                                <div className="comment-meta" style={{display:'flex',gap:8,alignItems:'center'}}>
                                                    <button className="linkish" onClick={async ()=>{ const uSnap = await getDoc(doc(db,'users',c.uid)); if(uSnap.exists()) setMiniProfile({uid:c.uid,...uSnap.data()}); }}>{c.authorName}</button>
                                                    <span className="small muted"> · {new Date(c.createdAt).toLocaleString()}</span>
                                                    {c.uid === user?.uid && (
                                                        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                                                            <button className="ghost" onClick={()=>{ setEditingCommentId(c.id); setEditingCommentText(c.text); }}>edit</button>
                                                            <button className="ghost" onClick={async ()=>{ if(!confirm('Delete this comment?')) return; await deleteDoc(doc(db,'posts',p.id,'comments',c.id)); const cSnap = await getDocs(collection(db,'posts',p.id,'comments')); setCommentsMap(m=>({...m,[p.id]:cSnap.docs.map(d=>({id:d.id,...d.data()}))})); }}>delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="comment-text">
                                                    {editingCommentId === c.id ? (
                                                        <div>
                                                            <input value={editingCommentText} onChange={(e)=>setEditingCommentText(e.target.value)} />
                                                            <div style={{textAlign:'right',marginTop:6}}>
                                                                <button className="primary" onClick={async ()=>{ await updateDoc(doc(db,'posts',p.id,'comments',c.id),{text:editingCommentText}); setEditingCommentId(null); const cSnap = await getDocs(collection(db,'posts',p.id,'comments')); setCommentsMap(m=>({...m,[p.id]:cSnap.docs.map(d=>({id:d.id,...d.data()}))})); }}>Save</button>
                                                                <button onClick={()=>setEditingCommentId(null)}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        c.text
                                                    )}
                                                </div>
                                                <div className="comment-actions">
                                                    <button onClick={async ()=>{ const uid = user?.uid; if(!uid) return alert('Login to like'); try{ let likes=c.likes||[]; let dislikes=c.dislikes||[]; if(likes.includes(uid)) likes=likes.filter(x=>x!==uid); else{likes.push(uid);dislikes=dislikes.filter(x=>x!==uid);} await updateDoc(doc(db,'posts',p.id,'comments',c.id),{likes,dislikes}); const cSnap = await getDocs(collection(db,'posts',p.id,'comments')); setCommentsMap(m=>({...m,[p.id]:cSnap.docs.map(d=>({id:d.id,...d.data()}))})); }catch(e){console.error(e);alert('Failed to update like')} }}>👍 {c.likes?.length||0}</button>
                                                    <button onClick={async ()=>{ const uid = user?.uid; if(!uid) return alert('Login to dislike'); try{ let likes=c.likes||[]; let dislikes=c.dislikes||[]; if(dislikes.includes(uid)) dislikes=dislikes.filter(x=>x!==uid); else{dislikes.push(uid);likes=likes.filter(x=>x!==uid);} await updateDoc(doc(db,'posts',p.id,'comments',c.id),{likes,dislikes}); const cSnap = await getDocs(collection(db,'posts',p.id,'comments')); setCommentsMap(m=>({...m,[p.id]:cSnap.docs.map(d=>({id:d.id,...d.data()}))})); }catch(e){console.error(e);alert('Failed to update dislike')} }}>👎 {c.dislikes?.length||0}</button>
                                                    <button onClick={()=>{ setCommentInputs(inputs=>({...inputs,[p.id]:{text:'',parentId:c.id}})); }}>reply</button>
                                                </div>

                                                <div className="comment-replies">
                                                    {(commentsMap[p.id]||[]).filter(r=>r.parentId===c.id).map(r=> (
                                                        <div key={r.id} className="comment reply">
                                                            <div className="comment-left">
                                                                <div className="avatar-small">{r.authorPhoto ? <img src={r.authorPhoto} alt="a" /> : <div className="initial">{(r.authorName||"U")[0]}</div>}</div>
                                                            </div>
                                                            <div className="comment-body">
                                                                <div className="comment-meta"><button className="linkish" onClick={async ()=>{ const uSnap = await getDoc(doc(db,'users',r.uid)); if(uSnap.exists()) setProfileUser({uid:r.uid,...uSnap.data()}); setProfileOpen(true); }}>{r.authorName}</button> <span className="small muted"> · {new Date(r.createdAt).toLocaleString()}</span></div>
                                                                <div>{r.text}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="comment-box">
                                    <input placeholder={user ? 'Write a comment...' : 'Login to comment'} value={(commentInputs[p.id] && commentInputs[p.id].text) || ''} onChange={(e)=>setCommentInputs(inputs=>({...inputs,[p.id]:{...(inputs[p.id]||{}),text:e.target.value}}))} disabled={!user} />
                                    <div style={{textAlign:'right',marginTop:6}}>
                                        <button onClick={async ()=>{ const ci = commentInputs[p.id]||{}; await addDoc(collection(db,'posts',p.id,'comments'),{ text:ci.text||'', uid:user.uid, authorName: usersMap[user.uid]?.name||user.displayName||'User', authorPhoto: usersMap[user.uid]?.photoURL||user.photoURL||null, likes:[], dislikes:[], parentId:ci.parentId||null, createdAt: Date.now() }); const cSnap = await getDocs(collection(db,'posts',p.id,'comments')); setCommentsMap(m=>({...m,[p.id]:cSnap.docs.map(d=>({id:d.id,...d.data()}))})); setCommentInputs(inputs=>({...inputs,[p.id]:{text:'',parentId:null}})); }} disabled={!user}>Comment</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
 