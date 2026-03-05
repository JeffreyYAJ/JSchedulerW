#!/bin/bash
# ----------------------------------------------------
# REQUÊTES CURL - ORDONNANCEUR V2 (Par Semaine)
# URL de base : http://localhost:3000
# ----------------------------------------------------

echo "=== 1. CRÉATION DU VIVIER D'ÉLÈVES ==="

curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Marc", "genre": "H"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Jean", "genre": "H"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Sophie", "genre": "F"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Marie", "genre": "F"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Luc", "genre": "H"}'
curl -X POST http://localhost:3000/api/eleves -H "Content-Type: application/json" -d '{"nom": "Julie", "genre": "F"}'

echo -e "\n\n=== 2. CRÉATION DES PROGRAMMES (Format Semaine) ==="

# Semaine 1 : Du Lundi 9 Mars au Dimanche 15 Mars 2026 (Avec Discours)
curl -X POST http://localhost:3000/api/programmes \
-H "Content-Type: application/json" \
-d '{"date_debut_semaine": "2026-03-09", "date_fin_semaine": "2026-03-15", "contient_discours": true}'

# Semaine 2 : Du Lundi 16 Mars au Dimanche 22 Mars 2026 (Sans Discours -> Sketch 3)
curl -X POST http://localhost:3000/api/programmes \
-H "Content-Type: application/json" \
-d '{"date_debut_semaine": "2026-03-16", "date_fin_semaine": "2026-03-22", "contient_discours": false}'

# Vérification : Récupérer les programmes créés
curl -X GET http://localhost:3000/api/programmes

echo -e "\n\n=== 3. TEST DES AFFECTATIONS MANUELLES (Sur la Semaine 1) ==="

# Assigner Marc (id 1, H) à la Lecture
curl -X POST http://localhost:3000/api/affectations \
-H "Content-Type: application/json" \
-d '{"id_programme": 1, "id_eleve": 1, "type_expose": "Lecture", "role": "Titulaire"}'

# Assigner Jean (id 2, H) au Discours
curl -X POST http://localhost:3000/api/affectations \
-H "Content-Type: application/json" \
-d '{"id_programme": 1, "id_eleve": 2, "type_expose": "Discours", "role": "Titulaire"}'

# Assigner Sophie (id 3, F) au Sketch 1 (Titulaire)
curl -X POST http://localhost:3000/api/affectations \
-H "Content-Type: application/json" \
-d '{"id_programme": 1, "id_eleve": 3, "type_expose": "Sketch 1", "role": "Titulaire"}'

# Assigner Marie (id 4, F) au Sketch 1 (Partenaire)
curl -X POST http://localhost:3000/api/affectations \
-H "Content-Type: application/json" \
-d '{"id_programme": 1, "id_eleve": 4, "type_expose": "Sketch 1", "role": "Partenaire"}'

# Voir le planning complet de la Semaine 1
echo -e "\n--- Planning de la Semaine 1 ---"
curl -X GET http://localhost:3000/api/programmes/1/affectations

echo -e "\n\n=== 4. TEST DU GÉNÉRATEUR AUTOMATIQUE ==="

# Générer les 4 prochaines semaines à partir du Lundi 23 Mars 2026
curl -X POST http://localhost:3000/api/programmes/generer \
-H "Content-Type: application/json" \
-d '{"date_debut": "2026-03-23", "nombre_semaines": 4}'

echo -e "\n\n=== TESTS TERMINÉS AVEC SUCCÈS ! ==="