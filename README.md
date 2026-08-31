# SCR CIPHER · COSMAR — PWA

Conversão do `scr_cipher_v04_05_26_cosmar.html` em Progressive Web App
instalável (Android e iOS), sem alterar a lógica de criptografia.
(Leitura humana; nenhum arquivo de código o importa.)

## Estrutura

```
scr-cipher-pwa/
├── index.html      # app original + metas PWA + fontes locais + registro do SW
├── manifest.json   # nome, ícones (192/512/maskable), standalone, tema #00050c
├── sw.js           # precache do shell/fontes + cache de tiles OSM (LRU 600)
├── offline.html    # fallback de navegação
├── icons/          # PNG 192/512/maskable/apple-touch + SVG
├── fonts/          # Share Tech Mono, Barlow, Barlow Condensed (woff2 latin/latin-ext)
└── images/         # ícones padrão do Leaflet (referenciados pelo CSS embutido)
```

## O que mudou vs. o HTML original

- **Google Fonts → local**: o `@import` de `fonts.googleapis.com` foi trocado por
  `fonts/fonts.css` com woff2 vendados (subsets latin + latin-ext). Sem isso, a
  primeira abertura offline atrasava o carregamento e perdia a tipografia.
- **Metas PWA**: `manifest.json`, `apple-touch-icon`, favicons (PNG + SVG).
  As metas `apple-mobile-web-app-*`, `theme-color` claro/escuro e
  `viewport-fit=cover` já existiam no original e foram preservadas.
- **Service worker**: pré-cache do shell (o Leaflet, o topojson e o mapa-múndi
  TopoJSON de 18,7 MB já eram embutidos no HTML) + cache de tiles OSM com LRU.
- Lógica de chave de sessão, codificação, decodificação e mapa: **inalterada**.

## Rodar localmente

```bash
cd scr-cipher-pwa
python -m http.server 8766
# abrir http://localhost:8766  (localhost é contexto seguro: SW funciona)
```

## Deploy (obrigatório para instalar)

Service workers exigem **HTTPS** (ou localhost). Hospede a pasta inteira em
qualquer estático com HTTPS: GitHub Pages, Netlify, Vercel, Cloudflare Pages.

- **Android (Chrome)**: menu ⋮ → "Instalar app" / banner de instalação.
- **iOS (Safari 16.4+)**: Compartilhar → "Adicionar à Tela de Início".

## Como atualizar o app

Edite os arquivos e incremente `VERSION` em `sw.js` (ex.: `v2`). O novo SW
pré-cacheia, ativa e apaga as caches antigas automaticamente.

## Notas

- O código de acesso (6 dígitos) e a derivação da chave de sessão continuam
  exatamente como no original.
- Tiles de mapa: só OpenStreetMap é cacheado; áreas já vistas ficam
  disponíveis offline. O modo OFFLINE do app usa as fronteiras embutidas.
