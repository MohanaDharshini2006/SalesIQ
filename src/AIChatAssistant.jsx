import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Bot, RefreshCw, Info } from 'lucide-react';
import './AIChatAssistant.css';

const AIChatAssistant = ({ currentProduct = null, allProducts = [], onClearContext, onProductSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'ai', text: '👋 Hey! I\'m your StoreIQ AI assistant. Ask me anything — about your products, scores, or how to improve your store. I\'m here to help!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const welcomeSentRef = useRef(null);

  useEffect(() => {
    if (currentProduct) {
      setIsOpen(true);
    }
  }, [currentProduct?.title]);

  // When a product is selected, we update the ref to keep track of it
  useEffect(() => {
    if (currentProduct) {
      welcomeSentRef.current = currentProduct.title;
    } else {
      welcomeSentRef.current = null;
    }
  }, [currentProduct?.title]);

  const handleSend = async (isRetry = false) => {
    if (!inputValue.trim() && !isRetry) return;
    if (isLoading && !isRetry) return;

    let currentMsg = inputValue.trim();
    if (!isRetry) {
      setMessages(prev => [...prev, { type: 'user', text: currentMsg }]);
      setInputValue('');
    } else {
      currentMsg = messages[messages.length -1].text;
    }
    
    // Smart fuzzy product detection — checks meaningful keywords from titles
    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'its']);
    const msgWords = currentMsg.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    const detectedProduct = allProducts.find(p => {
      const titleWords = p.title.toLowerCase().split(/[\s:&-]+/).filter(w => w.length > 2 && !stopWords.has(w));
      const matchCount = titleWords.filter(tw => msgWords.some(mw => tw.includes(mw) || mw.includes(tw))).length;
      return matchCount >= 1; // at least one meaningful keyword match
    });

    let effectiveProduct = currentProduct;
    if (detectedProduct) {
      console.log(`[FRONTEND][CONTEXT] Detected change to: ${detectedProduct.title}`);
      if (onProductSelect) {
        onProductSelect(detectedProduct);
        effectiveProduct = detectedProduct;
      }
    }

    // 4. Dynamic Routing / No Context (Handled automatically by backend now)
    setIsLoading(true);

    const requestBody = {
      title: effectiveProduct?.title || 'General Browsing',
      price: effectiveProduct?.price ? effectiveProduct.price.replace('$', '') : null,
      message: currentMsg,
      image: effectiveProduct?.image,
      products: allProducts,
      productNames: allProducts.map(p => p.title), // help AI identify products by keyword
      history: messages.filter(m => 
        m.text !== 'AI response failed. Please try again.' && 
        !m.text.includes('SYNC_COMPLETE') &&
        !m.text.includes('SYSTEM_STATUS')
      )
    };

    try {
      console.log(`[FRONTEND][REQUEST] | Product: ${requestBody.title} | Message: ${currentMsg}`);
      
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.text || data.text.trim() === "") {
        throw new Error("EMPTY_RESPONSE");
      }
      
      setMessages(prev => [...prev, { type: 'ai', text: data.text.trim() }]);
    } catch (error) {
      console.error('[FRONTEND][ERROR]', error.message);
      
      if (!isRetry) {
        return handleSend(true);
      }

      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: `Connection Error: ${error.message}. Please check if the backend server is running.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="ai-chat-container">
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="title-group">
              <div className="avatar">
                <Sparkles size={18} />
              </div>
              <div className="header-text">
                <h3>AI Assistant</h3>
                <div className="status"><div className="status-dot"></div> Online</div>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {currentProduct && (
            <div className="context-bar">
              <div className="context-info">
                <Info size={14} />
                <span>Chatting about <strong>{currentProduct.title}</strong></span>
              </div>
              <button className="clear-context" onClick={onClearContext}>
                <RefreshCw size={12} /> Clear
              </button>
            </div>
          )}

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.type}`}>
                <div className="message-icon">
                  {msg.type === 'ai' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`message-bubble ${msg.type}`}>
                  {msg.text}
                  {msg.image && (
                    <div className="message-image-container">
                      <img src={msg.image} alt="AI Generated" className="message-image" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row ai">
                <div className="message-icon"><Bot size={16} /></div>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input-area">
            <div className="ai-chat-input-wrapper">
              <input 
                type="text" 
                placeholder="Ask me anything about your store..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button 
                className="send-btn"
                onClick={handleSend} 
                disabled={!inputValue.trim() || isLoading}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button className={`ai-chat-button ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {!isOpen && <span className="label">Chat with AI</span>}
        <div className="icon-wrapper">
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </div>
      </button>
    </div>
  );
};

export default AIChatAssistant;
