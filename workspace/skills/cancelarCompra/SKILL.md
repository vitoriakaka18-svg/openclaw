---
name: cancelarCompra
description: "Cancela a compra de uma peça, retornando seu status para 'disponivel' no estoque do Sanity."
---

# Cancelar Compra

Use esta habilidade quando a cliente desistir explicitamente da compra de uma peça que estava reservada ou cujo Pix já havia sido gerado.

## Comando

```bash
node ~/.openclaw/workspace/skills/cancelarCompra/cancelarCompra.js '{"id": "156d0830-ab3f..."}'
```

| Campo | Descrição                                                |
| ----- | -------------------------------------------------------- |
| `id`  | O ID `_id` do produto no Sanity que estava em negociação |

## Resposta

O script confirmará se a peça foi cancelada e voltou a ficar disponível para o público. Avise a cliente carinhosamente que o cancelamento foi concluído.
