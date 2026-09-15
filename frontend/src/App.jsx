import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Send, BookOpen, MessageSquare, Sparkles, Check } from 'lucide-react';
import './App.css';

function App() {
  const [faqs, setFaqs] = useState([]);
  const [clientMessage, setClientMessage] = useState('Comment réinitialiser mon mot de passe ?');
  const [agentReply, setAgentReply] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/api/faq')
      .then((res) => setFaqs(res.data))
      .catch((err) => console.error('Erreur chargement FAQ:', err));
  }, []);

  const handleFetchSuggestion = async () => {
    if (!clientMessage) return;
    setLoadingAi(true);
    try {
      const response = await axios.post('http://localhost:5000/api/copilot/suggest', {
        message: clientMessage,
      });
      setAiSuggestion(response.data.suggestion);
    } catch (error) {
      console.error('Erreur Copilot:', error);
      setAiSuggestion('Impossible de générer une suggestion pour le moment.');
    } finally {
      setLoadingAi(false);
    }
  };

  const applySuggestion = () => {
    setAgentReply(aiSuggestion);
  };

  return (
    <div className="app-container">
      {/* Sidebar des articles FAQ */}
      <aside className="sidebar">
        <h2><BookOpen size={20} /> Base FAQ</h2>
        {faqs.map((faq) => (
          <div key={faq.id} className="faq-card">
            <h4>{faq.question}</h4>
            <p>{faq.answer}</p>
          </div>
        ))}
      </aside>

      {/* Zone centrale du ticket agent */}
      <main className="main-chat">
        <header className="chat-header">
          <MessageSquare size={20} />
          <h3>Ticket #101 - Demande client</h3>
        </header>

        <div className="chat-messages">
          <div className="message-box client">
            <strong>Client :</strong>
            <p>{clientMessage}</p>
          </div>

          {agentReply && (
            <div className="message-box agent">
              <strong>Agent :</strong>
              <p>{agentReply}</p>
            </div>
          )}
        </div>

        <div className="reply-section">
          <textarea
            placeholder="Saisissez votre réponse..."
            value={agentReply}
            onChange={(e) => setAgentReply(e.target.value)}
          />
          <div className="actions-bar">
            <button className="btn btn-primary">
              <Send size={16} /> Envoyer la réponse
            </button>
          </div>
        </div>
      </main>

      {/* Panneau latéral Copilot IA */}
      <aside className="copilot-panel">
        <div className="copilot-header">
          <Sparkles size={22} />
          <h2>Zen Copilot IA</h2>
        </div>

        <button 
          className="btn btn-copilot" 
          onClick={handleFetchSuggestion}
          disabled={loadingAi}
        >
          {loadingAi ? 'Génération...' : 'Demander une suggestion IA'}
        </button>

        {aiSuggestion && (
          <div className="copilot-box">
            <p>{aiSuggestion}</p>
            <button className="btn btn-apply" onClick={applySuggestion}>
              <Check size={14} /> Insérer dans la réponse
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default App;