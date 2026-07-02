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
- **APIs** : CoinGecko (crypto, gratuit, sans clé, en CAD), FMP (actions/métaux,
  **offre gratuite = 250 requêtes/jour**), ExchangeRate open.er-api.com (USD→CAD),
  Claude API (moteur IA, `claude-opus-4-8`).

## Variables d'environnement (dans Vercel, PAS dans le repo)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publiques, aussi dans `.env` local)
- `FMP_API_KEY` (secrète, serveur)
- `ANTHROPIC_API_KEY` (secrète, serveur)

## Workflow Git (IMPORTANT)

- Développer sur la branche **`claude/investment-app-setup-ycqpyt`**.
- Déploiement = **fast-forward de `main`** puis push (l'utilisateur a donné le
  feu vert permanent pour déployer ainsi). Après merge, revenir sur la branche.
- Fin des messages de commit :
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` puis
  `Claude-Session: https://claude.ai/code/session_01AsvWbqBRio4CWEzzyVQn3G`

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

## ⚠️ En cours / à vérifier en priorité

1. **Quota FMP** : la limite gratuite du jour a été épuisée pendant les tests
   (429 « Limit Reach »). Correctif déployé : `api/market-data.js` fait
   maintenant **une requête groupée** (`/stable/quote?symbol=A,B,C`, repli
   legacy `/api/v3/quote/...`) → ~1-2 appels FMP par génération au lieu de ~70.
   **À faire une fois le quota FMP réinitialisé** (~24h) : ouvrir
   `…/api/debug-fmp` pour confirmer que ça renvoie du JSON (statut 200), puis
   « Générer » et vérifier que actions + crypto + métaux s'affichent tous.
2. **Retirer l'outil de diagnostic** `api/debug-fmp.js` une fois FMP validé.

## Prochaines étapes (après validation FMP)

- **Fondamentaux détaillés** (marges, ROIC, dette) : non fournis actuellement
  (la requête groupée ne donne que cours, P/E, capitalisation, BPA, moyennes
  50/200j). À enrichir avec parcimonie (1 appel/action) ou via une offre FMP
  payante — décision utilisateur.
- **B3 — Automatisation du lundi** : cron Vercel appelant la génération (sans
  utilisateur → utiliser la clé `service_role` + un id propriétaire). Garder le
  bouton manuel en secours.
- **Phase 3** : sentiment Reddit / Google Trends, affinage prompts, analyse de
  performance a posteriori.

## Carte des fichiers clés

- Serveur : `api/generate-recommendations.js` (chef d'orchestre, `maxDuration=60`,
  effort `low`), `api/market-data.js` (données FMP/CoinGecko/FX), `api/prompt.js`
  (prompt + schéma JSON), `api/candidates.js` (liste ciblée), `api/debug-fmp.js`
  (diagnostic temporaire), `api/stock-prices.js` (prix actions/métaux).
- Frontend : `src/lib/recommendations.js` (lecture/génération), `src/lib/
  portfolio.js`, `src/lib/prices.js`, `src/lib/supabase.js`, `src/lib/weights.js`,
  `src/lib/preferences.js`. Pages dans `src/pages/`, composants dans
  `src/components/`.
- BDD : `supabase/schema.sql` (5 tables + RLS). Migration ajoutée à la main :
  `weekly_recommendations` a les colonnes `data jsonb` et `avertissement_global`.

## Notes techniques

- Fonctions Vercel gratuites : **limite 60 s**. Garder la génération sous cette
  limite (effort `low`, peu d'appels).
- Le prompt de recommandation gère les données manquantes (confiance abaissée) ;
  ne pas paniquer si certains fondamentaux manquent.
- L'outil interactif `AskUserQuestion` a souvent échoué dans ces sessions →
  privilégier les questions en texte simple.
