import { promises as fs } from "fs";
import path from "path";

const inputStr = process.argv[2] || "{}";
const clientJid = process.argv[3] || "desconhecido@s.whatsapp.net";

const RASTREAMENTOS_FILE = path.join(process.cwd(), "workspace", "rastreamentos.json");
const PAGAMENTOS_FILE = path.join(process.cwd(), "workspace", "pagamentos.json");
const FOLLOWUP_FILE = path.join(process.cwd(), "workspace", "followup.json");

// Helper para carregar JSON com segurança
async function lerArquivoJson(filePath, defaultValue = {}) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

async function atualizarRastreamento() {
  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido recebido:", inputStr);
    process.exit(1);
  }

  let orderId = data.orderId || "";
  const codigoRastreio = data.codigoRastreio || "";

  try {
    let rastreamentos = await lerArquivoJson(RASTREAMENTOS_FILE, {});

    // CASO 1: SALVAR / ATUALIZAR CÓDIGO
    if (codigoRastreio) {
      if (!orderId) {
        // Tenta deduzir o orderId do cliente no pagamentos.json ou followup.json
        console.log(`⚠️ orderId ausente. Tentando deduzir para o cliente ${clientJid}...`);
        const pagamentos = await lerArquivoJson(PAGAMENTOS_FILE, {});
        if (pagamentos[clientJid]) {
          orderId = pagamentos[clientJid].orderId;
        } else {
          const followups = await lerArquivoJson(FOLLOWUP_FILE, []);
          const r = followups.find((f) => f.jid === clientJid);
          if (r) {
            // Se for no followup, pode não ter o orderId, mas tentamos associar
            orderId = r.orderId || "ADL-DEDUCED";
          }
        }
      }

      if (!orderId) {
        console.error("Erro: Para salvar um rastreamento, informe o 'orderId'.");
        process.exit(1);
      }

      // Adiciona ou atualiza
      rastreamentos[orderId] = {
        orderId: orderId,
        codigoRastreio: codigoRastreio,
        clienteJid: clientJid,
        dataAtualizacao: new Date().toISOString(),
      };

      await fs.writeFile(RASTREAMENTOS_FILE, JSON.stringify(rastreamentos, null, 2), "utf8");

      console.log(`\n✅ CÓDIGO DE RASTREAMENTO ATUALIZADO COM SUCESSO!`);
      console.log(`Pedido ID: ${orderId}`);
      console.log(`Rastreio: ${codigoRastreio}`);
      console.log(`Cliente JID: ${clientJid}`);
      console.log(
        `\n(Instrução Interna NINA: Avise à cliente ou gerente carinhosamente que o código de rastreamento foi registrado com sucesso no sistema.)`,
      );
      process.exit(0);
    }

    // CASO 2: CONSULTAR CÓDIGO
    console.log(`🔎 Consultando código de rastreamento...`);

    let encontrado = null;

    // Busca direta por orderId
    if (orderId && rastreamentos[orderId]) {
      encontrado = rastreamentos[orderId];
    } else {
      // Busca geral por JID ou telefone
      const entries = Object.values(rastreamentos);
      encontrado = entries.find(
        (r) =>
          r.clienteJid === clientJid ||
          (clientJid !== "desconhecido@s.whatsapp.net" &&
            r.clienteJid.split("@")[0] === clientJid.split("@")[0]),
      );
    }

    if (encontrado) {
      console.log(`\n✅ RASTREAMENTO ENCONTRADO!`);
      console.log(`Pedido ID: ${encontrado.orderId}`);
      console.log(`Código de Rastreio: ${encontrado.codigoRastreio}`);
      console.log(
        `Data de Registro: ${new Date(encontrado.dataAtualizacao).toLocaleDateString("pt-BR")}`,
      );
      console.log(
        `\n(Instrução Interna NINA: Informe à cliente com muito carinho que você encontrou o rastreio dela: *${encontrado.codigoRastreio}*. Diga que ela pode rastrear no site dos Correios e dê um encorajamento fofo!)`,
      );
    } else {
      console.log(`\n❌ Nenhum código de rastreamento encontrado para este pedido ou cliente.`);
      console.log(
        `\n(Instrução Interna NINA: Diga à cliente de forma super simpática que não encontrou o código de rastreio dela nos registros ainda. Explique que o pedido pode estar em fase de embalagem e que logo Dona Cris atualizará, ou peça o número do pedido para tentar uma busca manual.)`,
      );
    }
  } catch (err) {
    console.error("Erro ao gerenciar rastreamento:", err.message);
    process.exit(1);
  }
}

atualizarRastreamento();
