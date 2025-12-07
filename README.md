# ATLAS — Modelagem de Sistemas

Projeto estático de páginas web para o curso de Modelagem de Sistemas. Contém telas de home, leitores e cadastro, com HTML, CSS e JavaScript simples.

## Estrutura

```
index.html
src/
  static/
    css/
      home.css
      login.css
      readers.css
      register.css
    html/
      home.html
      readers.html
      register.html
    js/
      home.js
      login.js
      readers.js
      register.js
```

## Executando com um servidor HTTP simples

Você pode usar um servidor local para servir os arquivos estáticos com http server:

```bash
npx http-server
```

Acesse em: http://localhost:8080/

## Notas
- Este repositório não requer build; os arquivos são estáticos.
