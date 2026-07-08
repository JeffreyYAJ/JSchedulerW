using JWScheduler.Desktop.Data;
using JWScheduler.Desktop.Models;
using Microsoft.EntityFrameworkCore;

namespace JWScheduler.Desktop.Services;

public class EleveService
{
    private readonly AppDbContext _db;

    public EleveService(AppDbContext db) => _db = db;

    public async Task<List<Eleve>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Eleves.OrderBy(e => e.Nom).ToListAsync(ct);

    public async Task<Eleve?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _db.Eleves.FindAsync([id], ct);

    public async Task<List<Eleve>> GetPrioritairesAsync(string? genre = null, CancellationToken ct = default)
    {
        var cutoff = DateTime.Today.AddMonths(-3);
        var query = _db.Eleves.Where(e =>
            e.DateDernierExpose == null || e.DateDernierExpose.Value.Date <= cutoff);

        if (genre is "H" or "F")
            query = query.Where(e => e.Genre == genre);

        return await query
            .OrderBy(e => e.DateDernierExpose)
            .ToListAsync(ct);
    }

    public async Task<Eleve> AddAsync(string nom, string genre, DateTime? dateDernierExpose = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(nom))
            throw new ArgumentException("Le nom est requis.");
        if (genre is not ("H" or "F"))
            throw new ArgumentException("Le genre doit être H ou F.");

        var eleve = new Eleve { Nom = nom.Trim(), Genre = genre, DateDernierExpose = dateDernierExpose };
        _db.Eleves.Add(eleve);
        await _db.SaveChangesAsync(ct);
        return eleve;
    }

    public async Task UpdateAsync(int id, string nom, string genre, DateTime? dateDernierExpose, CancellationToken ct = default)
    {
        var eleve = await _db.Eleves.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("Élève non trouvé.");

        if (string.IsNullOrWhiteSpace(nom))
            throw new ArgumentException("Le nom est requis.");
        if (genre is not ("H" or "F"))
            throw new ArgumentException("Le genre doit être H ou F.");

        eleve.Nom = nom.Trim();
        eleve.Genre = genre;
        eleve.DateDernierExpose = dateDernierExpose;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var eleve = await _db.Eleves.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("Élève non trouvé.");
        _db.Eleves.Remove(eleve);
        await _db.SaveChangesAsync(ct);
    }
}
