import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ messages, onSendMessage, loading, sessionActive }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !loading && sessionActive) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="chat-container glass-panel">
            <div className="messages-list">
                {messages.length === 0 && (
                    <div className="empty-state">
                        Start the session to begin the consultation.
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message-bubble ${msg.sender} fade-in`}>
                        <div className="bubble-content">
                            {msg.text}
                        </div>
                        <span className="timestamp">{msg.time}</span>
                    </div>
                ))}
                {loading && (
                    <div className="message-bubble patient loading">
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={sessionActive ? "Ask a question..." : "Start session first..."}
                    disabled={!sessionActive || loading}
                />
                <button type="submit" disabled={!sessionActive || loading || !input.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
