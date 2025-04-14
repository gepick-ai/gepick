import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import svgLoader from "vite-svg-loader";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import react from "@vitejs/plugin-react";

function staticSavePath(type?: string, ext?: string): string {
  const STATIC_BASE_FOLDER = "static";
  const STATIC_FORMAT = "[name]-[hash][extname]";

  if (!type)
    return `${STATIC_BASE_FOLDER}/${STATIC_FORMAT}`;

  if (ext)
    return `${STATIC_BASE_FOLDER}/${type}/${STATIC_FORMAT.replace("[extname]", `.${ext}`)}`;

  return `${STATIC_BASE_FOLDER}/${type}/${STATIC_FORMAT}`;
}

export default defineConfig({
  plugins: [
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use('/api/file', async (req, res) => {
          try {
            // 读取本地文件
            const filePath = req.url as string;
            let content = '';

            if (req.url?.includes('png')) {
              content = await readFile(filePath, 'base64');
              content = `data:image/png;base64,${content}`;
            }
            else {
              content = await readFile(filePath, 'utf-8');
            }

            // 设置响应头
            res.setHeader('Content-Type', 'application/json');
            const body = JSON.stringify({ code: 200, data: { content } });
            res.end(body);
          }
          catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read file' }));
          }
        });
      },
    },
    react({
      babel: {
        plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
      },
    }),
    checker({
      typescript: true,
    }),
    svgLoader(),
    nodePolyfills(),
  ],
  resolve: {
    alias: {
      "@gepick/client": resolve(__dirname, "./src"),
      "@gepick/plugin-system": resolve(__dirname, "../../packages/plugin-system/src"),
    },
  },
  server: {
    port: 8080,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
    proxy: {
      "^/api": {
        target: "http://localhost:5173",
        changeOrigin: true,
      },
    },
  },
  define: {
    // "process.env.MESSAGING_URL": "http://localhost:3000/api",
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: () => {
          return staticSavePath("js", "js");
        },
        chunkFileNames: () => {
          return staticSavePath("js", "js");
        },
        assetFileNames: ({ name }) => {
          let folderPath = staticSavePath();

          if (!name)
            return folderPath;

          const categories = {
            media: /\.(png|jpe?g|gif|svg|webp|webm|mp3)$/,
            css: /\.(css)$/,
            fonts: /\.(woff|woff2|eot|ttf|otf)$/,
            wasm: /\.(wasm)$/,
          };

          Object.entries(categories).forEach(([key, value]) => {
            if (value.test(name)) {
              folderPath = staticSavePath(key);
            }
          });

          return folderPath;
        },
        // NOTE: 代码分割讨论参考
        // @link: https://github.com/vbenjs/vue-vben-admin/issues/1652
        // @link: https://zhuanlan.zhihu.com/p/453295973
        // @link: https://www.zhihu.com/question/518443897
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // NOTE：解决vite打包第三方依赖为vendor一个文件过大的问题，https://juejin.cn/post/7076997286357631012
            return (
              `node_modules/${id.toString()?.split("node_modules/")[2]?.split("/")[0]?.toString()}`
            );
          }
        },
      },
    },
  },
});
