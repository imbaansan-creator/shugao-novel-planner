import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const single = mode === 'single';

  return {
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    base: single ? './' : '/',
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') }
    },
    build: single
      ? {
          target: 'es2015',
          assetsInlineLimit: 100000000,
          cssCodeSplit: false,
          outDir: 'dist-single'
        }
      : {},
    server: {
      port: 5173,
      strictPort: true,
      // Windows 上原生文件监听经常失效，导致浏览器拿到新旧混合的模块。
      // 用轮询兜底，宁可多花一点 CPU。
      watch: { usePolling: true, interval: 300 }
    }
  };
});
