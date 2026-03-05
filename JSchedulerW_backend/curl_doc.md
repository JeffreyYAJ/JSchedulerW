curl -X GET http://localhost:3000/api/eleves

curl -X GET "http://localhost:3000/api/eleves/prioritaires"

curl -X GET "http://localhost:3000/api/eleves/prioritaires?genre=H"

curl -X GET "http://localhost:3000/api/eleves/prioritaires?genre=F"

curl -X POST http://localhost:3000/api/affectations \
-H "Content-Type: application/json" \
-d '{"id_programme": 1, "id_eleve": 3, "type_expose": "Lecture", "role": "Titulaire"}'

curl -X POST http://localhost:3000/api/affectations \
-H "Content-Type: application/json" \
-d '{"id_programme": 1, "id_eleve": 4, "type_expose": "Sketch 1", "role": "Titulaire"}'

curl -X POST http://localhost:3000/api/affectations \
-H "Content-Type: application/json" \
-d '{"id_programme": 1, "id_eleve": 3, "type_expose": "Sketch 1", "role": "Partenaire"}'

curl -X POST http://localhost:3000/api/programmes/generer \
-H "Content-Type: application/json" \
-d '{"date_debut": "2026-04-01", "nombre_semaines": 8}'
