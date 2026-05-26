import { promises as fs } from "fs";
import path from "path";

const inputStr = process.argv[2] || "{}";
const CLIENTES_FILE = path.join(process.cwd(), "workspace", "clientes.json");

async function salvarCliente() {
  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido recebido:", inputStr);
    process.exit(1);
  }

  const telefone = (data.telefone || "desconhecido").replace(/\D/g, "");
  const nome = data.nome || "Cliente sem nome";

  if (telefone === "desconhecido" && nome === "Cliente sem nome") {
    console.error("Erro: É necessário informar pelo menos um telefone ou nome.");
    process.exit(1);
  }

  try {
    // Tenta ler o arquivo atual
    let clientesData = {};
    try {
      const fileContent = await fs.readFile(CLIENTES_FILE, "utf8");
      clientesData = JSON.parse(fileContent);
    } catch (err) {
      // Arquivo não existe ou inválido, cria um novo
      clientesData = {};
    }

    // A chave pode ser o telefone se disponível, senão usamos o nome como ID
    const chave = telefone !== "desconhecido" ? telefone : nome.toLowerCase().replace(/\s+/g, "_");

    // Atualiza o perfil mesclando com dados existentes
    clientesData[chave] = {
      ...(clientesData[chave] || {}),
      nome: nome,
      telefone: telefone,
      tamanho: data.tamanho || (clientesData[chave] && clientesData[chave].tamanho) || "",
      preferencias:
        data.preferencias || (clientesData[chave] && clientesData[chave].preferencias) || [],
      observacao: data.observacao || (clientesData[chave] && clientesData[chave].observacao) || "",
      ultimaInteracao: new Date().toISOString(),
    };

    // Salva o arquivo
    await fs.writeFile(CLIENTES_FILE, JSON.stringify(clientesData, null, 2), "utf8");

    console.log(`\n✅ PERFIL SALVO COM SUCESSO!`);
    console.log(`Nome: ${nome}`);
    if (data.tamanho) console.log(`Tamanho: ${data.tamanho}`);
    if (data.preferencias) console.log(`Preferências: ${JSON.stringify(data.preferencias)}`);
    console.log(
      `\n(Instrução Interna NINA: Continue a conversa chamando a cliente pelo nome e usando as informações dela para dar um atendimento mega personalizado e chique.)`,
    );
  } catch (err) {
    console.error("Erro ao salvar cliente:", err.message);
    process.exit(1);
  }
}

salvarCliente();
