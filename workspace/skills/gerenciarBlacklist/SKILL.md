---
name: gerenciarBlacklist
description: "Adiciona ou remove um número de WhatsApp da blacklist (bloqueio de contatos)."
---

# Gerenciar Blacklist

Use esta habilidade para bloquear contatos indesejados (adicionar à blacklist) ou desbloqueá-los (remover da blacklist). Clientes que estão na blacklist são exibidos nos relatórios gerenciais e podem ser ignorados em interações automatizadas.

## Comando

```bash
node ~/.openclaw/workspace/skills/gerenciarBlacklist/gerenciarBlacklist.js '{"acao": "adicionar", "telefone": "5511999999999", "nome": "Cliente Inconveniente"}' '{{From}}'
```

| Campo      | Descrição                                                               |
| ---------- | ----------------------------------------------------------------------- |
| `acao`     | Ação a realizar: `"adicionar"` ou `"remover"` (obrigatório)             |
| `telefone` | Número de telefone com DDD (opcional se `jid` for informado)            |
| `jid`      | JID completo do WhatsApp (ex: `5511999999999@s.whatsapp.net`, opcional) |
| `nome`     | Nome identificador do contato (opcional, útil para o relatório)         |

## Resposta

O script confirmará a inserção ou remoção do número no arquivo local `blacklist.json`.
