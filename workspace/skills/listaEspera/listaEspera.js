import { promises as fs } from "fs";
import path from "path";

const projectId = (process.env.SANITY_PROJECT_ID || "rljynorj").trim();
const dataset = (process.env.SANITY_DATASET || "production").trim();
const token = (process.env.SANITY_TOKEN || "").trim();
const inputStr = process.argv[2] || "{}";
const clientJid = process.argv[3] || "desconhecido@s.whatsapp.net";

const ESPERA_FILE = path.join(process.cwd(), "workspace", "lista_espera.json");

async function listaEspera() {
  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido recebido:", inputStr);
    process.exit(1);
  }

  const pecaId = data.id || data.pecaId;
  const nomeCliente = data.nomeCliente;

  if (!pecaId || !nomeCliente) {
    console.error("Erro: Campos obrigatórios ausentes: 'id' (ou 'pecaId') e 'nomeCliente'.");
    process.exit(1);
  }

  let telefone = (data.telefone || "").replace(/\D/g, "");
  let jid = clientJid;

  if (!telefone && clientJid !== "desconhecido@s.whatsapp.net") {
    telefone = clientJid.split("@")[0];
  } else if (telefone && clientJid === "desconhecido@s.whatsapp.net") {
    jid = `${telefone}@s.whatsapp.net`;
  }

  console.log(`⏳ Buscando peça ${pecaId} no Sanity para verificar...`);

  try {
    // Busca os detalhes da peça no Sanity para enriquecer o log/retorno
    let nomePeca = "Peça Sem Nome";
    if (token) {
      try {
        const query = `*[_id == "${pecaId}" || _id == "drafts.${pecaId}"][0]{name}`;
        const queryUrl = `https://${projectId}.api.sanity.io/v2023-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;
        const resQuery = await fetch(queryUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resQuery.ok) {
          const queryJson = await resQuery.json();
          if (queryJson?.result) {
            nomePeca = queryJson.result.name || nomePeca;
          }
        }
      } catch (e) {
        console.warn("Aviso ao buscar detalhes da peça:", e.message);
      }
    }

    // Carrega a lista de espera atual
    let espera = {};
    try {
      const fileContent = await fs.readFile(ESPERA_FILE, "utf8");
      espera = JSON.parse(fileContent);
      if (typeof espera !== "object" || espera === null) espera = {};
    } catch (err) {
      espera = {};
    }

    if (!Array.isArray(espera[pecaId])) {
      espera[pecaId] = [];
    }

    // Verifica se já está cadastrada para esta peça
    const jaCadastrada = espera[pecaId].some((c) => c.jid === jid || c.telefone === telefone);

    if (!jaCadastrada) {
      espera[pecaId].push({
        nome: nomeCliente,
        telefone: telefone,
        jid: jid,
        dataAdicao: new Date().toISOString(),
      });
      await fs.writeFile(ESPERA_FILE, JSON.stringify(espera, null, 2), "utf8");
      console.log(`\n✅ CLIENTE ADICIONADA À LISTA DE ESPERA COM SUCESSO!`);
      console.log(`Peça: ${nomePeca} (ID: ${pecaId})`);
      console.log(`Cliente: ${nomeCliente}`);
      console.log(`Telefone: ${telefone}`);
      console.log(`JID: ${jid}`);
      console.log(
        `\n(Instrução Interna NINA: Avise à cliente carinhosamente que você a colocou na lista de espera para a peça e que entrará em contato assim que tivermos novidades.)`,
      );
    } else {
      console.log(`\n⚠️ A cliente (${nomeCliente}) já está na lista de espera para esta peça.`);
    }
  } catch (err) {
    console.error("Erro ao gerenciar lista de espera:", err.message);
    process.exit(1);
  }
}

listaEspera();
