import React, { useState } from 'react';
import { 
  Sparkles, Send, Plus, Trash2, Edit2, Search, BarChart3, 
  BookOpen, Clock, CheckCircle2, MessageSquare, RefreshCw, 
  Home, User, ShieldCheck, Headphones, CornerDownLeft, MessageCircle,
  Check, X, Lock
} from 'lucide-react';
import './App.css';

// --- MOTS DE PASSE D'ACCÈS AUX RÔLES ---
const ROLE_PASSWORDS = {
  client: '123',
  agent: '456',
  supervisor: '789'
};

// --- DONNÉES INITIALES ---
const INITIAL_FAQS = [
  {
    id: 1,
    question: "Comment réinitialiser mon mot de passe ?",
    answer: "Rendez-vous sur la page de connexion, cliquez sur 'Mot de passe oublié' et suivez les instructions envoyées par e-mail.",
    category: "Compte & Connexion"
  },
  {
    id: 2,
    question: "Quels sont les délais de livraison pour la France ?",
    answer: "Les délais standard sont de 48h à 72h ouvrées via Colissimo.",
    category: "Livraison"
  },
  {
    id: 3,
    question: "Comment télécharger ma facture ?",
    answer: "Connectez-vous à votre espace client, rubrique 'Mes Commandes', puis cliquez sur 'Télécharger la facture'.",
    category: "Facturation"
  }
];

const INITIAL_TICKETS = [
  {
    id: 'TK-101',
    client: 'Sophie Martin',
    subject: 'Erreur de paiement sur la commande #4590',
    status: 'OPEN',
    priority: 'HIGH',
    sentiment: 'angry',
    waitTime: '18 min',
    messages: [
      { id: 1, sender: 'client', text: 'Bonjour, ma carte a été débitée deux fois pour la commande #4590 ! Merci de régler cela rapidement.' }
    ]
  },
  {
    id: 'TK-102',
    client: 'Thomas Dubois',
    subject: 'Changement d adresse de livraison',
    status: 'OPEN',
    priority: 'MEDIUM',
    sentiment: 'neutral',
    waitTime: '5 min',
    messages: [
      { id: 1, sender: 'client', text: 'Bonjour, je souhaite modifier mon adresse avant l expédition.' }
    ]
  },
  {
    id: 'TK-103',
    client: 'Claire Bernard',
    subject: 'Question sur l offre Zen Premium',
    status: 'RESOLVED',
    priority: 'LOW',
    sentiment: 'happy',
    waitTime: '2 min',
    messages: [
      { id: 1, sender: 'client', text: 'Merci beaucoup pour vos explications claires !' },
      { id: 2, sender: 'agent', text: 'Ravi d avoir pu vous aider. Excellente journée !' }
    ]
  }
];

export default function App() {
  const [currentRole, setCurrentRole] = useState('landing');
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [faqs, setFaqs] = useState(INITIAL_FAQS);
  const [activeTicketId, setActiveTicketId] = useState('TK-101');
  const [chatInput, setChatInput] = useState('');
  const [copilotSuggestion, setCopilotSuggestion] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);

  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0];

  const handleSendMessage = (sender = 'agent') => {
    if (!chatInput.trim() || !activeTicket) return;
    const newMessage = { id: Date.now(), sender, text: chatInput };
    
    setTickets(tickets.map(t => {
      if (t.id === activeTicket.id) {
        return { ...t, messages: [...t.messages, newMessage] };
      }
      return t;
    }));
    setChatInput('');
  };

  const handleEditMessage = (ticketId, messageId, newText) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          messages: t.messages.map(m => m.id === messageId ? { ...m, text: newText } : m)
        };
      }
      return t;
    }));
  };

  const handleDeleteMessage = (ticketId, messageId) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          messages: t.messages.filter(m => m.id !== messageId)
        };
      }
      return t;
    }));
  };

  const handleDeleteTicket = (ticketId) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce ticket ?")) {
      const remainingTickets = tickets.filter(t => t.id !== ticketId);
      setTickets(remainingTickets);
      if (remainingTickets.length > 0) {
        setActiveTicketId(remainingTickets[0].id);
      }
    }
  };

  const handleGenerateCopilot = () => {
    setIsCopilotLoading(true);
    setCopilotSuggestion('');
    setTimeout(() => {
      const matchedFaq = faqs.find(f => 
        activeTicket?.subject.toLowerCase().includes(f.category.toLowerCase()) || 
        f.question.toLowerCase().includes('facture')
      );
      
      const suggestion = matchedFaq 
        ? `Bonjour ${activeTicket?.client || ''},\n\nConformément à notre procédure : ${matchedFaq.answer}\n\nN'hésitez pas si vous avez d'autres questions !`
        : `Bonjour ${activeTicket?.client || ''},\n\nJ'ai bien pris en compte votre demande concernant "${activeTicket?.subject}". Je vérifie votre dossier et je reviens vers vous immédiatement.`;

      setCopilotSuggestion(suggestion);
      setIsCopilotLoading(false);
    }, 1000);
  };

  const handleCreateTicket = (newTicket) => {
    setTickets([newTicket, ...tickets]);
    setActiveTicketId(newTicket.id);
    setIsAddTicketModalOpen(false);
  };

  return (
    <div className="app-viewport">
      {currentRole === 'landing' ? (
        <LandingScreen onSelectRole={setCurrentRole} />
      ) : (
        <>
          <Navbar 
            activeRole={currentRole} 
            onHomeClick={() => setCurrentRole('landing')} 
          />

          {currentRole === 'client' && (
            <ClientView 
              tickets={tickets}
              activeTicket={activeTicket}
              setActiveTicketId={setActiveTicketId}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendMessage={() => handleSendMessage('client')}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onDeleteTicket={handleDeleteTicket}
              onOpenAddTicket={() => setIsAddTicketModalOpen(true)}
            />
          )}

          {currentRole === 'agent' && (
            <div className="three-columns-layout">
              <aside className="column-sidebar">
                <div className="sidebar-header-row">
                  <div className="section-title">
                    <MessageCircle size={14} /> Tickets Actifs ({tickets.length})
                  </div>
                  <button className="btn-add-ticket" onClick={() => setIsAddTicketModalOpen(true)}>
                    <Plus size={13} /> Nouveau
                  </button>
                </div>

                <div className="ticket-list">
                  {tickets.map((t) => (
                    <div 
                      key={t.id} 
                      className={`ticket-card ${t.id === activeTicketId ? 'active' : ''}`}
                      onClick={() => setActiveTicketId(t.id)}
                    >
                      <div className="ticket-card-header">
                        <div className="client-header-group">
                          <span className="client-name">{t.client}</span>
                        </div>
                        <span className="ticket-id">{t.id}</span>
                      </div>
                      <div className="ticket-subject">{t.subject}</div>

                      <div className="ticket-tags">
                        <span className={`badge-pill tag-${t.status.toLowerCase()}`}>{t.status}</span>
                        <span className={`badge-pill badge-priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                        <span className={`badge-pill cell-sentiment-${t.sentiment}`}>{t.sentiment}</span>
                        <span className="badge-pill cell-wait">{t.waitTime}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                  <div className="section-title">
                    <BookOpen size={14} /> Aperçu RAG FAQ ({faqs.length})
                  </div>
                  <div className="faq-list">
                    {faqs.slice(0, 2).map((f) => (
                      <div key={f.id} className="faq-card">
                        <h5>{f.question}</h5>
                        <p>{f.answer.slice(0, 60)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <main className="column-chat">
                <div className="chat-header">
                  <div>
                    <h3>{activeTicket?.subject}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Client : <strong>{activeTicket?.client}</strong> ({activeTicket?.id})
                    </span>
                  </div>
                  <div className="chat-header-actions">
                    <span className={`badge-pill tag-${activeTicket?.status.toLowerCase()}`}>
                      {activeTicket?.status}
                    </span>
                  </div>
                </div>

                <div className="messages-list">
                  {activeTicket?.messages.map((msg) => (
                    <div key={msg.id || Math.random()} className={`message-bubble ${msg.sender}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>

                <div className="chat-input-box">
                  <textarea 
                    rows="3" 
                    placeholder="Saisissez votre réponse au client..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <div className="chat-input-footer">
                    <button className="btn-send" onClick={() => handleSendMessage('agent')}>
                      Envoyer <Send size={14} />
                    </button>
                  </div>
                </div>
              </main>

              <aside className="column-copilot">
                <div className="copilot-header">
                  <Sparkles size={18} /> Copilot RAG IA
                </div>

                <button 
                  className={`btn-copilot ${isCopilotLoading ? 'loading' : ''}`} 
                  onClick={handleGenerateCopilot}
                  disabled={isCopilotLoading}
                >
                  <Sparkles size={16} /> 
                  {isCopilotLoading ? 'Analyse RAG en cours...' : 'Générer la Réponse IA'}
                </button>

                {copilotSuggestion && (
                  <div className="suggestion-box">
                    <p>{copilotSuggestion}</p>
                    <button 
                      className="btn-insert"
                      onClick={() => setChatInput(copilotSuggestion)}
                    >
                      <CornerDownLeft size={14} /> Insérer dans le Chat
                    </button>
                  </div>
                )}
              </aside>
            </div>
          )}

          {currentRole === 'supervisor' && (
            <SupervisorView 
              faqs={faqs} 
              setFaqs={setFaqs} 
              tickets={tickets} 
            />
          )}
        </>
      )}

      {isAddTicketModalOpen && (
        <ModalAddTicket 
          onClose={() => setIsAddTicketModalOpen(false)} 
          onSubmit={handleCreateTicket} 
        />
      )}
    </div>
  );
}

// ================= LANDING SCREEN AVEC POPUP MOT DE PASSE =================
function LandingScreen({ onSelectRole }) {
  const [selectedRoleModal, setSelectedRoleModal] = useState(null);

  return (
    <div className="landing-screen">
      <div className="landing-header">
        <div className="brand-badge"><Sparkles size={24} /></div>
        <h1>ZenSupport Copilot</h1>
        <p>Sélectionnez un rôle pour vous connecter</p>
      </div>

      <div className="role-grid">
        <div className="role-box" onClick={() => setSelectedRoleModal('client')}>
          <div className="role-box-icon"><User size={22} /></div>
          <h3>Espace Client</h3>
          <p>Consulter, créer, corriger ou supprimer vos tickets et messages.</p>
          <button className="role-box-btn">Accéder comme Client (Code: 123)</button>
        </div>

        <div className="role-box" onClick={() => setSelectedRoleModal('agent')}>
          <div className="role-box-icon"><Headphones size={22} /></div>
          <h3>Espace Agent</h3>
          <p>Gestion des tickets, messagerie et assistance Copilot IA.</p>
          <button className="role-box-btn">Accéder comme Agent (Code: 456)</button>
        </div>

        <div className="role-box" onClick={() => setSelectedRoleModal('supervisor')}>
          <div className="role-box-icon"><ShieldCheck size={22} /></div>
          <h3>Espace Superviseur</h3>
          <p>Gestion CRUD de la base FAQ RAG et tableau de bord.</p>
          <button className="role-box-btn">Accéder comme Superviseur (Code: 789)</button>
        </div>
      </div>

      {/* POPUP Saisie de mot de passe */}
      {selectedRoleModal && (
        <ModalPassword 
          role={selectedRoleModal}
          onClose={() => setSelectedRoleModal(null)}
          onSuccess={(role) => {
            setSelectedRoleModal(null);
            onSelectRole(role);
          }}
        />
      )}
    </div>
  );
}

// ================= MODALE POPUP MOT DE PASSE =================
function ModalPassword({ role, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getRoleLabel = () => {
    if (role === 'client') return 'Client';
    if (role === 'agent') return 'Agent';
    return 'Superviseur';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ROLE_PASSWORDS[role]) {
      onSuccess(role);
    } else {
      setErrorMsg('Mot de passe incorrect ! Veuillez réinstaller le code valide.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <div className="modal-icon"><Lock size={20} /></div>
        <h3>Connexion Espace {getRoleLabel()}</h3>
        <p>Veuillez entrer le mot de passe requis pour accéder à cet espace (Code: <strong>{ROLE_PASSWORDS[role]}</strong>).</p>

        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label>Mot de Passe</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Ex: 123"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
              autoFocus
              required
            />
            {errorMsg && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                {errorMsg}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-modal-confirm">
              Accéder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= NAVBAR =================
function Navbar({ activeRole, onHomeClick }) {
  const getRoleLabel = () => {
    if (activeRole === 'client') return 'Client';
    if (activeRole === 'agent') return 'Agent Support';
    return 'Superviseur';
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-brand">
        <Sparkles size={18} className="brand-icon" /> ZenSupport IA
      </div>
      <div className="navbar-right">
        <div className="role-badge">
          <span className="active-dot" />
          Rôle : <strong>{getRoleLabel()}</strong>
        </div>
        <button className="btn-home" onClick={onHomeClick} title="Revenir au menu principal">
          <Home size={16} />
        </button>
      </div>
    </nav>
  );
}

// ================= ESPACE CLIENT =================
function ClientView({ 
  tickets, activeTicket, setActiveTicketId, 
  chatInput, setChatInput, onSendMessage, 
  onEditMessage, onDeleteMessage, onDeleteTicket,
  onOpenAddTicket
}) {
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleStartEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditText(msg.text);
  };

  const handleSaveEdit = (msgId) => {
    if (editText.trim()) {
      onEditMessage(activeTicket.id, msgId, editText);
    }
    setEditingMsgId(null);
  };

  return (
    <div className="three-columns-layout" style={{ gridTemplateColumns: '300px 1fr' }}>
      {/* SIDEBAR CLIENT SANS LE BOUTON REVENIR */}
      <aside className="column-sidebar">
        <div className="sidebar-header-row">
          <button className="btn-add-ticket" onClick={onOpenAddTicket} style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={13} /> Nouveau Ticket
          </button>
        </div>

        <div className="section-title" style={{ marginTop: '14px' }}>
          <MessageSquare size={14} /> Mes Demandes ({tickets.length})
        </div>

        <div className="ticket-list">
          {tickets.map((t) => (
            <div 
              key={t.id} 
              className={`ticket-card ${t.id === activeTicket?.id ? 'active' : ''}`}
              onClick={() => setActiveTicketId(t.id)}
            >
              <div className="ticket-card-header">
                <span className="client-name">{t.client}</span>
                <span className="ticket-id">{t.id}</span>
              </div>
              <div className="ticket-subject">{t.subject}</div>

              <div className="ticket-tags">
                <span className={`badge-pill tag-${t.status.toLowerCase()}`}>{t.status}</span>
                <span className={`badge-pill badge-priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                <span className={`badge-pill cell-sentiment-${t.sentiment}`}>{t.sentiment}</span>
                <span className="badge-pill cell-wait">{t.waitTime}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* CHAT CLIENT */}
      <main className="column-chat">
        <div className="chat-header">
          <div>
            <h3>{activeTicket?.subject || 'Sélectionnez une demande'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ticket N° : <strong>{activeTicket?.id}</strong>
            </span>
          </div>
          
          {/* NOUVEAU STYLE DU BOUTON SUPPRIMER LE TICKET */}
          {activeTicket && (
            <button 
              onClick={() => onDeleteTicket(activeTicket.id)}
              style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '7px 14px',
                fontWeight: '600',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
            >
              <Trash2 size={14} /> Supprimer le ticket
            </button>
          )}
        </div>

        <div className="messages-list">
          {!activeTicket || activeTicket.messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
              Aucun message dans ce ticket.
            </p>
          ) : (
            activeTicket.messages.map((msg) => (
              <div key={msg.id || Math.random()} className={`message-bubble ${msg.sender}`}>
                {editingMsgId === msg.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <textarea 
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)}
                      rows="2"
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8rem' }}
                    />
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingMsgId(null)} className="btn-modal-cancel" style={{ padding: '2px 6px' }}>
                        <X size={12} />
                      </button>
                      <button onClick={() => handleSaveEdit(msg.id)} className="btn-modal-confirm" style={{ padding: '2px 8px' }}>
                        <Check size={12} /> Valider
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>{msg.text}</span>
                    {msg.sender === 'client' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleStartEdit(msg)} 
                          title="Corriger"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => onDeleteMessage(activeTicket.id, msg.id)} 
                          title="Supprimer"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="chat-input-box">
          <textarea 
            rows="3" 
            placeholder="Posez votre question ou ajoutez une précision..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <div className="chat-input-footer">
            <button className="btn-send" onClick={onSendMessage}>
              Envoyer <Send size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ================= ESPACE SUPERVISEUR & CRUD FAQ =================
function SupervisorView({ faqs, setFaqs, tickets }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'Général' });

  const categoryStats = [
    { label: 'Technique', count: 12, percentage: 50, color: 'var(--zen-green)' },
    { label: 'Facturation', count: 6, percentage: 25, color: '#3b82f6' },
    { label: 'Compte & Accès', count: 4, percentage: 17, color: '#f59e0b' },
    { label: 'Livraison', count: 2, percentage: 8, color: '#ef4444' },
  ];

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '', category: 'Général' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer, category: faq.category || 'Général' });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Voulez-vous supprimer cette question de la FAQ RAG ?')) {
      setFaqs(faqs.filter(f => f.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) return;

    if (editingFaq) {
      setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, ...formData } : f));
    } else {
      setFaqs([{ id: Date.now(), ...formData }, ...faqs]);
    }
    setIsModalOpen(false);
  };

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="supervisor-container">
      <header className="supervisor-header">
        <div className="supervisor-title">
          <h2>Espace Superviseur</h2>
          <span className="rag-sync-badge">
            <Sparkles size={14} /> Index RAG Actif ({faqs.length} connaissances)
          </span>
        </div>

        <div className="supervisor-tabs">
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} /> Dashboard Analytique
          </button>
          <button 
            className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <BookOpen size={16} /> Gestion FAQ (RAG)
          </button>
        </div>
      </header>

      {activeTab === 'analytics' ? (
        <div className="analytics-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon icon-green"><MessageSquare size={20} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Tickets Traités</span>
                <span className="kpi-value">{tickets.length}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon icon-blue"><Clock size={20} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Temps Moyen de Réponse</span>
                <span className="kpi-value">11 min</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon icon-purple"><Sparkles size={20} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Utilisation Copilot</span>
                <span className="kpi-value">88%</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon icon-emerald"><CheckCircle2 size={20} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Taux de Résolution</span>
                <span className="kpi-value">95%</span>
              </div>
            </div>
          </div>

          <div className="analytics-charts-grid">
            <div className="chart-card">
              <div className="card-header">
                <h3>Répartition par Catégorie</h3>
              </div>
              <div className="category-list">
                {categoryStats.map((cat, idx) => (
                  <div key={idx} className="category-item">
                    <div className="category-info">
                      <span>{cat.label}</span>
                      <strong>{cat.count} tickets ({cat.percentage}%)</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <div className="card-header">
                <h3>Performance du RAG IA</h3>
              </div>
              <div className="ai-stats-box">
                <div className="ai-stat-row">
                  <span>Suggestions IA validées immédiatement</span>
                  <strong className="text-green">68%</strong>
                </div>
                <div className="ai-stat-row">
                  <span>Suggestions modifiées par l'agent</span>
                  <strong className="text-orange">22%</strong>
                </div>
                <div className="ai-stat-row">
                  <span>Suggestions ignorées</span>
                  <strong className="text-red">10%</strong>
                </div>
                <div className="rag-status-banner">
                  <RefreshCw size={14} /> Base de connaissances synchronisée en temps réel
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="faq-crud-view">
          <div className="crud-toolbar">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Rechercher une question FAQ..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-add-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Ajouter une FAQ
            </button>
          </div>

          <div className="faq-table-container">
            <table className="faq-table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Question</th>
                  <th>Réponse RAG</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-table">Aucune question FAQ trouvée.</td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq) => (
                    <tr key={faq.id}>
                      <td>
                        <span className="faq-cat-badge">{faq.category || 'Général'}</span>
                      </td>
                      <td className="col-question"><strong>{faq.question}</strong></td>
                      <td className="col-answer">{faq.answer}</td>
                      <td className="col-actions">
                        <button className="btn-action edit" onClick={() => handleOpenEdit(faq)} title="Éditer">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn-action delete" onClick={() => handleDelete(faq.id)} title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            <div className="modal-icon"><BookOpen size={20} /></div>
            <h3>{editingFaq ? 'Modifier la FAQ RAG' : 'Ajouter une FAQ RAG'}</h3>
            <p>Ce contenu enrichit directement les réponses générées par le Copilot IA.</p>

            <form onSubmit={handleSave} className="ticket-form">
              <div className="form-group">
                <label>Catégorie</label>
                <select 
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Général">Général</option>
                  <option value="Technique">Technique</option>
                  <option value="Facturation">Facturation</option>
                  <option value="Livraison">Livraison</option>
                </select>
              </div>

              <div className="form-group">
                <label>Question du Client</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Quel est le délai de remboursement ?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Réponse Officielle (RAG Contexte)</label>
                <textarea 
                  className="form-textarea" 
                  rows="4"
                  placeholder="Rédigez la réponse de référence..."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-modal-confirm">
                  {editingFaq ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= MODALE CREATION DE TICKET =================
function ModalAddTicket({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    client: '',
    subject: '',
    priority: 'MEDIUM',
    sentiment: 'neutral',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.client || !formData.subject) return;

    const newTicket = {
      id: `TK-${Math.floor(100 + Math.random() * 900)}`,
      client: formData.client,
      subject: formData.subject,
      status: 'OPEN',
      priority: formData.priority,
      sentiment: formData.sentiment,
      waitTime: 'À l instant',
      messages: formData.message ? [{ id: Date.now(), sender: 'client', text: formData.message }] : []
    };

    onSubmit(newTicket);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-large">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <div className="modal-icon"><Plus size={20} /></div>
        <h3>Nouveau Ticket Client</h3>
        <p>Soumettre une nouvelle demande au support technique.</p>

        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nom du Client</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Jean Dupont"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Priorité</label>
              <select 
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Sujet du Ticket</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Problème d accès à mon compte"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Message Initial</label>
            <textarea 
              className="form-textarea" 
              rows="3"
              placeholder="Décrivez votre problème..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-modal-confirm">
              Soumettre le Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}