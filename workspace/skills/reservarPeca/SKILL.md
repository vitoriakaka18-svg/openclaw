---
name: reservarPeca
description: "Altera o status de uma peça no estoque (Sanity) para 'reservada'."
---

# Reservar Peça

Use esta habilidade quando a cliente demonstrar intenção real de compra mas precisar de um tempinho (ex: vai pagar no dia seguinte, ou pediu para segurar até o fim do dia) ou quando o pagamento estiver pendente.

## Comando

```bash
node ~/.openclaw/workspace/skills/reservarPeca/reservarPeca.js '{"id": "156d0830-ab3f...", "nomeCliente": "Joana", "emailCliente": "joana@email.com"}' '{{From}}'
```

| Campo          | Descrição                                      |
| -------------- | ---------------------------------------------- |
| `id`           | O ID `_id` do produto no Sanity                |
| `nomeCliente`  | Nome da cliente que está reservando (opcional) |
| `emailCliente` | Email da cliente (opcional)                    |

## Resposta

O script confirmará se a peça foi atualizada no estoque com sucesso. Após a confirmação do script, avise a cliente carinhosamente que a peça está guardada especialmente para ela.
