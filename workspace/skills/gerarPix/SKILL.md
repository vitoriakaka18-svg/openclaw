---
name: gerarPix
description: "Gera um código Pix (Copia e Cola) via Mercado Pago para fechar uma venda."
---

# Gerar PIX

Use esta habilidade **apenas** quando a cliente confirmar todos os itens, endereço/retirada, e concordar em pagar via Pix.

## Comando

Você deve passar um JSON com as informações do pedido.
Exemplo:

```bash
node ~/.openclaw/workspace/skills/gerarPix/gerarPix.js '{"nome": "Maria", "email": "maria@email.com", "total": 150.00}'
```

## Resposta

O script retornará o "Copia e Cola" do Pix.
Envie esse código para a cliente de forma limpa, para que seja fácil dela copiar no celular. Avise que a reserva da peça dura 60 minutos.
