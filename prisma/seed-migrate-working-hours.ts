/**
 * Seed para Migração de Horários de Trabalho
 *
 * Este seed converte os horários de trabalho dos funcionários do formato antigo
 * para o novo formato sem alterar o schema do banco de dados.
 *
 * Formato Antigo:
 * {
 *   "tuesday": ["08:00", "10:00", "16:00", "19:30"],
 *   "saturday": ["10:00", "14:00", "18:00"],
 *   "thursday": ["08:00", "10:00", "12:00", "19:30"]
 * }
 *
 * Novo Formato:
 * {
 *   "timeSlots": [
 *     {
 *       "id": "slot_2_0800_0",
 *       "dayOfWeek": 2,
 *       "startTime": "08:00",
 *       "endTime": "09:00",
 *       "isRecurring": true,
 *       "isActive": true,
 *       "specificDate": undefined
 *     }
 *   ],
 *   "timeOffs": []
 * }
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de nomes de dias para números
const DAY_NAME_TO_NUMBER: { [key: string]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  domingo: 0,
  segunda: 1,
  terça: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sábado: 6,
};

interface OldScheduleFormat {
  [dayName: string]: string[];
}

interface NewTimeSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isActive: boolean;
  specificDate?: string;
}

interface NewWorkingHours {
  timeSlots: NewTimeSlot[];
  timeOffs: any[];
}

/**
 * Converte um horário para o próximo slot de 1 hora
 */
function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + 1;
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Gera um ID único para o horário
 */
function generateTimeSlotId(dayOfWeek: number, startTime: string, index: number): string {
  return `slot_${dayOfWeek}_${startTime.replace(':', '')}_${index}`;
}

/**
 * Converte formato antigo para novo formato
 */
function migrateScheduleFormat(oldSchedule: OldScheduleFormat): NewWorkingHours {
  const newTimeSlots: NewTimeSlot[] = [];

  Object.entries(oldSchedule).forEach(([dayName, timeSlots]) => {
    const dayOfWeek = DAY_NAME_TO_NUMBER[dayName.toLowerCase()];

    if (dayOfWeek === undefined) {
      console.warn(`Dia não reconhecido: ${dayName}`);
      return;
    }

    timeSlots.forEach((startTime, index) => {
      const newTimeSlot: NewTimeSlot = {
        id: generateTimeSlotId(dayOfWeek, startTime, index),
        dayOfWeek,
        startTime,
        endTime: getEndTime(startTime),
        isRecurring: true, // Assumimos que horários antigos são recorrentes
        isActive: true,
        specificDate: undefined,
      };

      newTimeSlots.push(newTimeSlot);
    });
  });

  return {
    timeSlots: newTimeSlots,
    timeOffs: [], // Inicialmente vazio
  };
}

/**
 * Função principal de migração
 */
async function migrateAllEmployees(): Promise<void> {
  try {
    console.log('🚀 Iniciando migração de horários de trabalho...');

    // Buscar todos os funcionários com workingHours não vazio
    const employees = await prisma.employee.findMany({
      where: {
        workingHours: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        workingHours: true,
      },
    });

    console.log(`📊 Encontrados ${employees.length} funcionários para migrar`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      try {
        const oldWorkingHours = employee.workingHours as any;

        // Verificar se já está no novo formato
        if (oldWorkingHours && oldWorkingHours.timeSlots) {
          console.log(`⏭️  Funcionário ${employee.name} já está no novo formato`);
          skippedCount++;
          continue;
        }

        // Verificar se tem dados para migrar
        if (!oldWorkingHours || Object.keys(oldWorkingHours).length === 0) {
          console.log(`⏭️  Funcionário ${employee.name} não tem horários para migrar`);
          skippedCount++;
          continue;
        }

        // Migrar para novo formato
        const newWorkingHours = migrateScheduleFormat(oldWorkingHours);

        // Atualizar no banco
        await prisma.employee.update({
          where: { id: employee.id },
          data: { workingHours: JSON.parse(JSON.stringify(newWorkingHours)) },
        });

        console.log(`✅ Migrado: ${employee.name} - ${newWorkingHours.timeSlots.length} horários`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Erro ao migrar funcionário ${employee.name}:`, (error as Error).message);
      }
    }

    console.log('\n📈 Resumo da migração:');
    console.log(`✅ Migrados: ${migratedCount}`);
    console.log(`⏭️  Ignorados: ${skippedCount}`);
    console.log(`📊 Total processados: ${employees.length}`);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

/**
 * Função para testar a migração com dados específicos
 */
function testMigration(): void {
  console.log('🧪 Testando migração com dados de exemplo...');

  const testData: OldScheduleFormat = {
    tuesday: ['08:00', '10:00', '16:00', '19:30'],
    saturday: ['10:00', '14:00', '18:00'],
    thursday: ['08:00', '10:00', '12:00', '19:30'],
  };

  const migrated = migrateScheduleFormat(testData);

  console.log('Formato antigo:', testData);
  console.log('Formato novo:', JSON.stringify(migrated, null, 2));
  console.log(`Total de horários: ${migrated.timeSlots.length}`);
}

/**
 * Função para reverter a migração (usar com cuidado!)
 */
async function rollbackMigration(): Promise<void> {
  console.log('⚠️  ATENÇÃO: Esta operação irá reverter TODOS os horários para o formato antigo!');
  console.log('⚠️  Certifique-se de ter um backup antes de continuar!');

  // Descomente as linhas abaixo para executar o rollback
  /*
  const employees = await prisma.employee.findMany({
    where: {
      workingHours: {
        path: ['timeSlots'],
        not: null
      }
    }
  });

  for (const employee of employees) {
    const newFormat = employee.workingHours as any;
    const oldFormat: OldScheduleFormat = {};
    
    newFormat.timeSlots.forEach((slot: NewTimeSlot) => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[slot.dayOfWeek];
      
      if (!oldFormat[dayName]) {
        oldFormat[dayName] = [];
      }
      oldFormat[dayName].push(slot.startTime);
    });

    await prisma.employee.update({
      where: { id: employee.id },
      data: { workingHours: oldFormat }
    });

    console.log(`Revertido: ${employee.name}`);
  }
  */
}

/**
 * Função principal do seed
 */
async function main(): Promise<void> {
  try {
    // Verificar argumentos da linha de comando
    const command = process.argv[2];

    switch (command) {
      case 'migrate':
        await migrateAllEmployees();
        break;
      case 'test':
        testMigration();
        break;
      case 'rollback':
        await rollbackMigration();
        break;
      default:
        console.log('Uso: npm run prisma:seed-migrate [migrate|test|rollback]');
        console.log('');
        console.log('Comandos disponíveis:');
        console.log('  migrate  - Executa a migração completa');
        console.log('  test     - Testa a migração com dados de exemplo');
        console.log('  rollback - Reverte a migração (use com cuidado!)');
        break;
    }
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed
main();
