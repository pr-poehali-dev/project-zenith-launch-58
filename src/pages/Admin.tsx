import { useState, useRef } from 'react';
import func2url from '../../func2url.json';

const API = func2url['gallery'];

const Admin = () => {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [photos, setPhotos] = useState<{ id: number; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const login = async () => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, image: '', content_type: 'image/jpeg' }),
    });
    if (res.status === 401) {
      setAuthError('Неверный пароль');
      return;
    }
    setAuthed(true);
    loadPhotos();
  };

  const loadPhotos = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setPhotos(data.photos || []);
  };

  const upload = async (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string) || '';
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, image: base64, content_type: file.type }),
      });
      await loadPhotos();
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = async (id: number) => {
    await fetch(API, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id }),
    });
    setPhotos((p) => p.filter((x) => x.id !== id));
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl p-8 shadow-2xl border border-border">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">NARGIZA</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">Управление галереей</p>
          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
          />
          {authError && <p className="text-red-400 text-sm mb-3 text-center">{authError}</p>}
          <button
            onClick={login}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Галерея NARGIZA</h1>
          <span className="text-muted-foreground text-sm">{photos.length} фото</span>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full mb-8 py-5 rounded-2xl border-2 border-dashed border-primary/50 text-primary hover:border-primary hover:bg-primary/5 transition-all font-semibold text-lg disabled:opacity-50"
        >
          {uploading ? 'Загружаю...' : '+ Добавить фото'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-card">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => deletePhoto(photo.id)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">Фото пока нет. Нажми «+ Добавить фото»</p>
        )}
      </div>
    </div>
  );
};

export default Admin;
