import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, User, Send, Bot, CheckCircle, Clock, 
  Shield, Headphones, Home, Plus, X, Lock
} from 'lucide-react';
import './App.css';

function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // États pour la modal de mot de passe
  const [pendingRole, setPendingRole] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // États pour la création de ticket client
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newChannel, setNewChannel] = useState('WEB');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [ticketError, setTicketError] = useState('');

  // États pour les données de l'application
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [copilotSuggestion, setCopilotSuggestion] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Chargement des données au démarrage
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

  // Clic sur une carte de rôle
  const handleRoleClick = (role) => {
    setPendingRole(role);
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  // Annulation de la saisie du mot de passe
  const handleCancelPassword = () => {
    setShowPasswordModal(false);
    setPendingRole(null);
    setPasswordInput('');
    setPasswordError('');
  };

  // Vérification du mot de passe via l'API Backend (BDD)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: pendingRole,
          password: passwordInput,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentRole(pendingRole);
        setPendingRole(null);
        setShowPasswordModal(false);
        setPasswordInput('');
      } else {
        setPasswordError(data.message || 'Mot de passe incorrect');
      }
    } catch (err) {
      setPasswordError('Erreur de connexion avec le serveur');
    }
  };

  // Création d'un ticket par le client
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setTicketError('');

    if (!newSubject.trim() || !newDescription.trim()) {
      setTicketError('Veuillez remplir le sujet et la description.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          channel: newChannel,
          priority: newPriority,
          description: newDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTickets((prev) => [data, ...prev]);
        setSelectedTicket(data);
        setShowNewTicketModal(false);
        setNewSubject('');
        setNewDescription('');
        setTicketError('');
      } else {
        setTicketError(data.message || 'Erreur lors de la création du ticket');
      }
    } catch (error) {
      console.error('Erreur création ticket:', error);
      setTicketError('Impossible de contacter le serveur backend.');
    }
  };

  // Calcul du temps d'attente
  const getWaitingTime = (createdAt) => {
    if (!createdAt) return '0m';
    const diffInMinutes = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60));
    if (diffInMinutes < 60) return `${Math.max(0, diffInMinutes)}m`;
    return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
  };

  // Demander une suggestion à l'IA
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
      setCopilotSuggestion(data.suggestion || "Aucune suggestion disponible.");
    } catch (error) {
      setCopilotSuggestion("Erreur de connexion avec le serveur IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Envoyer un message
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
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  if (loading) return <div className="loading-state">Chargement de l'application...</div>;

  /* ================= PAGE 1 : ÉCRAN DE SÉLECTION DES RÔLES ================= */
  if (!currentRole) {
    return (
      <div className="landing-screen">
        <div className="landing-header">
          <div className="brand-badge"><Bot size={28} /></div>
          <h1>Zen Copilot IA</h1>
          <p>Choisissez un espace de travail pour continuer</p>
        </div>

        <div className="role-grid">
          <div className="role-box" onClick={() => handleRoleClick('CLIENT')}>
            <div className="role-box-icon"><User size={24} /></div>
            <h3>Espace Client</h3>
            <p>Accédez à vos demandes et suivez l'état de vos tickets.</p>
            <button className="role-box-btn">Entrer comme Client</button>
          </div>

          <div className="role-box" onClick={() => handleRoleClick('AGENT')}>
            <div className="role-box-icon"><Headphones size={24} /></div>
            <h3>Agent Support</h3>
            <p>Gérez la résolution des tickets assisté par le Copilot IA.</p>
            <button className="role-box-btn">Entrer comme Agent</button>
          </div>

          <div className="role-box" onClick={() => handleRoleClick('SUPERVISOR')}>
            <div className="role-box-icon"><Shield size={24} /></div>
            <h3>Superviseur</h3>
            <p>Supervisez la plateforme et gérez la base de connaissances FAQ.</p>
            <button className="role-box-btn">Entrer comme Superviseur</button>
          </div>
        </div>

        {/* MODAL MOT DE PASSE */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <button className="modal-close-btn" onClick={handleCancelPassword}>
                <X size={16} />
              </button>
              <div className="modal-icon"><Lock size={20} /></div>
              <h3>Accès sécurisé</h3>
              <p>
                Entrez le mot de passe pour l'espace{' '}
                <strong>
                  {pendingRole === 'CLIENT' ? 'Client' : pendingRole === 'AGENT' ? 'Agent Support' : 'Superviseur'}
                </strong>
              </p>
              
              <form onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mot de passe"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />

                {passwordError && <div className="form-error" style={{ marginTop: '10px' }}>{passwordError}</div>}

                <div className="modal-actions" style={{ marginTop: '14px' }}>
                  <button type="button" className="btn-modal-cancel" onClick={handleCancelPassword}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-modal-confirm">
                    Valider
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================= PAGE 2 : INTERFACE PRINCIPALE (3 COLONNES) ================= */
  return (
    <div className="app-viewport">
      {/* NAVBAR SUPÉRIEURE */}
      <header className="main-navbar">
        <div className="navbar-brand">
          <Bot size={20} className="brand-icon" />
          <span>Zen Copilot IA</span>
        </div>

        <div className="navbar-right">
          <div className="role-badge">
            <span className="active-dot"></span>
            <span>Rôle : <strong>{currentRole === 'CLIENT' ? 'Client' : currentRole === 'AGENT' ? 'Agent Support' : 'Superviseur'}</strong></span>
          </div>

          <button 
            className="btn-home" 
            title="Changer de rôle"
            onClick={() => setShowExitModal(true)}
          >
            <Home size={16} />
          </button>
        </div>
      </header>

      {/* MODAL RETOUR ÉCRAN D'ACCUEIL */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close-btn" onClick={() => setShowExitModal(false)}>
              <X size={16} />
            </button>
            <div className="modal-icon"><Home size={22} /></div>
            <h3>Changer de rôle ?</h3>
            <p>Voulez-vous quitter cet espace et revenir au choix des rôles ?</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowExitModal(false)}>
                Annuler
              </button>
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

      {/* MODAL DE CRÉATION DE TICKET (CLIENT) */}
      {showNewTicketModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <button className="modal-close-btn" onClick={() => setShowNewTicketModal(false)}>
              <X size={16} />
            </button>
            <div className="modal-icon"><Plus size={20} /></div>
            <h3>Nouveau Ticket de Support</h3>
            <p>Décrivez votre problème, notre équipe vous répondra dans les plus brefs délais.</p>

            <form onSubmit={handleCreateTicket} className="ticket-form">
              {ticketError && <div className="form-error">{ticketError}</div>}

              <div className="form-group">
                <label>Sujet de la demande</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Problème de connexion, Erreur de facturation..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Canal</label>
                  <select className="form-select" value={newChannel} onChange={(e) => setNewChannel(e.target.value)}>
                    <option value="WEB">Web</option>
                    <option value="EMAIL">Email</option>
                    <option value="CHAT">Chat</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priorité</label>
                  <select className="form-select" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description détaillée</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Expliquez en détail la difficulté rencontrée..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-modal-cancel" onClick={() => setShowNewTicketModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-modal-confirm">
                  Créer le ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAYOUT 3 COLONNES */}
      <div className="three-columns-layout">
        {/* COLONNE 1 : TICKETS ET FAQ */}
        <aside className="column-sidebar">
          <div className="sidebar-section">
            <div className="section-title">
              <MessageSquare size={14} />
              <span>{currentRole === 'CLIENT' ? 'MES TICKETS' : 'INBOX TICKETS'}</span>
              {currentRole === 'CLIENT' && (
                <button className="btn-add-faq" onClick={() => setShowNewTicketModal(true)}>
                  <Plus size={10} /> Nouveau ticket
                </button>
              )}
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
                      <span className="tag">{t.channel}</span>
                      {t.priority && <span className="tag">P: {t.priority}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-title">
              <Bot size={14} />
              <span>BASE FAQ</span>
              {currentRole === 'SUPERVISOR' && <button className="btn-add-faq"><Plus size={10} /> Ajouter</button>}
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

        {/* COLONNE 2 : CHAT PRINCIPAL */}
        <main className="column-chat">
          {selectedTicket ? (
            <>
              <header className="chat-header">
                <div>
                  <h3>{selectedTicket.subject}</h3>
                  <span className="client-info"><User size={12} /> {selectedTicket.client?.name}</span>
                </div>
                <span className="badge-status">{selectedTicket.status}</span>
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
                  placeholder={currentRole === 'CLIENT' ? "Écrivez votre message..." : "Rédigez votre réponse au client..."}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="input-actions">
                  <button className="btn-send" onClick={handleSendMessage}>
                    <Send size={14} /> {currentRole === 'CLIENT' ? 'Envoyer' : 'Envoyer & Résoudre'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-chat">Sélectionnez un ticket pour ouvrir la discussion</div>
          )}
        </main>

        {/* COLONNE 3 : COPILOT IA */}
        <aside className="column-copilot">
          <div className="copilot-header">
            <Bot size={16} />
            <span>Zen Copilot IA</span>
          </div>

          {currentRole === 'CLIENT' ? (
            <div className="copilot-client-info">
              <p>💡 <strong>Assistance automatique</strong></p>
              <p>Vos messages sont analysés en temps réel pour accélérer la prise en charge par notre équipe support.</p>
            </div>
          ) : (
            <>
              <button className="btn-copilot" onClick={handleGenerateSuggestion} disabled={isGenerating}>
                {isGenerating ? 'Analyse en cours...' : 'Générer une suggestion IA'}
              </button>
              {copilotSuggestion && (
                <div className="suggestion-box">
                  <p>{copilotSuggestion}</p>
                  <button className="btn-insert" onClick={() => setReplyText(copilotSuggestion)}>
                    <CheckCircle size={14} /> Copier dans le message
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