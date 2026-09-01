# Splash screens iOS

As imagens `iphone_*.png` neste diretório são as "apple-touch-startup-image"
referenciadas em `index.html`. Elas aparecem quando o app é aberto no modo
standalone (depois de "Adicionar à Tela de Início" no iOS Safari).

## Como gerar (recomendado)

Use o `@vite-pwa/assets-generator` para gerar ícones e splash screens a
partir de uma única imagem SVG/PNG de alta resolução:

```bash
npx @vite-pwa/assets-generator
```

Coloque a imagem fonte em `public/logo.svg` (ou ajuste o config do gerador).

## Alternativa manual

Crie PNGs com as resoluções referenciadas em `index.html`:
- `iphone_320x460.png` (320x460, iPhone clássico)
- `iphone6_375x667.png` (375x667, iPhone 6/7/8)
- `iphone6plus_414x736.png` (414x736, iPhone 6/7/8 Plus)

Cada uma com fundo `#0b3d91` (theme-color) e o logo centralizado.

Sem essas imagens o app ainda funciona standalone no iOS; apenas mostra
uma tela em branco/azul breve no início.
