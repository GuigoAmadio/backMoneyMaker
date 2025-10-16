module.exports = function (options, webpack) {
  const lazyImports = [
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    'class-transformer/storage',
    // Terminus optional dependencies - esses não estão instalados
    '@mikro-orm/core',
    '@nestjs/mongoose',
    '@nestjs/sequelize',
    '@nestjs/typeorm',
    '@nestjs/sequelize/dist/common/sequelize.utils',
    '@nestjs/typeorm/dist/common/typeorm.utils',
    'mongodb',
    'mysql',
    'mysql2',
    'pg',
    'pg-native',
    'sqlite3',
    'tedious',
    'oracledb',
  ];

  return {
    ...options,
    target: 'node',
    externalsPresets: { node: true },
    
    externals: [
    ({ request }, callback) => {
      if (!request) return callback();

        // tudo que começa com onnxruntime-node vira commonjs (sem bundlar)
        if (request === 'onnxruntime-node' || request.startsWith('onnxruntime-node/')) {
          return callback(null, 'commonjs ' + request);
        }

        // (opcional) externalizar também para evitar bundles grandes
        if (
          request === '@huggingface/transformers' ||
          request.startsWith('@huggingface/transformers/') ||
          request === 'chromadb' ||
          request.startsWith('chromadb/')
        ) {
          return callback(null, 'commonjs ' + request);
        }

        callback();
      },
      {
      // Mark these as external so they're not bundled by webpack
      stripe: 'commonjs stripe',
      '@prisma/client': 'commonjs @prisma/client',
      ioredis: 'commonjs ioredis',
      redis: 'commonjs redis',
      bcrypt: 'commonjs bcrypt',
      'node-telegram-bot-api': 'commonjs node-telegram-bot-api',
      grammy: 'commonjs grammy',
      // NÃO marcar terminus como external - deixar bundlar
    },],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
    module: {
      ...options.module,
      rules: [
        ...options.module.rules,
        {
          // Ignorar arquivos .d.ts e .js.map do Terminus
          test: /\.d\.ts$|\.js\.map$/,
          use: 'null-loader',
        },
      ],
    },
    resolve: {
      ...options.resolve,
      extensions: ['.js', '.json', '.ts'],
      // Ignorar arquivos .d.ts durante o resolve
      mainFields: ['main', 'module'],
    },
  };
};
