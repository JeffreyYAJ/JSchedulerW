using JWScheduler.Desktop.Models;
using Microsoft.EntityFrameworkCore;

namespace JWScheduler.Desktop.Data;

public class AppDbContext : DbContext
{
    public DbSet<Eleve> Eleves => Set<Eleve>();
    public DbSet<Programme> Programmes => Set<Programme>();
    public DbSet<Affectation> Affectations => Set<Affectation>();

    private readonly string _dbPath;

    public AppDbContext()
    {
        var folder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "JWScheduler");
        Directory.CreateDirectory(folder);
        _dbPath = Path.Combine(folder, "database.db");
    }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        _dbPath = string.Empty;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
            optionsBuilder.UseSqlite($"Data Source={_dbPath}");
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Eleve>(e =>
        {
            e.ToTable("Eleves");
            e.HasKey(x => x.Id);
            e.Property(x => x.Nom).IsRequired();
            e.Property(x => x.Genre).IsRequired();
            e.Property(x => x.DateDernierExpose).HasColumnName("date_dernier_expose");
        });

        modelBuilder.Entity<Programme>(p =>
        {
            p.ToTable("Programmes");
            p.HasKey(x => x.Id);
            p.Property(x => x.DateDebutSemaine).HasColumnName("date_debut_semaine");
            p.Property(x => x.DateFinSemaine).HasColumnName("date_fin_semaine");
            p.Property(x => x.ContientDiscours).HasColumnName("contient_discours").HasConversion<int>();
        });

        modelBuilder.Entity<Affectation>(a =>
        {
            a.ToTable("Affectations");
            a.HasKey(x => x.Id);
            a.Property(x => x.IdProgramme).HasColumnName("id_programme");
            a.Property(x => x.IdEleve).HasColumnName("id_eleve");
            a.Property(x => x.TypeExpose).HasColumnName("type_expose").IsRequired();
            a.Property(x => x.Role).HasColumnName("role");
            a.HasOne(x => x.Programme).WithMany().HasForeignKey(x => x.IdProgramme);
            a.HasOne(x => x.Eleve).WithMany().HasForeignKey(x => x.IdEleve);
        });
    }
}

public static class DatabaseInitializer
{
    public static void EnsureCreated(AppDbContext db)
    {
        db.Database.EnsureCreated();
    }
}
