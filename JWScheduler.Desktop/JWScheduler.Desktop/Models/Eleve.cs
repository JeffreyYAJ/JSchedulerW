namespace JWScheduler.Desktop.Models;

public class Eleve
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public DateTime? DateDernierExpose { get; set; }

    public string Initiales => Nom.Length >= 2 ? Nom[..2].ToUpperInvariant() : Nom.ToUpperInvariant();

    public string Statut
    {
        get
        {
            if (DateDernierExpose is null) return "OK";
            var diffDays = (DateTime.Today - DateDernierExpose.Value.Date).Days;
            if (diffDays > 90) return "Overdue";
            if (diffDays > 60) return "Upcoming";
            return "OK";
        }
    }

    public bool EstPrioritaire
    {
        get
        {
            if (DateDernierExpose is null) return true;
            return DateDernierExpose.Value.Date <= DateTime.Today.AddMonths(-3);
        }
    }
}
