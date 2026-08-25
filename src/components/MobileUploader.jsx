// src/components/MobileUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function MobileUploader({ existingImages = [], refresh }) {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [invitePassword, setInvitePassword] = useState('');

  function onFileChange(e) {
    setFiles(Array.from(e.target.files));
  }

  async function uploadAll() {
    if (files.length === 0) return;
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    try {
      const res = await axios.post('/api/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-invite-password': invitePassword },
        onUploadProgress: (ev) => {
          const pct = Math.round((ev.loaded * 100) / ev.total);
          setUploadProgress({ total: pct });
        }
      });
      setFiles([]);
      setUploadProgress({});
      if (refresh) refresh();
      alert(`Upload réussi : ${res.data.uploaded.length} image(s)`);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.response && err.response.data && err.response.data.error ? err.response.data.error : err.message));
    }
  }

  function toggleSelect(id) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!window.confirm(`Supprimer ${selected.size} image(s) ?`)) return;
    try {
      await axios.delete('/api/images', { data: { ids: Array.from(selected), password: invitePassword } });
      setSelected(new Set());
      if (refresh) refresh();
      alert('Suppression réussie');
    } catch (err) {
      console.error(err);
      alert('Suppression échouée: ' + (err.response && err.response.data && err.response.data.error ? err.response.data.error : err.message));
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <label>Invite password (si vous êtes invité) : </label>
        <input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} />
      </div>

      <input type="file" accept="image/*" multiple onChange={onFileChange} />
      {files.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={uploadAll}>Uploader {files.length} image(s)</button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={deleteSelected} disabled={selected.size === 0}>Supprimer la sélection ({selected.size})</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
        {existingImages.map(img => (
          <div key={img.id} style={{ position: 'relative' }}>
            <input type="checkbox" checked={selected.has(img.id)} onChange={() => toggleSelect(img.id)} style={{ position: 'absolute', zIndex: 2 }} />
            <img src={img.url} alt={img.filename} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
