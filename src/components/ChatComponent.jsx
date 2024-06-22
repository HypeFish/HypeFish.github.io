import React, { useState, useEffect } from 'react';
import { db } from '../service/firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FaUserCircle } from 'react-icons/fa';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    console.log("Component mounted");
    const messagesCollection = collection(db, 'chatlog');
    const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => messagesData.push({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
    });

    return () => {
      console.log("Component unmounted");
      unsubscribe();
    };
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const messageData = {
        text: newMessage,
        timestamp: new Date(),
      };

      // Update local state immediately
      setMessages([...messages, { id: Date.now().toString(), ...messageData }]);
      setNewMessage('');

      try {
        // Add to Firestore
        await addDoc(collection(db, 'chatlog'), messageData);
        console.log("Message added to Firestore");
      } catch (error) {
        console.error("Error adding message to Firestore:", error);
      }
    }
  };

  return (
    <div className="chat-room">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <FaUserCircle className="message-icon" size={32} />
            <div className="message-text">
              {message.text}
            </div>
          </div>
        ))}
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
