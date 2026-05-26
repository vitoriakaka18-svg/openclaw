---
name: atualizarRastreamento
description: "Salva, atualiza ou consulta códigos de rastreamento de encomendas."
---

# Atualizar Rastreamento

Use esta habilidade para gerenciar os códigos de rastreamento dos Correios/Melhor Envio das clientes.

- Se você fornecer o `codigoRastreio` e o `orderId`, a habilidade **salvará/atualizará** o código no sistema.
- Se você **não** fornecer o `codigoRastreio`, a habilidade **consultará** os códigos existentes vinculados ao `orderId` ou ao número de WhatsApp da cliente para responder onde está a encomenda.

## Comando

```bash
node ~/.openclaw/workspace/skills/atualizarRastreamento/atualizarRastreamento.js '{"orderId": "ADL-MPMSKZ2D", "codigoRastreio": "BR123456789BR"}' '{{From}}'
```

| Campo            | Descrição                                                                            |
| ---------------- | ------------------------------------------------------------------------------------ |
| `orderId`        | O ID do pedido (ex: `ADL-MPMSKZ2D`, opcional para consulta, obrigatório para salvar) |
| `codigoRastreio` | O código de rastreamento (ex: `BR123456789BR`, opcional se for apenas consulta)      |

## Resposta

O script confirmará se o código foi salvo com sucesso ou retornará os detalhes do rastreamento encontrado para que você possa repassar para a cliente com carinho.
