using JWScheduler.Desktop.Data;
using JWScheduler.Desktop.Models;
using Microsoft.EntityFrameworkCore;

namespace JWScheduler.Desktop.Services;

public class AffectationService
{
    private readonly AppDbContext _db;

    public AffectationService(AppDbContext db) => _db = db;

    public async Task<List<AffectationDetail>> GetByProgrammeAsync(int idProgramme, CancellationToken ct = default) =>
        await _db.Affectations
            .Where(a => a.IdProgramme == idProgramme)
            .Join(_db.Eleves,
                a => a.IdEleve,
                e => e.Id,
                (a, e) => new AffectationDetail
                {
                    AffectationId = a.Id,
                    TypeExpose = a.TypeExpose,
                    Role = a.Role,
                    EleveId = e.Id,
                    Nom = e.Nom,
                    Genre = e.Genre
                })
            .OrderBy(x => x.TypeExpose)
            .ToListAsync(ct);

    public async Task<Affectation> AssignerAsync(AffectationRequest request, CancellationToken ct = default)
    {
        var eleve = await _db.Eleves.FindAsync([request.IdEleve], ct)
            ?? throw new KeyNotFoundException("Élève ou Programme introuvable.");
        var programme = await _db.Programmes.FindAsync([request.IdProgramme], ct)
            ?? throw new KeyNotFoundException("Élève ou Programme introuvable.");

        var dejaAssigne = await _db.Affectations
            .FirstOrDefaultAsync(a => a.IdProgramme == request.IdProgramme && a.IdEleve == request.IdEleve, ct);

        if (dejaAssigne is not null)
            throw new InvalidOperationException($"{eleve.Nom} est déjà assigné(e) à un(e) {dejaAssigne.TypeExpose} pour ce programme !");

        if (request.TypeExpose is "Lecture" or "Discours" && eleve.Genre != "H")
            throw new InvalidOperationException($"{request.TypeExpose} est réservé aux hommes.");

        if (request.TypeExpose == "Discours" && !programme.ContientDiscours)
            throw new InvalidOperationException("Ce programme est configuré pour un Sketch 3, pas de Discours.");

        if (request.TypeExpose == "Sketch 3" && programme.ContientDiscours)
            throw new InvalidOperationException("Ce programme est configuré pour un Discours, pas de Sketch 3.");

        if (request.TypeExpose.StartsWith("Sketch", StringComparison.Ordinal))
        {
            var existants = await _db.Affectations
                .Where(a => a.IdProgramme == request.IdProgramme && a.TypeExpose == request.TypeExpose)
                .Join(_db.Eleves, a => a.IdEleve, e => e.Id, (a, e) => e)
                .ToListAsync(ct);

            if (existants.Count >= 2)
                throw new InvalidOperationException($"Le {request.TypeExpose} est déjà complet (2 personnes max).");

            if (existants.Count == 1 && existants[0].Genre != eleve.Genre)
                throw new InvalidOperationException(
                    $"Incompatibilité de genre. Le partenaire assigné est de genre {existants[0].Genre}. Les sketchs doivent être H/H ou F/F.");
        }

        var affectation = new Affectation
        {
            IdProgramme = request.IdProgramme,
            IdEleve = request.IdEleve,
            TypeExpose = request.TypeExpose,
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Titulaire" : request.Role
        };

        _db.Affectations.Add(affectation);
        eleve.DateDernierExpose = programme.DateDebutSemaine;
        await _db.SaveChangesAsync(ct);
        return affectation;
    }
}
