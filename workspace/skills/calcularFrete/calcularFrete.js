const inputStr = process.argv[2] || "{}";

async function calcular() {
  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (e) {
    console.error("Erro: JSON inválido recebido:", inputStr);
    process.exit(1);
  }

  const cep = (data.cep || "").replace(/\D/g, "");
  const pecaId = data.id || "";
  const preco = Number(data.preco) || 189; // Fallback se não tiver preço exato

  if (!cep) {
    console.error("Erro: campo CEP é obrigatório.");
    process.exit(1);
  }

  console.log(`⏳ Calculando opções de frete para o CEP ${cep}...`);

  try {
    const freteRes = await fetch("https://achado-de-luxo.vercel.app/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cep_destino: cep,
        peso: 0.7,
        altura: 12,
        largura: 15,
        comprimento: 15,
        valor_produto: preco,
      }),
    });

    const fData = await freteRes.json();

    if (fData.servicos && fData.servicos.length > 0) {
      console.log(`\n✅ FRETE CALCULADO COM SUCESSO!`);
      console.log(`Opções disponíveis para o CEP ${cep}:`);
      fData.servicos.forEach((s) => {
        console.log(`- ${s.name}: R$ ${s.price} (Prazo estimado: ${s.delivery_time} dias úteis)`);
      });
      console.log(
        `\n(Instrução Interna NINA: Repasse essas opções exatamente com esses valores para a cliente de forma educada e pergunte qual ela prefere.)`,
      );
    } else {
      console.log(
        `\n❌ Nenhuma opção de frete disponível no momento para esse CEP. Tente verificar se o CEP está correto.`,
      );
    }
  } catch (err) {
    console.error("Erro ao calcular frete:", err.message);
    process.exit(1);
  }
}

calcular();
