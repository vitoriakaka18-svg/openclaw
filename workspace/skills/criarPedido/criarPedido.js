const projectId = (process.env.SANITY_PROJECT_ID || "rljynorj").trim();
const dataset = (process.env.SANITY_DATASET || "production").trim();
const token = (process.env.SANITY_TOKEN || "").trim();
const inputStr = process.argv[2] || "{}";

async function criarPedido() {
  if (!token) {
    console.error("Erro: SANITY_TOKEN não configurado.");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido:", inputStr);
    process.exit(1);
  }

  // Valida campos obrigatórios
  const camposObrigatorios = [
    "orderId",
    "produtoId",
    "nomeProduto",
    "total",
    "nomeCliente",
    "cpfCliente",
    "telefoneCliente",
  ];
  for (const campo of camposObrigatorios) {
    if (!data[campo]) {
      console.error(`Erro: campo obrigatório ausente: ${campo}`);
      process.exit(1);
    }
  }

  const pedido = {
    _type: "order",
    orderId: data.orderId,
    status: "pendente",
    paymentId: data.paymentMPId || "",
    customer: {
      name: data.nomeCliente,
      cpf: (data.cpfCliente || "").replace(/\D/g, ""),
      phone: (data.telefoneCliente || "").replace(/\D/g, ""),
      email: data.emailCliente || "",
    },
    items: [
      {
        _key: `item-${Date.now()}`,
        product: {
          _type: "reference",
          _ref: data.produtoId,
        },
        name: data.nomeProduto,
        size: data.tamanho || "",
        price: Number(data.total),
      },
    ],
    financials: {
      subtotal: Number(data.total),
      shippingPrice: 0,
      total: Number(data.total),
      shippingMethod: data.tipoEntrega === "retirada" ? "Retirada na Loja" : "Entrega",
    },
    shippingAddress:
      data.tipoEntrega === "entrega"
        ? {
            fullAddress: data.enderecoEntrega || "",
            zipcode: "",
          }
        : {
            fullAddress: "Retirada na Loja - Av. Presidente Kennedy, 1852 - São Caetano do Sul",
            zipcode: "",
          },
  };

  console.log(`⏳ Criando pedido ${data.orderId} no Sanity...`);

  try {
    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2023-01-01/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mutations: [{ create: pedido }],
        }),
      },
    );

    const json = await res.json();

    if (!res.ok) {
      console.error("Erro Sanity:", JSON.stringify(json, null, 2));
      process.exit(1);
    }

    const newId = json.results?.[0]?.id || "desconhecido";
    console.log(`\n✅ PEDIDO CRIADO NO SANITY COM SUCESSO!`);
    console.log(`Order ID: ${data.orderId}`);
    console.log(`Sanity Document ID: ${newId}`);
    console.log(`Status: Aguardando Pagamento ⏳`);
    console.log(`Produto: ${data.nomeProduto}`);
    console.log(`Cliente: ${data.nomeCliente}`);
    console.log(`Total: R$ ${Number(data.total).toFixed(2)}`);
    if (data.dataRetirada) console.log(`Retirada: ${data.dataRetirada}`);
  } catch (err) {
    console.error("Erro ao criar pedido:", err.message);
    process.exit(1);
  }
}

criarPedido();
