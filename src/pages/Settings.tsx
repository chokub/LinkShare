import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { key: 'profile', label: 'บัญชีผู้ใช้' },
  { key: 'theme', label: 'ธีม' },
  { key: 'glow', label: 'แสงรอบการ์ด' },
  { key: 'data', label: 'การจัดการข้อมูล' },
  { key: 'language', label: 'ภาษา' },
  { key: 'ai', label: 'AI & การแจ้งเตือน' },
  { key: 'support', label: 'Feedback & Support' },
];

const LOCAL_KEY = 'cardGlowGradient';
const GLOW_PRESETS = [
  { name: 'Yellow', value: 'conic-gradient(from 0deg, #ffe066, #ffd700, #fffbe0, #ffe066 100%)' },
  { name: 'Blue', value: 'conic-gradient(from 0deg, #60a5fa, #2563eb, #3b82f6, #60a5fa 100%)' },
  { name: 'Rainbow', value: 'conic-gradient(from 0deg, #ff0080, #7928ca, #007cf0, #00dfd8, #ff0080 100%)' },
  { name: 'Purple-Blue', value: 'conic-gradient(from 0deg, #a78bfa, #60a5fa, #2563eb, #a78bfa 100%)' },
];

export default function Settings() {
  const [section, setSection] = useState('profile');
  const [theme, setTheme] = useState('auto');
  const [glow, setGlow] = useState(() => localStorage.getItem(LOCAL_KEY) || GLOW_PRESETS[0].value);
  const [lang, setLang] = useState('th');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notify, setNotify] = useState(true);
  const [exported, setExported] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // mock user
  const user = { email: 'user@email.com' };

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, glow);
  }, [glow]);

  // ใช้ react-router ถ้ามี (ถ้าไม่มีจะ fallback เป็น window.location)
  let navigate = null;
  try {
    // eslint-disable-next-line
    navigate = require('react-router-dom').useNavigate?.();
  } catch {}

  const handleBack = () => {
    if (navigate) {
      navigate('/dashboard');
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '40px auto', border: '1px solid #2221', borderRadius: 16, background: 'var(--settings-bg, #fff)' }}>
      <div style={{ padding: '20px 32px 0 32px', display: 'flex', alignItems: 'center' }}>
        <button onClick={handleBack} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginRight: 24, boxShadow: '0 1px 4px #6366f133', transition: 'background 0.15s' }}>
          ← กลับไป Dashboard
        </button>
        <span style={{ fontWeight: 'bold', fontSize: 20, color: 'var(--settings-title, #222)' }}>ตั้งค่า</span>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ minWidth: 200, borderRight: '1px solid #2222', padding: 24, background: 'var(--settings-sidebar, #f8fafc)', borderRadius: '0 0 0 16px' }}>
          <nav>
            {SECTIONS.map(s => (
              <button
                key={s.key}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 0',
                  marginBottom: 8,
                  background: section === s.key ? 'var(--settings-active, #6366f1)' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  textAlign: 'left',
                  fontWeight: section === s.key ? 'bold' : 'normal',
                  color: section === s.key ? 'var(--settings-active-text, #fff)' : 'var(--settings-sidebar-text, #222)',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'background 0.15s, color 0.15s'
                }}
                onClick={() => setSection(s.key)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>
        <main style={{ flex: 1, padding: 32, color: 'var(--settings-text, #222)', background: 'var(--settings-bg, #fff)', minHeight: 500 }}>
          {section === 'profile' && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: 'var(--settings-title, #222)' }}>บัญชีผู้ใช้</h2>
              <div style={{ background: 'var(--settings-card, #fff)', borderRadius: 10, padding: 24, maxWidth: 400, marginBottom: 16, boxShadow: '0 2px 8px #0002', border: '1px solid #2222', color: 'var(--settings-card-text, #222)' }}>
                <div style={{ marginBottom: 8 }}><b>อีเมล:</b> {user.email}</div>
                <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16, marginTop: 8, boxShadow: '0 1px 4px #6366f133' }}>ออกจากระบบ</button>
              </div>
            </section>
          )}
          {section === 'theme' && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: 'var(--settings-title, #222)' }}>ธีม</h2>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <button onClick={() => setTheme('light')} style={{ padding: '10px 24px', borderRadius: 6, border: theme === 'light' ? '2px solid #6366f1' : '1px solid #bbb', background: theme === 'light' ? '#e0e7ff' : '#fff', fontWeight: theme === 'light' ? 'bold' : 'normal', color: '#222' }}>Light</button>
                <button onClick={() => setTheme('dark')} style={{ padding: '10px 24px', borderRadius: 6, border: theme === 'dark' ? '2px solid #6366f1' : '1px solid #bbb', background: theme === 'dark' ? '#e0e7ff' : '#fff', fontWeight: theme === 'dark' ? 'bold' : 'normal', color: '#222' }}>Dark</button>
                <button onClick={() => setTheme('auto')} style={{ padding: '10px 24px', borderRadius: 6, border: theme === 'auto' ? '2px solid #6366f1' : '1px solid #bbb', background: theme === 'auto' ? '#e0e7ff' : '#fff', fontWeight: theme === 'auto' ? 'bold' : 'normal', color: '#222' }}>Auto</button>
              </div>
              <div>ธีมปัจจุบัน: <b>{theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}</b></div>
            </section>
          )}
          {section === 'glow' && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: 'var(--settings-title, #222)' }}>แสงรอบการ์ด</h2>
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  width: 220, height: 120, borderRadius: 18, background: 'var(--settings-card, #232329)',
                  marginBottom: 16, position: 'relative', boxShadow: '0 2px 16px #0008'
                }}>
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: 22,
                    background: glow,
                    filter: 'blur(2.5px) brightness(1.2)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }} />
                  <div style={{
                    position: 'relative', zIndex: 2, width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 18
                  }}>
                    ตัวอย่างการ์ด
                  </div>
                </div>
                <div style={{ color: 'var(--settings-card-text, #fff)', marginBottom: 12 }}>
                  Glow ปัจจุบัน: <b>{GLOW_PRESETS.find(p => p.value === glow)?.name}</b>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {GLOW_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => setGlow(preset.value)}
                      style={{
                        width: 60, height: 60, borderRadius: 12,
                        border: glow === preset.value ? '3px solid #6366f1' : '1px solid #bbb',
                        background: preset.value,
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: glow === preset.value ? '0 0 0 2px #6366f1' : 'none',
                      }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
          {section === 'data' && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: 'var(--settings-title, #222)' }}>การจัดการข้อมูล</h2>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <button onClick={() => { setExported(true); setTimeout(() => setExported(false), 1500); }} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>Export ข้อมูล</button>
                <button onClick={() => { if(window.confirm('ยืนยันลบข้อมูลทั้งหมด?')) setDeleted(true); }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>ลบข้อมูลทั้งหมด</button>
              </div>
              {exported && <div style={{ color: '#10b981', fontWeight: 'bold' }}>Export สำเร็จ!</div>}
              {deleted && <div style={{ color: '#ef4444', fontWeight: 'bold' }}>ข้อมูลถูกลบแล้ว</div>}
            </section>
          )}
          {section === 'language' && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: 'var(--settings-title, #222)' }}>ภาษา</h2>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <button onClick={() => setLang('th')} style={{ padding: '10px 24px', borderRadius: 6, border: lang === 'th' ? '2px solid #6366f1' : '1px solid #bbb', background: lang === 'th' ? '#e0e7ff' : '#fff', fontWeight: lang === 'th' ? 'bold' : 'normal', color: '#222' }}>ไทย</button>
                <button onClick={() => setLang('en')} style={{ padding: '10px 24px', borderRadius: 6, border: lang === 'en' ? '2px solid #6366f1' : '1px solid #bbb', background: lang === 'en' ? '#e0e7ff' : '#fff', fontWeight: lang === 'en' ? 'bold' : 'normal', color: '#222' }}>English</button>
              </div>
              <div>ภาษาปัจจุบัน: <b>{lang === 'th' ? 'ไทย' : 'English'}</b></div>
            </section>
          )}
          {section === 'ai' && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: 'var(--settings-title, #222)' }}>AI & การแจ้งเตือน</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--settings-text, #222)' }}>
                  <input type="checkbox" checked={aiEnabled} onChange={() => setAiEnabled(v => !v)} />
                  เปิดฟีเจอร์ AI (แนะนำแท็ก, สรุปเนื้อหา)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--settings-text, #222)' }}>
                  <input type="checkbox" checked={notify} onChange={() => setNotify(v => !v)} />
                  เปิดการแจ้งเตือน (Toast, Email)
                </label>
              </div>
            </section>
          )}
          {section === 'support' && (
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: 'var(--settings-title, #222)' }}>Feedback & Support</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>ส่ง Feedback</button>
                <a href="#" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 'bold', fontSize: 16 }}>ดูคู่มือการใช้งาน / FAQ</a>
                <div style={{ color: '#64748b', fontSize: 15 }}>ติดต่อทีมงาน: support@linkkeep.com</div>
              </div>
            </section>
          )}
        </main>
      </div>
      <style>{`
        body.dark, html.dark {
          --settings-bg: #18181b;
          --settings-sidebar: #18181b;
          --settings-sidebar-text: #fff;
          --settings-title: #fff;
          --settings-card: #232329;
          --settings-card-text: #fff;
          --settings-active: #6366f1;
          --settings-active-text: #fff;
        }
      `}</style>
    </div>
  );
} 