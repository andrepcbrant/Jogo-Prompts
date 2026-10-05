# Guilda dos Escribas

Jogo de RPG que ensina markdown para escrever prompts melhores para IA. Prompts são feitiços, cada símbolo de markdown é uma runa, e o chefe final, o Oráculo Confuso, só obedece a feitiços bem escritos.

## Rodar

```bash
npm install
npm run dev      # servidor local
npm run check    # tipos + lint + testes
npm run build    # site estático em dist/
```

## Como o projeto é organizado

| Pasta | O que tem |
| --- | --- |
| `src/engine/` | Motor puro, sem interface: leitura do markdown, regras de validação, avaliação, progressão |
| `src/content/` | Missões, chefe e títulos da guilda, **só dados** |
| `src/state/` | Salvamento no navegador e estado do jogo |
| `src/ui/` | Componentes React |
| `tests/` | Testes do motor e o teste automático de conteúdo |

## Adicionar uma missão

1. Crie `src/content/missions/minha-missao.ts` com `defineMission({...})` (use uma missão existente como modelo).
2. Importe-a em `src/content/index.ts` e coloque na lista `MISSIONS`.
3. Rode `npm test`. O teste de conteúdo confere que a solução de referência passa em todas as regras, que o texto inicial falha, que os pré-requisitos existem e que não há ciclos.

As regras disponíveis estão em `src/engine/rules/index.ts`. O editor autocompleta os nomes e os parâmetros.

## Publicar

O workflow `.github/workflows/deploy.yml` publica no GitHub Pages a cada push na `main`. Para ativar, vá em **Settings → Pages** do repositório e escolha **GitHub Actions** como fonte. O build usa caminho relativo, então funciona também em Vercel, Netlify ou numa pasta qualquer.
