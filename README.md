# Site Vortex

Landing page da Vortex Marketing & Publicidade. HTML, CSS e JavaScript puros com Vite, GSAP (ScrollTrigger e SplitText) e Lenis.

## Rodar e publicar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a pasta dist/ para publicar
```

A pasta `dist/` pode ser publicada em qualquer hospedagem estática (Vercel, Netlify, Hostinger, Cloudflare Pages).

**GitHub Pages (automático):** cada envio para a branch `main` publica o site em `https://sites-lucas-carlos.github.io/site-vortex/` pelo workflow `.github/workflows/deploy.yml`. Configuração única: Settings > Pages > Source: GitHub Actions.

## Antes de publicar

1. **Ativar o formulário.** Os leads chegam por e-mail via FormSubmit. O primeiro envio dispara um e-mail de ativação para `contato@vortexinc.com.br`. Alguém precisa clicar em "Activate Form" nesse e-mail. Até isso acontecer, nenhum lead é entregue. O endereço está em `src/form.js` (`ENDPOINT`).
2. **Domínio.** Canonical, Open Graph, sitemap e robots usam `https://vortexinc.com.br`. Se o domínio for outro, troque em `index.html`, `public/robots.txt` e `public/sitemap.xml`.

## Onde editar

| O quê | Arquivo |
| --- | --- |
| Textos, seções, perguntas frequentes | `index.html` |
| Cores, fontes, espaçamentos (tokens no topo) | `src/styles.css` |
| Animações | `src/main.js` |
| Formulário (campos, destino) | `index.html` e `src/form.js` |
| Fotos da seção "time" | `src/assets/` |
| Logo (SVG vetorizado) | `src/assets/vortex-symbol.svg` |

Ícones: escreva `<!-- icon:nome -->` no HTML usando nomes do [Phosphor Icons](https://phosphoricons.com) (estilo light).

## Pendências para a próxima rodada

- Fotos reais dos 3 founders (hoje há monogramas no lugar).
- Cases com números e depoimentos de clientes.
- WhatsApp (botão flutuante e destino alternativo do formulário).
- Instagram e outras redes no rodapé.
- Google Analytics / Meta Pixel. O formulário já dispara `generate_lead` (dataLayer) e `Lead` (fbq) quando eles existirem.
