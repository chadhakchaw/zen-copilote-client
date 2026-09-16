import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, User, Send, Bot, CheckCircle, Clock, 
  Shield, Headphones, Home, Plus, X 
} from 'lucide-react';
import './App.css';

function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [copilotSuggestion, setCopilotSuggestion] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, faqsRes] = await Promise.all([
          fetch('http://localhost:5000/api/tickets'),
          fetch('http://localhost:5000/api/faq')
        ]);
        const ticketsData = await ticketsRes.json();
        const faqsData = await faqsRes.json();

        setTickets(ticketsData);
        setFaqs(faqsData);
        if (ticketsData.length > 0) setSelectedTicket(ticketsData[0]);
      } catch (err) {
        console.error('Erreur de chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getWaitingTime = (createdAt) => {
    if (!createdAt) return '0m';
    const diffInMinutes = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60));
    if (diffInMinutes < 60) return `${Math.max(0, diffInMinutes)}m`;
    return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
  };

  const handleGenerateSuggestion = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/copilot/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id }),
      });
      const data = await response.json();
      setCopilotSuggestion(data.suggestion || "Impossible de générer une suggestion.");
    } catch (error) {
      setCopilotSuggestion("Erreur lors de la connexion avec le serveur IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText,
          senderRole: currentRole === 'CLIENT' ? 'CLIENT' : 'AGENT',
          status: currentRole === 'CLIENT' ? 'IN_PROGRESS' : 'RESOLVED',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTicket = data.id ? data : {
          ...selectedTicket,
          messages: [...(selectedTicket.messages || []), { id: Date.now(), content: replyText, senderRole: currentRole === 'CLIENT' ? 'CLIENT' : 'AGENT' }]
        };

        setSelectedTicket(updatedTicket);
        setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
        setReplyText('');
        setCopilotSuggestion('');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  if (loading) return <div className="loading-state">Chargement de la plateforme...</div>;

  /* ================= PAGE 1 : SELECTION DES 3 ROLES ================= */
  if (!currentRole) {
    return (
      <div className="landing-screen">
        <div className="landing-header">
          <div className="brand-badge"><Bot size={32} /></div>
          <h1>Zen Copilot IA</h1>
          <p>Sélectionnez votre espace pour accéder à la plateforme</p>
        </div>

        <div className="role-grid">
          <div className="role-box" onClick={() => setCurrentRole('CLIENT')}>
            <div className="role-box-icon client-theme"><User size={30} /></div>
            <h3>Espace Client</h3>
            <p>Suivez vos tickets en cours et échangez directement avec le support client.</p>
            <button className="role-box-btn">Accéder comme Client</button>
          </div>

          <div className="role-box" onClick={() => setCurrentRole('AGENT')}>
            <div className="role-box-icon agent-theme"><Headphones size={30} /></div>
            <h3>Agent Support</h3>
            <p>Traitez la boîte de réception des tickets assisté par l'intelligence artificielle.</p>
            <button className="role-box-btn">Accéder comme Agent</button>
          </div>

          <div className="role-box" onClick={() => setCurrentRole('SUPERVISOR')}>
            <div className="role-box-icon supervisor-theme"><Shield size={30} /></div>
            <h3>Superviseur</h3>
            <p>Supervisez l'activité globale et gérez la base de connaissances FAQ.</p>
            <button className="role-box-btn">Accéder comme Superviseur</button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= PAGE 2 : INTERFACE DE TRAVAIL (NAVBAR + 3 COLONNES) ================= */
  return (
    <div className="app-viewport">
      {/* NAVBAR NATIVE SUR TOUTE LA LARGEUR */}
      <header className="main-navbar">
        <div className="navbar-brand">
          <Bot size={22} className="brand-icon" />
          <span>Zen Copilot IA</span>
        </div>

        <div className="navbar-right">
          <div className="role-badge">
            <span className="active-dot"></span>
            <span>Connecté en tant que : <strong>{currentRole === 'CLIENT' ? 'Client' : currentRole === 'AGENT' ? 'Agent Support' : 'Superviseur'}</strong></span>
          </div>

          <button 
            className="btn-home" 
            title="Retour à l'accueil"
            onClick={() => setShowExitModal(true)}
          >
            <Home size={18} />
          </button>
        </div>
      </header>

      {/* POPUP CONFIRMATION RETOUR */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close-btn" onClick={() => setShowExitModal(false)}>
              <X size={16} />
            </button>
            <div className="modal-icon"><Home size={26} /></div>
            <h3>Retourner à l'accueil ?</h3>
            <p>Êtes-vous sûr de vouloir quitter cet espace et revenir à la sélection des rôles ?</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowExitModal(false)}>Annuler</button>
              <button 
                className="btn-modal-confirm" 
                onClick={() => {
                  setShowExitModal(false);
                  setCurrentRole(null);
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT PRINCIPAL : 3 COLONNES FIXES */}
      <div className="three-columns-layout">
        {/* COLONNE 1: SIDEBAR */}
        <aside className="column-sidebar">
          <div className="sidebar-section">
            <div className="section-title">
              <MessageSquare size={16} />
              <span>{currentRole === 'CLIENT' ? 'MES TICKETS' : 'INBOX TICKETS'}</span>
            </div>
            <div className="ticket-list">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className={`ticket-card ${selectedTicket?.id === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(t)}
                >
                  <div className="ticket-card-header">
                    <span className="client-name">{t.client?.name || 'Client'}</span>
                    <span className="wait-time"><Clock size={11} /> {getWaitingTime(t.createdAt)}</span>
                  </div>
                  <h4 className="ticket-subject">{t.subject}</h4>
                  
                  {currentRole !== 'CLIENT' && (
                    <div className="ticket-tags">
                      <span className={`tag channel-tag ${t.channel?.toLowerCase()}`}>{t.channel}</span>
                      {t.priority && <span className={`tag priority-tag ${t.priority?.toLowerCase()}`}>P: {t.priority}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-title">
              <Bot size={16} />
              <span>BASE FAQ</span>
              {currentRole === 'SUPERVISOR' && <button className="btn-add-faq"><Plus size={12} /> Ajouter</button>}
            </div>
            <div className="faq-list">
              {faqs.map((faq) => (
                <div key={faq.id} className="faq-card">
                  <h5>{faq.question}</h5>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* COLONNE 2: ZONE CHAT */}
        <main className="column-chat">
          {selectedTicket ? (
            <>
              <header className="chat-header">
                <div>
                  <h3>{selectedTicket.subject}</h3>
                  <span className="client-info"><User size={13} /> {selectedTicket.client?.name}</span>
                </div>
                <span className={`badge-status ${selectedTicket.status?.toLowerCase()}`}>{selectedTicket.status}</span>
              </header>

              <div className="messages-list">
                {selectedTicket.messages?.map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.senderRole === 'CLIENT' ? 'client' : 'agent'}`}>
                    <span className="sender-label">{msg.senderRole === 'CLIENT' ? 'Client' : 'Agent Support'}</span>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>

              <div className="chat-input-box">
                <textarea
                  rows={3}
                  placeholder={currentRole === 'CLIENT' ? "Écrivez votre message..." : "Saisissez votre réponse..."}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="input-actions">
                  <button className="btn-send" onClick={handleSendMessage}>
                    <Send size={15} /> {currentRole === 'CLIENT' ? 'Envoyer' : 'Envoyer & Résoudre'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-chat">Sélectionnez un ticket pour voir la discussion</div>
          )}
        </main>

        {/* COLONNE 3: PANNEAU COPILOT */}
        <aside className="column-copilot">
          <div className="copilot-header">
            <Bot size={18} />
            <span>Zen Copilot IA</span>
          </div>

          {currentRole === 'CLIENT' ? (
            <div className="copilot-client-info">
              <p>💡 <strong>Assistance automatique</strong></p>
              <p>Vos réponses sont analysées en temps réel par notre assistant IA pour accélérer le traitement de votre demande.</p>
            </div>
          ) : (
            <>
              <button className="btn-copilot" onClick={handleGenerateSuggestion} disabled={isGenerating}>
                {isGenerating ? 'Analyse...' : 'Demander une suggestion IA'}
              </button>
              {copilotSuggestion && (
                <div className="suggestion-box">
                  <p>{copilotSuggestion}</p>
                  <button className="btn-insert" onClick={() => setReplyText(copilotSuggestion)}>
                    <CheckCircle size={15} /> Insérer dans la réponse
                  </button>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;