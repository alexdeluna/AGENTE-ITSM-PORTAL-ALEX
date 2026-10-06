# ACE — Agente Conversacional Estruturado

Aplicação PWA independente do Portal ITSM. Ela usa o mesmo Firebase Authentication e o mesmo Firestore, sem importar ou modificar a interface do Portal.

## Dados consultados

- `users/{uid}`: identifica usuário ativo;
- `services/{id}`: carrega serviços e subcategorias ativos;
- `subcategoryConfig`: o backend usa tipo, criticidade e SLA oficiais;
- `tickets`: recebe o chamado criado pela função autenticada.

## Descrição sugerida

O campo `suggestedDescription` é opcional. Enquanto ele não existir no Portal, o ACE solicita uma descrição manual, com exemplo de local e problema.

## Publicação

1. Publique os arquivos estáticos deste projeto no endereço próprio do ACE.
2. No Firebase Authentication, inclua o domínio publicado do ACE em **Authorized domains**.
3. Instale e publique `functions/createAceTicket` no projeto `itsm-portal-alex`.

A função é obrigatória: ela confirma autenticação recente, usuário ativo, serviço/subcategoria ativos e busca classificação, criticidade e SLA no Firestore antes de criar o chamado. Ela não altera a interface do Portal.

O tempo de inatividade está configurado em 15 minutos no início de `app.js` e em `functions/index.js`.
