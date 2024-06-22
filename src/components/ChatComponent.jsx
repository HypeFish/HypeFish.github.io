import React, { useState, useEffect, useRef } from 'react';
import { db } from '../service/firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FaUserCircle } from 'react-icons/fa';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const messagesCollection = collection(db, 'chatlog');
    const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => messagesData.push({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const messageData = {
        text: newMessage,
        timestamp: new Date(),
      };

      setMessages([...messages, { id: Date.now().toString(), ...messageData }]);
      setNewMessage('');

      try {
        await addDoc(collection(db, 'chatlog'), messageData);
      } catch (error) {
        console.error("Error adding message to Firestore:", error);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-room">
      <h1>Welcome to the Chat Room</h1>
        <p>This chat room allows you to communicate with others in real-time. Feel free to join the conversation, ask questions, or share your thoughts.
          Everything is anonymous but will be moderated.
        </p> 
      <div className="messages" ref={messagesContainerRef}>
        {messages.map((message) => (
          <div key={message.id} className="message">
            <FaUserCircle className="message-icon" size={32} />
            <div className="message-content">
              <div className="message-text">
                {message.text}
              </div>
              <div className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
