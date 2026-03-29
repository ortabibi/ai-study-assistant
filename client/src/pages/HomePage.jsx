import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getAuthUser, clearAuth } from '../authToken';

export default function HomePage() {
    const navigate = useNavigate();
    const user = getAuthUser();
    const userName = useMemo(() => user?.name || 'there', [user]);
    const [messages, setMessages] = useState([
        { role: 'ai', text: `Hey ${userName || 'there'}! 👋 I'm your personal study assistant.` },
        { role: 'ai', text: `Before we start — what subject are you currently studying? (e.g. Biology, Math, History...)` }
    ]);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [userProfile, setUserProfile] = useState({ subject: '', level: '', style: '' }); 
    const [input, setInput] = useState('');
    const [docs, setDocs] = useState([]);
    const [showDocs, setShowDocs] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        axios.get('https://ai-study-assistant-server.onrender.com/api/documents', {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        }).then(res => setDocs(res.data.documents || [])).catch(() => { });
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function handleSend() {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

        setTimeout(() => {
            if (onboardingStep === 0) {
                setUserProfile(p => ({ ...p, subject: userMsg }));
                setOnboardingStep(1);
                setMessages(prev => [...prev, { role: 'ai', text: `Nice! And what's your level? (e.g. High school, University, Self-learning...)` }]);
            } else if (onboardingStep === 1) {
                setUserProfile(p => ({ ...p, level: userMsg }));
                setOnboardingStep(2);
                setMessages(prev => [...prev, { role: 'ai', text: `Got it! Last question — how do you prefer to learn? Quizzes, study plans, or asking questions?` }]);
            } else if (onboardingStep === 2) {
                setUserProfile(p => ({ ...p, style: userMsg }));
                setOnboardingStep(3);
                setMessages(prev => [...prev, {
                    role: 'ai',
                    text: `Perfect! So you're studying ${userProfile.subject} at ${userProfile.level} level and prefer ${userMsg}. I'm ready to help! Upload a document or pick one from your library to get started 🚀`
                }]);
                setShowDocs(true);
            } else {
                const lower = userMsg.toLowerCase();
                if (lower.includes('quiz') || lower.includes('test')) {
                    setMessages(prev => [...prev, { role: 'ai', text: `Let's do a quiz! Pick a document from your library 🧠` }]);
                    setShowDocs(true);
                } else if (lower.includes('plan') || lower.includes('study')) {
                    setMessages(prev => [...prev, { role: 'ai', text: `I'll build you a study plan! Pick a document 📅` }]);
                    setShowDocs(true);
                } else if (lower.includes('ask') || lower.includes('question')) {
                    setMessages(prev => [...prev, { role: 'ai', text: `Sure! Pick a document and ask me anything about it 💬` }]);
                    setShowDocs(true);
                } else if (lower.includes('upload')) {
                    setMessages(prev => [...prev, { role: 'ai', text: `Click the 📎 button below to upload a PDF or TXT file!` }]);
                } else {
                    setMessages(prev => [...prev, { role: 'ai', text: `I can help you with quizzes, study plans, or answer questions. What would you like? 😊` }]);
                }
            }
        }, 600);
    }

    async function handleUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setMessages(prev => [...prev, { role: 'user', text: `Uploading "${file.name}"...` }]);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post('https://ai-study-assistant-server.onrender.com/api/documents/upload', formData, {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            const doc = res.data?.document;
            if (doc) {
                setDocs(prev => [doc, ...prev]);
                setMessages(prev => [...prev, { role: 'ai', text: `✅ "${doc.filename}" uploaded! What do you want to do with it — quiz, study plan, or ask questions?` }]);
                setShowDocs(true);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: '❌ Upload failed. Please try again.' }]);
        }
        setUploading(false);
        e.target.value = '';
    }

    async function handleDelete(id) {
        await axios.delete(`https://ai-study-assistant-server.onrender.com/api/documents/${id}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        setDocs(prev => prev.filter(d => d.id !== id));
    }

    return (
        <div style={s.root}>
            {/* Header */}
            <header style={s.header}>
                <span style={s.logo}>📚 StudyAI</span>
                <div style={s.headerRight}>
                    <button style={s.docsToggle} onClick={() => setShowDocs(v => !v)}>
                        📂 Documents ({docs.length})
                    </button>
                    <button style={s.logoutBtn} onClick={() => { clearAuth(); navigate('/'); }}>Logout</button>
                </div>
            </header>

            <div style={s.body}>
                {/* Chat */}
                <div style={s.chatPanel}>
                    <div style={s.messages}>
                        {messages.map((m, i) => (
                            <div key={i} style={m.role === 'ai' ? s.aiMsg : s.userMsg}>
                                {m.role === 'ai' && <span style={s.aiAvatar}>🤖</span>}
                                <div style={m.role === 'ai' ? s.aiBubble : s.userBubble}>{m.text}</div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div style={s.inputRow}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.txt"
                            style={{ display: 'none' }}
                            onChange={handleUpload}
                        />
                        <button style={s.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            📎
                        </button>
                        <input
                            style={s.textInput}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Tell me what you want to study..."
                        />
                        <button style={s.sendBtn} onClick={handleSend}>Send</button>
                    </div>
                </div>

                {/* Documents panel */}
                {showDocs && (
                    <div style={s.docsPanel}>
                        <h3 style={s.docsTitle}>Your Documents</h3>
                        {docs.length === 0 ? (
                            <p style={s.docsEmpty}>No documents yet.</p>
                        ) : (
                            docs.map(doc => (
                                <div key={doc.id} style={s.docCard}>
                                    <div style={s.docName}>📝 {doc.filename}</div>
                                    <div style={s.docDate}>{new Date(doc.createdAt).toLocaleDateString()}</div>
                                    <div style={s.docBtns}>
                                        <button style={s.docBtn} onClick={() => navigate(`/study-plan/${doc.id}`)}>📅 Plan</button>
                                        <button style={s.docBtn} onClick={() => navigate(`/quiz/${doc.id}`)}>🧠 Quiz</button>
                                        <button style={s.docBtn} onClick={() => navigate(`/ask/${doc.id}`)}>💬 Ask</button>
                                        <button style={{ ...s.docBtn, color: '#f87171' }} onClick={() => handleDelete(doc.id)}>🗑</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const s = {
    root: { minHeight: '100vh', background: '#1a1d2e', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    logo: { fontWeight: 700, fontSize: '1.1rem', color: '#a78bfa' },
    headerRight: { display: 'flex', gap: '10px' },
    docsToggle: { background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' },
    logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    chatPanel: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '760px', margin: '0 auto', width: '100%', padding: '0 20px' },
    messages: { flex: 1, overflowY: 'auto', padding: '28px 0', display: 'flex', flexDirection: 'column', gap: '16px' },
    aiMsg: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
    userMsg: { display: 'flex', justifyContent: 'flex-end' },
    aiAvatar: { fontSize: '1.4rem', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    aiBubble: { background: '#252840', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', color: '#e8eaf6', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '80%' },
    userBubble: { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '14px 14px 4px 14px', padding: '12px 16px', color: '#fff', fontSize: '0.95rem', maxWidth: '80%' },
    inputRow: { display: 'flex', gap: '10px', padding: '16px 0 28px', alignItems: 'center' },
    attachBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '44px', height: '44px', borderRadius: '10px', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 },
    textInput: { flex: 1, background: '#252840', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '0.95rem', outline: 'none' },
    sendBtn: { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0 },
    docsPanel: { width: '280px', background: '#0f1225', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '24px 16px', overflowY: 'auto', flexShrink: 0 },
    docsTitle: { fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' },
    docsEmpty: { color: '#4b5563', fontSize: '0.9rem' },
    docCard: { background: '#13162b', borderRadius: '10px', padding: '12px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.06)' },
    docName: { color: '#e8eaf6', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' },
    docDate: { color: '#4b5563', fontSize: '0.78rem', marginBottom: '10px' },
    docBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    docBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem' },
};