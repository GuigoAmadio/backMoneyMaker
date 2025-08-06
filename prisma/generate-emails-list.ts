import * as fs from 'fs';
import * as path from 'path';

// Ler o arquivo JSON
const psicanalistasPath = path.join(__dirname, 'psicanalistas.json');
const psicanalistasData = fs.readFileSync(psicanalistasPath, 'utf8');
const psicanalistas = JSON.parse(psicanalistasData);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '.') // Substitui espaços por pontos
    .replace(/\.+/g, '.') // Remove pontos duplicados
    .replace(/^\.|\.$/g, ''); // Remove pontos no início e fim
}

function generateEmail(name: string): string {
  const normalizedName = normalizeName(name);
  return `${normalizedName}@expatriamente.com`;
}

console.log('📧 Lista de emails que seriam criados pelo seed:');
console.log('='.repeat(60));

// Admin
console.log('👤 ADMIN:');
console.log('admin@expatriamente.com');
console.log('');

// Funcionários (apenas os que aceitaram convite)
console.log('👥 FUNCIONÁRIOS (convite = "Sim"):');
const funcionarios = psicanalistas.filter((p) => p.convite === 'Sim');

funcionarios.forEach((psicanalista, index) => {
  const email = generateEmail(psicanalista.nome);
  console.log(`${index + 1}. ${psicanalista.nome}`);
  console.log(`   Email: ${email}`);
  console.log(`   Telefone: ${psicanalista.contato}`);
  console.log('');
});

console.log('📊 RESUMO:');
console.log(`- Total de psicanalistas no JSON: ${psicanalistas.length}`);
console.log(`- Psicanalistas com convite = "Sim": ${funcionarios.length}`);
console.log(
  `- Psicanalistas sem resposta ou recusados: ${psicanalistas.length - funcionarios.length}`,
);
console.log('');

// Lista apenas dos emails para copiar/colar
console.log('📋 LISTA APENAS DOS EMAILS:');
console.log('admin@expatriamente.com');
funcionarios.forEach((psicanalista) => {
  console.log(generateEmail(psicanalista.nome));
});

console.log('');
console.log('🔍 PSICANALISTAS QUE NÃO ACEITARAM CONVITE:');
const naoAceitaram = psicanalistas.filter((p) => p.convite !== 'Sim');
naoAceitaram.forEach((psicanalista) => {
  console.log(`- ${psicanalista.nome} (convite: "${psicanalista.convite}")`);
});
