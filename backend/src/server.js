import { app } from './app.js';
import { ambiente } from './config/ambiente.js';

app.listen(ambiente.porta, () => {
  console.log(`Servidor rodando em: http://localhost:${ambiente.porta}`);
});
