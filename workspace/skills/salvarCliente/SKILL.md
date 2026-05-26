---
name: salvarCliente
description: "Salva o perfil da cliente (nome, tamanho, preferências) no banco de dados da loja."
---

# Salvar Cliente

Use esta habilidade imediatamente quando a cliente informar o nome dela, ou o tamanho que ela veste, ou disser que está procurando por algo específico (ex: "só uso saias", "quero vestidos pro verão"). Isso ajuda a personalizar o atendimento no futuro.

## Comando

```bash
node ~/.openclaw/workspace/skills/salvarCliente/salvarCliente.js '{"telefone": "11999999999", "nome": "Joana", "tamanho": "M", "preferencias": ["Vestidos", "Verão"]}'
```

| Campo          | Descrição                                    |
| -------------- | -------------------------------------------- |
| `telefone`     | Telefone da cliente (se você tiver)          |
| `nome`         | Nome da cliente                              |
| `tamanho`      | Tamanho de roupa (ex: P, M, G, 38)           |
| `preferencias` | Array de categorias ou estilos que ela gosta |
| `observacao`   | Algum detalhe extra importante               |

## Resposta

O script confirmará que o perfil foi salvo. Você não precisa falar para a cliente "perfil salvo", apenas continue a conversa naturalmente chamando-a pelo nome e usando a informação que você acabou de gravar para ser uma consultora incrível!
