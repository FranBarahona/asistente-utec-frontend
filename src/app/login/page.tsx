'use client';
import { useState } from 'react';

export default function PopupLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/microsoft/login/system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        window.opener.postMessage({ error: data.detail || 'Login failed' }, '*');
        window.close();
        return;
      }

      window.opener.postMessage({ user: data.user }, '*');
      window.close();

    } catch (err) {
      window.opener.postMessage({ error: 'Error al iniciar sesión' }, '*');
      window.close();
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
