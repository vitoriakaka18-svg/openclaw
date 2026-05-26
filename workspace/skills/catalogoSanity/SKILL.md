---
name: catalogoSanity
description: "Consulta o estoque de peças da Achado de Luxo diretamente no Sanity CMS."
---

# Catalogo Sanity

Use esta habilidade para buscar peças no estoque da loja (Sanity CMS).
Você pode buscar por termo (nome, marca, cor, categoria, tamanho) ou listar tudo disponível.

## Comandos

Busca geral (lista as primeiras peças disponíveis):

```bash
node ~/.openclaw/workspace/skills/catalogoSanity/catalogoSanity.js
```

Busca por termo específico (exemplo: vestido, bolsa, prada, G, azul):

```bash
node ~/.openclaw/workspace/skills/catalogoSanity/catalogoSanity.js "vestido"
```

## Resposta

O script retornará um JSON com os campos: `_id`, `nome`, `preco`, `precoOriginal`, `tamanho`, `marca`, `categoria`, `subcategoria`, `condicao`, `status`, `imagemUrl`, `imagemUrlAlt`.

## Uso de Imagens — IMPORTANTE

O campo `imagemUrl` contém a URL **completa** da imagem no CDN do Sanity.

**Você DEVE enviar a imagem para a cliente usando o formato abaixo — nunca envie só o link em texto:**

```
[FOTO: {imagemUrl}]
```

Exemplo correto:

```
[FOTO: https://cdn.sanity.io/images/rljynorj/production/abc123-800x1200.jpg]
```

Isso fará com que a imagem apareça visualmente na conversa para a cliente. Não envie o link em texto puro.

## Filtro por status

Somente peças com status `disponivel`, `ultima` ou `promocao` são retornadas. Peças com status `vendida` ou `reservada` não aparecem.
