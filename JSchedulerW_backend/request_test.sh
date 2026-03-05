#!/bin/bash
# ----------------------------------------------------
# REQUÊTES CURL POUR L'API ORDONNANCEUR
# URL de base : http://localhost:3000
# ----------------------------------------------------

echo "=== 1. TEST DES ÉLÈVES ==="

# Ajouter des élèves (Hommes et Femmes)
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Marc", "genre": "H"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Jean", "genre": "H"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Sophie", "genre": "F"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Marie", "genre": "F"}'

# Récupérer tous les élèves
curl -X GET http://localhost:3000/api/eleves

# Récupérer les élèves prioritaires (ils devraient tous y être au début)
curl -X GET http://localhost:3000/api/eleves/prioritaires

echo -e "\n\n=== 2. TEST DES PROGRAMMES ==="

# Créer un programme pour la semaine prochaine (avec Discours)
curl -X POST http://localhost:3000/api/programmes -H "Content-Type: application/json" -d '{"date_programme": "2026-03-12", "contient_discours": true}'

# Créer un programme pour dans deux semaines (sans Discours -> donc Sketch 3)
curl -X POST http://localhost:3000/api/programmes -H "Content-Type: application/json" -d '{"date_programme": "2026-03-19", "contient_discours": false}'

# Récupérer tous les programmes
curl -X GET http://localhost:3000/api/programmes

echo -e "\n\n=== 3. TEST DES AFFECTATIONS (Assigner au Programme 1) ==="

# Assigner Marc (id 1, H) à la Lecture (Doit réussir)
curl -X POST http://localhost:3000/api/affectations -H "Content-Type: application/json" -d '{"id_programme": 1, "id_eleve": 1, "type_expose": "Lecture", "role": "Titulaire"}'

# Assigner Sophie (id 3, F) au Discours (Doit ÉCHOUER - Réservé aux hommes)
curl -X POST http://localhost:3000/api/affectations -H "Content-Type: application/json" -d '{"id_programme": 1, "id_eleve": 3, "type_expose": "Discours", "role": "Titulaire"}'

# Assigner Sophie (id 3, F) au Sketch 1
curl -X POST http://localhost:3000/api/affectations -H "Content-Type: application/json" -d '{"id_programme": 1, "id_eleve": 3, "type_expose": "Sketch 1", "role": "Titulaire"}'

# Assigner Marie (id 4, F) au Sketch 1 avec Sophie (Doit réussir - F/F)
curl -X POST http://localhost:3000/api/affectations -H "Content-Type: application/json" -d '{"id_programme": 1, "id_eleve": 4, "type_expose": "Sketch 1", "role": "Partenaire"}'

# Voir le planning final du programme 1
curl -X GET http://localhost:3000/api/programmes/1/affectations

echo -e "\n\n=== 4. TEST DU GÉNÉRATEUR AUTOMATIQUE ==="

# Générer les 8 prochaines semaines à partir d'une date (Attention: nécessite au moins 5-6 élèves en base pour bien fonctionner)
curl -X POST http://localhost:3000/api/programmes/generer -H "Content-Type: application/json" -d '{"date_debut": "2026-04-01", "nombre_semaines": 8}'