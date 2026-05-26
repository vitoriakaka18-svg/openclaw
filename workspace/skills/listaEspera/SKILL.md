---
name: listaEspera
description: "Adiciona uma cliente à lista de espera de uma peça esgotada."
---

# Lista de Espera

Use esta habilidade quando a cliente demonstrar interesse em um produto que está esgotado ou indisponível no momento. A NINA salvará o nome e o contato da cliente vinculados ao ID do produto para que ela possa ser notificada quando a peça retornar ao estoque.

## Comando

```bash
node ~/.openclaw/workspace/skills/listaEspera/listaEspera.js '{"id": "156d0830-ab3f...", "nomeCliente": "Fernanda"}' '{{From}}'
```

| Campo         | Descrição                                                                   |
| ------------- | --------------------------------------------------------------------------- |
| `id`          | O ID `_id` do produto no Sanity que está esgotado (obrigatório)             |
| `nomeCliente` | Nome da cliente que deseja entrar na fila (obrigatório)                     |
| `telefone`    | Telefone de contato (opcional, se não informado será deduzido do remetente) |

## Resposta

O script retornará a confirmação do produto e o registro da cliente na lista de espera local `lista_espera.json`.
