import { promises as fs } from "fs";
import path from "path";

const inputStr = process.argv[2] || "{}";
const BLACKLIST_FILE = path.join(process.cwd(), "workspace", "blacklist.json");

async function gerenciarBlacklist() {
  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido recebido:", inputStr);
    process.exit(1);
  }

  const acao = data.acao;
  if (acao !== "adicionar" && acao !== "remover") {
    console.error("Erro: O campo 'acao' deve ser 'adicionar' ou 'remover'.");
    process.exit(1);
  }

  let jid = data.jid || "";
  let telefone = (data.telefone || "").replace(/\D/g, "");
  const nome = data.nome || "";

  if (!jid && !telefone) {
    console.error("Erro: Você deve fornecer 'telefone' ou 'jid'.");
    process.exit(1);
  }

  // Normalização de jid e telefone
  if (jid && !telefone) {
    telefone = jid.split("@")[0];
  } else if (telefone && !jid) {
    jid = `${telefone}@s.whatsapp.net`;
  }

  try {
    // Tenta ler o arquivo atual
    let blacklist = [];
    try {
      const fileContent = await fs.readFile(BLACKLIST_FILE, "utf8");
      blacklist = JSON.parse(fileContent);
      if (!Array.isArray(blacklist)) blacklist = [];
    } catch (err) {
      // Arquivo não existe ou inválido, cria novo
      blacklist = [];
    }

    if (acao === "adicionar") {
      // Verifica se já está na lista
      const existe = blacklist.some((b) => b.jid === jid || b.telefone === telefone);
      if (!existe) {
        blacklist.push({
          jid: jid,
          telefone: telefone,
          nome: nome || "Contato Bloqueado",
          dataBloqueio: new Date().toISOString(),
        });
        await fs.writeFile(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2), "utf8");
        console.log(`\n✅ CONTATO ADICIONADO À BLACKLIST COM SUCESSO!`);
        console.log(`Nome: ${nome || "Contato Bloqueado"}`);
        console.log(`Telefone: ${telefone}`);
        console.log(`JID: ${jid}`);
      } else {
        console.log(`\n⚠️ O contato (${telefone}) já está na blacklist.`);
      }
    } else if (acao === "remover") {
      const tamanhoInicial = blacklist.length;
      blacklist = blacklist.filter((b) => b.jid !== jid && b.telefone !== telefone);

      if (blacklist.length < tamanhoInicial) {
        await fs.writeFile(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2), "utf8");
        console.log(`\n✅ CONTATO REMOVEDO DA BLACKLIST COM SUCESSO!`);
        console.log(`Telefone: ${telefone}`);
        console.log(`JID: ${jid}`);
      } else {
        console.log(`\n⚠️ O contato (${telefone}) não foi encontrado na blacklist.`);
      }
    }
  } catch (err) {
    console.error("Erro ao gerenciar blacklist:", err.message);
    process.exit(1);
  }
}

gerenciarBlacklist();
