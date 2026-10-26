import { useEffect, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowRight, BarChart3, BookOpen,
  Check, ChevronDown, CircleHelp, FileText, Globe, LayoutDashboard,
  LogOut, Menu, Search, Settings, ShieldCheck, Sparkles, Trash2,
  TrendingUp, X, Zap
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const cx = (...parts) => parts.filter(Boolean).join(" ");

function AppButton({ children, variant = "primary", className = "", ...props }) {
  return <button className={cx("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" ? "bg-violet-500 text-white hover:bg-violet-400" : variant === "secondary" ? "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "text-slate-400 hover:bg-white/5 hover:text-white", className)} {...props}>{children}</button>;
}

function Field({ label, ...props }) {
  return <label className="block text-sm"><span className="mb-2 block font-medium text-slate-300">{label}</span><input {...props} className={cx("w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400", props.className)} /></label>;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not authenticate.");
      onAuth(data);
    } catch (err) { setError(err.message || "Cannot connect to backend."); }
    finally { setBusy(false); }
  }

  return <div className="flex min-h-screen items-center justify-center px-5 py-10">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#101525] shadow-2xl md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-violet-600/30 via-[#11162a] to-cyan-600/10 p-10 md:flex">
        <Brand />
        <div><div className="mb-4 inline-flex rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-200"><Sparkles size={14} className="mr-2"/> SEO workspace</div><h1 className="text-4xl font-bold leading-tight">Make better decisions about your search visibility.</h1><p className="mt-5 leading-7 text-slate-400">Audit pages, review content, and keep your SEO reports organized.</p></div>
        <p className="text-xs text-slate-500">Searchly is an independent educational demo.</p>
      </div>
      <form onSubmit={submit} className="p-6 sm:p-10">
        <div className="mb-8 md:hidden"><Brand /></div>
        <p className="text-sm text-violet-300">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
        <h2 className="mt-2 text-3xl font-bold">{mode === "login" ? "Sign in to Searchly" : "Create your account"}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{mode === "login" ? "Open your SEO workspace and saved reports." : "Create an account to start auditing and saving reports."}</p>
        <div className="mt-7 space-y-5">
          {mode === "register" && <Field label="Your name" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Morgan" required minLength={2} maxLength={80} />}
          <Field label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} maxLength={128} />
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
        <AppButton type="submit" disabled={busy} className="mt-7 w-full py-3">{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16}/></AppButton>
        <p className="mt-6 text-center text-sm text-slate-400">{mode === "login" ? "New to Searchly?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="font-semibold text-violet-300 hover:text-white">{mode === "login" ? "Create account" : "Sign in"}</button></p>
      </form>
    </div>
  </div>;
}

function Brand() {
  return <a href="#" className="inline-flex items-center gap-3 text-xl font-bold text-white"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500"><Sparkles size={21}/></span>Searchly<span className="-ml-3 text-violet-300">.</span></a>;
}

function StatCard({ icon: Icon, label, value, detail }) {
  return <div className="rounded-2xl border border-white/10 bg-[#101525] p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><span className="rounded-lg bg-violet-400/10 p-2 text-violet-300"><Icon size={17}/></span></div><p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>;
}

function Sidebar({ page, setPage, user, logout, mobileOpen, setMobileOpen }) {
  const nav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "audit", label: "Website audit", icon: Search },
    { id: "content", label: "Content analyzer", icon: BookOpen },
    { id: "reports", label: "Saved reports", icon: FileText }
  ];
  return <>
    {mobileOpen && <button aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden"/>}
    <aside className={cx("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#0b0f1c] p-5 transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-center justify-between"><Brand/><button className="text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20}/></button></div>
      <div className="mt-10"><p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Workspace</p>{nav.map(item => <button key={item.id} onClick={() => { setPage(item.id); setMobileOpen(false); }} className={cx("mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition", page === item.id ? "bg-violet-500/15 font-semibold text-violet-200" : "text-slate-400 hover:bg-white/5 hover:text-white")}><item.icon size={18}/>{item.label}</button>)}</div>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 font-bold text-violet-200">{user.name.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div><button onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white"><LogOut size={16}/> Sign out</button></div>
    </aside>
  </>;
}

function Topbar({ page, user, onMenu }) {
  const titles = { overview: "Overview", audit: "Website audit", content: "Content analyzer", reports: "Saved reports" };
  return <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#080b16]/90 px-4 backdrop-blur-xl sm:px-8">
    <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu/></button><div><p className="text-xs text-slate-500">WORKSPACE / {titles[page]?.toUpperCase()}</p><h1 className="mt-1 text-lg font-semibold sm:text-xl">{titles[page]}</h1></div></div>
    <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:inline">{user.name}</span><div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/20 bg-violet-400/10 font-semibold text-violet-200">{user.name.slice(0,1).toUpperCase()}</div></div>
  </header>;
}

function Overview({ reports, setPage }) {
  const seoReports = reports.filter(r => r.kind === "seo");
  const contentReports = reports.filter(r => r.kind === "content");
  const recent = reports.slice(0, 4);
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-400">Here is what is happening in your workspace.</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Your SEO command center</h2></div><AppButton onClick={() => setPage("audit")}><Search size={16}/> New audit</AppButton></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={FileText} label="Saved reports" value={reports.length} detail="Reports in your workspace"/>
      <StatCard icon={Globe} label="Website audits" value={seoReports.length} detail="Saved SEO audit reports"/>
      <StatCard icon={BookOpen} label="Content checks" value={contentReports.length} detail="Saved content analyses"/>
      <StatCard icon={ShieldCheck} label="Workspace" value="Private" detail="Reports belong to your account"/>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-white/10 bg-[#101525] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Recent reports</h3><p className="mt-1 text-sm text-slate-500">Your latest saved work</p></div><button onClick={() => setPage("reports")} className="text-sm text-violet-300 hover:text-white">View all →</button></div>
        {recent.length ? <div className="mt-5 divide-y divide-white/10">{recent.map(r => <div key={r._id} className="flex items-center gap-3 py-4"><div className="rounded-xl bg-violet-400/10 p-3 text-violet-300">{r.kind === "seo" ? <Globe size={18}/> : <BookOpen size={18}/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="mt-1 truncate text-xs text-slate-500">{r.input}</p></div><span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span></div>)}</div> : <EmptyState title="No reports yet" text="Run a website audit or content analysis, then save the result here."/>}
      </section>
      <section className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-[#101525] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300"><Zap/></div><h3 className="mt-5 text-xl font-bold">Make your next move count</h3><p className="mt-3 text-sm leading-6 text-slate-400">Run a rule-based page audit or review an article before publishing. Start with a small, measurable improvement.</p><div className="mt-6 space-y-3"><button onClick={() => setPage("audit")} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10"><span className="flex items-center gap-3"><Search size={17}/> Analyze a website</span><ArrowRight size={16}/></button><button onClick={() => setPage("content")} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10"><span className="flex items-center gap-3"><BookOpen size={17}/> Check an article</span><ArrowRight size={16}/></button></div></section>
    </div>
  </div>;
}

function EmptyState({ title, text }) {
  return <div className="py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-400"><FileText/></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{text}</p></div>;
}

function ReportResult({ result }) {
  return <div className="mt-6 rounded-2xl border border-white/10 bg-[#101525] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-slate-500">Audit score</p><p className="mt-2 text-4xl font-bold text-violet-300">{result.score}<span className="text-lg text-slate-500">/100</span></p></div><div className="max-w-xl"><p className="break-all text-sm font-medium">{result.url}</p><p className="mt-2 text-sm text-slate-400">{result.title || "No page title found"}</p></div></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{result.checks.map(c => <div key={c.name} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className={cx("flex items-center gap-2 text-sm font-semibold", c.passed ? "text-emerald-300" : "text-amber-300")}>{c.passed ? <Check size={16}/> : <CircleHelp size={16}/>} {c.name}</p><p className="mt-2 break-words text-xs leading-5 text-slate-400">{c.detail}</p></div>)}</div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Words",result.wordCount],["H1 headings",result.h1Count],["Images",result.imageCount],["Missing alt",result.imagesMissingAlt]].map(([label,value]) => <div key={label} className="rounded-xl bg-white/[0.03] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div>
    <p className="mt-4 text-xs leading-5 text-slate-500">{result.note}</p>
  </div>;
}

function WebsiteAudit({ token, onSaved }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function analyze(e) {
    e.preventDefault(); setBusy(true); setError(""); setResult(null); setSaved(false);
    try {
      const response = await fetch(`${API}/seo/analyze`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed.");
      const audit = data.result || data;

       setResult({
         ...audit,
         h1Count: Array.isArray(audit.h1)
         ? audit.h1.length
         : audit.h1Count ?? 0,
        wordCount: audit.wordCount ?? 0,
        note: audit.note || "Basic on-page SEO checks completed.",
        });
    } catch (err) { setError(err.message || "Could not connect to the backend."); }
    finally { setBusy(false); }
  }
  async function save() {
    try {
      const response = await fetch(`${API}/reports`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ kind: "seo", name: result.title || result.url, input: result.url, result }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save report.");
      setSaved(true); onSaved();
    } catch (err) { setError(err.message); }
  }
  return <div className="mx-auto max-w-5xl"><div className="max-w-2xl"><p className="text-sm text-slate-400">ON-PAGE CHECKS</p><h2 className="mt-2 text-3xl font-bold">Website SEO audit</h2><p className="mt-3 leading-7 text-slate-400">Enter a public webpage URL to inspect basic HTML SEO elements. Some websites block automated requests or render content with JavaScript.</p></div>
    <form onSubmit={analyze} className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101525] p-4 sm:flex-row sm:p-5"><div className="relative flex-1"><Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input type="url" required maxLength={2048} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-white/10 bg-[#0b1020] py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-400"/></div><AppButton type="submit" disabled={busy}>{busy ? <Activity className="animate-pulse" size={17}/> : <Search size={17}/>} {busy ? "Analyzing..." : "Analyze URL"}</AppButton></form>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">{error}</p>}
    {result && <><ReportResult result={result}/><div className="mt-4 flex flex-wrap gap-3"><AppButton onClick={save} disabled={saved}>{saved ? <Check size={16}/> : <FileText size={16}/>} {saved ? "Report saved" : "Save report"}</AppButton><AppButton variant="secondary" onClick={() => { setResult(null); setUrl(""); }}>New audit</AppButton></div></>}
    <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm leading-6 text-slate-400"><p className="font-semibold text-amber-200">What this audit checks</p>Page title, meta description, H1 count, image alt attributes, canonical link, and rough visible-text word count. The score is a demo checklist, not a Google ranking prediction.</div>
  </div>;
}

function ContentAnalyzer({ token, onSaved }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  async function analyze(e) {
    e.preventDefault(); setBusy(true); setError(""); setResult(null); setSaved(false);
    try {
      const response = await fetch(`${API}/content/analyze`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ text, keyword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not analyze content.");
      setResult(data);
    } catch (err) { setError(err.message || "Could not connect to backend."); }
    finally { setBusy(false); }
  }
  async function save() {
    try {
      const response = await fetch(`${API}/reports`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ kind: "content", name: title || keyword || "Content analysis", input: keyword, result }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save report.");
      setSaved(true); onSaved();
    } catch (err) { setError(err.message); }
  }
  return <div className="mx-auto max-w-5xl"><div className="max-w-2xl"><p className="text-sm text-slate-400">CONTENT OPTIMIZATION</p><h2 className="mt-2 text-3xl font-bold">Content analyzer</h2><p className="mt-3 leading-7 text-slate-400">Review word count, target keyword usage, and heading structure before publishing.</p></div>
    <form onSubmit={analyze} className="mt-7 space-y-5 rounded-2xl border border-white/10 bg-[#101525] p-5 sm:p-7">
      <Field label="Report name (optional)" value={title} onChange={e => setTitle(e.target.value)} placeholder="My SEO article" maxLength={160}/>
      <Field label="Target keyword (optional)" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. best running shoes" maxLength={120}/>
      <label className="block text-sm"><span className="mb-2 block font-medium text-slate-300">Article text or HTML</span><textarea required minLength={20} maxLength={100000} rows={10} value={text} onChange={e => setText(e.target.value)} placeholder="Paste your article here. You can include headings such as <h1>...</h1> and <h2>...</h2>." className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm leading-6 outline-none focus:border-violet-400"/></label>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{text.trim() ? text.trim().split(/\s+/).length : 0} rough words · 100,000 character limit</p><AppButton type="submit" disabled={busy}>{busy ? "Checking..." : "Analyze content"} <ArrowRight size={16}/></AppButton></div>
    </form>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-300">{error}</p>}
    {result && <div className="mt-6 rounded-2xl border border-white/10 bg-[#101525] p-5 sm:p-6"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Word count",result.wordCount],["Characters",result.characterCount],["Keyword uses",result.keywordCount],["Keyword density",`${result.keywordDensityPercent}%`]].map(([l,v]) => <div key={l} className="rounded-xl bg-white/[0.03] p-4"><p className="text-xs text-slate-500">{l}</p><p className="mt-2 text-xl font-bold">{v}</p></div>)}</div><h3 className="mt-6 font-semibold">Checklist</h3><div className="mt-3 space-y-3">{result.checks.map(c => <div key={c.name} className="rounded-xl border border-white/10 p-4"><p className={c.passed ? "text-emerald-300" : "text-amber-300"}>{c.passed ? "✓" : "⚠"} {c.name}</p><p className="mt-1 text-sm text-slate-400">{c.detail}</p></div>)}</div><p className="mt-4 text-xs text-slate-500">{result.note}</p><AppButton className="mt-5" onClick={save} disabled={saved}>{saved ? <Check size={16}/> : <FileText size={16}/>} {saved ? "Report saved" : "Save report"}</AppButton></div>}
  </div>;
}

function Reports({ reports, reload, token }) {
  const [error, setError] = useState("");
  async function remove(id) {
    if (!window.confirm("Delete this saved report?")) return;
    setError("");
    try {
      const response = await fetch(`${API}/reports/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete report.");
      reload();
    } catch (err) { setError(err.message); }
  }
  return <div className="mx-auto max-w-5xl"><p className="text-sm text-slate-400">YOUR WORKSPACE</p><h2 className="mt-2 text-3xl font-bold">Saved reports</h2><p className="mt-3 text-slate-400">Reports are private to your account.</p>
    {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
    <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#101525]">
      {reports.length ? reports.map(r => <div key={r._id} className="flex flex-col gap-3 border-b border-white/10 p-5 last:border-0 sm:flex-row sm:items-center"><div className="rounded-xl bg-violet-400/10 p-3 text-violet-300"><FileText size={20}/></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.name}</p><p className="mt-1 break-all text-sm text-slate-400">{r.input || "Content analysis"}</p><p className="mt-1 text-xs text-slate-500">{r.kind === "seo" ? "Website audit" : "Content analysis"} · {new Date(r.createdAt).toLocaleString()}</p></div><div className="flex items-center gap-3"><span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300">{r.result?.score != null ? `Score ${r.result.score}/100` : `${r.result?.wordCount ?? 0} words`}</span><AppButton variant="ghost" aria-label="Delete report" onClick={() => remove(r._id)}><Trash2 size={17}/></AppButton></div></div>) : <EmptyState title="No saved reports" text="Run an audit or content analysis and save the result to see it here."/>}
    </div>
  </div>;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("searchly_token") || "");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("overview");
  const [reports, setReports] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(Boolean(token));
  const [globalError, setGlobalError] = useState("");

  function onAuth(data) {
    localStorage.setItem("searchly_token", data.token);
    setToken(data.token); setUser(data.user); setGlobalError("");
  }
  function logout() {
    localStorage.removeItem("searchly_token");
    setToken(""); setUser(null); setReports([]); setPage("overview");
  }
  async function loadReports(currentToken = token) {
    if (!currentToken) return;
    try {
      const response = await fetch(`${API}/reports`, { headers: { Authorization: `Bearer ${currentToken}` } });
      const data = await response.json();
      if (response.status === 401) { logout(); return; }
      if (!response.ok) throw new Error(data.error || "Could not load reports.");
      setReports(data.reports || []);
      setGlobalError("");
    } catch (err) { setGlobalError(err.message || "Could not connect to backend."); }
  }

  useEffect(() => {
    if (!token) { setAuthChecking(false); return; }
    let active = true;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Session expired."); return data; })
      .then(data => { if (active) { setUser(data.user); loadReports(token); } })
      .catch(() => { if (active) { localStorage.removeItem("searchly_token"); setToken(""); setUser(null); } })
      .finally(() => { if (active) setAuthChecking(false); });
    return () => { active = false; };
  }, [token]);

  if (authChecking) return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading workspace…</div>;
  if (!token || !user) return <AuthScreen onAuth={onAuth}/>;

  return <div className="min-h-screen bg-[#080b16] text-slate-100">
    <Sidebar page={page} setPage={setPage} user={user} logout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    <div className="min-h-screen lg:pl-64"><Topbar page={page} user={user} onMenu={() => setMobileOpen(true)}/><main className="mx-auto max-w-[1600px] p-4 sm:p-8">
      {globalError && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-200"><span>{globalError}</span><AppButton variant="secondary" onClick={() => loadReports()}>Retry</AppButton></div>}
      {page === "overview" && <Overview reports={reports} setPage={setPage}/>}
      {page === "audit" && <WebsiteAudit token={token} onSaved={() => loadReports()}/>}
      {page === "content" && <ContentAnalyzer token={token} onSaved={() => loadReports()}/>}
      {page === "reports" && <Reports reports={reports} reload={() => loadReports()} token={token}/>}
      <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-slate-600 sm:flex-row"><span>© {new Date().getFullYear()} Searchly · Learning project</span><span>Basic checks only · Not affiliated with Surfer SEO</span></footer>
    </main></div>
  </div>;
}
