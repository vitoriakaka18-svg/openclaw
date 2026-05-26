const projectId = (process.env.SANITY_PROJECT_ID || "rljynorj").trim();
const dataset = (process.env.SANITY_DATASET || "production").trim();
const token = (process.env.SANITY_TOKEN || "").trim();
const inputStr = process.argv[2] || "{}";

async function reservarPeca() {
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

  console.log(`⏳ Reservando peça ${pecaId} no Sanity...`);

  try {
    // Tenta atualizar a peça publicada
    const resPublicada = await fetch(
      `https://${projectId}.api.sanity.io/v2023-01-01/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mutations: [{ patch: { id: pecaId, set: { status: "reservada" } } }],
        }),
      },
    );

    // Tenta atualizar também os drafts (rascunhos) caso a peça não esteja totalmente publicada
    const resDraft = await fetch(
      `https://${projectId}.api.sanity.io/v2023-01-01/data/mutate/${dataset}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mutations: [{ patch: { id: "drafts." + pecaId, set: { status: "reservada" } } }],
        }),
      },
    );

    const json = await resPublicada.json();

    if (!resPublicada.ok) {
      console.error("Erro Sanity:", JSON.stringify(json, null, 2));
      process.exit(1);
    }

    console.log(`\n✅ PEÇA RESERVADA COM SUCESSO NO ESTOQUE!`);
    console.log(`Peça ID: ${pecaId}`);
    console.log(`Status alterado para: reservada`);
    console.log(
      `\n(Instrução Interna NINA: Avise a cliente docemente que a peça está reservada exclusivamente para ela por 24 horas.)`,
    );
  } catch (err) {
    console.error("Erro ao reservar peça:", err.message);
    process.exit(1);
  }
}

reservarPeca();
