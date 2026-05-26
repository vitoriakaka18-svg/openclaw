---
name: consultarCliente
description: "Consulta o perfil salvo de uma cliente (tamanho, preferências, observações e histórico) usando seu contato."
---

# Consultar Cliente

Use esta habilidade para buscar o perfil persistente de uma cliente no sistema local quando ela perguntar se você lembra do tamanho dela, quais são as preferências dela ou se você precisar recuperar observações anteriores para dar um atendimento ultra personalizado.

## Comando

```bash
node ~/.openclaw/workspace/skills/consultarCliente/consultarCliente.js '{}' '{{From}}'
```

Você pode passar o `telefone` no JSON se quiser consultar o perfil de um número específico, ou deixar o JSON vazio `'{}'` para consultar automaticamente os dados de quem enviou a mensagem (usando o remetente `{{From}}`).

## Resposta

O script retornará os detalhes do perfil da cliente (Nome, Tamanho, Preferências, Observações e a data da última conversa) salvos em `clientes.json`.
