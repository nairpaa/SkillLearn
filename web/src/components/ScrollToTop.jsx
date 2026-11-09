import { useEffect } from 'react';
import { useLocation } from 'react-router';

// Pindah halaman → mulai dari atas (kecuali ada #hash, itu diurus halamannya sendiri)
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
