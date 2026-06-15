import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'nargiza_gallery_photos';
const ADMIN_PASSWORD = 'NARGIZA_ADMIN';
const IMGUR_CLIENT_ID = 'f8b49e6e5e36175';

type Photo = { id: string; url: string };

const getPhotos = (): Photo[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const savePhotos = (photos: Photo[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));

const Admin = () => {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authed) setPhotos(getPhotos());
  }, [authed]);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setAuthError('Неверный пароль');
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      const newPhoto = { id: data.data.id, url: data.data.link };
      const updated = [newPhoto, ...getPhotos()];
      savePhotos(updated);
      setPhotos(updated);
    } else {
      setError('Ошибка загрузки. Попробуй ещё раз.');
    }
    setUploading(false);
  };

  const deletePhoto = (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    savePhotos(updated);
    setPhotos(updated);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl p-8 shadow-2xl border border-border">
          <h1 className="text-2xl font-bold text-foreground text-center mb-1">NARGIZA</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">Управление галереей</p>
          <input
            type="password"
            placeholder="Пароль"
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
          className="w-full mb-4 py-5 rounded-2xl border-2 border-dashed border-primary/50 text-primary hover:border-primary hover:bg-primary/5 transition-all font-semibold text-lg disabled:opacity-50"
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
        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

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
