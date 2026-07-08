# Documentation Backend — JW Scheduler

API REST embarquée dans l'application Electron **JW Scheduler**.  
Elle gère les élèves, les semaines de programme et les affectations d'exposés.

---

## Sommaire

1. [Architecture](#1-architecture)
2. [Démarrage](#2-démarrage)
3. [Base de données](#3-base-de-données)
4. [Règles métier](#4-règles-métier)
5. [Référence API](#5-référence-api)
6. [Codes d'erreur](#6-codes-derreur)
7. [Logs et fichiers](#7-logs-et-fichiers)

---

## 1. Architecture

```
JSchedulerW_backend/
├── createServer.js       # Factory Express — point d'entrée du serveur
├── server.js             # Mode standalone (dev / tests)
├── database.js           # Initialisation SQLite + schéma
├── affectationRules.js   # Validation métier des affectations
├── logger.js             # Journalisation fichier
└── routes/
    ├── eleves.js         # CRUD élèves + prioritaires + historique
    ├── programmes.js     # CRUD programmes + génération auto
    ├── affectations.js   # CRUD affectations
    └── admin.js          # Sauvegarde / restauration BDD
```

### Intégration Electron

En production, le serveur est démarré depuis `main.js` via `createServer()` :

- **Port** : `3000` (fixe)
- **URL de base** : `http://localhost:3000/api`
- **Données** : dossier `userData` d'Electron (`database.db`)

En développement, les données sont stockées dans `JSchedulerW_backend/database.db`.

---

## 2. Démarrage

### Mode Electron (recommandé)

```bash
npm run dev          # Vite + Electron
npm run dist         # Build + package
```

Le backend démarre automatiquement avec l'application.

### Mode standalone

Utile pour tester l'API sans Electron :

```bash
cd JSchedulerW_backend
node server.js
```

Variables d'environnement optionnelles :

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port HTTP | `3000` |
| `JWSCHEDULER_DB_FOLDER` | Dossier contenant `database.db` | `JSchedulerW_backend/` |

---

## 3. Base de données

SQLite — fichier `database.db`.

### Table `Eleves`

| Colonne | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Identifiant auto-incrémenté |
| `nom` | TEXT | Nom de l'élève |
| `genre` | TEXT | `'H'` ou `'F'` |
| `date_dernier_expose` | DATE | Date du dernier exposé (`YYYY-MM-DD`) ou `NULL` |

### Table `Programmes`

| Colonne | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Identifiant auto-incrémenté |
| `date_debut_semaine` | DATE | Début de la semaine |
| `date_fin_semaine` | DATE | Fin de la semaine |
| `contient_discours` | BOOLEAN | `1` = semaine avec discours, `0` = Sketch 3 |

### Table `Affectations`

| Colonne | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Identifiant auto-incrémenté |
| `id_programme` | INTEGER FK | Référence `Programmes.id` |
| `id_eleve` | INTEGER FK | Référence `Eleves.id` |
| `type_expose` | TEXT | `Lecture`, `Discours`, `Sketch 1`, `Sketch 2`, `Sketch 3` |
| `role` | TEXT | `Titulaire` ou `Partenaire` |

### Suppressions en cascade

- Supprimer un **élève** → supprime ses affectations
- Supprimer un **programme** → supprime ses affectations

---

## 4. Règles métier

Implémentées dans `affectationRules.js` et appliquées à chaque `POST` / `PUT` sur `/affectations`.

| Règle | Détail |
|---|---|
| Unicité | Un élève ne peut être assigné qu'**une seule fois** par semaine |
| Lecture / Discours | Réservés aux **hommes** (`genre = 'H'`) |
| Discours vs Sketch 3 | Mutuellement exclusifs selon `contient_discours` du programme |
| Sketchs (1, 2, 3) | Maximum **2 personnes** par sketch |
| Genre sketchs | Les deux partenaires doivent être du **même genre** (H/H ou F/F) |
| Priorité | Élève prioritaire si `date_dernier_expose` est `NULL` ou > **3 mois** |
| Date exposé | Mise à jour automatique à `date_debut_semaine` du programme lors d'une affectation |
| Suppression | Recalcul de `date_dernier_expose` sur la dernière affectation restante |

---

## 5. Référence API

**URL de base** : `http://localhost:3000/api`

Toutes les requêtes JSON utilisent l'en-tête :

```
Content-Type: application/json
```

---

### Élèves — `/eleves`

#### `GET /eleves`

Liste tous les élèves.

**Réponse `200`**

```json
[
  { "id": 1, "nom": "Jean Dupont", "genre": "H", "date_dernier_expose": "2026-03-15" }
]
```

---

#### `GET /eleves/prioritaires`

Élèves n'ayant pas exposé depuis 3 mois ou jamais.

**Query params**

| Param | Description |
|---|---|
| `genre` | Optionnel : `H` ou `F` pour filtrer |

**Exemple** : `GET /eleves/prioritaires?genre=H`

---

#### `GET /eleves/:id`

Détail d'un élève.

**Réponses** : `200` | `404`

---

#### `GET /eleves/:id/historique`

Historique des affectations d'un élève, trié du plus récent au plus ancien.

**Réponse `200`**

```json
[
  {
    "affectation_id": 12,
    "type_expose": "Lecture",
    "role": "Titulaire",
    "date_debut_semaine": "2026-03-10",
    "date_fin_semaine": "2026-03-16"
  }
]
```

---

#### `POST /eleves`

Crée un élève.

**Body**

```json
{
  "nom": "Marie Martin",
  "genre": "F",
  "date_dernier_expose": "2026-01-01"
}
```

| Champ | Requis | Description |
|---|---|---|
| `nom` | oui | Nom de l'élève |
| `genre` | oui | `H` ou `F` |
| `date_dernier_expose` | non | Date ISO `YYYY-MM-DD` |

**Réponse `201`**

```json
{ "message": "Élève ajouté", "id": 5 }
```

---

#### `PUT /eleves/:id`

Met à jour un élève.

**Body** : même structure que `POST`.

**Réponses** : `200` | `400` | `404`

---

#### `DELETE /eleves/:id`

Supprime un élève et toutes ses affectations.

**Réponses** : `200` | `404`

---

### Programmes — `/programmes`

#### `GET /programmes`

Liste toutes les semaines, triées par date décroissante.

---

#### `GET /programmes/:id`

Détail d'un programme.

**Réponse `200`**

```json
{
  "id": 1,
  "date_debut_semaine": "2026-04-07",
  "date_fin_semaine": "2026-04-13",
  "contient_discours": true
}
```

---

#### `POST /programmes`

Crée une semaine.

**Body**

```json
{
  "date_debut_semaine": "2026-04-07",
  "date_fin_semaine": "2026-04-13",
  "contient_discours": false
}
```

**Réponse `201`**

```json
{ "id": 3 }
```

---

#### `PUT /programmes/:id`

Modifie une semaine existante. Même body que `POST`.

---

#### `DELETE /programmes/:id`

Supprime une semaine et toutes ses affectations.

---

#### `GET /programmes/:id_programme/affectations`

Planning complet d'une semaine.

**Réponse `200`**

```json
[
  {
    "affectation_id": 7,
    "type_expose": "Lecture",
    "role": "Titulaire",
    "eleve_id": 2,
    "nom": "Jean Dupont",
    "genre": "H"
  }
]
```

---

#### `POST /programmes/generer`

Génère automatiquement plusieurs semaines avec affectations.

**Body**

```json
{
  "date_debut": "2026-04-07",
  "nombre_semaines": 8
}
```

| Champ | Requis | Défaut |
|---|---|---|
| `date_debut` | oui | — |
| `nombre_semaines` | non | `8` |

**Comportement** :
- Crée des semaines de 7 jours consécutives
- Alterne aléatoirement discours / sketch 3
- Assigne lecture, sketchs et discours/sketch 3 en priorisant les élèves les moins récemment exposés
- Utilise une **transaction SQLite** (rollback en cas d'erreur)

**Réponse `201`**

```json
{ "message": "8 semaines générées avec succès !" }
```

---

### Affectations — `/affectations`

#### `POST /affectations`

Assigne un élève à un créneau.

**Body**

```json
{
  "id_programme": 1,
  "id_eleve": 3,
  "type_expose": "Sketch 1",
  "role": "Titulaire"
}
```

| Champ | Requis | Valeurs |
|---|---|---|
| `id_programme` | oui | ID du programme |
| `id_eleve` | oui | ID de l'élève |
| `type_expose` | oui | `Lecture`, `Discours`, `Sketch 1`, `Sketch 2`, `Sketch 3` |
| `role` | non | `Titulaire` (défaut) ou `Partenaire` |

**Réponse `201`**

```json
{
  "message": "Affectation réussie et date de l'élève mise à jour !",
  "id": 15
}
```

---

#### `PUT /affectations/:id`

Remplace l'élève d'une affectation existante.

**Body**

```json
{ "id_eleve": 5 }
```

Les règles métier sont revalidées. La `date_dernier_expose` de l'ancien et du nouvel élève est recalculée.

**Réponses** : `200` | `400` | `404`

---

#### `DELETE /affectations/:id`

Supprime une affectation et recalcule la date du dernier exposé de l'élève concerné.

**Réponses** : `200` | `404`

---

### Administration — `/admin`

#### `GET /admin/backup`

Télécharge le fichier `database.db`.

**Réponse** : fichier binaire (`.db`)

Utilisé comme fallback web ; en Electron, la sauvegarde passe par le dialogue natif (`preload.js`).

---

#### `POST /admin/restore`

Restaure la base depuis un fichier local (usage Electron / IPC).

**Body**

```json
{ "backupPath": "/chemin/vers/sauvegarde.db" }
```

**Réponse `200`**

```json
{
  "message": "Base de données restaurée avec succès",
  "safetyBackup": "/chemin/vers/database-before-restore-1234567890.db"
}
```

> Une copie de sécurité de l'ancienne base est créée automatiquement avant restauration.

---

## 6. Codes d'erreur

Toutes les erreurs API renvoient un JSON :

```json
{ "error": "Message descriptif en français" }
```

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Données invalides ou règle métier violée |
| `404` | Ressource introuvable |
| `500` | Erreur serveur / base de données |

---

## 7. Logs et fichiers

| Fichier | Emplacement | Description |
|---|---|---|
| `database.db` | `userData/` (prod) ou `JSchedulerW_backend/` (dev) | Base SQLite |
| `backend.log` | Même dossier que la BDD | Journal des événements serveur |

Exemple d'entrée de log :

```
[2026-07-08T16:00:00.000Z] === Backend starting in EMBEDDED mode ===
[2026-07-08T16:00:00.100Z] Database setup complete
[2026-07-08T16:00:00.200Z] Server is running embedded on http://localhost:3000
```

---

## Vérification rapide

```bash
curl http://localhost:3000/api/
# → Ordonnanceur API is running!

curl http://localhost:3000/api/eleves
# → [...]
```

Voir [`curl_doc.md`](./curl_doc.md) pour une liste complète d'exemples curl.
