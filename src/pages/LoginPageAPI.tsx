import { useState } from 'react';
import { api } from '../api/client';

interface LoginPageAPIProps {
  onLogin: () => void;
}

function LoginPageAPI({ onLogin }: LoginPageAPIProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await api.login(username, password);
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      direction: 'rtl'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', color: '#667eea', marginBottom: '10px' }}>
            🔐
          </h1>
          <h2 style={{ fontSize: '24px', color: '#2c3e50', margin: '0' }}>
            מערכת ניהול גמ"ח
          </h2>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            התחבר למערכת
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#2c3e50',
            fontWeight: 'bold'
          }}>
            שם משתמש:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="הזן שם משתמש..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#2c3e50',
            fontWeight: 'bold'
          }}>
            סיסמה:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleLogin()}
            placeholder="הזן סיסמה..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: '2px solid #e74c3c',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#c0392b'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !username || !password}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            background: loading || !username || !password ? '#95a5a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !username || !password ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ מתחבר...' : '🔓 כניסה'}
        </button>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e8f4f8',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#2c3e50'
        }}>
          <strong>💡 פרטי התחברות ברירת מחדל:</strong>
          <p style={{ margin: '5px 0 0 0' }}>
            שם משתמש: <strong>admin</strong><br />
            סיסמה: <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPageAPI;
