import { readFileSync } from "fs";

const MP_ACCESS_TOKEN = (process.env.MP_ACCESS_TOKEN || "").trim();

// Aceita JSON via arquivo (--file caminho) ou argumento direto
let inputStr = "{}";
const fileArgIdx = process.argv.indexOf("--file");
if (fileArgIdx !== -1 && process.argv[fileArgIdx + 1]) {
  inputStr = readFileSync(process.argv[fileArgIdx + 1], "utf8").trim();
} else if (process.argv[2] && !process.argv[2].startsWith("--")) {
  inputStr = process.argv[2];
}

async function gerar() {
  if (!MP_ACCESS_TOKEN) {
    console.error("Erro: MP_ACCESS_TOKEN não configurado.");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido recebido:", inputStr);
    process.exit(1);
  }

  const orderId = `ADL-${Date.now().toString(36).toUpperCase()}`;
  const total = Number(data.total);

  if (!total || total <= 0) {
    console.error("Erro: valor total inválido:", data.total);
    process.exit(1);
  }

  console.log(`⏳ Gerando Pix no Mercado Pago para pedido ${orderId}...`);

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": orderId,
      },
      body: JSON.stringify({
        transaction_amount: total,
        description: `Pedido ${orderId} - Achado de Luxo`,
        payment_method_id: "pix",
        payer: {
          email: (data.email || "cliente@achadodeluxo.com.br").trim(),
          first_name: (data.nome || "Cliente").split(" ")[0].trim(),
          last_name: (data.nome || "Cliente").split(" ").slice(1).join(" ").trim() || "Achado",
          identification: {
            type: "CPF",
            number: (data.cpf || "").replace(/\D/g, "").trim(),
          },
        },
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro MP:", JSON.stringify(mpData, null, 2));
      process.exit(1);
    }

    const qrCode = mpData?.point_of_interaction?.transaction_data?.qr_code;
    const paymentId = mpData?.id;

    if (!qrCode) {
      console.error(
        "Erro: QR Code não retornado pelo Mercado Pago:",
        JSON.stringify(mpData, null, 2),
      );
      process.exit(1);
    }

    console.log(`\n✅ PIX GERADO COM SUCESSO!`);
    console.log(`ID do Pedido: ${orderId}`);
    console.log(`ID do Pagamento MP: ${paymentId}`);
    console.log(`Valor: R$ ${total.toFixed(2)}`);
    console.log(`Copia e Cola:\n${qrCode}`);
    console.log(
      `\n(Instrução Interna NINA: Envie APENAS o código "Copia e Cola" acima para a cliente. Informe o valor R$ ${total.toFixed(2)}. Diga que a reserva dura 60 minutos. Depois use a skill criarPedido com: orderId="${orderId}", paymentMPId="${paymentId}")`,
    );
  } catch (err) {
    console.error("Erro ao gerar Pix:", err.message);
    process.exit(1);
  }
}

gerar();
