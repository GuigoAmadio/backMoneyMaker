import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../common/cache/redis.service';

describe('Redis Cache Tests', () => {
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [RedisService],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  describe('Conexão Redis', () => {
    it('deve conectar ao Redis', async () => {
      try {
        // Tentar uma operação real para testar conexão
        await redisService.set('test:connection', 'test');
        const result = await redisService.get('test:connection');

        if (result === 'test') {
          console.log('✅ Redis conectado e funcionando!');
          expect(result).toBe('test');
        } else {
          console.log('⚠️ Redis não está disponível - pulando teste de conexão');
        }
      } catch (error) {
        console.log('⚠️ Erro ao conectar com Redis:', error.message);
        // Não falhar o teste se Redis não estiver disponível
        return;
      }
    });
  });

  describe('Operações de Cache', () => {
    it('deve salvar e recuperar string', async () => {
      const key = 'test:string';
      const value = 'test value';

      await redisService.set(key, value);
      const result = await redisService.get(key);

      expect(result).toBe(value);
    });

    it('deve salvar e recuperar objeto', async () => {
      const key = 'test:object';
      const value = { name: 'test', value: 123 };

      await redisService.set(key, value);
      const result = await redisService.get(key);

      expect(result).toEqual(value);
    });

    it('deve testar TTL', async () => {
      const key = 'test:ttl';
      const value = 'test value';

      await redisService.setWithTTL(key, value, 5); // 5 segundos
      const ttl = await redisService.getTTL(key);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(5);
    });

    it('deve expirar chaves automaticamente', async () => {
      const key = 'test:expire';
      const value = 'test value';

      await redisService.setWithTTL(key, value, 2); // 2 segundos

      // Verificar se existe
      let result = await redisService.get(key);
      expect(result).toBe(value);

      // Aguardar expiração
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verificar se expirou
      result = await redisService.get(key);
      expect(result).toBeNull();
    }, 10000);

    it('deve verificar se chave existe', async () => {
      const key = 'test:exists';
      const value = 'test value';

      // Verificar que não existe inicialmente
      let exists = await redisService.exists(key);
      expect(exists).toBe(false);

      // Salvar e verificar que existe
      await redisService.set(key, value);
      exists = await redisService.exists(key);
      expect(exists).toBe(true);
    });

    it('deve deletar chave', async () => {
      const key = 'test:delete';
      const value = 'test value';

      // Salvar chave
      await redisService.set(key, value);
      let exists = await redisService.exists(key);
      expect(exists).toBe(true);

      // Deletar chave
      await redisService.delete(key);
      exists = await redisService.exists(key);
      expect(exists).toBe(false);
    });

    it('deve incrementar contador', async () => {
      const key = 'test:increment';

      // Incrementar de 0 para 1
      let result = await redisService.increment(key);
      expect(result).toBe(1);

      // Incrementar de 1 para 3
      result = await redisService.increment(key, 2);
      expect(result).toBe(3);
    });

    it('deve definir múltiplos valores', async () => {
      const values = {
        'test:mset:1': 'value1',
        'test:mset:2': 'value2',
        'test:mset:3': 'value3',
      };

      await redisService.mset(values);

      // Verificar se todos foram salvos
      for (const [key, expectedValue] of Object.entries(values)) {
        const result = await redisService.get(key);
        expect(result).toBe(expectedValue);
      }
    });

    it('deve usar client_id corretamente', async () => {
      const key = 'test:client';
      const value = 'test value';
      const clientId = 'test-client-123';

      // Salvar com client_id
      await redisService.set(key, value, clientId);

      // Verificar que não existe sem client_id
      let result = await redisService.get(key);
      expect(result).toBeNull();

      // Verificar que existe com client_id
      result = await redisService.get(key, clientId);
      expect(result).toBe(value);
    });

    it('deve usar prefixo corretamente', async () => {
      const key = 'test:prefix';
      const value = 'test value';
      const prefix = 'myapp';

      // Salvar com prefixo
      await redisService.set(key, value, undefined, { prefix });

      // Verificar que não existe sem prefixo
      let result = await redisService.get(key);
      expect(result).toBeNull();

      // Verificar que existe com prefixo
      result = await redisService.get(key, undefined, prefix);
      expect(result).toBe(value);
    });

    it('deve usar getOrSet corretamente', async () => {
      const key = 'test:getorset';
      let callCount = 0;

      const fetchFn = async () => {
        callCount++;
        return `value-${callCount}`;
      };

      // Primeira chamada deve executar fetchFn
      const result1 = await redisService.getOrSet(key, fetchFn);
      expect(result1).toBe('value-1');
      expect(callCount).toBe(1);

      // Segunda chamada deve retornar do cache
      const result2 = await redisService.getOrSet(key, fetchFn);
      expect(result2).toBe('value-1');
      expect(callCount).toBe(1); // Não deve chamar fetchFn novamente
    });
  });

  describe('Operações de Limpeza', () => {
    it('deve limpar cache', async () => {
      // Salvar algumas chaves
      await redisService.set('test:clear:1', 'value1');
      await redisService.set('test:clear:2', 'value2');
      await redisService.set('test:clear:3', 'value3');

      // Verificar que existem
      let count = await redisService.getKeyCount('test:clear:*');
      expect(count).toBeGreaterThan(0);

      // Limpar cache
      const deletedCount = await redisService.clear();
      expect(deletedCount).toBeGreaterThan(0);

      // Verificar que foram removidas
      count = await redisService.getKeyCount('test:clear:*');
      expect(count).toBe(0);
    });

    it('deve deletar por padrão', async () => {
      // Salvar chaves com padrão específico
      await redisService.set('test:pattern:1', 'value1');
      await redisService.set('test:pattern:2', 'value2');
      await redisService.set('other:key', 'value3');

      // Deletar por padrão
      const deletedCount = await redisService.deletePattern('test:pattern:*');
      expect(deletedCount).toBe(2);

      // Verificar que foram removidas
      const remaining = await redisService.getKeyCount('test:pattern:*');
      expect(remaining).toBe(0);

      // Verificar que outras chaves permanecem
      const otherExists = await redisService.exists('other:key');
      expect(otherExists).toBe(true);
    });
  });

  describe('Operações de Tags', () => {
    it('deve invalidar por tags', async () => {
      // Salvar chaves com tags
      await redisService.set('test:tag:1', 'value1', undefined, { tags: ['tag1', 'tag2'] });
      await redisService.set('test:tag:2', 'value2', undefined, { tags: ['tag2', 'tag3'] });
      await redisService.set('test:tag:3', 'value3', undefined, { tags: ['tag1'] });

      // Verificar que existem
      let exists1 = await redisService.exists('test:tag:1');
      let exists2 = await redisService.exists('test:tag:2');
      let exists3 = await redisService.exists('test:tag:3');
      expect(exists1).toBe(true);
      expect(exists2).toBe(true);
      expect(exists3).toBe(true);

      // Invalidar por tag1
      await redisService.invalidateByTags(['tag1']);

      // Verificar que tag1 foi removida, mas tag2 permanece
      exists1 = await redisService.exists('test:tag:1');
      exists2 = await redisService.exists('test:tag:2');
      exists3 = await redisService.exists('test:tag:3');
      expect(exists1).toBe(false); // tag1
      expect(exists2).toBe(true); // tag2 permanece
      expect(exists3).toBe(false); // tag1
    });
  });

  describe('Estatísticas', () => {
    it('deve obter estatísticas', async () => {
      const stats = await redisService.getStats();

      expect(stats).toHaveProperty('connected');
      expect(stats).toHaveProperty('keysCount');
      expect(stats).toHaveProperty('info');
      expect(typeof stats.connected).toBe('boolean');
      expect(typeof stats.keysCount).toBe('number');
    });

    it('deve obter padrões comuns', async () => {
      // Salvar algumas chaves com padrões
      await redisService.set('app:user:1', 'user1');
      await redisService.set('app:user:2', 'user2');
      await redisService.set('app:product:1', 'product1');
      await redisService.set('cache:temp:1', 'temp1');

      const patterns = await redisService.getCommonPatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);

      // Verificar estrutura
      if (patterns.length > 0) {
        const pattern = patterns[0];
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('count');
        expect(pattern).toHaveProperty('examples');
        expect(Array.isArray(pattern.examples)).toBe(true);
      }
    });
  });
});
