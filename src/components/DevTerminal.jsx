import React, { useState, useEffect, useRef } from 'react';
import '../styles/global.css'; // Ensure we have access to variables

const DevTerminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { text: "Welcome to HypeFish OS v1.0.0", type: 'system' },
    { text: "Type 'help' for a list of commands.", type: 'system' },
  ]);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // 1. Toggle Open/Close with Tilde (~) key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for backtick/tilde
      if (e.key === '`' || e.key === '~') {
        e.preventDefault(); // Prevent typing the character
        setIsOpen(prev => !prev);
      }
      // Close on Escape
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Auto-scroll and Focus
  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, history]);

  // 3. Command Logic
  const handleCommand = (cmd) => {
    const args = cmd.trim().split(' ');
    const command = args[0].toLowerCase();
    
    let response = "";
    let type = "success";

    switch (command) {
      case 'help':
        response = "Available commands: ls, cd [page], whoami, date, clear, exit";
        break;
      case 'ls':
        response = "index  projects  music  game  blog  resume.pdf";
        break;
      case 'whoami':
        response = "root user (guest)";
        break;
      case 'date':
        response = new Date().toString();
        break;
      case 'cd':
        const page = args[1];
        const validPages = {
          'home': '/',
          'index': '/',
          'projects': '/project',
          'music': '/music',
          'game': '/game',
          'blog': '/blog'
        };
        
        if (!page) {
            response = "usage: cd [page_name]";
            type = "error";
        } else if (validPages[page] || page === '..') {
            const target = page === '..' ? '/' : validPages[page];
            response = `Navigating to ${target}...`;
            setTimeout(() => window.location.href = target, 800);
        } else {
            response = `cd: no such file or directory: ${page}`;
            type = "error";
        }
        break;
      case 'clear':
        setHistory([]);
        return; // Skip adding to history
      case 'exit':
        setIsOpen(false);
        response = "Terminating session...";
        break;
      case 'sudo':
        response = "User is not in the sudoers file. This incident will be reported.";
        type = "error";
        break;
      default:
        if (cmd.trim() === '') return;
        response = `command not found: ${command}`;
        type = "error";
    }

    setHistory(prev => [
        ...prev, 
        { text: `hypefish@visitor:~$ ${cmd}`, type: 'command' },
        { text: response, type }
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCommand(input);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
      <div style={styles.terminal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>HypeFish_Terminal — -bash</span>
          <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>×</button>
        </div>
        
        <div style={styles.body}>
          {history.map((line, i) => (
            <div key={i} style={{ 
                ...styles.line, 
                color: line.type === 'error' ? '#ff5f5f' : line.type === 'command' ? '#f1fa8c' : '#50fa7b' 
            }}>
              {line.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <span style={styles.prompt}>hypefish@visitor:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.input}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};

// CSS-in-JS for simplicity (You can move this to a .css file if preferred)
const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '5vh',
    backdropFilter: 'blur(2px)'
  },
  terminal: {
    width: '90%',
    maxWidth: '800px',
    height: '60vh',
    backgroundColor: '#1e1e1e', // Dark terminal background
    borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: '"Fira Code", monospace',
    border: '1px solid #333'
  },
  header: {
    backgroundColor: '#2d2d2d',
    padding: '0.5rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#aaa',
    fontSize: '0.8rem',
    borderBottom: '1px solid #333'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '1.2rem'
  },
  body: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    color: '#f8f8f2'
  },
  line: {
    marginBottom: '0.5rem',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4'
  },
  form: {
    display: 'flex',
    padding: '1rem',
    backgroundColor: '#252525',
    borderTop: '1px solid #333'
  },
  prompt: {
    color: '#8be9fd',
    marginRight: '0.5rem'
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#f8f8f2',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '1rem'
  }
};

export default DevTerminal;