import { promises as fs } from "fs";
import path from "path";

const inputStr = process.argv[2] || "{}";
const clientJid = process.argv[3] || "desconhecido@s.whatsapp.net";

const CLIENTES_FILE = path.join(process.cwd(), "workspace", "clientes.json");

async function consultarCliente() {
  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido recebido:", inputStr);
    process.exit(1);
  }

  let telefoneBusca = (data.telefone || "").replace(/\D/g, "");
  let jidBusca = clientJid;

  if (!telefoneBusca && clientJid !== "desconhecido@s.whatsapp.net") {
    telefoneBusca = clientJid.split("@")[0];
  }

  try {
    // Tenta ler o arquivo de clientes
    let clientesData = {};
    try {
      const fileContent = await fs.readFile(CLIENTES_FILE, "utf8");
      clientesData = JSON.parse(fileContent);
    } catch (err) {
      clientesData = {};
    }

    // Procura na base de clientes pelo telefone
    let perfilEncontrado = null;
    let chaveEncontrada = "";

    // Tenta busca exata pela chave
    if (telefoneBusca && clientesData[telefoneBusca]) {
      perfilEncontrado = clientesData[telefoneBusca];
      chaveEncontrada = telefoneBusca;
    } else {
      // Busca varrendo todos os registros
      for (const [chave, perfil] of Object.entries(clientesData)) {
        if (
          perfil.telefone === telefoneBusca ||
          (perfil.telefone && telefoneBusca && perfil.telefone.endsWith(telefoneBusca))
        ) {
          perfilEncontrado = perfil;
          chaveEncontrada = chave;
          break;
        }
      }
    }

    if (perfilEncontrado) {
      console.log(`\n✅ PERFIL DE CLIENTE ENCONTRADO!`);
      console.log(`Nome: ${perfilEncontrado.nome || "Cliente"}`);
      console.log(`Telefone: ${perfilEncontrado.telefone || "Não informado"}`);
      console.log(`Tamanho: ${perfilEncontrado.tamanho || "Ainda não cadastrado"}`);
      console.log(
        `Preferências: ${perfilEncontrado.preferencias && perfilEncontrado.preferencias.length > 0 ? perfilEncontrado.preferencias.join(", ") : "Nenhuma preferência registrada"}`,
      );
      console.log(`Observações: ${perfilEncontrado.observacao || "Nenhuma observação"}`);
      if (perfilEncontrado.ultimaInteracao) {
        const dataInteracao = new Date(perfilEncontrado.ultimaInteracao).toLocaleDateString(
          "pt-BR",
        );
        console.log(`Última Conversa: ${dataInteracao}`);
      }
      console.log(
        `\n(Instrução Interna NINA: Use essas informações da cliente para mostrar que você se lembra do rostinho/tamanho dela! Exemplo: "Lembro sim, linda! Você veste M, né? Vou selecionar as melhores peças..." ou pergunte se quer manter as preferências anteriores.)`,
      );
    } else {
      console.log(
        `\n❌ Nenhum perfil persistente encontrado para o contato com telefone ${telefoneBusca || "desconhecido"}.`,
      );
      console.log(
        `\n(Instrução Interna NINA: Trate a cliente com o máximo de carinho e simpatia como uma nova amiga da boutique! Durante o bate-papo, pergunte delicadamente o nome dela e o tamanho que ela costuma vestir. Quando ela responder, use a ferramenta \`salvarCliente\` na hora para gravar a memória dela para sempre!)`,
      );
    }
  } catch (err) {
    console.error("Erro ao consultar cliente:", err.message);
    process.exit(1);
  }
}

consultarCliente();
