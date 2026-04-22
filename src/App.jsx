import { useEffect, useState } from "react";
import { db } from "./firebase";

import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
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
} from "firebase/auth";

export default function App() {
    const auth = getAuth();

    const [user, setUser] = useState(null);
    const [mode, setMode] = useState("login");
    const [tab, setTab] = useState("feed");

    const [users, setUsers] = useState({});
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});

    const [postText, setPostText] = useState("");
    const [postImage, setPostImage] = useState("");

    const [commentInput, setCommentInput] = useState({});

    const [profile, setProfile] = useState({
        username: "",
        bio: "",
        avatar: "",
    });

    const [viewProfile, setViewProfile] = useState(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [theme, setTheme] = useState("light");
    const [lang, setLang] = useState("ru");

    const APP_VERSION = "beta v0.9";

    const postsRef = collection(db, "posts");
    const commentsRef = collection(db, "comments");
    const usersRef = collection(db, "users");

    const isGuest = user?.isAnonymous;

    const avatarFallback =
        "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

    /* ---------------- AUTH ---------------- */

    useEffect(() => {
        onAuthStateChanged(auth, (u) => {
            setUser(u);
            setMode(u ? "app" : "login");
            if (u) loadProfile(u.uid);
        });
    }, []);

    /* ---------------- LOAD ---------------- */

    const loadUsers = async () => {
        const snap = await getDocs(usersRef);
        const map = {};
        snap.forEach((d) => (map[d.id] = d.data()));
        setUsers(map);
    };

    const loadPosts = async () => {
        const snap = await getDocs(query(postsRef, orderBy("createdAt", "desc")));
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    const loadComments = async () => {
        const snap = await getDocs(commentsRef);

        const grouped = {};
        snap.forEach((d) => {
            const c = { id: d.id, ...d.data() };
            if (!grouped[c.postId]) grouped[c.postId] = [];
            grouped[c.postId].push(c);
        });

        setComments(grouped);
    };

    useEffect(() => {
        loadUsers();
        loadPosts();
        loadComments();
    }, []);

    const loadProfile = async (uid) => {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) setProfile(snap.data());
    };

    /* ---------------- BASE64 ---------------- */

    const toBase64 = (file) =>
        new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.readAsDataURL(file);
        });

    /* ---------------- PROFILE SAVE ---------------- */

    const saveProfile = async () => {
        if (isGuest) return;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            username: profile.username,
            bio: profile.bio,
            avatar: profile.avatar,
        });

        loadUsers();
    };

    /* ---------------- POSTS ---------------- */

    const createPost = async () => {
        if (!postText.trim()) return;

        await addDoc(postsRef, {
            text: postText,
            image: postImage || null,
            uid: user.uid,
            likes: [],
            dislikes: [],
            editedOnce: false,
            createdAt: Date.now(),
        });

        setPostText("");
        setPostImage("");
        loadPosts();
    };

    const toggleLike = async (post) => {
        const uid = user.uid;

        let likes = post.likes || [];
        let dislikes = post.dislikes || [];

        if (likes.includes(uid)) {
            likes = likes.filter((id) => id !== uid);
        } else {
            likes.push(uid);
            dislikes = dislikes.filter((id) => id !== uid);
        }

        await updateDoc(doc(db, "posts", post.id), { likes, dislikes });
        loadPosts();
    };

    const toggleDislike = async (post) => {
        const uid = user.uid;

        let likes = post.likes || [];
        let dislikes = post.dislikes || [];

        if (dislikes.includes(uid)) {
            dislikes = dislikes.filter((id) => id !== uid);
        } else {
            dislikes.push(uid);
            likes = likes.filter((id) => id !== uid);
        }

        await updateDoc(doc(db, "posts", post.id), { likes, dislikes });
        loadPosts();
    };

    const editPost = async (post) => {
        if (post.uid !== user.uid) return;
        if (post.editedOnce) return alert("only once");

        const text = prompt("edit post", post.text);
        if (!text) return;

        await updateDoc(doc(db, "posts", post.id), {
            text,
            editedOnce: true,
        });

        loadPosts();
    };

    const deletePost = async (post) => {
        if (post.uid !== user.uid) return;
        await deleteDoc(doc(db, "posts", post.id));
        loadPosts();
    };

    /* ---------------- COMMENTS ---------------- */

    const addComment = async (postId) => {
        const text = commentInput[postId];
        if (!text) return;

        await addDoc(commentsRef, {
            postId,
            text,
            uid: user.uid,
            createdAt: Date.now(),
        });

        setCommentInput({ ...commentInput, [postId]: "" });
        loadComments();
    };

    const editComment = async (c) => {
        const text = prompt("edit comment", c.text);
        if (!text) return;

        await updateDoc(doc(db, "comments", c.id), { text });
        loadComments();
    };

    const deleteComment = async (id) => {
        await deleteDoc(doc(db, "comments", id));
        loadComments();
    };

    /* ---------------- PROFILE VIEW ---------------- */

    const openProfile = (uid) => {
        setViewProfile(users[uid]);
        setTab("profileView");
    };

    /* ---------------- LOGOUT ---------------- */

    const logout = async () => {
        if (!confirm("logout?")) return;
        await signOut(auth);
    };

    /* ---------------- UI ---------------- */

    const themeStyle =
        theme === "dark"
            ? { bg: "#0d1117", text: "#e6edf3", card: "#161b22" }
            : { bg: "#f5f6fa", text: "#111", card: "#fff" };

    const page = {
        minHeight: "100vh",
        background: themeStyle.bg,
        color: themeStyle.text,
        padding: 16,
        fontFamily: "sans-serif",
    };

    const card = {
        background: themeStyle.card,
        padding: 12,
        borderRadius: 14,
        marginBottom: 10,
        maxWidth: 700,
        margin: "0 auto",
    };

    const btn = {
        marginRight: 6,
        padding: "6px 10px",
        borderRadius: 10,
        cursor: "pointer",
    };

    /* ---------------- LOGIN ---------------- */

    if (mode === "login") {
        return (
            <div style={page}>
                <div style={card}>
                    <h2>
                        Mideal <span style={{ fontSize: 12 }}>{APP_VERSION}</span>
                    </h2>

                    <input placeholder="email" onChange={(e) => setEmail(e.target.value)} />
                    <input placeholder="password" type="password" onChange={(e) => setPassword(e.target.value)} />

                    <button onClick={() => signInWithEmailAndPassword(auth, email, password)}>login</button>
                    <button onClick={() => createUserWithEmailAndPassword(auth, email, password)}>register</button>
                    <button onClick={() => signInAnonymously(auth)}>guest</button>
                </div>
            </div>
        );
    }

    /* ---------------- PROFILE VIEW ---------------- */

    if (tab === "profileView") {
        return (
            <div style={page}>
                <div style={card}>
                    <button onClick={() => setTab("feed")}>back</button>

                    <img src={viewProfile?.avatar || avatarFallback} width={80} />

                    <h2>{viewProfile?.username}</h2>
                    <p>{viewProfile?.bio}</p>
                </div>
            </div>
        );
    }

    /* ---------------- PROFILE ---------------- */

    if (tab === "profile") {
        return (
            <div style={page}>
                <div style={card}>
                    <h2>profile</h2>

                    <input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                    <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />

                    <input type="file" onChange={async (e) => setProfile({ ...profile, avatar: await toBase64(e.target.files[0]) })} />

                    <button onClick={saveProfile}>save</button>
                </div>

                <button onClick={logout}>logout</button>
            </div>
        );
    }

    /* ---------------- FEED ---------------- */

    return (
        <div style={page}>
            <div style={card}>
                <h2>
                    Mideal <span style={{ fontSize: 12 }}>{APP_VERSION}</span>
                </h2>

                <button onClick={() => setTab("profile")}>profile</button>
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>theme</button>
                <button onClick={logout}>logout</button>
            </div>

            <div style={card}>
                <input value={postText} onChange={(e) => setPostText(e.target.value)} />
                <input type="file" onChange={async (e) => setPostImage(await toBase64(e.target.files[0]))} />
                <button onClick={createPost}>post</button>
            </div>

            {posts.map((post) => {
                const u = users[post.uid] || {};

                return (
                    <div key={post.id} style={card}>
                        <div onClick={() => openProfile(post.uid)} style={{ cursor: "pointer" }}>
                            <img src={u.avatar || avatarFallback} width={30} />
                            <b>{u.username || "anon"}</b>
                        </div>

                        <p>{post.text}</p>

                        {post.image && <img src={post.image} width="100%" />}

                        <button onClick={() => toggleLike(post)}>👍 {post.likes?.length || 0}</button>
                        <button onClick={() => toggleDislike(post)}>👎 {post.dislikes?.length || 0}</button>

                        {post.uid === user.uid && (
                            <>
                                <button onClick={() => editPost(post)}>edit</button>
                                <button onClick={() => deletePost(post)}>delete</button>
                            </>
                        )}

                        <input
                            value={commentInput[post.id] || ""}
                            onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                        />

                        <button onClick={() => addComment(post.id)}>comment</button>

                        {(comments[post.id] || []).map((c) => {
                            const cu = users[c.uid] || {};

                            return (
                                <div key={c.id} onClick={() => openProfile(c.uid)}>
                                    <img src={cu.avatar || avatarFallback} width={20} />
                                    <b>{cu.username}</b> {c.text}

                                    {c.uid === user.uid && (
                                        <>
                                            <button onClick={() => editComment(c)}>edit</button>
                                            <button onClick={() => deleteComment(c.id)}>del</button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}