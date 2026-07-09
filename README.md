# Investment Advisor — Document de conception

> Document directeur destiné à guider le développement dans Claude Code.
> Usage strictement personnel — ne constitue pas un conseil financier professionnel.

---

## 1. Vision & Objectifs

### Vision
Application web personnelle responsive permettant de centraliser des recommandations d'investissement hebdomadaires générées par IA, de calculer une allocation optimale selon un niveau de risque, et de suivre l'historique complet de son portefeuille avec analyse P&L.

### Utilisateur cible
Usage strictement personnel. L'application ne constitue pas un conseil financier professionnel.

### Objectifs principaux
- Recevoir chaque semaine des recommandations d'investissement fondées sur une analyse IA des marchés (actions, métaux précieux, crypto).
- Disposer d'un calculateur d'allocation pondéré par niveau de confiance.
- Journaliser manuellement ses investissements réels et suivre ses performances.

### Philosophie d'investissement
- Approche hybride : **sécuritaire** (préservation du capital + croissance stable) + **risqué** (fort potentiel de croissance, tolérance à la volatilité).
- Analyse fondamentale prioritaire, complétée par le contexte macro, les actualités économiques, et les signaux de sentiment (Reddit, Google Trends) utilisés comme indicateurs secondaires.
- Horizon long terme : 3–5 ans et plus.
- Devise de référence : **CAD**.

---

## 2. Architecture technique

### Stack technique
- **Frontend** : React (Vite) + Tailwind CSS — responsive mobile-first.
- **Backend / BDD** : Supabase (PostgreSQL) — stockage cloud multi-appareils.
- **Déploiement** : Vercel — gratuit, déploiement automatique.
- **Authentification** : Supabase Auth — accès sécurisé depuis tous les appareils.

### APIs externes

| Source | Usage | Coût |
|---|---|---|
| Financial Modeling Prep (FMP) | Données actions + cours métaux (or, argent au comptant ; palladium, platine via ETF) | Tier Starter (300 req/min) |
| CoinGecko | Données crypto toutes capitalisations (incl. micro-caps) | Gratuit |
| ExchangeRate-API | Conversion USD → CAD en temps réel | Tier gratuit |
| Reddit API | Sentiment communautaire (indicateur secondaire) | Gratuit |
| Google Trends | Intérêt public sur un actif (indicateur secondaire) | Gratuit |

### Moteur d'analyse IA
- **Modèle** : Claude API (`claude-sonnet-4-6`).
- **Déclenchement** : automatique chaque lundi via un cron job Vercel, avec bouton manuel en fallback.
- **Flux de données** :
  1. Cron job déclenché chaque lundi matin.
  2. Appel aux APIs pour récupérer données marché + actualités + sentiment.
  3. Injection dans un prompt structuré (inspiré de la conversation « Analystes financiers IA »).
  4. Claude génère les recommandations en JSON structuré.
  5. Résultats sauvegardés dans Supabase.
  6. Le frontend affiche les données depuis Supabase.

> **Note technique** : le cron job Vercel gratuit a des limites de fréquence et de durée d'exécution. Prévoir les deux modes — automatique si possible, bouton manuel « Générer les recommandations de la semaine » en fallback.

### Structure de la base de données (Supabase)

| Table | Contenu |
|---|---|
| `weekly_recommendations` | Top 3 sécuritaire + top 3 risqué + métaux + mentions honorables + date de génération |
| `assets` | Détail de chaque actif recommandé (nom, ticker, type, analyse, niveau de confiance) |
| `portfolio` | Investissements réels journalisés par l'utilisateur |
| `transactions` | Historique des achats / ventes avec date, prix, quantité |
| `calculator_sessions` | Sauvegarde des sessions de calcul d'allocation |

### Prompt structuré (inspiré de « Analystes financiers IA »)
Le prompt injecté dans Claude suit cette logique :
- Contexte macro de la semaine (données injectées depuis les APIs).
- Analyse fondamentale par actif candidat.
- Sentiment Reddit + Google Trends en signal secondaire.
- Instruction de sortie : JSON structuré avec `ticker`, `nom`, `type`, `catégorie` (sécuritaire / risqué), `niveau_de_confiance` (High / Medium / Low), `résumé_thèse`, `points_de_risque`.

---

## 3. Fonctionnalités détaillées

### 3.1 — Moteur de recommandations hebdomadaires

**Déclenchement** : chaque lundi (automatique via cron, bouton manuel en fallback).

**Production attendue par génération** :

| Catégorie | Sécuritaire | Risqué |
|---|---|---|
| Actions | Top 3 | Top 3 |
| Crypto | Top 3 | Top 3 |
| Métaux précieux | Classement des 4 (Or, Argent, Palladium, Platine) — bloc sécuritaire | — |

> Palladium et Platine sont revenus dans la sélection (juillet 2026) grâce au
> passage du compte FMP au tier Starter, via leurs ETF (PALL / PPLT). Or et
> argent restent au cours au comptant (contrats à terme GCUSD / SIUSD).

→ **16 recommandations principales** + **10 mentions honorables** (mélange actions / métaux / crypto).

**Pour chaque actif recommandé, Claude produit** :
- Nom + ticker / code.
- Type (action / métal / crypto) et catégorie (sécuritaire / risqué).
- Niveau de confiance : High / Medium / Low.
- Évolution de la semaine (%).
- Résumé de thèse (annonce à venir, performance, fondamentaux, projet).
- Points de risque explicites.

**Règle clé** : le niveau de confiance est l'élément central — il alimente l'affichage **et** le calculateur. Il doit être justifié par l'analyse, pas arbitraire.

### 3.2 — Page d'analyse détaillée
Accessible en cliquant sur n'importe quel actif d'un top 3. Affiche l'analyse complète générée par Claude : thèse développée, métriques fondamentales clés, contexte macro pertinent, signaux de sentiment (Reddit / Google Trends), points de risque, niveau de confiance justifié.

### 3.3 — Calculateur d'allocation

**Entrée** : une somme en CAD + bouton « Calculer ».

**Logique de répartition (Logique B — points pondérés)** :
- Chaque actif reçoit un poids selon son niveau de confiance (défaut : **High = 5, Medium = 3, Low = 2**).
- On additionne tous les poids et chaque actif reçoit sa part proportionnelle de la somme.
- Pondération **configurable** dans les réglages.

**Interactions** :
- Résultat affiché sous le bouton : nom de chaque actif + somme allouée.
- Bouton « Avoir plus d'indices » → ajoute des éléments issus des mentions honorables.
- Chaque élément est **sélectionnable** (cases à cocher) → recalcul dynamique selon la sélection. L'utilisateur garde le contrôle final.

### 3.4 — Portefeuille & historique

**Vue d'ensemble (haut de page)** : capital total, % gain / perte global, P&L en $ global.

**Par actif détenu** : nom, quantité, % du capital, % gain / perte, P&L en $. Clic → déroule l'historique (date d'achat, prix d'achat, quantité).

**Nouvel investissement (haut de page)** → deux options :
1. Enregistrer depuis l'onglet calcul.
2. Ajout manuel : sélection parmi les actifs de la semaine, ou ajout d'un nouvel actif via son nom / code + saisie de la somme investie.

**Analyse de performance** : évaluation a posteriori — ai-je investi au bon moment ? L'app mémorise les prix des ~35 actifs à chaque génération (table `price_history`) et compare chaque prix d'achat à la fourchette observée depuis (verdict de timing par transaction, section repliable de la page Portefeuille). « Ai-je vendu au bon moment » viendra si un flux de vente est ajouté un jour.

---

## 4. Structure des pages (UX/UI)

Navigation persistante : barre en bas sur mobile, latérale sur desktop. **5 pages**, dont 4 dans la navigation principale (la page Analyse détaillée est accessible uniquement au clic sur un actif).

### Page 1 — Accueil (Recommandations de la semaine)
Affichage vertical en **sections repliables** pour rester lisible sur mobile :
1. En-tête : date de génération + bouton « Générer » (fallback manuel).
2. Actions — Sécuritaire : top 3 → nom, évolution semaine (%), badge confiance.
3. Actions — Risqué : top 3, même format.
4. Crypto — Sécuritaire : top 3, même format.
5. Crypto — Risqué : top 3, même format.
6. Métaux précieux : bloc unique, classement des 4 (Or, Argent, Palladium, Platine), même format.
7. Mentions honorables : 10 actifs mélangés, même format.

Chaque carte est **cliquable** → renvoie vers la page d'analyse détaillée.

### Page 2 — Analyse détaillée
Au clic sur un actif. Contenu : nom + ticker, badge confiance, évolution, thèse développée, métriques fondamentales, contexte macro, sentiment (Reddit / Trends), points de risque, bouton retour.

### Page 3 — Calculateur
1. Champ de saisie du montant (CAD) + bouton « Calculer ».
2. Résultat sous le bouton : liste nom + somme allouée (Logique B).
3. Bouton « Avoir plus d'indices » → ajoute des mentions honorables.
4. Chaque élément sélectionnable (cases à cocher) → recalcul dynamique.
5. Accès aux réglages de pondération.

### Page 4 — Portefeuille & Historique
1. Haut de page : bouton « Nouvel investissement » + vue d'ensemble (capital, % gain / perte, P&L $).
2. Liste des actifs détenus : nom, quantité, % capital, % gain / perte, P&L $ → clic déroule l'historique.
3. Flux « Nouvel investissement » : enregistrer depuis le calcul, ou ajout manuel.

### Page 5 — Réglages
- Pondération du calculateur : valeurs High / Medium / Low (défaut 5 / 3 / 2), ajustables.
- Équilibre sécuritaire / risqué : curseur de répartition globale.
- Devise : CAD par défaut (configurable pour évolution future).
- Préférences d'affichage : sections repliées / dépliées par défaut sur l'accueil.
- Génération des recommandations : bascule automatique (lundi) / manuel.
- Compte : connexion / déconnexion Supabase Auth.

---

## 5. Roadmap de développement

Principe directeur : **construire une app utilisable le plus tôt possible**, puis enrichir. Le moteur IA n'est pas branché en premier — on bâtit d'abord le squelette qui fonctionne sans lui.

### Phase 0 — Fondations
- Setup projet : React (Vite) + Tailwind + déploiement Vercel.
- Connexion Supabase + schéma de base de données (les 5 tables).
- Supabase Auth (connexion multi-appareils).
- Navigation entre les 5 pages (coquilles vides).

→ *Résultat : une app déployée, navigable, avec authentification.*

### Phase 1 — Le cœur fonctionnel (sans IA)
- Portefeuille & historique : journalisation manuelle, calcul P&L, vue par actif, historique déroulant.
- Calculateur : saisie montant + Logique B + sélection d'actifs + réglages de pondération.
- Page Réglages complète.
- Connexion aux APIs de prix (FMP, CoinGecko, ExchangeRate) pour valoriser le portefeuille en CAD.

→ *Résultat : suivi de portefeuille réel et calcul d'allocation manuels. L'app est utile même sans IA.*

### Phase 2 — Le moteur IA
- Intégration Claude API + prompt structuré (inspiré de « Analystes financiers IA »).
- Branchement des APIs de données + actualités + sentiment (Reddit, Google Trends).
- Génération des recommandations hebdomadaires → stockage Supabase.
- Page d'accueil alimentée par les vraies recommandations.
- Page d'analyse détaillée.
- Cron job du lundi (avec bouton manuel en fallback).
- Analyse de performance a posteriori (3.4) + historisation des prix.

→ *Résultat : les recommandations automatiques fonctionnent.*

### Phase 3 — Enrichissements
- Affinage des prompts et de la pondération selon les retours d'usage.
- Améliorations UX issues de l'usage réel.

→ *Résultat : l'app devient un véritable outil d'aide à la décision.*

### Phase 4 — Évolution (plus tard)
- ✅ (juillet 2026) **Appli Android (APK)** disponible sans réécriture : coquille
  TWA (Bubblewrap) qui ouvre le site en plein écran — projet dans `android/`,
  fabrication via GitHub Actions, APK publié dans la release GitHub « apk ».
  L'appli suit automatiquement chaque déploiement du site.
- Migration vers app mobile native (React Native) si un jour nécessaire. La logique métier et les appels API de la web app sont réutilisables.

---

## Annexe — Décisions de conception validées

- **Stockage** : Supabase (cloud, multi-appareils).
- **Type d'app** : web responsive d'abord, mobile native envisagée plus tard.
- **Métaux précieux** : Or, Argent, Palladium, Platine — traités comme bloc sécuritaire unique (classement des 4), pas de distinction sécuritaire / risqué. Palladium et Platine réintégrés (juillet 2026) via le tier FMP Starter et leurs ETF (PALL / PPLT).
- **Crypto** : toutes capitalisations, y compris micro-caps.
- **Devise** : CAD.
- **Logique du calculateur** : Logique B (points pondérés), pondération configurable.
- **Sentiment réseaux sociaux** : Reddit + Google Trends uniquement, en indicateur secondaire (Twitter/X écarté pour cause d'API restrictive et coûteuse).
- **Analyse de performance a posteriori** : reportée en Phase 2.
 
