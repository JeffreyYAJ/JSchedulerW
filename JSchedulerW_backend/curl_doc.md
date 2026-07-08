# Exemples curl — API JW Scheduler

URL de base : `http://localhost:3000/api`

---

## Santé

```bash
curl http://localhost:3000/api/
```

---

## Élèves

```bash
# Liste
curl http://localhost:3000/api/eleves

# Détail
curl http://localhost:3000/api/eleves/1

# Prioritaires (tous)
curl http://localhost:3000/api/eleves/prioritaires

# Prioritaires hommes
curl "http://localhost:3000/api/eleves/prioritaires?genre=H"

# Prioritaires femmes
curl "http://localhost:3000/api/eleves/prioritaires?genre=F"

# Historique d'un élève
curl http://localhost:3000/api/eleves/1/historique

# Créer
curl -X POST http://localhost:3000/api/eleves \
  -H "Content-Type: application/json" \
  -d '{"nom": "Paul Martin", "genre": "H", "date_dernier_expose": null}'

# Modifier
curl -X PUT http://localhost:3000/api/eleves/1 \
  -H "Content-Type: application/json" \
  -d '{"nom": "Paul Martin", "genre": "H", "date_dernier_expose": "2026-03-01"}'

# Supprimer
curl -X DELETE http://localhost:3000/api/eleves/1
```

---

## Programmes

```bash
# Liste
curl http://localhost:3000/api/programmes

# Détail
curl http://localhost:3000/api/programmes/1

# Affectations d'une semaine
curl http://localhost:3000/api/programmes/1/affectations

# Créer
curl -X POST http://localhost:3000/api/programmes \
  -H "Content-Type: application/json" \
  -d '{
    "date_debut_semaine": "2026-04-07",
    "date_fin_semaine": "2026-04-13",
    "contient_discours": false
  }'

# Modifier
curl -X PUT http://localhost:3000/api/programmes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "date_debut_semaine": "2026-04-07",
    "date_fin_semaine": "2026-04-13",
    "contient_discours": true
  }'

# Supprimer
curl -X DELETE http://localhost:3000/api/programmes/1

# Générer 8 semaines automatiquement
curl -X POST http://localhost:3000/api/programmes/generer \
  -H "Content-Type: application/json" \
  -d '{"date_debut": "2026-04-07", "nombre_semaines": 8}'
```

---

## Affectations

```bash
# Assigner — Lecture
curl -X POST http://localhost:3000/api/affectations \
  -H "Content-Type: application/json" \
  -d '{"id_programme": 1, "id_eleve": 3, "type_expose": "Lecture", "role": "Titulaire"}'

# Assigner — Sketch 1 (titulaire + partenaire, même genre)
curl -X POST http://localhost:3000/api/affectations \
  -H "Content-Type: application/json" \
  -d '{"id_programme": 1, "id_eleve": 4, "type_expose": "Sketch 1", "role": "Titulaire"}'

curl -X POST http://localhost:3000/api/affectations \
  -H "Content-Type: application/json" \
  -d '{"id_programme": 1, "id_eleve": 5, "type_expose": "Sketch 1", "role": "Partenaire"}'

# Modifier — remplacer l'élève
curl -X PUT http://localhost:3000/api/affectations/7 \
  -H "Content-Type: application/json" \
  -d '{"id_eleve": 6}'

# Supprimer
curl -X DELETE http://localhost:3000/api/affectations/7
```

---

## Administration

```bash
# Télécharger la sauvegarde
curl -O -J http://localhost:3000/api/admin/backup

# Restaurer (chemin local — usage Electron)
curl -X POST http://localhost:3000/api/admin/restore \
  -H "Content-Type: application/json" \
  -d '{"backupPath": "/chemin/vers/jwscheduler-backup.db"}'
```
