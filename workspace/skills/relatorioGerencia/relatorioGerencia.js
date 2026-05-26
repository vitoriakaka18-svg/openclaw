import { promises as fs } from "fs";
import path from "path";

const RESERVAS_FILE = path.join(process.cwd(), "workspace", "reservas.json");
const PAGAMENTOS_FILE = path.join(process.cwd(), "workspace", "pagamentos.json");
const ESPERA_FILE = path.join(process.cwd(), "workspace", "lista_espera.json");
const BLACKLIST_FILE = path.join(process.cwd(), "workspace", "blacklist.json");

async function lerArquivoJson(filePath, defaultValue = []) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

async function gerarRelatorio() {
  try {
    const reservas = await lerArquivoJson(RESERVAS_FILE, []);
    const pagamentos = await lerArquivoJson(PAGAMENTOS_FILE, {});
    const espera = await lerArquivoJson(ESPERA_FILE, {});
    const blacklist = await lerArquivoJson(BLACKLIST_FILE, []);

    let relatorio = `📊 **RELATÓRIO GERENCIAL ATUALIZADO** 📊\n\n`;

    // 1. Reservas Ativas
    const reservasCount = reservas.filter((r) => r.tipo === "reserva").length;
    relatorio += `📦 **Reservas Ativas (Prazo de 24h):** ${reservasCount}\n`;
    if (reservasCount > 0) {
      reservas
        .filter((r) => r.tipo === "reserva")
        .forEach((r) => {
          const tempoRestante = Math.max(0, r.expiraEm - Date.now());
          const horas = Math.floor(tempoRestante / (60 * 60 * 1000));
          const minutos = Math.floor((tempoRestante % (60 * 60 * 1000)) / (60 * 1000));
          relatorio += `  - Piece: *${r.nomePeca}* (ID: ${r.pecaId}) | Cliente: ${r.nomeCliente} | Expira em: ${horas}h ${minutos}min\n`;
        });
    } else {
      relatorio += `  - Nenhuma reserva ativa no momento.\n`;
    }
    relatorio += `\n`;

    // 2. Medidas Pendentes
    const medidasCount = reservas.filter((r) => r.tipo === "medida" && !r.resolvida).length;
    relatorio += `📏 **Solicitações de Medidas Pendentes:** ${medidasCount}\n`;
    if (medidasCount > 0) {
      reservas
        .filter((r) => r.tipo === "medida" && !r.resolvida)
        .forEach((r) => {
          relatorio += `  - Piece: *${r.nomePeca}* (ID: ${r.pecaId}) | Cliente: ${r.nomeCliente}\n`;
        });
    } else {
      relatorio += `  - Nenhuma solicitação de medida pendente no momento.\n`;
    }
    relatorio += `\n`;

    // 3. Pagamentos Pendentes (Pix gerados)
    const pagamentosCount = Object.keys(pagamentos).length;
    relatorio += `💳 **Pix Aguardando Pagamento:** ${pagamentosCount}\n`;
    if (pagamentosCount > 0) {
      Object.entries(pagamentos).forEach(([jid, p]) => {
        const tempoPassado = Date.now() - p.timestamp;
        const minutos = Math.floor(tempoPassado / (60 * 1000));
        relatorio += `  - Cliente: ${p.nomeCliente} (${jid.split("@")[0]}) | Peça: *${p.pecaNome}* | Valor: R$ ${p.total.toFixed(2)} | Gerado há: ${minutos} min\n`;
      });
    } else {
      relatorio += `  - Nenhum Pix aguardando pagamento no momento.\n`;
    }
    relatorio += `\n`;

    // 4. Lista de Espera
    const esperaCount = Object.values(espera).reduce(
      (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
      0,
    );
    relatorio += `⏳ **Clientes na Lista de Espera:** ${esperaCount}\n`;
    if (esperaCount > 0) {
      Object.entries(espera).forEach(([pecaId, clientes]) => {
        if (Array.isArray(clientes) && clientes.length > 0) {
          relatorio += `  - Peça ID *${pecaId}*:\n`;
          clientes.forEach((c) => {
            relatorio += `    * ${c.nome} (${c.telefone || "sem telefone"})\n`;
          });
        }
      });
    } else {
      relatorio += `  - Nenhuma cliente na lista de espera.\n`;
    }
    relatorio += `\n`;

    // 5. Blacklist
    const blacklistCount = blacklist.length;
    relatorio += `🚫 **Contatos Bloqueados (Blacklist):** ${blacklistCount}\n`;
    if (blacklistCount > 0) {
      blacklist.forEach((b) => {
        relatorio += `  - ${b.nome || "sem nome"} (${b.telefone || b.jid.split("@")[0]})\n`;
      });
    }

    console.log(relatorio);
  } catch (err) {
    console.error("Erro ao gerar relatório gerencial:", err.message);
    process.exit(1);
  }
}

gerarRelatorio();
