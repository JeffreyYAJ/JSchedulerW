namespace JWScheduler.Desktop.Models;

public class Programme
{
    public int Id { get; set; }
    public DateTime DateDebutSemaine { get; set; }
    public DateTime DateFinSemaine { get; set; }
    public bool ContientDiscours { get; set; }

    public string PeriodeLabel =>
        $"Semaine du {DateDebutSemaine:dd MMMM} au {DateFinSemaine:dd MMMM yyyy}";

    public string TypeLabel => ContientDiscours ? "Avec discours" : "Programme standard";
}
