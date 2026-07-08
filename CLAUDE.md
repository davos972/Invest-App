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
  métaux, **tier Starter — 300 requêtes/minute**, un appel par symbole),
  ExchangeRate open.er-api.com (USD→CAD), Claude API (moteur IA, `claude-opus-4-8`).
- **FMP est passé au tier Starter (juillet 2026)** : la liste blanche de
  l'offre gratuite ne s'applique plus → tous les symboles sont accessibles.
  Les grandes capitalisations autrefois bloquées en 402 (NEE, PG, MCD, AVGO,
  ASML, MA, LLY…) remarchent, et les **ETF métaux PALL (palladium) et PPLT
  (platine) sont de nouveau accessibles**. Vérifié en réel par l'utilisateur :
  AAPL, NEE, PALL, PPLT répondent tous. On garde le montage « un appel par
  symbole » (éprouvé, ~39 appels/génération, une goutte d'eau dans 300/min)
  plutôt que de repasser à la requête groupée : on ne remplace pas ce qui
  marche.
- **Métaux (4 depuis Starter)** : or/argent via contrats à terme
  (GCUSD/SIUSD, cours au comptant), palladium/platine via ETF (PALL/PPLT,
  cours de part). Prix de nature différente mais comparables pour le
  classement et la tendance.
- La liste `STOCKS` de `api/candidates.js` est désormais diversifiée par
  secteur (~35 actions). Plus besoin de tester la « gratuité » d'un ticker
  avant de l'ajouter — tout FMP est ouvert avec Starter.

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
- **Rebranchement FMP Starter** ✅ (juillet 2026, cette session) : suite au
  passage du compte FMP au tier Starter (300/min, tous symboles ouverts),
  liste `STOCKS` enrichie et diversifiée par secteur (~35 actions, ancres
  défensives de qualité + croissance), et **retour du palladium (PALL) et du
  platine (PPLT)** → 4 métaux classés. Prompt, données d'exemple et docs mis
  à jour. Mécanisme d'appels FMP inchangé (éprouvé). Le quota n'est plus une
  contrainte (~39 appels/génération, largement sous 300/min). Reste à faire :
  lancer une génération pour valider en réel l'affichage des 4 métaux et des
  nouvelles actions.

## Screening dynamique des actions (juillet 2026)

- **`api/screener.js`** : les actions candidates ne viennent plus d'une liste
  statique mais d'un **screening dynamique** via l'endpoint FMP
  `/stable/company-screener`. Deux profils (`PROFILS` dans le fichier) :
  - **sécuritaire** : cap > 10 Md$, volume > 1 M ; garde-fou : croissance CA
    > 8 %, marge nette > 10 %, ROE > 12 %, dette/capitaux < 1,5.
  - **risqué** : cap 2–8 Md$, volume > 300 k ; garde-fou : croissance CA
    > 30 %, marge brute > 40 %, croissance BPA > 20 %.
- Le screener FMP ne filtre QUE sur capitalisation/volume/bourse. Les critères
  de croissance/marge NE sont PAS des paramètres du screener → ils sont
  appliqués **en code**, après récupération des fondamentaux (`ratios-ttm` +
  `financial-growth`), comme **garde-fou anti-bruit** : tout candidat aux
  fondamentaux clés manquants ou insuffisants est REJETÉ. Le screener
  présélectionne, le prompt tranche sur la valorisation.
- **ROE** absent de `ratios-ttm` → calculé : `netIncomePerShareTTM ÷
  shareholdersEquityPerShareTTM` (null si capitaux ≤ 0 → rejet).
- Plafonné à **~30 candidats/profil** (triés par volume), pour tenir la limite
  60 s de Vercel (les appels FMP sont rapides/parallélisés via `mapPool` ; c'est
  Claude qui domine le temps, sortie plafonnée à ~26 items). Champs ajoutés au
  prompt : `profil_origine`, `secteur`, `croissance_ca_pct`, `croissance_bpa_pct`,
  `marge_brute_pct`, `roe_pct` (+ `per`, `bpa_cad`, `marge_nette_pct`,
  `dette_sur_capitaux_propres`, `peg`).
- **Filet de sécurité** : si < 4 survivants (échec réseau / screen trop strict),
  repli automatique sur la liste statique `STOCKS` de `candidates.js`.
- **Validé en réel** (juillet 2026) : nouveaux noms, deux profils remplis,
  analyses jugées très bonnes par l'utilisateur. Le vivier étant plus court que
  l'ancienne liste statique, on a élargi le plafond 20→30 pour retrouver 10
  mentions honorables (sinon ~7). Prompt : « 16 principales », consigne « viser
  10 mentions distinctes », et **plus de mention de l'absence de contexte macro**
  (Claude le signalait car on le lui disait — reformulé).

## Contourner la limite 60 s de Vercel (décision : PLUS TARD)

- Le plafond 60 s ne gêne PAS aujourd'hui (la génération tient large). Il ne
  gênera que si on veut **aller plus loin** : effort Claude `medium`/`high`,
  vivier de centaines de candidats, screening en 2 temps.
- **Décision (juillet 2026, avec l'utilisateur)** : on NE l'implémente PAS
  maintenant — on est en phase de test, et le cycle rapide « bouton Générer sur
  Vercel » est précieux pour itérer. On migrera **quand la logique sera stable**
  et qu'on voudra volontairement pousser l'analyse en profondeur.
- **Voie retenue = gratuite** : sortir la génération hebdo du lundi de Vercel
  vers un **GitHub Action** (aucune limite de temps ; le bouton manuel reste sur
  Vercel en version « rapide »). Secrets à mettre côté GitHub :
  `ANTHROPIC_API_KEY`, `FMP_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RECO_OWNER_USER_ID`. Réutilise `generation-core.js` (Node/ESM pur).
  Alternative écartée : Vercel Pro (~20 $/mois, `maxDuration=300`, 1 ligne).
- **Contexte macro** ✅ AJOUTÉ (juillet 2026) : tableau de bord macro fourni au
  prompt via FMP (aucune nouvelle clé). `fetchMacro` dans `market-data.js` :
  S&P 500 (`^GSPC`) + Nasdaq (`^IXIC`) niveau/variation, VIX (`^VIX`, indice de
  la peur), taux du Trésor 2 ans / 10 ans (endpoint `/stable/treasury-rates`,
  champs `year2`/`year10` ; `^TNX` NON reconnu par FMP → écarté). Le prompt
  explique comment lire ces signaux (VIX, courbe des taux, régime des indices)
  pour NUANCER la confiance, sans supplanter l'analyse fondamentale. Reste à
  valider en réel : lancer une génération et vérifier que Claude parle du
  contexte macro (VIX, taux) dans ses analyses. Inflation (CPI) : pas encore,
  extension possible via `/stable/economic-indicators`.

## Prochaines étapes

- **Palladium / Platine** ✅ REVENUS (juillet 2026) grâce au tier FMP Starter,
  via leurs ETF (PALL/PPLT). Ne plus les considérer comme « retirés ».
- **Fondamentaux détaillés** ✅ AJOUTÉS (juillet 2026, tier Starter) :
  `/stable/quote` ne renvoie plus le P/E ni le bénéfice par action → on récupère
  ces données (+ marge nette, dette/capitaux propres, PEG) via un appel par
  action à `/stable/ratios-ttm` (`fetchRatiosIndividually` dans
  `api/market-data.js`). Champs ajoutés aux données actions : `per`, `bpa_cad`,
  `marge_nette_pct`, `dette_sur_capitaux_propres`, `peg`. Le prompt les décrit
  et cadre l'analyse GARP dessus. ~34 appels FMP en plus (~73/génération au
  total, large sous 300/min). Reste à valider en réel : relancer une génération
  et vérifier que Claude ne dit plus « données de valorisation non fournies ».
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
  génération, zéro appel FMP en plus) qui mémorise le prix ET le contexte de
  marché du moment (moyennes 50/200 j, haut/bas 52 sem. pour actions/métaux ;
  variations 7 j/30 j + distance ATH pour cryptos). Section repliable
  « 📊 Analyse de performance » dans Portefeuille : verdict de TIMING par
  achat basé sur le contexte au moment de l'achat, à la demande de
  l'utilisateur (⚠️ impulsion / 🎯 consolidation / 🔪 chute / 👍 zone
  correcte — logique dans `src/lib/history.js`), + fourchette observée
  depuis l'achat en complément. Fenêtre de rattachement achat↔instantané :
  ±10 jours. **Validé en réel par l'utilisateur** : SQL exécuté dans
  Supabase, génération OK, verdicts affichés. Les achats antérieurs de plus
  de 10 jours au premier instantané restent « contexte inconnu » pour
  toujours (pas de données historiques gratuites) — c'est normal.
- **Flux de vente** ✅ code déployé (juillet 2026) : bouton « 💸 Vendre » sur
  chaque position (quantité/prix/date, prix pré-rempli), méthode du COÛT
  MOYEN (gain réalisé = q × (prix vente − coût moyen)), colonne `sens`
  ('achat'/'vente') dans `transactions` (prix_achat = prix unitaire de
  l'opération, nom historique), badges ACHAT/VENTE dans l'historique,
  section « Positions fermées » (quantité 0, gain réalisé conservé), tuile
  P&L avec « dont réalisés », et verdicts de timing pour les VENTES dans
  l'analyse de performance (lecture inversée : vendre en impulsion = 🎯,
  vendre en chute = ⚠️ panique — `VERDICTS_VENTE` dans `src/lib/history.js`).
  **Validé en réel par l'utilisateur** (juillet 2026) : SQL de la colonne
  `sens` exécuté dans Supabase, vente testée, tout fonctionne.
- **Timing sur les recommandations** ✅ (même session) : le verdict de
  contexte (impulsion / consolidation / chute / …) s'affiche aussi sur la
  page 1 — badge compact sur chaque carte (`AssetCard`, prop `contexte`)
  + encadré « Timing » complet dans l'Analyse détaillée. Basé sur le
  DERNIER relevé price_history (`analyseContexteActuel` dans
  `src/lib/history.js`, textes au présent ; les verdicts d'achat passé
  utilisent les mêmes seuils, textes au passé).
- **Sentiment social** ✅ AJOUTÉ (juillet 2026) : via **StockTwits** (« le
  Twitter de la bourse »), PAS Reddit — Reddit exige désormais une inscription
  développeur révisée (developers.reddit.com, orientée Devvit), trop lourde pour
  un signal secondaire. FMP social sentiment écarté aussi (réservé aux comptes
  antérieurs à août 2025). StockTwits : gratuit, sans clé, répond depuis Vercel
  (vérifié). `api/sentiment.js` (`fetchSentiment`) lit
  `api.stocktwits.com/api/2/streams/symbol/{SYM}.json` (cryptos = suffixe `.X`,
  ex. `BTC.X`) → par actif : `messages_recents` (volume), `haussiers`/`baissiers`
  (messages étiquetés Bullish/Bearish). Attaché à chaque action/crypto
  (champ `sentiment_social`) ; pas sur les métaux. Non bloquant (erreur/limite
  de débit → null, la génération continue). Le prompt le cadre comme signal
  SECONDAIRE (conforte/nuance, jamais moteur ; méfiance sur l'engouement
  spéculatif). Limite StockTwits ~200 req/h par IP → OK pour un usage hebდo ;
  attention en test si beaucoup de générations d'affilée. **Validé en réel**
  (juillet 2026). Le sentiment est aussi RÉINJECTÉ dans les recommandations
  stockées (`attachSentiment` dans `generation-core.js`, par ticker) et AFFICHÉ
  dans l'analyse détaillée (`SentimentBox` dans `AssetDetail.jsx` : humeur
  haussière/baissière/mitigée + volume ; masquée si indisponible). Champ
  `sentiment_social` exposé via `normalize` (`src/lib/recommendations.js`).
- **Phase 3** : affinage des prompts et de la pondération selon l'usage.

## Carte des fichiers clés

- Serveur : `api/generation-core.js` (cœur partagé de la génération, effort
  `low`), `api/generate-recommendations.js` (bouton manuel, `maxDuration=60`),
  `api/cron-generate.js` (cron du lundi, secret + service_role),
  `api/market-data.js` (orchestration : actions via screener, métaux + crypto +
  FX + macro + sentiment), `api/screener.js` (screening dynamique des actions,
  2 profils + garde-fou fondamental), `api/sentiment.js` (sentiment social
  StockTwits, secondaire), `api/fmp-utils.js` (primitives FMP partagées :
  getJson, cad/num/pct, mapPool, fetchQuote/RatiosTtm/Growth/Screener/Treasury),
  `api/prompt.js` (prompt + schéma JSON), `api/candidates.js` (STOCKS de repli +
  CRYPTOS + METALS), `api/stock-prices.js` (prix actions/métaux pour le portefeuille).
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
