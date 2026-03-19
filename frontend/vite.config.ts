import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/auth": "http://backend:8000",
      "/accounts": "http://backend:8000",
      "/categories": "http://backend:8000",
      "/transactions": "http://backend:8000",
      "/dashboard": "http://backend:8000",
      "/exports": "http://backend:8000",
    },
  },
});
