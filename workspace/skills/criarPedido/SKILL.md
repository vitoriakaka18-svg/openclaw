---
name: criarPedido
description: "Cria um pedido (order) no Sanity CMS após confirmação do pagamento. Use após gerar o PIX e obter o ID do pagamento."
---

# Criar Pedido no Sanity

Use esta habilidade **logo após** gerar o PIX com sucesso, passando o `orderId` e `paymentMPId` retornados pelo `gerarPix`, junto com os dados da cliente e do produto escolhido.

## Campos obrigatórios

| Campo             | Descrição                                                 |
| ----------------- | --------------------------------------------------------- |
| `orderId`         | ID do pedido gerado pelo gerarPix (ex: ADL-MPMSKZ2D)      |
| `produtoId`       | `_id` do produto no Sanity (ex: 156d0830-ab3f...)         |
| `nomeProduto`     | Nome do produto escolhido                                 |
| `total`           | Valor total em reais                                      |
| `nomeCliente`     | Nome completo da cliente                                  |
| `cpfCliente`      | CPF da cliente                                            |
| `telefoneCliente` | Telefone da cliente                                       |
| `tipoEntrega`     | `"retirada"` ou `"entrega"`                               |
| `paymentMPId`     | ID do pagamento no Mercado Pago (retornado pelo gerarPix) |

## Campos opcionais

| Campo             | Descrição                                     |
| ----------------- | --------------------------------------------- |
| `emailCliente`    | E-mail da cliente                             |
| `tamanho`         | Tamanho escolhido                             |
| `cor`             | Cor escolhida da peça (ex: "Verde menta")     |
| `dataRetirada`    | Data e hora da retirada (ex: "amanhã às 14h") |
| `enderecoEntrega` | Endereço completo para entrega                |
| `notas`           | Observações do pedido                         |

## Comando

```bash
node ~/.openclaw/workspace/skills/criarPedido/criarPedido.js '{"orderId":"ADL-MPMSKZ2D","paymentMPId":"123456","produtoId":"156d0830-ab3f-4c5d-b83c-ee1ea8e9dfed","nomeProduto":"Vestido Longo Tomara que Caia","total":79,"nomeCliente":"Kailany Vitoria Pereira","cpfCliente":"62652034367","telefoneCliente":"85992915094","tipoEntrega":"retirada","dataRetirada":"amanhã às 14h"}' '{{From}}'
```

## Resposta

O script confirmará a criação do pedido e retornará o ID do documento no Sanity.
