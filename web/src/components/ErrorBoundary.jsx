import { Component } from 'react';
import { AlertIcon } from './Icons';
import { Button } from './ui';

// Menangkap error render supaya halaman tidak jadi putih kosong.
// Kasus paling umum: tab lama dibuka setelah redeploy, file chunk lama sudah tidak ada →
// impor dinamis gagal. Untuk itu halaman dimuat ulang otomatis SEKALI (versi terbaru ikut terambil).
const RELOAD_KEY = 'sl-chunk-reload';
const isChunkError = (err) =>
  /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(`${err?.name} ${err?.message}`);

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (!isChunkError(error)) return;
    try {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
      }
    } catch {
      // sessionStorage tidak tersedia: biarkan pengguna menekan tombol muat ulang
    }
  }

  componentDidMount() {
    try {
      sessionStorage.removeItem(RELOAD_KEY);
    } catch {
      /* abaikan */
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page boot-error" role="alert">
        <div className="sb-message">
          <div className="icon-tile danger">
            <AlertIcon size={26} />
          </div>
          <h1 className="sb-title">Something went wrong</h1>
          <p className="sb-text">Reload the page to get the latest version of SkillLearn. Your progress is saved.</p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      </div>
    );
  }
}
