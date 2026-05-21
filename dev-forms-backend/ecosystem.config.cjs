module.exports = {
  apps: [
    {
      name: 'hackathon-api',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'upload-worker',
      script: './src/workers/UploadWorker.js',
      instances: 1, // Worker processando a fila não precisa rodar em todas as CPUs
      exec_mode: 'fork',
    }
  ]
};
