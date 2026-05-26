---
name: calcularFrete
description: "Calcula o valor do frete e os prazos de entrega para o CEP da cliente."
---

# Calcular Frete

Use esta habilidade imediatamente quando a cliente informar o CEP para entrega (ou se você tiver pedido o CEP).

## Comando

```bash
node ~/.openclaw/workspace/skills/calcularFrete/calcularFrete.js '{"cep": "09560010", "id": "156d0830-ab3f...", "preco": 189}'
```

| Campo   | Descrição                                                   |
| ------- | ----------------------------------------------------------- |
| `cep`   | O CEP informado pela cliente (somente números ou com traço) |
| `id`    | ID do produto que a cliente quer (opcional)                 |
| `preco` | Preço do produto em reais (opcional, para seguro do frete)  |

## Resposta

O script retornará uma lista de opções de frete (ex: PAC, SEDEX) com os respectivos valores em reais e prazos estimados em dias úteis.
Repasse essas opções para a cliente de forma amigável e pergunte qual delas ela prefere.
