const projectId = (process.env.SANITY_PROJECT_ID || "rljynorj").trim();
const dataset = (process.env.SANITY_DATASET || "production").trim();
const token = (process.env.SANITY_TOKEN || "").trim();
const inputStr = process.argv[2] || "{}";

async function cancelarCompra() {
  if (!token) {
    console.error("Erro: SANITY_TOKEN não configurado no .env.");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido:", inputStr);
    process.exit(1);
  }

  const pecaId = data.id;

  if (!pecaId) {
    console.error(`Erro: campo obrigatório ausente: id`);
    process.exit(1);
  }

  console.log(`⏳ Cancelando compra e liberando a peça ${pecaId} no Sanity...`);

  try {
    // Retorna a peça publicada para "disponivel"
    const resPublicada = await fetch(
      `https://${projectId}.api.sanity.io/v2023-01-01/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mutations: [{ patch: { id: pecaId, set: { status: "disponivel" } } }],
        }),
      },
    );

    // Retorna a peça draft (rascunho) para "disponivel"
    const resDraft = await fetch(
      `https://${projectId}.api.sanity.io/v2023-01-01/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mutations: [{ patch: { id: "drafts." + pecaId, set: { status: "disponivel" } } }],
        }),
      },
    );

    if (!resPublicada.ok) {
      const json = await resPublicada.json();
      console.error("Erro Sanity:", JSON.stringify(json, null, 2));
      process.exit(1);
    }

    console.log(`\n✅ COMPRA CANCELADA COM SUCESSO!`);
    console.log(`Peça ID: ${pecaId}`);
    console.log(`Status da peça alterado de volta para: disponivel`);
    console.log(
      `\n(Instrução Interna NINA: Avise a cliente docemente que o cancelamento foi feito com sucesso e a peça já está disponível novamente. Pergunte se ela quer ver outras opções!)`,
    );
  } catch (err) {
    console.error("Erro ao cancelar compra:", err.message);
    process.exit(1);
  }
}

cancelarCompra();
