# Documentation de l'API Ordonnanceur

URL de base : `http://localhost:3000/api`

## 1. Élèves (/eleves)

Gère la base de données des participants.

- `GET /eleves` : Récupère la liste de tous les élèves.

- `GET /eleves/:id` : Récupère les détails d'un élève spécifique.

- `GET /eleves/prioritaires` : Récupère les élèves inactifs depuis plus de 3 mois ou n'ayant jamais participé.

- `POST /eleves` : Ajoute un nouvel élève.

  Body attendu : `{ "nom": "String", "genre": "H" | "F" }`

- `PUT /eleves/:id` : Met à jour les informations d'un élève.

  Body attendu : `{ "nom": "String", "genre": "H" | "F", "date_dernier_expose": "YYYY-MM-DD" (optionnel) }`

- `DELETE /eleves/:id` : Supprime un élève de la base.

## 2. Programmes (/programmes)

Gère les sessions hebdomadaires (la "coquille" temporelle).

- `GET /programmes` : Récupère tous les programmes, triés du plus récent au plus ancien.

- `GET /programmes/:id` : Récupère un programme spécifique.

- `POST /programmes` : Crée une nouvelle semaine.

  Body attendu : `{ "date_programme": "YYYY-MM-DD", "contient_discours": Boolean }`

- `PUT /programmes/:id` : Modifie la date ou le format (Discours/Sketch 3) d'un programme.

  Body attendu : `{ "date_programme": "YYYY-MM-DD", "contient_discours": Boolean }`

- `DELETE /programmes/:id` : Supprime un programme.

## 3. Affectations (/affectations)

Gère l'assignation des rôles tout en respectant les règles métier.

- `GET /programmes/:id_programme/affectations` : Récupère tout le planning (les élèves et leurs rôles) pour un programme donné.

- `POST /affectations` : Assigne un élève à un rôle. Met à jour automatiquement la date de son dernier exposé.

  Body attendu : `{ "id_programme": Integer, "id_eleve": Integer, "type_expose": "Lecture" | "Discours" | "Sketch 1" | "Sketch 2" | "Sketch 3", "role": "Titulaire" | "Partenaire" }`

## 4. Générateur Automatique

- `POST /programmes/generer` : Génère automatiquement des programmes et des affectations sur plusieurs semaines en respectant les contraintes et l'équité.

  Body attendu : `{ "date_debut": "YYYY-MM-DD", "nombre_semaines": Integer (par défaut 8) }`
