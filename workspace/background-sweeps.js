import { promises as fs } from "fs";
import path from "path";
import express from "express";

const MP_ACCESS_TOKEN = (
  process.env.MP_ACCESS_TOKEN ||
  "APP_USR-6322985441289765-051312-9e7490ed0e808c50b5542a8f073d8317-1138563402"
).trim();
const SANITY_PROJECT_ID = (process.env.SANITY_PROJECT_ID || "rljynorj").trim();
const SANITY_TOKEN = (process.env.SANITY_TOKEN || "").trim();
const SANITY_DATASET = (process.env.SANITY_DATASET || "production").trim();

const PORT = process.env.PORT || 3000;
const OPENCLAW_HOOK_URL = "http://127.0.0.1:18789/hooks/agent";
const OPENCLAW_TOKEN = "nina-local-secret-123";

const RESERVAS_FILE = path.join(process.cwd(), "workspace", "reservas.json");
const PAGAMENTOS_FILE = path.join(process.cwd(), "workspace", "pagamentos.json");
const FOLLOWUP_FILE = path.join(process.cwd(), "workspace", "followup.json");
const CLIENTES_FILE = path.join(process.cwd(), "workspace", "clientes.json");
const ESPERA_FILE = path.join(process.cwd(), "workspace", "lista_espera.json");

const GERENCIA_WPP = "5511991406619@s.whatsapp.net";
const VIP_GROUP_LINK = "https://chat.whatsapp.com/EI1hWZzTF1V4ecxKnnr2MF";

const app = express();
app.use(express.json());

// Helper para ler arquivos locais JSON com segurança
async function lerArquivoJson(filePath, defaultValue = []) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

// Helper para salvar arquivos locais JSON
async function salvarArquivoJson(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Erro ao salvar arquivo ${filePath}:`, err.message);
  }
}

// Helper para enviar mensagens via OpenClaw Webhook (POST /hooks/agent)
async function triggerNinaMessage(jid, promptMessage) {
  try {
    const res = await fetch(OPENCLAW_HOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        message: `[INSTRUÇÃO DE SISTEMA DE VARREDURA] NINA, envie uma resposta em seu tom de voz de persona para a cliente (${jid}):\n\n${promptMessage}`,
        channel: "whatsapp",
        to: jid,
        deliver: true,
      }),
    });
    if (!res.ok) {
      console.error(`Erro no trigger da mensagem para ${jid}: ${res.statusText}`);
    }
  } catch (err) {
    console.error(`Erro ao disparar webhook da NINA para ${jid}:`, err.message);
  }
}

// 1. verificarReservas()
async function verificarReservas() {
  const reservas = await lerArquivoJson(RESERVAS_FILE, []);
  if (reservas.length === 0) return;

  const agora = Date.now();
  const reservasPressionar = [];
  const reservasExpirar = [];
  const novasReservas = [];

  for (const r of reservas) {
    const tempoRestante = r.expiraEm - agora;
    if (tempoRestante <= 0 && r.tipo !== "medida") {
      reservasExpirar.push(r);
    } else if (r.tipo === "medida" && r.resolvida) {
      // Ignora resolvidas
    } else if (tempoRestante <= 2 * 60 * 60 * 1000 && !r.lembreteEnviado && r.tipo !== "medida") {
      r.lembreteEnviado = true;
      reservasPressionar.push(r);
      novasReservas.push(r);
    } else {
      novasReservas.push(r);
    }
  }

  await salvarArquivoJson(RESERVAS_FILE, novasReservas);

  // Lembrete faltando 2h
  for (const r of reservasPressionar) {
    console.log(`⏰ Enviando lembrete de reserva expirando para ${r.clienteJid}`);
    await triggerNinaMessage(
      r.clienteJid,
      `Avise docemente a cliente (${r.nomeCliente}) que a reserva da peça *${r.nomePeca}* vence em menos de 2 horas. Se ela ainda quiser garantir, você gera o Pix agora. Senão, ela voltará para as araras do site. Termine com emoji carinhoso.`,
    );
  }

  // Cancelar reservas expiradas
  for (const r of reservasExpirar) {
    console.log(`💔 Reserva expirada de ${r.clienteJid} para peça ${r.pecaId}`);
    try {
      const cleanPecaId = r.pecaId.replace(/[\[\]]/g, "").trim();

      // Devolve para disponível no Sanity
      await fetch(
        `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/mutate/${SANITY_DATASET}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SANITY_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mutations: [
              { patch: { id: cleanPecaId, set: { status: "disponivel" } } },
              { patch: { id: "drafts." + cleanPecaId, set: { status: "disponivel" } } },
            ],
          }),
        },
      );

      // Notifica cliente via NINA
      await triggerNinaMessage(
        r.clienteJid,
        `Avise com muito carinho e tom consolador a cliente (${r.nomeCliente}) que o prazo de 24h da reserva para a peça *${r.nomePeca}* expirou e ela teve que retornar para as araras do site. Diga que se ela quiser, pode fazer uma nova reserva ou compra se ainda estiver disponível.`,
      );

      // Notifica Cris
      await triggerNinaMessage(
        GERENCIA_WPP,
        `Informe à Dona Cris que a reserva de *${r.nomePeca}* para a cliente *${r.nomeCliente}* (${r.clienteJid.split("@")[0]}) expirou e a peça voltou a ficar disponível no site.`,
      );
    } catch (e) {
      console.error(`Erro ao expirar reserva ${r.pecaId}:`, e.message);
    }
  }
}

// 2. verificarCarrinhosAbandonados()
async function verificarCarrinhosAbandonados() {
  const pagamentos = await lerArquivoJson(PAGAMENTOS_FILE, {});
  const chaves = Object.keys(pagamentos);
  if (chaves.length === 0) return;

  const agora = Date.now();
  const QUARENTA_E_CINCO_MINUTOS_MS = 45 * 60 * 1000;
  const SESSENTA_E_CINCO_MINUTOS_MS = 65 * 60 * 1000;

  for (const [from, pendente] of Object.entries(pagamentos)) {
    if (!pendente.timestamp) continue;
    const passado = agora - pendente.timestamp;

    // Lembrete de 45 minutos (carrinho abandonado)
    if (
      !pendente.lembreteCarrinhoEnviado &&
      passado >= QUARENTA_E_CINCO_MINUTOS_MS &&
      passado < SESSENTA_E_CINCO_MINUTOS_MS
    ) {
      console.log(`🛒 Lembrete de carrinho abandonado para ${from}`);
      pendente.lembreteCarrinhoEnviado = true;
      await salvarArquivoJson(PAGAMENTOS_FILE, pagamentos);

      await triggerNinaMessage(
        from,
        `Mande um lembrete mega simpático e fofo para a cliente (${pendente.nomeCliente}) dizendo que o Pix gerado para a peça *${pendente.pecaNome}* expira em 15 minutinhos. Pergunte se ela precisa de alguma ajudinha com o Pix ou com o pagamento.`,
      );
    }

    // Expiração completa de 65 minutos
    if (passado >= SESSENTA_E_CINCO_MINUTOS_MS) {
      console.log(`🚫 Pix expirado por inatividade para ${from}. Devolvendo ao estoque...`);

      try {
        const pecasIds = pendente.pecaId ? pendente.pecaId.split(",").map((i) => i.trim()) : [];

        // Devolve peças no Sanity
        for (const pId of pecasIds) {
          if (pId) {
            await fetch(
              `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/mutate/${SANITY_DATASET}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${SANITY_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  mutations: [
                    { patch: { id: pId, set: { status: "disponivel" } } },
                    { patch: { id: "drafts." + pId, set: { status: "disponivel" } } },
                  ],
                }),
              },
            ).catch((e) => console.error(`Erro ao devolver peça ${pId}:`, e.message));
          }
        }

        // Cancela o pedido no Sanity
        if (pendente.sanityId) {
          await fetch(
            `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/mutate/${SANITY_DATASET}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SANITY_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mutations: [{ patch: { id: pendente.sanityId, set: { status: "cancelado" } } }],
              }),
            },
          ).catch((e) => console.error("Erro ao cancelar order no Sanity:", e.message));
        }

        // Notifica cliente
        await triggerNinaMessage(
          from,
          `Avise docemente a cliente (${pendente.nomeCliente}) que o QR Code do seu Pix expirou por falta de pagamento. A peça *${pendente.pecaNome}* retornou para o estoque e se ela ainda quiser, basta pedir para você gerar um novo Pix.`,
        );

        // Notifica Cris
        await triggerNinaMessage(
          GERENCIA_WPP,
          `Informe à Dona Cris que o Pix de *${pendente.pecaNome}* para a cliente *${pendente.nomeCliente}* (${from.split("@")[0]}) expirou. O pedido foi cancelado e a peça voltou ao estoque.`,
        );

        // Limpa da lista de pagamentos pendentes
        delete pagamentos[from];
        await salvarArquivoJson(PAGAMENTOS_FILE, pagamentos);
      } catch (err) {
        console.error("Erro ao expirar Pix:", err.message);
      }
    }
  }
}

// 3. verificarPedidosPendentesSanity()
async function verificarPedidosPendentesSanity() {
  try {
    const query = encodeURIComponent(
      `*[_type == "order" && status == "pendente"]{_id, _createdAt}`,
    );
    const resOrders = await fetch(
      `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/query/${SANITY_DATASET}?query=${query}`,
      {
        headers: { Authorization: `Bearer ${SANITY_TOKEN}` },
      },
    );
    if (!resOrders.ok) return;

    const queryData = await resOrders.json();
    const pendingOrders = queryData?.result || [];

    if (pendingOrders.length > 0) {
      const SESSENTA_E_CINCO_MINUTOS = Date.now() - 65 * 60 * 1000;
      const mutations = [];

      for (const o of pendingOrders) {
        const orderTime = new Date(o._createdAt).getTime();
        if (orderTime < SESSENTA_E_CINCO_MINUTOS) {
          mutations.push({ patch: { id: o._id, set: { status: "cancelado" } } });
        }
      }

      if (mutations.length > 0) {
        await fetch(
          `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/mutate/${SANITY_DATASET}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SANITY_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ mutations }),
          },
        );
        console.log(`🧹 Limpeza Global Sanity: cancelou ${mutations.length} pedidos abandonados.`);
      }
    }
  } catch (err) {
    console.error("Erro na limpeza de pedidos do Sanity:", err.message);
  }
}

// 4. verificarFollowups()
async function verificarFollowups() {
  let followups = await lerArquivoJson(FOLLOWUP_FILE, []);
  if (followups.length === 0) return;

  const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;
  const agora = Date.now();
  let novasFollowups = [];

  for (const fu of followups) {
    if (!fu.enviado && agora - fu.dataPagamento >= TRES_DIAS_MS) {
      console.log(`💌 Enviando follow-up de 3 dias para ${fu.jid}`);
      fu.enviado = true;

      await triggerNinaMessage(
        fu.jid,
        `Faça um pós-venda super fofo e delicado com a cliente (${fu.nomeCliente}). Diga que faz 3 dias que a compra do *${fu.pecaNome}* foi confirmada, pergunte se chegou direitinho e se ela amou a peça. Termine com emoji romântico.`,
      );

      novasFollowups.push(fu);
    } else if (agora - fu.dataPagamento < 30 * 24 * 60 * 60 * 1000) {
      // Mantém no histórico por até 30 dias
      novasFollowups.push(fu);
    }
  }

  await salvarArquivoJson(FOLLOWUP_FILE, novasFollowups);
}

// 5. verificarRelatorio()
let ultimoRelatorioDia = null;
async function verificarRelatorio() {
  const agora = new Date();
  const horaBrasilia = agora.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
  const diaBrasilia = agora.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const hora = parseInt(horaBrasilia.split(":")[0], 10);
  if (hora === 9 && ultimoRelatorioDia !== diaBrasilia) {
    ultimoRelatorioDia = diaBrasilia;

    console.log("📊 Preparando relatório matinal para Dona Cris...");
    try {
      const reservas = await lerArquivoJson(RESERVAS_FILE, []);
      const pagamentos = await lerArquivoJson(PAGAMENTOS_FILE, {});
      const espera = await lerArquivoJson(ESPERA_FILE, {});

      const reservasCount = reservas.filter((r) => r.tipo === "reserva").length;
      const medidasCount = reservas.filter((r) => r.tipo === "medida" && !r.resolvida).length;
      const pagamentosCount = Object.keys(pagamentos).length;
      const esperaCount = Object.values(espera).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0,
      );

      const msg =
        `☀️ *BOM DIA, DONA CRIS!* 🌸\n\n📊 *RESUMO DO DIA — ${diaBrasilia}*\n\n` +
        `📦 *Reservas ativas:* ${reservasCount}\n` +
        `📏 *Medidas pendentes:* ${medidasCount}\n` +
        `💳 *Pagamentos aguardando Pix:* ${pagamentosCount}\n` +
        `⏳ *Clientes na lista de espera:* ${esperaCount}\n\n` +
        `Tenha um dia lindo e abençoado de muitas vendas! 💖✨`;

      await triggerNinaMessage(GERENCIA_WPP, msg);
    } catch (err) {
      console.error("Erro ao gerar relatório diário:", err.message);
    }
  }
}

// 6. verificarClientesSumidos() - [NOVO]
async function verificarClientesSumidos() {
  const clientes = await lerArquivoJson(CLIENTES_FILE, {});
  const pagamentos = await lerArquivoJson(PAGAMENTOS_FILE, {});
  const reservas = await lerArquivoJson(RESERVAS_FILE, []);

  const agora = Date.now();
  const VINTE_E_QUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

  for (const [chave, c] of Object.entries(clientes)) {
    if (!c.ultimaInteracao || !c.telefone) continue;
    const jid = `${c.telefone}@s.whatsapp.net`;

    // Ignora se o cliente já comprou ou tem pendência de reserva/Pix ativa
    if (pagamentos[jid] || reservas.some((r) => r.clienteJid === jid)) continue;
    if (c.followupSumidoEnviado) continue; // Evita mandar duas vezes

    const passado = agora - new Date(c.ultimaInteracao).getTime();

    // Se sumiu há mais de 24h mas menos de 3 dias (janela de oportunidade)
    if (passado >= VINTE_E_QUATRO_HORAS_MS && passado < 3 * 24 * 60 * 60 * 1000) {
      console.log(`🌸 Cliente sumida há 24h detectada: ${c.nome} (${jid})`);
      c.followupSumidoEnviado = true;
      await salvarArquivoJson(CLIENTES_FILE, clientes);

      await triggerNinaMessage(
        jid,
        `Mande uma mensagem mega delicada e simpática para a cliente (${c.nome}). Diga que conversaram ontem e passe apenas para ver se ela ficou com alguma dúvida sobre as peças que gostou. Em seguida, convide-a com muito carinho para fazer parte do nosso **Grupo VIP exclusivo da boutique no WhatsApp** onde postamos todas as novidades fresquinhas em primeira mão! Envie o link oficial do grupo: ${VIP_GROUP_LINK}`,
      );
    }
  }
}

// 7. verificarPixExpirado() (lembrete aos 25 minutos)
async function verificarPixExpirado() {
  const pagamentos = await lerArquivoJson(PAGAMENTOS_FILE, {});
  const agora = Date.now();
  const LIMITE_LEMBRETE_MS = 25 * 60 * 1000;

  for (const [jid, pend] of Object.entries(pagamentos)) {
    if (!pend.lembretePixEnviado && agora - pend.timestamp >= LIMITE_LEMBRETE_MS) {
      console.log(`⏰ Lembrete de vencimento do Pix de 25m para ${jid}`);
      pend.lembretePixEnviado = true;
      await salvarArquivoJson(PAGAMENTOS_FILE, pagamentos);

      await triggerNinaMessage(
        jid,
        `Avise docemente a cliente (${pend.nomeCliente}) que o Pix gerado para a peça *${pend.pecaNome}* vence em minutinhos! Diga que se ela não conseguir pagar a tempo, basta pedir que você gera outro Pix na hora.`,
      );
    }
  }
}

// Webhook automático do Mercado Pago
app.post("/webhook/mercadopago", async (req, res) => {
  res.sendStatus(200); // Responde imediatamente com sucesso ao Mercado Pago

  try {
    const { type, data } = req.body;
    if (type !== "payment" || !data?.id) return;
    const paymentId = String(data.id);

    // Carrega pagamentos locais pendentes
    const pagamentos = await lerArquivoJson(PAGAMENTOS_FILE, {});

    // Procura o cliente que possui esse ID de pagamento
    const clientJid = Object.keys(pagamentos).find(
      (jid) => pagamentos[jid].paymentId === paymentId,
    );
    if (!clientJid) return;

    console.log(`🔔 Webhook MP: Recebido pagamento ${paymentId} para ${clientJid}`);

    // Consulta detalhes do pagamento na API oficial do Mercado Pago para ver se foi aprovado
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!mpRes.ok) return;

    const mpData = await mpRes.json();
    if (mpData?.status !== "approved") return;

    const pendente = pagamentos[clientJid];
    const nomeCliente = pendente.nomeCliente || "Amiga";

    console.log(`✅ Webhook MP: Pix ${paymentId} aprovado! Atualizando estoque e notificando...`);

    // 1. Avisar a cliente via NINA
    await triggerNinaMessage(
      clientJid,
      `Agradeça com imensa alegria e entusiasmo a cliente (${nomeCliente}). Confirme que o Pix de *R$ ${pendente.total}* foi aprovado com sucesso e que a peça *${pendente.pecaNome}* está garantida! Diga que o pedido foi enviado para embalagem perfumada e logo logo ela receberá o rastreamento.`,
    );

    // 2. Avisar a Cris
    await triggerNinaMessage(
      GERENCIA_WPP,
      `Informe à Dona Cris com muita empolgação: *PAGAMENTO CONFIRMADO VIA WEBHOOK!* Cliente: ${nomeCliente}, Peça: ${pendente.pecaNome}, Valor: R$ ${pendente.total}, Telefone: ${clientJid.split("@")[0]}. O pedido foi marcado como pago no Sanity e a peça como vendida.`,
    );

    // 3. Sincroniza Sanity: Marca pedido como pago e peças como vendidas
    try {
      const orderId = pendente.sanityId;
      if (orderId) {
        // Marca pedido como pago
        await fetch(
          `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/mutate/${SANITY_DATASET}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SANITY_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mutations: [{ patch: { id: orderId, set: { status: "pago" } } }],
            }),
          },
        );

        // Marca peças como vendidas no Sanity
        const pecasIds = pendente.pecaId ? pendente.pecaId.split(",").map((id) => id.trim()) : [];
        const mutations = pecasIds.map((pId) => ({
          patch: { id: pId, set: { status: "vendida" } },
        }));
        if (mutations.length > 0) {
          await fetch(
            `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/mutate/${SANITY_DATASET}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SANITY_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ mutations }),
            },
          );
        }
        console.log(`🚀 Webhook MP: Pedido ${pendente.orderId} marcado como PAGO no Sanity.`);
      }
    } catch (sanityErr) {
      console.error("Erro ao sincronizar pagamento com o Sanity:", sanityErr.message);
    }

    // 4. Agenda follow-up de 3 dias no followup.json
    const followups = await lerArquivoJson(FOLLOWUP_FILE, []);
    followups.push({
      jid: clientJid,
      nomeCliente: nomeCliente,
      pecaNome: pendente.pecaNome,
      dataPagamento: Date.now(),
      enviado: false,
    });
    await salvarArquivoJson(FOLLOWUP_FILE, followups);

    // 5. Limpa dos pagamentos pendentes locais
    delete pagamentos[clientJid];
    await salvarArquivoJson(PAGAMENTOS_FILE, pagamentos);
  } catch (err) {
    console.error("Erro no processamento do webhook MP:", err.message);
  }
});

// Loop principal de varreduras periódicas (roda a cada 5 minutos)
async function startSweeps() {
  console.log("🧹 Iniciando varreduras de segundo plano da NINA...");

  // Executa imediatamente no início
  await verificarReservas();
  await verificarCarrinhosAbandonados();
  await verificarPixExpirado();
  await verificarClientesSumidos();
  await verificarFollowups();
  await verificarRelatorio();

  // Agenda intervalos periódicos
  setInterval(verificarReservas, 5 * 60 * 1000);
  setInterval(verificarCarrinhosAbandonados, 5 * 60 * 1000);
  setInterval(verificarPixExpirado, 5 * 60 * 1000);
  setInterval(verificarClientesSumidos, 60 * 60 * 1000); // Roda a cada 1 hora para clientes sumidas
  setInterval(verificarFollowups, 60 * 60 * 1000); // Roda a cada 1 hora
  setInterval(verificarRelatorio, 5 * 60 * 1000); // Confere relatórios a cada 5 minutos
  setInterval(verificarPedidosPendentesSanity, 15 * 60 * 1000); // Limpeza global a cada 15 minutos
}

app.listen(PORT, () => {
  console.log(`🟢 Webhook Listener do Mercado Pago rodando na porta ${PORT}`);
  startSweeps();
});
