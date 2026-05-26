import { spawn } from "child_process";
import path from "path";

console.log(
  "🚀 [LAUNCHER] Iniciando OpenClaw Gateway e Varreduras em Segundo Plano (Sweeps & Webhooks)...",
);

// Resolvendo caminhos
const sweepsPath = path.join(process.cwd(), "workspace", "background-sweeps.js");
const gatewayPath = path.join(process.cwd(), "openclaw.mjs");

// 1. Inicia o Processo de Varreduras (Sweeps/Webhook MP)
console.log(`📦 [LAUNCHER] Iniciando microsserviço de varreduras: node ${sweepsPath}`);
const sweeps = spawn("node", [sweepsPath], {
  stdio: "inherit",
  env: { ...process.env, PORT: "3000" }, // Webhook listener escuta na porta 3000
});

// 2. Inicia o OpenClaw Gateway (escuta na porta 18789 ou configurada)
const gatewayPort = process.env.OPENCLAW_GATEWAY_PORT || "18789";
console.log(`📦 [LAUNCHER] Iniciando OpenClaw Gateway na porta ${gatewayPort}`);
const gateway = spawn("node", [gatewayPath, "gateway", "--bind", "lan"], {
  stdio: "inherit",
});

// Tratamento de encerramento limpo (forward de sinais)
const handleExit = (signal) => {
  console.log(`\n🛑 [LAUNCHER] Sinal ${signal} recebido. Finalizando processos filhos...`);
  try {
    sweeps.kill(signal);
  } catch (e) {}
  try {
    gateway.kill(signal);
  } catch (e) {}
  process.exit(0);
};

process.on("SIGINT", () => handleExit("SIGINT"));
process.on("SIGTERM", () => handleExit("SIGTERM"));

// Monitoramento dos processos filhos
sweeps.on("exit", (code) => {
  console.error(`⚠️ [LAUNCHER] Microsserviço de varreduras fechou com código ${code}.`);
  // Derruba o gateway para forçar o container a reiniciar por completo
  try {
    gateway.kill("SIGTERM");
  } catch (e) {}
  process.exit(code || 1);
});

gateway.on("exit", (code) => {
  console.error(`⚠️ [LAUNCHER] OpenClaw Gateway fechou com código ${code}.`);
  // Derruba o microsserviço de varreduras para forçar reinício
  try {
    sweeps.kill("SIGTERM");
  } catch (e) {}
  process.exit(code || 1);
});
