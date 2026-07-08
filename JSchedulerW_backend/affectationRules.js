async function recalculateEleveDate(db, id_eleve) {
    const row = await db.get(`
        SELECT MAX(p.date_debut_semaine) AS derniere_date
        FROM Affectations a
        JOIN Programmes p ON a.id_programme = p.id
        WHERE a.id_eleve = ?
    `, [id_eleve]);

    await db.run(
        'UPDATE Eleves SET date_dernier_expose = ? WHERE id = ?',
        [row?.derniere_date || null, id_eleve]
    );
}

async function validateAffectation(db, { id_programme, id_eleve, type_expose, role }, excludeAffectationId = null) {
    const eleve = await db.get('SELECT * FROM Eleves WHERE id = ?', [id_eleve]);
    const programme = await db.get('SELECT * FROM Programmes WHERE id = ?', [id_programme]);

    if (!eleve || !programme) {
        return { ok: false, status: 404, error: 'Élève ou Programme introuvable' };
    }

    let dejaAssigneQuery = `
        SELECT type_expose FROM Affectations
        WHERE id_programme = ? AND id_eleve = ?
    `;
    const dejaParams = [id_programme, id_eleve];
    if (excludeAffectationId) {
        dejaAssigneQuery += ' AND id != ?';
        dejaParams.push(excludeAffectationId);
    }

    const dejaAssigne = await db.get(dejaAssigneQuery, dejaParams);
    if (dejaAssigne) {
        return {
            ok: false,
            status: 400,
            error: `${eleve.nom} est déjà assigné(e) à un(e) ${dejaAssigne.type_expose} pour ce programme !`,
        };
    }

    if (['Lecture', 'Discours'].includes(type_expose) && eleve.genre !== 'H') {
        return { ok: false, status: 400, error: `${type_expose} est réservé aux hommes.` };
    }

    if (type_expose === 'Discours' && programme.contient_discours === 0) {
        return { ok: false, status: 400, error: 'Ce programme est configuré pour un Sketch 3, pas de Discours.' };
    }
    if (type_expose === 'Sketch 3' && programme.contient_discours === 1) {
        return { ok: false, status: 400, error: 'Ce programme est configuré pour un Discours, pas de Sketch 3.' };
    }

    if (type_expose.startsWith('Sketch')) {
        let existantsQuery = `
            SELECT a.*, e.genre
            FROM Affectations a
            JOIN Eleves e ON a.id_eleve = e.id
            WHERE a.id_programme = ? AND a.type_expose = ?
        `;
        const existantsParams = [id_programme, type_expose];
        if (excludeAffectationId) {
            existantsQuery += ' AND a.id != ?';
            existantsParams.push(excludeAffectationId);
        }

        const existants = await db.all(existantsQuery, existantsParams);

        if (existants.length >= 2) {
            return { ok: false, status: 400, error: `Le ${type_expose} est déjà complet (2 personnes max).` };
        }
        if (existants.length === 1) {
            const partenaire = existants[0];
            if (partenaire.genre !== eleve.genre) {
                return {
                    ok: false,
                    status: 400,
                    error: `Incompatibilité de genre. Le partenaire assigné est de genre ${partenaire.genre}. Les sketchs doivent être H/H ou F/F.`,
                };
            }
        }
    }

    return { ok: true, eleve, programme, role: role || 'Titulaire' };
}

module.exports = { validateAffectation, recalculateEleveDate };
