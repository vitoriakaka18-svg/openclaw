const inputStr = process.argv[2] || "{}";
const data = JSON.parse(inputStr);

console.log(`[AGENDAMENTO] Retirada agendada com sucesso!`);
console.log(`Cliente: ${data.nome}`);
console.log(`Data/Hora: ${data.dataHora}`);
console.log(`(Lembrete salvo no sistema de controle da loja)`);
