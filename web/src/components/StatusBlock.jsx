import { Link } from 'react-router';
import { AlertIcon, FrownIcon } from './Icons';
import { Button } from './ui';

function GridSkeleton() {
  return (
    <div className="sb-stack">
      <div className="sk" style={{ width: 320, maxWidth: '70%', height: 34, borderRadius: 10 }} />
      <div className="sk" style={{ width: 220, maxWidth: '50%', height: 16 }} />
      <div className="course-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="sb-card">
            <div className="sk" style={{ height: 150, borderRadius: 0 }} />
            <div className="sb-card-body">
              <div className="sk" style={{ height: 16, width: '85%' }} />
              <div className="sk sk-soft" style={{ height: 12, width: '55%', borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="sb-detail">
      <div className="sb-stack" style={{ gap: 16 }}>
        <div className="sk" style={{ aspectRatio: '16 / 9', borderRadius: 16 }} />
        <div className="sk" style={{ height: 28, width: '70%', borderRadius: 10 }} />
        <div className="sk sk-soft" style={{ height: 14, width: '40%', borderRadius: 7 }} />
        <div className="sk sk-soft" style={{ height: 14, width: '95%', borderRadius: 7 }} />
        <div className="sk sk-soft" style={{ height: 14, width: '88%', borderRadius: 7 }} />
      </div>
      <div className="sb-side">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="sb-side-row">
            <div className="sk" style={{ width: 28, height: 28, borderRadius: '50%', flex: 'none' }} />
            <div className="sk sk-soft" style={{ flex: 1, height: 14, borderRadius: 7 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="sb-stack" style={{ gap: 12 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="sb-row">
          <div className="sk" style={{ width: 72, height: 56, borderRadius: 10, flex: 'none' }} />
          <div className="sb-stack" style={{ flex: 1, gap: 8 }}>
            <div className="sk" style={{ height: 14, width: '85%', borderRadius: 7 }} />
            <div className="sk sk-soft" style={{ height: 11, width: '50%', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Skeleton({ layout = 'grid' }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading" role="status">
      {layout === 'detail' ? <DetailSkeleton /> : layout === 'list' ? <ListSkeleton /> : <GridSkeleton />}
    </div>
  );
}

export function StatusMessage({ kind = 'error', error, onRetry, nfTitle = 'Course not found', retrying = false }) {
  const isError = kind === 'error';
  const caption = error
    ? `${error.code || 'ERR_NETWORK'} · ${error.method || 'GET'} ${error.path || '/api'}`
    : 'ERR_NETWORK · GET /api/courses';
  return (
    <div className="sb-message" role="alert">
      <div className={`icon-tile ${isError ? 'danger' : ''}`}>
        {isError ? <AlertIcon size={26} /> : <FrownIcon size={26} />}
      </div>
      <h1 className="sb-title">{isError ? "Couldn't load content" : nfTitle}</h1>
      <p className="sb-text">
        {isError
          ? 'Check your internet connection and try again. Your progress is saved.'
          : 'The link may be broken, or this item is no longer available.'}
      </p>
      <div className="sb-actions">
        {isError && onRetry && (
          <Button size="sm" busy={retrying} onClick={onRetry} className="sb-retry">
            Try again
          </Button>
        )}
        <Link to="/" className="btn btn-secondary btn-sm">
          Back to Home
        </Link>
      </div>
      {isError && <div className="sb-caption">{caption}</div>}
    </div>
  );
}

// Satu komponen untuk loading / error / not found di semua layar data
export function StatusBlock({ kind, layout = 'grid', error, onRetry, nfTitle, retrying, bare = false }) {
  const inner =
    kind === 'loading' ? (
      <Skeleton layout={layout} />
    ) : (
      <StatusMessage kind={kind} error={error} onRetry={onRetry} nfTitle={nfTitle} retrying={retrying} />
    );
  if (bare) return inner;
  return <div className="container">{inner}</div>;
}

// Helper: tentukan state dari satu/lebih query TanStack
export function queryStatus(...queries) {
  const failed = queries.find((q) => q.isError);
  if (failed) {
    return { kind: failed.error?.status === 404 ? 'notfound' : 'error', error: failed.error };
  }
  if (queries.some((q) => q.isPending)) return { kind: 'loading' };
  return null;
}

export function retryAll(...queries) {
  return () => queries.filter((q) => q.isError).forEach((q) => q.refetch());
}
