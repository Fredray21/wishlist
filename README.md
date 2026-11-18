# 🎁 Wishlist

Wishlist personnelle : mes proches réservent un cadeau en secret, et moi je ne vois jamais ce qui est réservé.

- **Next.js 16 (App Router)**, TypeScript, Tailwind CSS 4, Lucide React
- **Pas de base de données** : un fichier `data/wishlist.json`, écrit de façon atomique (fichier temporaire + `fs.rename`), avec une file d'attente qui sérialise les écritures
- **Docker + GitHub Actions** : image publiée sur GHCR, déploiement sur le VPS via SSH et `docker compose`, volume persistant `./data`

## Fonctionnalités

### Visiteurs (sans compte)
- Bandeau anti-spoiler « 🤫 Chut ! … » en haut de la liste, rappelé dans la fenêtre de réservation
- Filtres : Disponibles / Tous, catégorie, tranche de prix, tri (priorité, prix, récents)
- **Réserver ce cadeau** : prénom et note facultatifs. Un **code à 4 chiffres** est affiché et enregistré, avec un jeton, dans le `localStorage`
- Les autres visiteurs voient « Déjà réservé ». « Annuler ma réservation » marche en un clic avec le jeton local, ou avec le code depuis un autre appareil (tentatives limitées)

### Admin (`/admin` ou le cadenas du pied de page)
- Mot de passe `ADMIN_PASSWORD`, cookie `HttpOnly` / `SameSite=Strict` signé en HMAC avec `SESSION_SECRET`
- **Anti-spoiler strict** : quand on est connecté en admin, l'API et le HTML ne contiennent **jamais** la clé `reserved`. Les routes de réservation renvoient 403 à l'admin, pour qu'aucun message d'erreur ne trahisse rien
- Ajouter un cadeau (avec remplissage automatique titre / image / prix depuis OpenGraph), le modifier, le supprimer, le marquer « Reçu » ou annuler ce marquage (section « Déjà reçus » visible par tous)

### Thèmes saisonniers
Le sélecteur en haut à droite propose `Auto` (par défaut), `Noël`, `Anniversaire` et `Minimaliste`. Le choix est mémorisé par navigateur et appliqué avant l'affichage, sans flash.

| Mois | Thème « Auto » |
| --- | --- |
| Novembre, décembre, janvier | Noël : rouge profond, vert sapin, doré, flocons en CSS pur |
| `BIRTHDAY_MONTH` et le mois précédent | Anniversaire : couleurs vives et confettis en CSS |
| Le reste de l'année | Minimaliste : sobre, suit le mode clair ou sombre du système |

### Design & secrets
Direction artistique « magazine de mode » : couverture avec titre géant animé lettre par lettre, bandeau défilant, cartes lookbook numérotées avec inclinaison 3D, grain papier, transitions de vue au filtrage, confettis maison (canvas, zéro dépendance). Respecte `prefers-reduced-motion`.

Le site cache **23 easter eggs** 🥚 — le carnet secret (pied de page) donne des indices.

## Développement

```bash
cp .env.example .env    # puis remplir ADMIN_PASSWORD et SESSION_SECRET
npm install
npm run dev             # http://localhost:3000
```

`data/wishlist.json` est créé automatiquement au démarrage à partir de `data/wishlist.example.json`. Il est ignoré par Git.

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `ADMIN_PASSWORD` | Mot de passe admin. Sans lui, le mode admin est désactivé |
| `SESSION_SECRET` | Clé de signature du cookie, 32 caractères minimum (`openssl rand -hex 32`) |
| `OWNER_NAME` | Prénom affiché (par défaut `Frédéric`) |
| `BIRTHDAY_MONTH` | Mois d'anniversaire (1-12) utilisé par le thème Auto |
| `DATA_DIR` | Dossier des données (par défaut `./data`, `/app/data` dans Docker) |

## Déploiement (VPS + Nginx + Certbot)

Même schéma que mes autres projets : la CI construit l'image `ghcr.io/<owner>/wishlist`, génère le `.env` à partir des secrets, le copie dans `~/app/wishlist` sur le VPS avec `docker-compose.yml`, puis lance `docker compose pull && docker compose up -d`.

**Secrets GitHub** (Settings → Secrets and variables → Actions) :
`VPS_HOST`, `VPS_USERNAME`, `VPS_PASSWORD`, `ADMIN_PASSWORD`, `SESSION_SECRET`.

**Variables GitHub** (facultatives) : `OWNER_NAME`, `BIRTHDAY_MONTH`.

Sur le VPS, une seule fois :
1. Copier `docs/nginx.conf.example` dans `/etc/nginx/sites-available/`, y mettre le vrai domaine, activer le site puis `sudo nginx -t && sudo systemctl reload nginx`
2. `sudo certbot --nginx -d <domaine>`

Le conteneur écoute sur `127.0.0.1:5020` (modifiable avec `HTTP_BIND` dans le workflow). `~/app/wishlist/data` est un volume : **les redéploiements n'y touchent jamais**. Pensez à le sauvegarder (`cp data/wishlist.json …`).

> Le domaine de production n'apparaît nulle part dans ce dépôt public : il n'existe que dans la config Nginx du VPS. Le site envoie aussi `robots.txt` et une balise `noindex`.

## Sécurité
- Aucun secret dans le dépôt : `.env*` et `data/*` sont ignorés
- Protection CSRF : vérification de `Origin` sur toutes les mutations, en plus de `SameSite=Strict`
- Limitation de débit en mémoire sur la connexion, les réservations et les annulations par code
- Le code et le jeton de réservation sont stockés hachés (SHA-256)
- La récupération OpenGraph est réservée à l'admin, bloque les adresses privées (SSRF), et limite le délai et la taille des pages
- Le conteneur tourne en utilisateur non-root (uid 1001)
