# CLAUDE.md — Mémoire & état du projet Invest-App

> Document de reprise pour toute nouvelle session. Lis-le en entier, puis lis
> `README.md` (document de conception) avant de coder.

## L'utilisateur

- **Débutant total en code.** Explique tout en mots simples, sans jargon, en
  **français**. Guide pas à pas.
- Fonctionne par validations : il réfléchit au concept, approuve les décisions,
  toi tu exécutes en continu et tu le tiens au courant.
- Ce qu'il peut faire lui-même : créer des comptes, cliquer dans des tableaux de
  bord (Supabase, Vercel, FMP, Anthropic), coller des clés. Toi : tout le code.

## Le projet

App web perso d'investissement (usage strictement personnel, pas un conseil
financier). Recommandations IA hebdo (actions / crypto / métaux), calculateur
d'allocation, suivi de portefeuille. Devise **CAD**. Détails complets dans
`README.md`.

## Stack & accès

- **Frontend** : React 19 + Vite + Tailwind v4. **Backend** : Supabase
  (PostgreSQL + Auth). **Serveur** : fonctions Vercel dans `/api`.
- **En ligne** : https://invest-app-silk.vercel.app (déploiement auto Vercel).
- **Supabase** : projet `ojjdvzgtpddlamncsygx`. RLS activée (chaque user ne voit
  que ses données).
- **APIs** : CoinGecko (crypto, gratuit, sans clé, en CAD), FMP (actions +
  or/argent, **offre gratuite = 250 requêtes/jour, un appel par symbole**),
  ExchangeRate open.er-api.com (USD→CAD), Claude API (moteur IA, `claude-opus-4-8`).
- FMP a resserré son offre gratuite (juillet 2026) : la requête groupée
  multi-symboles est passée payante (402), tout comme les ETF métaux
  (GLD/SLV/PALL/PPLT), même interrogés un par un. Seuls les **contrats à terme
  or (GCUSD) et argent (SIUSD)** restent gratuits chez FMP. Palladium et
  platine : aucune source gratuite trouvée (testé metals-api.com et Twelve
  Data, tous deux payants pour ces deux métaux) → retirés de l'app pour
  l'instant (voir README, section 5).
- **L'offre gratuite FMP est une liste blanche de symboles** : beaucoup de
  grandes capitalisations sont passées premium (402), dont NEE, PG, MCD,
  AVGO, ASML, MA, LLY, SO, DUK, XEL, CL, KMB, MDLZ, HD, MRK, AXP, QCOM,
  TXN, AMAT, ORCL, CRM, IBM, CAT. La liste `STOCKS` de `api/candidates.js`
  ne contient que des tickers **vérifiés gratuits** ; réserve vérifiée
  gratuite non utilisée : SBUX, NKE, BAC, GS, CVX, INTC, CSCO, T. Toujours
  tester un nouveau ticker avant de l'ajouter (200 = ok, 402 = payant).

## Variables d'environnement (dans Vercel, PAS dans le repo)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publiques, aussi dans `.env` local)
- `FMP_API_KEY` (secrète, serveur)
- `ANTHROPIC_API_KEY` (secrète, serveur)
- `CRON_SECRET` (secrète — Vercel l'envoie automatiquement au cron du lundi ;
  sert à refuser tout appel extérieur à `/api/cron-generate`)
- `SUPABASE_SERVICE_ROLE_KEY` (très secrète — clé Supabase à tous les droits,
  utilisée uniquement par le cron, jamais côté navigateur)
- `RECO_OWNER_USER_ID` (l'identifiant Supabase de l'utilisateur : le cron
  enregistre les recommandations à son nom)
- `METALS_API_KEY` et `TWELVEDATA_API_KEY` ont été créées pendant les tests du
  problème FMP (métaux) mais **ne sont plus utilisées par le code** — piste
  abandonnée (payantes pour palladium/platine). Peuvent être supprimées de
  Vercel sans risque, ou laissées de côté sans conséquence.

## Workflow Git (IMPORTANT)

- La branche de développement change à chaque nouvelle session (nom imposé au
  démarrage, ex. `claude/investment-app-fmp-quota-7boi2p`) — utilise celle
  indiquée en début de session, pas un nom fixe.
- Déploiement = **fast-forward de `main`** puis push (l'utilisateur a donné le
  feu vert permanent pour déployer ainsi). Après merge, revenir sur la branche.
- Fin des messages de commit :
  `Co-Authored-By: Claude <noreply@anthropic.com>` + une ligne
  `Claude-Session: <lien de la session en cours>`.

## État d'avancement

- **Phase 0 (fondations)** ✅ : 5 pages + navigation, Supabase Auth (login),
  déploiement Vercel.
- **Phase 1 (cœur)** ✅ : Portefeuille (achats, P&L, historique, cloud),
  Calculateur (Logique B, pondération réglable), Réglages (pondération, devise,
  préférences), prix réels (crypto CoinGecko + actions/métaux via FMP en CAD).
- **Phase 2 (IA)** ✅ cœur fonctionnel : `/api/generate-recommendations` récupère
  les données → prompt → Claude (JSON strict via `output_config.format`) →
  Supabase (`weekly_recommendations.data` jsonb). Accueil + Analyse détaillée +
  Calculateur + Portefeuille branchés sur les vraies recommandations (repli sur
  exemples si aucune génération). Bouton « Générer » avec attente fiabilisée
  (surveille l'apparition du résultat, pas de « Failed to fetch »).
- Le bouton du Calcul **« ➕ Ajouter ces placements à mon portefeuille »** achète
  chaque placement calculé au prix actuel et le journalise dans le portefeuille.
- **FMP validé** ✅ : après resserrement de l'offre gratuite FMP (requête
  groupée + ETF métaux passés payants), correctif déployé et confirmé en
  production — génération testée, actions + crypto + métaux (Or, Argent)
  s'affichent tous. Outils de diagnostic (`api/debug-fmp.js`,
  `api/debug-metals.js`) retirés.

- **Audit complet validé** ✅ (juillet 2026) : « ➕ Ajouter ces placements »
  re-testé OK par l'utilisateur ; 11 cryptos ✓ sur les 2 chemins (génération
  + portefeuille), 22 actions vérifiées gratuites ✓, 2 métaux ✓, FX ✓.
  Correctifs déployés : mentions honorables visibles dans le Calculateur,
  doublons tops/mentions éliminés (prompt + filet serveur), appels FMP par
  petits groupes sur les 2 chemins (anti-rafale), table CoinGecko complétée
  (SUI/AVAX/BNB/ONDO/HYPE), liste STOCKS reconstruite avec des tickers
  gratuits vérifiés. Outil d'audit `api/debug-prices.js` retiré.
- Économiser le quota FMP : chaque génération / ajout ≈ 24 requêtes (250/jour).
- La prochaine génération de recommandations utilisera la nouvelle liste
  d'actions (TSLA, JPM, XOM, DIS, ABBV, PFE, VZ remplacent les 7 passées
  premium).

## Prochaines étapes

- **Palladium / Platine** : retirés faute de source gratuite (voir section
  APIs ci-dessus). À réévaluer si une source gratuite apparaît, ou si
  l'utilisateur accepte un petit forfait payant un jour.
- **Fondamentaux détaillés** (marges, ROIC, dette) : non fournis actuellement
  (`api/market-data.js` ne donne que cours, P/E, capitalisation, BPA, moyennes
  50/200j). À enrichir avec parcimonie (1 appel/action) ou via une offre FMP
  payante — décision utilisateur.
- **B3 — Automatisation du lundi** ✅ TERMINÉ et testé (juillet 2026) :
  `api/cron-generate.js` + cron Vercel `0 11 * * 1` (lundi ~6-7 h heure de
  l'Est), cœur partagé dans `api/generation-core.js`, bouton manuel conservé.
  Les 3 variables Vercel (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RECO_OWNER_USER_ID`) sont créées. Testé en réel : appel sans secret
  refusé (401) ✓, déclenchement manuel depuis Vercel → nouvelles
  recommandations enregistrées et visibles dans l'app ✓.
  Note plan gratuit Vercel : l'heure exacte peut glisser dans l'heure qui
  suit ; max 2 crons par projet, fréquence quotidienne au plus.
- **Analyse de performance a posteriori** ✅ code déployé (juillet 2026) :
  table `price_history` (globale, instantané des ~35 actifs à chaque
  génération, zéro appel FMP en plus), `api/price-history.js` branché sur les
  2 chemins de génération, section repliable « 📊 Analyse de performance »
  dans la page Portefeuille (verdict de timing par achat : fourchette min-max
  observée depuis l'achat). L'analyse s'enrichit semaine après semaine avec
  l'historique. **Reste à faire par l'utilisateur** : exécuter le SQL de la
  table dans Supabase (SQL Editor), sinon la section affichera simplement
  « historique trop court » et les instantanés échoueront en silence.
  Pas de flux de VENTE dans l'app pour l'instant → « ai-je vendu au bon
  moment » sera possible seulement si on ajoute la vente un jour.
- **Phase 3** : sentiment Reddit / Google Trends, affinage prompts.

## Carte des fichiers clés

- Serveur : `api/generation-core.js` (cœur partagé de la génération, effort
  `low`), `api/generate-recommendations.js` (bouton manuel, `maxDuration=60`),
  `api/cron-generate.js` (cron du lundi, secret + service_role),
  `api/market-data.js` (données FMP/CoinGecko/FX, appels individuels par
  symbole), `api/prompt.js` (prompt + schéma JSON), `api/candidates.js`
  (liste ciblée), `api/stock-prices.js` (prix actions/métaux).
- Frontend : `src/lib/recommendations.js` (lecture/génération), `src/lib/
  portfolio.js`, `src/lib/prices.js`, `src/lib/supabase.js`, `src/lib/weights.js`,
  `src/lib/preferences.js`. Pages dans `src/pages/`, composants dans
  `src/components/`.
- BDD : `supabase/schema.sql` (6 tables + RLS, dont `price_history` globale
  pour l'historique des prix). Migration ajoutée à la main :
  `weekly_recommendations` a les colonnes `data jsonb` et `avertissement_global`.
- Analyse de performance : `api/price-history.js` (instantané serveur),
  `src/lib/history.js` (lecture + verdict de timing),
  `src/components/PerformanceAnalysis.jsx` (section dans Portefeuille).

## Notes techniques

- Fonctions Vercel gratuites : **limite 60 s**. Garder la génération sous cette
  limite (effort `low`, peu d'appels).
- Le prompt de recommandation gère les données manquantes (confiance abaissée) ;
  ne pas paniquer si certains fondamentaux manquent.
- L'outil interactif `AskUserQuestion` a souvent échoué dans ces sessions →
  privilégier les questions en texte simple.
