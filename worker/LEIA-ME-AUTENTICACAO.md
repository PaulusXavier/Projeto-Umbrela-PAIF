# Autenticação do Worker (Paulus)

O Worker agora só responde a quem estiver logado no Umbrela (ID token do Firebase em `Authorization: Bearer`).

Para publicar:
1. `wrangler.toml`: confira `FIREBASE_PROJECT_ID` (= `projectId` do `firebase-config.js`, hoje `paif-d2ab8`).
2. Opcional: `ALLOWED_UIDS = "uid1,uid2"` para restringir a contas específicas.
3. Crie o KV das cotas e descomente o bloco no `wrangler.toml`:
   `npx wrangler kv namespace create LIMITES`
4. `npx wrangler deploy`
5. Publique o front-end (o `sw.js` já foi para v94, então os aparelhos atualizam sozinhos).

Cotas: `COTA_USUARIO_DIA` (por usuário, padrão 100) e `COTA_DIA` (total). Sem o KV só vale o limite por minuto (10/usuário).
Teste: `node worker/teste-local.mjs`
