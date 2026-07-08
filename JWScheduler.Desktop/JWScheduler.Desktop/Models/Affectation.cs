namespace JWScheduler.Desktop.Models;

public class Affectation
{
    public int Id { get; set; }
    public int IdProgramme { get; set; }
    public int IdEleve { get; set; }
    public string TypeExpose { get; set; } = string.Empty;
    public string Role { get; set; } = "Titulaire";

    public Programme? Programme { get; set; }
    public Eleve? Eleve { get; set; }
}

public class AffectationDetail
{
    public int AffectationId { get; set; }
    public string TypeExpose { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int EleveId { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
}

public class AffectationRequest
{
    public int IdProgramme { get; set; }
    public int IdEleve { get; set; }
    public string TypeExpose { get; set; } = string.Empty;
    public string Role { get; set; } = "Titulaire";
}
