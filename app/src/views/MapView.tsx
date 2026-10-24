import { useRef, useState } from 'react';
import { useStore } from '../store/store';

/** 压到最长边 1600、JPEG 0.82：一张地图大概 200–500KB，塞得进 localStorage */
function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no 2d context');

        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读不出来'));
    };

    img.src = url;
  });
}

export default function MapView() {
  const { data, dispatch } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { image, pins } = data.map;
  const sel = pins.find((p) => p.id === selected);

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await compressImage(file);
      dispatch({ type: 'map/image', image: url });
    } catch {
      window.alert('这张图读不出来，换一张试试。');
    } finally {
      setBusy(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    dispatch({ type: 'map/pin/add', x, y });
  };

  if (!image) {
    return (
      <div className="empty">
        <h3>{pins.length > 0 ? '还没有底图' : '还没有地图'}</h3>
        <p>
          上传一张底图——手绘也行、截图也行、随便一张能当背景的图也行。
          上传之后，点图上任意位置就能打点。
        </p>
        {pins.length > 0 && (
          <>
            <p style={{ color: 'var(--warn)' }}>
              已经有 {pins.length} 个地点，上传底图后会按坐标显示。
            </p>
            <div className="map-pinlist">
              {pins.map((p) => (
                <div className="map-pinrow" key={p.id}>
                  <span className="map-pin-dot" />
                  <b>{p.name}</b>
                  {p.note && <span className="note">{p.note}</span>}
                  <button
                    className="btn ghost tiny"
                    title="删掉这个地点"
                    onClick={() => dispatch({ type: 'map/pin/remove', id: p.id })}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? '处理中…' : '上传底图'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            void pickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="map-toolbar">
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
          点图上任意位置添加地点；点已有标记可以编辑。
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? '处理中…' : '替换底图'}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (window.confirm('删除底图？已打的地点会保留坐标。')) {
                dispatch({ type: 'map/image', image: '' });
              }
            }}
          >
            删除底图
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          void pickFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div className="map-canvas" onClick={handleMapClick}>
        <img src={image} alt="地图底图" draggable={false} />
        {pins.map((p) => (
          <button
            key={p.id}
            className={`map-pin ${selected === p.id ? 'on' : ''}`}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            title={p.name || '未命名地点'}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(p.id);
            }}
          >
            <span className="map-pin-dot" />
            <span className="map-pin-label">{p.name || '未命名'}</span>
          </button>
        ))}
      </div>

      {sel && (
        <div className="map-editor">
          <div className="world-head" style={{ borderBottom: '0.5px solid var(--border)' }}>
            <input
              className="world-title"
              value={sel.name}
              placeholder="地点名"
              onChange={(e) =>
                dispatch({
                  type: 'map/pin/update',
                  id: sel.id,
                  patch: { name: e.target.value }
                })
              }
            />
            <button
              className="btn ghost tiny"
              title="删除这个地点"
              onClick={() => {
                dispatch({ type: 'map/pin/remove', id: sel.id });
                setSelected(null);
              }}
            >
              ×
            </button>
          </div>
          <textarea
            value={sel.note}
            placeholder="这里发生过什么 / 谁的地盘 / 为什么重要"
            onChange={(e) =>
              dispatch({
                type: 'map/pin/update',
                id: sel.id,
                patch: { note: e.target.value }
              })
            }
            style={{
              width: '100%',
              border: 'none',
              padding: '10px 12px',
              minHeight: 80,
              resize: 'vertical',
              fontSize: 'calc(14px * var(--fs))'
            }}
          />
        </div>
      )}
    </>
  );
}
