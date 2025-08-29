import axios from 'axios';

async function main() {
  const baseUrl = 'https://api.expatriamente.com'; // ajuste se necessário
  const endpoints = ['/cache/stats', '/metrics', '/metrics/json'];

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(baseUrl + endpoint);
      console.log(`\n===== ${endpoint} =====`);
      console.log(res.data);
    } catch (err) {
      console.error(`Erro ao acessar ${endpoint}:`, err.response?.data || err.message);
    }
  }
}

main();
