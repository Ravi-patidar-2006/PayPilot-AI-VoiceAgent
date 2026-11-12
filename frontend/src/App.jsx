import React from 'react';
import { useCallback, useEffect, useMemo, useState } from "react";
import './styles.css';
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bot, CheckCircle2, CircleDollarSign,
  Clock3, CreditCard, FileText, LayoutDashboard, LoaderCircle, MessageCircle,
  Plus, RefreshCw, Send, ShieldCheck, Sparkles, WalletCards, XCircle, Mic
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function money(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

function StatusPill({ status }) {
  const s = (status || "UNKNOWN").toUpperCase();
  const kind = s === "COMPLETED" ? "success" : ["CREATED", "APPROVED", "PAYER_ACTION_REQUIRED"].includes(s) ? "pending" : "neutral";
  return <span className={`status ${kind}`}><span />{s.replaceAll("_", " ")}</span>;
}

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState("Website design");
  const [amount, setAmount] = useState("25.00");
  const [currency, setCurrency] = useState("USD");
  const [command, setCommand] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [health, setHealth] = useState(null);
  const [active, setActive] = useState("Overview");

  const refresh = useCallback(async () => {
    try {
      const [txRes, healthRes] = await Promise.all([
        fetch(`${API}/api/transactions`),
        fetch(`${API}/api/health`)
      ]);
      if (!txRes.ok || !healthRes.ok) throw new Error("Backend did not respond.");
      const txData = await txRes.json();
      setTransactions(txData.transactions || []);
      setHealth(await healthRes.json());
    } catch {
      setHealth({ status: "offline", paypal_configured: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("token");
    const returned = params.get("paypal_return");
    const cancelled = params.get("paypal_cancel");
    if (cancelled) {
      setNotice({ type: "info", text: "Checkout was cancelled. No payment was captured." });
      window.history.replaceState({}, "", "/");
      return;
    }
    if (orderId && returned) {
      setBusy(true);
      fetch(`${API}/api/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST" })
        .then(async r => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.detail || "Could not verify/capture order.");
          setNotice({
            type: data.status === "COMPLETED" ? "success" : "info",
            text: data.status === "COMPLETED"
              ? `Sandbox payment completed. Order ${data.order_id}`
              : `PayPal returned status: ${data.status}. Check Transactions for details.`
          });
        })
        .catch(e => setNotice({ type: "error", text: e.message }))
        .finally(() => {
          setBusy(false);
          window.history.replaceState({}, "", "/");
          refresh();
        });
    }
  }, [refresh]);

  const completed = transactions.filter(t => t.status === "COMPLETED");
  const pending = transactions.filter(t => t.status !== "COMPLETED");
  const total = completed.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  async function createPayment() {
    if (busy) return;

    setBusy(true);
    setNotice(null);

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: Number(amount),
          currency
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Unable to create order.");
      }

      if (
        typeof data.approval_url !== "string" ||
        !data.approval_url.startsWith("https://")
      ) {
        throw new Error(
          "PayPal approval URL missing. Check the backend order response."
        );
      }

      setNotice({
        type: "info",
        text: "Sandbox order created. Opening PayPal checkout..."
      });

      window.location.assign(data.approval_url);
    } catch (e) {
      setNotice({
        type: "error",
        text: e.message || "Unable to create payment."
      });
      setBusy(false);
    }
  }


  function startVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setNotice({
        type: "error",
        text: "Voice input is not supported. Please use Chrome."
      });
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setNotice({
        type: "info",
        text: "Listening... Speak your command."
      });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();

      setCommand(transcript);
      setNotice({
        type: "success",
        text: "Voice recognized. PayPilot is processing..."
      });

      runAssistant(null, transcript);
    };

    recognition.onerror = (event) => {
      setNotice({
        type: "error",
        text: `Microphone error: ${event.error}`
      });
    };

    recognition.start();
  }

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      setNotice({
        type: "error",
        text: "Voice output is not supported in this browser."
      });
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 0.95;
    speech.pitch = 1.08;

    const voices = window.speechSynthesis.getVoices();

    const femaleVoice = voices.find(v =>
      /female|zira|heera|samantha|raveena|priya/i.test(v.name)
    );

    if (femaleVoice) {
      speech.voice = femaleVoice;
    } else {
      speech.voice = voices.find(v => v.lang === "en-IN") || null;
    }

    window.speechSynthesis.speak(speech);
  }

  async function runAssistant(e, spokenMessage = null) {
    if (e) e.preventDefault();

    const userMessage = (spokenMessage ?? command).trim();
    if (!userMessage || busy) return;

    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage }
    ]);
    setCommand("");
    setBusy(true);
    setNotice(null);

    try {
      const readOnlyQuestion =
        /balance|transaction|transactions|payment history|my payments|show payments|how many|total|rahul/i.test(
          userMessage
        );

      const endpoint = readOnlyQuestion
        ? "/api/assistant/query"
        : "/api/assistant/chat";

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Assistant request failed.");
      }

      let reply = data.message || "Please try a different command.";

      if (data.intent === "create_payment") {
        setAmount(data.amount);
        setCurrency(data.currency || "USD");
        setDescription(data.description || "PayPilot AI test payment");

        reply +=
          " Review the payment details in the form, then click Create Sandbox payment to continue.";
      } else if (data.intent === "transaction_summary") {
        const totalText = Object.entries(data.totals || {})
          .map(([cur, val]) => `${cur} ${val}`)
          .join(", ");

        const records = (data.transactions || [])
          .slice(0, 3)
          .map(
            (t) =>
              `${t.description} — ${t.amount} ${t.currency} (${t.status})`
          )
          .join("; ");

        if (totalText) {
          reply += ` Completed totals: ${totalText}.`;
        }

        if (records) {
          reply += ` Latest matching records: ${records}.`;
        }
      }

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply }
      ]);
      speakText(reply);

    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: error.message || "Could not reach the backend. Make sure FastAPI is running on port 8000."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }


  const nav = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Payments", icon: WalletCards },
    { name: "AI Assistant", icon: Bot },
    { name: "Invoices", icon: FileText }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><WalletCards size={22} /></div>
          <div><strong>PayPilot <span>AI</span></strong><small>INTELLIGENT PAYMENTS</small></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {nav.map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${active === name ? "active" : ""}`} onClick={() => setActive(name)}>
              <Icon size={18} /> <span>{name}</span>
              {name === "AI Assistant" && <span className="new-tag">AI</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sandbox-card">
            <div className="sandbox-icon"><ShieldCheck size={18} /></div>
            <div><strong>Sandbox mode</strong><small>Test payments only</small></div>
            <span className="live-dot" />
          </div>
          <div className="profile">
            <div className="avatar">PP</div>
            <div><strong>Demo Workspace</strong><small>Hackathon project</small></div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <span className={`connection ${health?.status === "ok" ? "connected" : "disconnected"}`}>
              <span /> {health?.status === "ok" ? "Backend connected" : "Backend offline"}
            </span>
            <button className="icon-button" onClick={refresh} title="Refresh"><RefreshCw size={17} /></button>
            <div className="avatar">PP</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><Sparkles size={14} /> YOUR FINANCE COPILOT</div>
              <h1>{active === "Overview" ? "Payment overview" : active}</h1>
              <p className="subtitle">{active === "Overview" ? "Your PayPilot activity at a glance." : active === "Payments" ? "Create and review PayPal Sandbox payments." : active === "AI Assistant" ? "Ask questions or prepare a payment draft for review." : "Manage your customer invoices."}</p>
            </div>
            <div className="date-chip"><Activity size={15} /> Sandbox environment</div>
          </div>

          {health && !health.paypal_configured && (
            <div className="notice warning">
              <XCircle size={18} />
              <div><strong>PayPal credentials not configured</strong><p>Add your Sandbox Client ID and Secret to <code>backend/.env</code>, then restart the backend.</p></div>
            </div>
          )}
          {notice && (
            <div className={`notice ${notice.type}`}>
              {notice.type === "success" ? <CheckCircle2 size={18} /> : notice.type === "error" ? <XCircle size={18} /> : <Activity size={18} />}
              <div>{notice.text}</div>
              <button className="notice-close" onClick={() => setNotice(null)}><XCircle size={16} /></button>
            </div>
          )}

          {active === "Overview" && (
            <>
              <section className="video-hero">
                <div className="video-hero-copy">
                  <div className="video-hero-kicker"><span className="hero-kicker-dot" /> PAYPILOT AI • SMART FINANCE WORKSPACE</div>
                  <h2>Payments made<br />simple<span>.</span> <em>Smarter.</em></h2>
                  <p>Manage, monitor and understand your payment activity from one intelligent workspace.</p>
                  <div className="video-hero-actions">
                    <button className="hero-primary" onClick={() => setActive("Payments")}>Create a payment <ArrowUpRight size={16} /></button>
                    <button className="hero-secondary" onClick={() => setActive("AI Assistant")}><Bot size={16} /> Ask AI Assistant</button>
                  </div>
                  <div className="hero-trust"><span className="hero-trust-icon"><ShieldCheck size={15} /></span><span><strong>Sandbox protected</strong><small>Test payments only • No real money</small></span></div>
                </div>
                <div className="hero-visual" aria-label="Animated payment card illustration">
                  <div className="hero-orbit orbit-one" />
                  <div className="hero-orbit orbit-two" />
                  <div className="hero-glow" />
                  <div className="hero-float-label"><span className="hero-pulse" /> PAYMENT SYSTEM ONLINE</div>
                  <div className="floating-card card-back">
                    <div className="floating-card-top"><span className="card-chip" /><span>PAYPILOT AI</span></div>
                    <div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 2048</div>
                    <div className="floating-card-bottom"><span>DEMO WORKSPACE</span><strong>VISA</strong></div>
                  </div>
                  <div className="floating-card card-front">
                    <div className="floating-card-top"><span className="card-chip" /><span className="contactless-mark">)))</span></div>
                    <div className="card-balance-label">AVAILABLE IN SANDBOX</div>
                    <div className="card-balance">{money(total, "USD")}</div>
                    <div className="floating-card-bottom"><span>PAYMENT OVERVIEW</span><strong>✦ AI</strong></div>
                  </div>
                  <div className="hero-mini-stat"><span className="mini-stat-icon"><Activity size={15} /></span><span><small>TRANSACTIONS</small><strong>{transactions.length} orders</strong></span><span className="mini-live">LIVE</span></div>
                  <div className="hero-spark spark-a">✳</div><div className="hero-spark spark-b">✧</div>
                </div>
                <div className="hero-bottom-line"><span>YOUR FINANCE COPILOT</span><span>SCROLL TO EXPLORE <span className="hero-down">↓</span></span></div>
              </section>
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top"><span>Total captured (USD)</span><div className="stat-icon blue"><CircleDollarSign size={19} /></div></div>
                  <div className="stat-value">{money(total, "USD")}</div>
                  <div className="stat-foot"><span className="stat-note">Sandbox only</span><span>Verified completed orders</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>Completed payments</span><div className="stat-icon green"><CheckCircle2 size={19} /></div></div>
                  <div className="stat-value">{completed.length}</div>
                  <div className="stat-foot"><span className="stat-note">Confirmed</span><span>Captured successfully</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>Open / other statuses</span><div className="stat-icon amber"><Clock3 size={19} /></div></div>
                  <div className="stat-value">{pending.length}</div>
                  <div className="stat-foot"><span className="stat-note">Needs review</span><span>Not marked completed</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>All orders</span><div className="stat-icon purple"><CreditCard size={19} /></div></div>
                  <div className="stat-value">{transactions.length}</div>
                  <div className="stat-foot"><span className="stat-note">Order history</span><span>Latest 50 records</span></div>
                </div>
              </section>
              <section className="panel transactions-panel">
                <div className="panel-heading transactions-heading">
                  <div><div className="panel-icon"><ArrowDownLeft size={18} /></div><div><h2>Recent transactions</h2><p>Payment statuses stored by PayPilot AI.</p></div></div>
                  <button className="text-button" onClick={refresh}>Refresh <RefreshCw size={14} /></button>
                </div>
                {recent.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon"><WalletCards size={24} /></div><strong>No transactions yet</strong><p>Create your first Sandbox payment to see it here.</p></div>
                ) : (
                  <div className="table-wrap"><table>
                    <thead><tr><th>PAYMENT</th><th>ORDER ID</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
                    <tbody>{recent.map(t => (
                      <tr key={t.paypal_order_id}>
                        <td><div className="payment-cell"><div className="payment-symbol"><FileText size={16} /></div><div><strong>{t.description}</strong><small>{t.capture_id ? `Capture: ${t.capture_id}` : "PayPal order"}</small></div></div></td>
                        <td className="order-id">{t.paypal_order_id}</td>
                        <td>{t.created_at}</td>
                        <td className="amount-cell">{money(t.amount, t.currency)}</td>
                        <td><StatusPill status={t.status} /></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </section>
            </>
          )}

          {active === "Payments" && (
            <>
              <div className="work-grid" style={{ gridTemplateColumns: "1fr" }}>
                <section className="panel create-panel">
                  <div className="panel-heading">
                    <div><div className="panel-icon"><Plus size={18} /></div><div><h2>Create a payment</h2><p>Generate a PayPal Sandbox checkout order.</p></div></div>
                    <span className="sandbox-badge">SANDBOX</span>
                  </div>
                  <form onSubmit={e => { e.preventDefault(); createPayment(); }}>
                    <label>Payment description</label>
                    <input value={description} onChange={e => setDescription(e.target.value)} maxLength={120} required placeholder="e.g. Website design" />
                    <div className="form-row">
                      <div className="amount-field">
                        <label>Amount</label>
                        <div className="amount-input"><span>$</span><input type="number" min="0.01" max="10000" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
                      </div>
                      <div>
                        <label>Currency</label>
                        <select value={currency} onChange={e => setCurrency(e.target.value)}>
                          <option value="USD">USD — US Dollar</option>
                          <option value="EUR">EUR — Euro</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="CAD">CAD — Canadian Dollar</option>
                        </select>
                      </div>
                    </div>
                    <div className="secure-note"><ShieldCheck size={16} /> Checkout is handled by PayPal Sandbox.</div>
                    <button className="primary-button" type="submit" disabled={busy || !health?.paypal_configured}>
                      {busy ? <LoaderCircle className="spin" size={17} /> : <ArrowUpRight size={17} />}
                      {busy ? "Please wait…" : "Create Sandbox payment"}
                    </button>
                  </form>
                </section>
              </div>
              <section className="panel transactions-panel">
                <div className="panel-heading transactions-heading">
                  <div><div className="panel-icon"><ArrowDownLeft size={18} /></div><div><h2>Recent transactions</h2><p>Payment statuses stored by PayPilot AI.</p></div></div>
                  <button className="text-button" onClick={refresh}>Refresh <RefreshCw size={14} /></button>
                </div>
                {recent.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon"><WalletCards size={24} /></div><strong>No transactions yet</strong><p>Create your first Sandbox payment to see it here.</p></div>
                ) : (
                  <div className="table-wrap"><table>
                    <thead><tr><th>PAYMENT</th><th>ORDER ID</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
                    <tbody>{recent.map(t => (
                      <tr key={t.paypal_order_id}>
                        <td><div className="payment-cell"><div className="payment-symbol"><FileText size={16} /></div><div><strong>{t.description}</strong><small>{t.capture_id ? `Capture: ${t.capture_id}` : "PayPal order"}</small></div></div></td>
                        <td className="order-id">{t.paypal_order_id}</td>
                        <td>{t.created_at}</td>
                        <td className="amount-cell">{money(t.amount, t.currency)}</td>
                        <td><StatusPill status={t.status} /></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </section>
            </>
          )}

          {active === "AI Assistant" && (
            <div className="work-grid" style={{ gridTemplateColumns: "1fr" }}>
              <section className="panel assistant-panel">
                <div className="panel-heading">
                  <div><div className="panel-icon ai"><Bot size={18} /></div><div><h2>Ask PayPilot</h2><p>Describe what you want to do.</p></div></div>
                  <span className="ai-badge"><Sparkles size={12} /> AI assistant</span>
                </div>
                <div className="chat-welcome">
                  <div className="bot-avatar">
                    <Bot size={21} />
                  </div>
                  <div className="chat-bubble">
                    <strong>Hi! I'm PayPilot.</strong>
                    <p>
                      Type or speak a command. Ask about PayPilot records,
                      or prepare a Sandbox payment for review.
                    </p>
                  </div>
                </div>

                <div className="chat-messages">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-welcome ${msg.role === "user" ? "user-message" : "assistant-message"
                        }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="bot-avatar">
                          <Bot size={21} />
                        </div>
                      )}

                      <div className="chat-bubble">
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {busy && (
                    <div className="chat-welcome assistant-message">
                      <div className="bot-avatar">
                        <Bot size={21} />
                      </div>
                      <div className="chat-bubble">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>

                <div className="suggestions">
                  <button
                    type="button"
                    onClick={() =>
                      setCommand("Create a test payment for $25 for website design")
                    }
                  >
                    Create a $25 test payment <ArrowUpRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommand("Show my transactions")}
                  >
                    Show my transactions <ArrowUpRight size={13} />
                  </button>
                </div>

                <form className="chat-input-row" onSubmit={runAssistant}>
                  <input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Type your message in English..."
                  />

                  <button
                    type="button"
                    aria-label="Voice input"
                    title="Speak a command"
                    onClick={startVoiceInput}
                    disabled={busy}
                  >
                    <Mic size={17} />
                  </button>

                  <button
                    type="submit"
                    aria-label="Send command"
                    disabled={busy || !command.trim()}
                  >
                    <Send size={17} />
                  </button>
                </form>
                <div className="assistant-foot"><span className="live-dot" /> Drafts only — you confirm before checkout.</div>
              </section>
            </div>
          )}

          {active === "Invoices" && (
            <section className="panel">
              <div className="panel-heading">
                <div><div className="panel-icon"><FileText size={18} /></div><div><h2>Invoices</h2><p>Invoice management workspace.</p></div></div>
              </div>
              <div className="empty-state">
                <div className="empty-icon"><FileText size={24} /></div>
                <strong>Invoice module coming soon</strong>
                <p>Invoice creation and management will be added here.</p>
              </div>
            </section>
          )}


          <footer><span>PayPilot AI</span><span><ShieldCheck size={14} /> Test environment · Never enter real customer data</span></footer>
        </div>
      </main>
    </div>
  );
}
