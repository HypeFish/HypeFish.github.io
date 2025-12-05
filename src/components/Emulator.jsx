// src/components/Emulator.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Chip8 } from '../lib/chip8';

const Emulator = () => {
  const canvasRef = useRef(null);
  const cpu = useRef(new Chip8());
  const [romName, setRomName] = useState("No ROM Loaded");

  // 1. Expanded Key Mapping
  const keyMap = {
    // Standard COSMAC VIP Mapping
    '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
    'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
    'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
    'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF,
    
    // Arrow Key Aliases (Map to 2, 4, 6, 8)
    'arrowup': 0x2,
    'arrowdown': 0x8,
    'arrowleft': 0x4,
    'arrowright': 0x6
  };

  useEffect(() => {
    // 2. Handle Key Presses
    const handleDown = (e) => {
      const key = keyMap[e.key.toLowerCase()];
      if (key !== undefined) {
        cpu.current.keys[key] = true;
      }
    };

    const handleUp = (e) => {
      const key = keyMap[e.key.toLowerCase()];
      if (key !== undefined) {
        cpu.current.keys[key] = false;
      }
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    // 3. Game Loop (60 FPS)
    const loop = setInterval(() => {
      // Run multiple CPU cycles per frame for speed (10 is a good balance)
      for (let i = 0; i < 10; i++) {
        cpu.current.cycle();
      }
      drawScreen();
    }, 1000 / 60);

    return () => {
      clearInterval(loop);
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  const drawScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(64, 32);
    
    for (let i = 0; i < cpu.current.gfx.length; i++) {
        const pixel = cpu.current.gfx[i];
        // Classic Green on Black
        const r = 0; 
        const g = pixel ? 255 : 0;
        const b = 0;
        
        imageData.data[i * 4] = r;
        imageData.data[i * 4 + 1] = g;
        imageData.data[i * 4 + 2] = b;
        imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRomName(file.name);
    const buffer = await file.arrayBuffer();
    const romData = new Uint8Array(buffer);
    
    // Reset CPU and Load
    cpu.current = new Chip8();
    cpu.current.loadGame(romData);
    console.log(`👾 Loaded ROM: ${file.name} (${romData.length} bytes)`);
  };

  return (
    <div className="emulator-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      
      <canvas 
        ref={canvasRef} 
        width={64} 
        height={32} 
        style={{ 
            width: '640px', 
            background: '#000', 
            imageRendering: 'pixelated',
            border: '4px solid #333',
            borderRadius: '4px'
        }} 
      />

      <div className="controls" style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'monospace', color: '#0015ffff', marginBottom: '1rem' }}>
            Loaded: {romName}
        </p>
        
        <label className="upload-btn" style={{
            background: '#333',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontFamily: 'monospace'
        }}>
            📁 Load ROM (.ch8)
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
        
        <div style={{ marginTop: '1.5rem', color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
            <p><strong>Controls:</strong> Arrow Keys (Move) • Z (Select/Action)</p>
        </div>
      </div>
    </div>
  );
};

export default Emulator;