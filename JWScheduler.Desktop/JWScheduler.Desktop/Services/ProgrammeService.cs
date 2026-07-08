using JWScheduler.Desktop.Data;
using JWScheduler.Desktop.Models;
using Microsoft.EntityFrameworkCore;

namespace JWScheduler.Desktop.Services;

public class ProgrammeService
{
    private readonly AppDbContext _db;

    public ProgrammeService(AppDbContext db) => _db = db;

    public async Task<List<Programme>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Programmes
            .OrderByDescending(p => p.DateDebutSemaine)
            .ToListAsync(ct);

    public async Task<Programme?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _db.Programmes.FindAsync([id], ct);

    public async Task<Programme> CreateAsync(DateTime dateDebut, DateTime dateFin, bool contientDiscours, CancellationToken ct = default)
    {
        if (dateFin < dateDebut)
            throw new ArgumentException("La date de fin doit être après la date de début.");

        var programme = new Programme
        {
            DateDebutSemaine = dateDebut.Date,
            DateFinSemaine = dateFin.Date,
            ContientDiscours = contientDiscours
        };
        _db.Programmes.Add(programme);
        await _db.SaveChangesAsync(ct);
        return programme;
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var programme = await _db.Programmes.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("Programme non trouvé.");

        var affectations = await _db.Affectations.Where(a => a.IdProgramme == id).ToListAsync(ct);
        _db.Affectations.RemoveRange(affectations);
        _db.Programmes.Remove(programme);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<int> GenererSemainesAsync(DateTime dateDebut, int nombreSemaines = 8, CancellationToken ct = default)
    {
        var random = Random.Shared;
        var dateCourante = dateDebut.Date;
        var semainesGenerees = 0;

        for (var i = 0; i < nombreSemaines; i++)
        {
            var dateDebutStr = dateCourante;
            var dateFinStr = dateCourante.AddDays(6);
            var contientDiscours = random.NextDouble() < 0.5;

            var programme = new Programme
            {
                DateDebutSemaine = dateDebutStr,
                DateFinSemaine = dateFinStr,
                ContientDiscours = contientDiscours
            };
            _db.Programmes.Add(programme);
            await _db.SaveChangesAsync(ct);

            var elevesDispos = await _db.Eleves
                .OrderBy(e => e.DateDernierExpose == null ? 0 : 1)
                .ThenBy(e => e.DateDernierExpose)
                .ToListAsync(ct);

            var hommes = elevesDispos.Where(e => e.Genre == "H").ToList();
            var femmes = elevesDispos.Where(e => e.Genre == "F").ToList();
            var affectations = new List<(int IdEleve, string Type, string Role)>();

            var lecteur = PiocherEleves(hommes, 1);
            if (lecteur is not null)
                affectations.Add((lecteur[0].Id, "Lecture", "Titulaire"));

            if (contientDiscours)
            {
                var orateur = PiocherEleves(hommes, 1);
                if (orateur is not null)
                    affectations.Add((orateur[0].Id, "Discours", "Titulaire"));
            }
            else
            {
                var listeChoisie = random.NextDouble() < 0.5 && hommes.Count >= 2 ? hommes : femmes;
                var duoSketch3 = PiocherEleves(listeChoisie.Count >= 2 ? listeChoisie : hommes.Count >= 2 ? hommes : femmes, 2);
                if (duoSketch3 is not null)
                {
                    affectations.Add((duoSketch3[0].Id, "Sketch 3", "Titulaire"));
                    affectations.Add((duoSketch3[1].Id, "Sketch 3", "Partenaire"));
                }
            }

            var listeSketch1 = random.NextDouble() < 0.5 && femmes.Count >= 2 ? femmes : hommes;
            var duoSketch1 = PiocherEleves(listeSketch1.Count >= 2 ? listeSketch1 : femmes.Count >= 2 ? femmes : hommes, 2);
            if (duoSketch1 is not null)
            {
                affectations.Add((duoSketch1[0].Id, "Sketch 1", "Titulaire"));
                affectations.Add((duoSketch1[1].Id, "Sketch 1", "Partenaire"));
            }

            var listeSketch2 = random.NextDouble() < 0.5 && hommes.Count >= 2 ? hommes : femmes;
            var duoSketch2 = PiocherEleves(listeSketch2.Count >= 2 ? listeSketch2 : hommes.Count >= 2 ? hommes : femmes, 2);
            if (duoSketch2 is not null)
            {
                affectations.Add((duoSketch2[0].Id, "Sketch 2", "Titulaire"));
                affectations.Add((duoSketch2[1].Id, "Sketch 2", "Partenaire"));
            }

            foreach (var aff in affectations)
            {
                _db.Affectations.Add(new Affectation
                {
                    IdProgramme = programme.Id,
                    IdEleve = aff.IdEleve,
                    TypeExpose = aff.Type,
                    Role = aff.Role
                });

                var eleve = await _db.Eleves.FindAsync([aff.IdEleve], ct);
                if (eleve is not null)
                    eleve.DateDernierExpose = dateDebutStr;
            }

            await _db.SaveChangesAsync(ct);
            dateCourante = dateCourante.AddDays(7);
            semainesGenerees++;
        }

        return semainesGenerees;
    }

    private static List<Eleve>? PiocherEleves(List<Eleve> liste, int nombre)
    {
        if (liste.Count < nombre) return null;
        var picked = liste.Take(nombre).ToList();
        liste.RemoveRange(0, nombre);
        return picked;
    }
}
