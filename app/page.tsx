'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  Send,
  Plus,
  LogOut,
  Bot,
  Sparkles,
  Zap,
  TrendingUp,
  Feather,
  Palette,
  ShieldCheck,
  Coins,
  MessageSquare,
  Menu,
  X,
  Radio,
  Video,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SkipLink } from '@/components/layout/SkipLink';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const AGENTS = [
  {
    id: 'Aura',
    name: 'Aura',
    role: 'Lead ReAct Orchestrator',
    desc: 'Pengurus keputusan & pembantu pintar serba boleh (BM-first).',
    icon: Zap,
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'Aura-Trade',
    name: 'Aura-Trade',
    role: 'Market Analyst',
    desc: 'Penganalisis sentimen Bursa Malaysia & pasaran kripto.',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'Aura-Pen',
    name: 'Aura-Pen',
    role: 'Content Director',
    desc: 'Pakar penulisan draf konten berimpak tinggi & naratif jenama Sakluma.',
    icon: Feather,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'Aura-Art',
    name: 'Aura-Art',
    role: 'Visual Architect',
    desc: 'Penjana konsep visual & persona digital maya konsisten.',
    icon: Palette,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'Aura-Scout',
    name: 'Aura-Scout',
    role: 'Radar & Intelligence',
    desc: 'Pengimbas berita, media sosial (YouTube/TikTok/X) & radar tren.',
    icon: Radio,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'Aura-Vision',
    name: 'Aura-Vision',
    role: 'Video & Media Director',
    desc: 'Pengarah video Reels, motion graphics & pipeline visual AI.',
    icon: Video,
    color: 'from-violet-500 to-fuchsia-600',
  },
];

export default function CloudCockpit() {
  const [user, setUser] = useState<User | null>(null);
  const [activeAgent, setActiveAgent] = useState('Aura');
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-1',
      title: 'Perbualan Awal',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [credits, setCredits] = useState('10.00');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check Supabase authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (e) {
        console.error('Error checking auth:', e);
      }
    }
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-scroll on new message chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal log masuk Google';
      alert(`Ralat log masuk: ${errorMsg}`);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Create new session
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Perbualan Baru',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
    setMobileMenuOpen(false);
  };

  // Send message to Secure Next.js Chat API
  const handleSendMessage = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || isStreaming) return;

    if (!customText) {
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantMsgId = `msg-${Date.now()}-a`;
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          sessionId: activeSessionId,
          agent: activeAgent,
        }),
      });

      if (!res.ok) {
        let errMsg = 'Gagal menyambung ke enjin perbualan TanAir.';
        try {
          const errData = await res.json();
          if (errData?.error?.message) {
            errMsg = errData.error.message;
          }
        } catch {
          // Fallback to status-based error message
          if (res.status === 401) errMsg = 'Sesi log masuk telah tamat. Sila log masuk semula.';
          else if (res.status === 429)
            errMsg = 'Had permintaan telah dicapai. Sila tunggu sebentar.';
          else if (res.status === 413) errMsg = 'Mesej terlalu panjang untuk diproses.';
        }
        throw new Error(errMsg);
      }

      if (!res.body) {
        throw new Error('Gagal menyambung ke enjin perbualan TanAir.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m)),
                );
              }
            } catch {
              // Ignore partial parse
            }
          }
        }
      }

      // Simulate tiny deduction for PAYG demonstration
      setCredits((prev) => {
        const val = Math.max(0, parseFloat(prev) - 0.02);
        return val.toFixed(2);
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Ralat tidak diketahui';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: `⚠ Maaf, berlaku ralat: ${errorMsg}` } : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle textarea auto-resize
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <SkipLink targetId="chat-main-content" />

      {/* ────────────────────────────────────────────────────────── */}
      {/* SIDEBAR (DESKTOP & MOBILE DRAWER) */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        aria-label="Navigasi Sisi"
        className={`fixed inset-y-0 left-0 z-[var(--aura-z-drawer)] w-72 bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--aura-purple-600)] to-[var(--aura-info-500)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary-glow)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight flex items-center gap-1.5 text-[var(--text-primary)]">
                TanAir{' '}
                <Badge variant="primary" size="sm">
                  Cloud
                </Badge>
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">BM-First Agent OS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup menu navigasi"
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold shadow-md shadow-[var(--accent-primary-glow)] transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
          >
            <Plus className="w-4 h-4" />
            Sesi Perbualan Baru
          </button>
        </div>

        {/* Agent Persona Selector */}
        <div className="px-3 py-2">
          <p className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-muted)] mb-2 px-1">
            Armada Ejen (Select Agent)
          </p>
          <div className="space-y-1">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              const isActive = activeAgent === agent.id;
              return (
                <button
                  type="button"
                  key={agent.id}
                  onClick={() => setActiveAgent(agent.id)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[var(--accent-primary)]/15 border border-[var(--border-accent)] text-[var(--text-primary)]'
                      : 'hover:bg-[var(--surface-hover)] border border-transparent text-[var(--text-secondary)]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate flex items-center justify-between">
                      {agent.name}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--aura-success-500)] shadow-[0_0_6px_var(--aura-success-500)]" />
                      )}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{agent.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Previous Chat Sessions */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-muted)] mb-2 px-1">
            Sejarah Sesi (Sessions)
          </p>
          <div className="space-y-1">
            {sessions.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                  activeSessionId === s.id
                    ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] font-medium border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span className="truncate flex-1">{s.title}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{s.created_at}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PAYG Credits & User Profile Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-soft)]/60 space-y-2">
          {/* Credit balance badge */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Coins className="w-4 h-4 text-[var(--accent-premium)]" />
              <span className="font-mono">Baki PAYG</span>
            </div>
            <Badge variant="success" size="sm">
              RM {credits}
            </Badge>
          </div>

          {/* User Account */}
          {user ? (
            <div className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar fallback={user.email ? user.email[0] : 'U'} size="sm" status="online" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log Keluar"
                aria-label="Log Keluar"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--feedback-danger-text)] hover:bg-[var(--feedback-danger-bg)] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors border border-[var(--border-subtle)] shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Log Masuk Google
            </button>
          )}
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MAIN CHAT CONTENT AREA */}
      {/* ────────────────────────────────────────────────────────── */}
      <main
        id="chat-main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] relative focus:outline-hidden"
      >
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--aura-success-500)] shadow-[0_0_8px_var(--aura-success-500)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Persona: <span className="text-[var(--accent-primary)]">{activeAgent}</span>
              </h2>
              <span className="text-[11px] text-[var(--text-muted)] font-mono hidden sm:inline">
                · {AGENTS.find((a) => a.id === activeAgent)?.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--aura-info-500)]" />
              <span>Multi-Tenant Sandbox Safe</span>
            </div>

            {user && (
              <span className="text-xs text-[var(--text-muted)] font-mono hidden md:inline">
                {user.email}
              </span>
            )}
          </div>
        </header>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--aura-purple-600)]/30 to-[var(--aura-info-500)]/20 border border-[var(--border-accent)] flex items-center justify-center mb-5 shadow-2xl shadow-[var(--accent-primary-glow)]">
                <Bot className="w-8 h-8 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                TanAir Cloud (Beta v1)
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                Antaramuka perbualan multi-ejen beridentiti Malaysia. Sila taip sebarang soalan atau
                pilih cadangan tindakan pantas di bawah.
              </p>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage('Bantu saya analisa strategi pasaran saham hari ini.')
                  }
                  className="p-3 rounded-xl bg-[var(--bg-soft)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-left text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--border-accent)]"
                >
                  📈{' '}
                  <span className="font-semibold text-[var(--text-primary)]">Analisis Pasaran</span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Semak sentimen Bursa & teknikal pasaran bersama Aura-Trade.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      'Tuliskan copywriting Facebook untuk produk Daging Salai Sakluma.',
                    )
                  }
                  className="p-3 rounded-xl bg-[var(--bg-soft)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-left text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--border-accent)]"
                >
                  ✍️{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    Copywriting Sakluma
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Jana draf iklan menarik gaya tempatan bersama Aura-Pen.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage('Bagaimanakah sistem kredit PAYG TanAir berfungsi?')
                  }
                  className="p-3 rounded-xl bg-[var(--bg-soft)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-left text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--border-accent)]"
                >
                  💰{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    Sistem Kredit PAYG
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Ketahui cara pengiraan token & penolakan baki RM10.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage('Boleh cadangkan idea kempen visual persona digital Maya?')
                  }
                  className="p-3 rounded-xl bg-[var(--bg-soft)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-left text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--border-accent)]"
                >
                  🎨{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    Konsep Visual FLUX
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Rangka prompt kreatif untuk watak konsisten AI bersama Aura-Art.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-soft)] border border-[var(--border-accent)] text-[var(--accent-primary)]'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <span className="text-xs font-bold">👤</span>
                  ) : (
                    <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent-primary)] text-white rounded-tr-none'
                      : 'bg-[var(--bg-soft)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {msg.role === 'user' ? 'Anda' : `${activeAgent} · TanAir`}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content || (
                      <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] text-xs italic">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
                        Aura sedang menaip respons...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Box */}
        <footer className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] focus-within:border-[var(--accent-primary)] rounded-2xl p-2 transition-colors shadow-lg">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={`Tanya ${activeAgent} sebarang arahan atau tugasan... (Enter untuk hantar)`}
                rows={1}
                disabled={isStreaming}
                aria-label={`Mesej kepada ${activeAgent}`}
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-3 py-2 outline-hidden resize-none max-h-36 leading-relaxed"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isStreaming}
                aria-label="Hantar mesej"
                className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-md shadow-[var(--accent-primary-glow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-2 px-1">
              <span>Shift + Enter untuk baris baru</span>
              <span className="font-mono">TanAir Cloud Beta · Multi-Tenant Vercel</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
