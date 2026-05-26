import { promises as fs } from "fs";
import path from "path";

const projectId = (process.env.SANITY_PROJECT_ID || "rljynorj").trim();
const dataset = (process.env.SANITY_DATASET || "production").trim();
const token = (process.env.SANITY_TOKEN || "").trim();
const inputStr = process.argv[2] || "{}";
const clientJid = process.argv[3] || "desconhecido@s.whatsapp.net";

const RESERVAS_FILE = path.join(process.cwd(), "workspace", "reservas.json");

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
  const nomeCliente = data.nomeCliente || "Cliente";

  if (!pecaId) {
    console.error(`Erro: campo obrigatório ausente: id`);
    process.exit(1);
  }

  console.log(`⏳ Reservando peça ${pecaId} no Sanity...`);

  try {
    // 1. Busca os detalhes da peça no Sanity (nome e imagem)
    let nomePeca = "Peça Sem Nome";
    let fotoUrl = "";
    try {
      const query = `*[_id == "${pecaId}" || _id == "drafts.${pecaId}"][0]{name, "imageUrl": imagePrimary.asset->url}`;
      const queryUrl = `https://${projectId}.api.sanity.io/v2023-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;
      const resQuery = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resQuery.ok) {
        const queryJson = await resQuery.json();
        if (queryJson?.result) {
          nomePeca = queryJson.result.name || nomePeca;
          fotoUrl = queryJson.result.imageUrl || fotoUrl;
        }
      }
    } catch (e) {
      console.warn("Aviso ao buscar detalhes da peça:", e.message);
    }

    // 2. Tenta atualizar a peça publicada no Sanity
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

    // Tenta atualizar também os drafts (rascunhos)
    await fetch(`https://${projectId}.api.sanity.io/v2023-01-01/data/mutate/${dataset}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mutations: [{ patch: { id: "drafts." + pecaId, set: { status: "reservada" } } }],
      }),
    });

    const json = await resPublicada.json();

    if (!resPublicada.ok) {
      console.error("Erro Sanity:", JSON.stringify(json, null, 2));
      process.exit(1);
    }

    // 3. Salva a reserva localmente em reservas.json
    let reservas = [];
    try {
      const fileContent = await fs.readFile(RESERVAS_FILE, "utf8");
      reservas = JSON.parse(fileContent);
      if (!Array.isArray(reservas)) reservas = [];
    } catch (err) {
      reservas = [];
    }

    // Remove qualquer reserva antiga para a mesma peça
    reservas = reservas.filter((r) => r.pecaId !== pecaId);

    // Adiciona a nova reserva (expira em 24h)
    reservas.push({
      pecaId: pecaId,
      nomePeca: nomePeca,
      expiraEm: Date.now() + 24 * 60 * 60 * 1000,
      lembreteEnviado: false,
      clienteJid: clientJid,
      nomeCliente: nomeCliente,
      tipo: "reserva",
      fotoUrl: fotoUrl,
    });

    await fs.writeFile(RESERVAS_FILE, JSON.stringify(reservas, null, 2), "utf8");

    console.log(`\n✅ PEÇA RESERVADA COM SUCESSO NO ESTOQUE E SALVA LOCALMENTE!`);
    console.log(`Peça ID: ${pecaId}`);
    console.log(`Nome da Peça: ${nomePeca}`);
    console.log(`Cliente: ${nomeCliente} (${clientJid})`);
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
