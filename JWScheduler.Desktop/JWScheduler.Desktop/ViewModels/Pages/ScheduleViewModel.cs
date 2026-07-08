using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using JWScheduler.Desktop.Helpers;
using JWScheduler.Desktop.Models;
using JWScheduler.Desktop.Services;

namespace JWScheduler.Desktop.ViewModels.Pages;

public partial class ScheduleViewModel : ObservableObject
{
    private readonly EleveService _eleveService;
    private readonly ProgrammeService _programmeService;
    private readonly AffectationService _affectationService;

    private int _programmeId;
    private List<Eleve> _allStudents = new();
    private HashSet<int> _priorityIds = new();
    private readonly Dictionary<string, int?> _selections = new();

    [ObservableProperty] private Programme? _programme;
    [ObservableProperty] private bool _isLoading;
    [ObservableProperty] private bool _isSaving;
    [ObservableProperty] private string _activeSlot = "Lecture";
    [ObservableProperty] private bool _sketch3IsDiscours;

    public ObservableCollection<AffectationDetail> ExistingAffectations { get; } = new();
    public ObservableCollection<SlotAssignmentViewModel> CurrentSlots { get; } = new();

    public List<string> SlotTypes { get; } = ["Lecture", "Sketch 1", "Sketch 2", "Sketch 3"];

    public ScheduleViewModel(
        EleveService eleveService,
        ProgrammeService programmeService,
        AffectationService affectationService)
    {
        _eleveService = eleveService;
        _programmeService = programmeService;
        _affectationService = affectationService;
    }

    public void Initialize(int programmeId)
    {
        _programmeId = programmeId;
        _selections.Clear();
    }

    public async Task LoadAsync()
    {
        IsLoading = true;
        try
        {
            Programme = await _programmeService.GetByIdAsync(_programmeId)
                ?? throw new KeyNotFoundException("Programme introuvable.");

            Sketch3IsDiscours = Programme.ContientDiscours;
            _allStudents = await _eleveService.GetAllAsync();
            _priorityIds = (await _eleveService.GetPrioritairesAsync()).Select(p => p.Id).ToHashSet();

            ExistingAffectations.Clear();
            foreach (var a in await _affectationService.GetByProgrammeAsync(_programmeId))
                ExistingAffectations.Add(a);

            RefreshSlots();
        }
        catch (Exception ex)
        {
            DialogHelper.ShowError(ex.Message);
        }
        finally
        {
            IsLoading = false;
        }
    }

    partial void OnActiveSlotChanged(string value) => RefreshSlots();

    partial void OnSketch3IsDiscoursChanged(bool value) => RefreshSlots();

    private static string Key(string typeExpose, string role) => $"{typeExpose}|{role}";

    private void RefreshSlots()
    {
        CurrentSlots.Clear();
        foreach (var def in BuildSlotDefinitions())
        {
            var selectionKey = Key(def.TypeExpose, def.Role);
            if (!_selections.ContainsKey(selectionKey))
                _selections[selectionKey] = null;

            var vm = new SlotAssignmentViewModel
            {
                SelectionKey = selectionKey,
                Label = def.Label,
                Rule = def.Rule,
                TypeExpose = def.TypeExpose,
                Role = def.Role,
                SelectedEleveId = _selections[selectionKey],
                AvailableStudents = BuildStudentGroups(def),
                FlatStudents = BuildStudentGroups(def).SelectMany(g => g.Eleves).ToList()
            };

            vm.SelectionChanged = id =>
            {
                _selections[selectionKey] = id;
                RefreshSlots();
            };

            CurrentSlots.Add(vm);
        }
    }

    private IEnumerable<(string Label, string Rule, string TypeExpose, string Role)> BuildSlotDefinitions()
    {
        if (ActiveSlot == "Lecture")
        {
            yield return ("Lecteur", "Uniquement des hommes", "Lecture", "Titulaire");
            yield break;
        }

        if (ActiveSlot is "Sketch 1" or "Sketch 2")
        {
            yield return ("Élève 1", "Sélectionner le premier élève", ActiveSlot, "Titulaire");
            yield return ("Élève 2", "Doit être du même sexe que l'élève 1", ActiveSlot, "Partenaire");
            yield break;
        }

        if (ActiveSlot == "Sketch 3")
        {
            if (Sketch3IsDiscours || Programme?.ContientDiscours == true)
                yield return ("Orateur (Discours)", "Uniquement des hommes", "Discours", "Titulaire");
            else
            {
                yield return ("Élève 1 (Sketch 3)", "Sélectionner le premier élève", "Sketch 3", "Titulaire");
                yield return ("Élève 2 (Sketch 3)", "Doit être du même sexe que l'élève 1", "Sketch 3", "Partenaire");
            }
        }
    }

    private List<EleveOptionGroup> BuildStudentGroups((string Label, string Rule, string TypeExpose, string Role) def)
    {
        var selectedIds = _selections.Values.Where(v => v.HasValue).Select(v => v!.Value).ToHashSet();
        var currentKey = Key(def.TypeExpose, def.Role);
        var currentSelection = _selections.GetValueOrDefault(currentKey);

        IEnumerable<Eleve> filtered = _allStudents;

        if (def.TypeExpose is "Lecture" or "Discours")
            filtered = filtered.Where(e => e.Genre == "H");

        if (def.Role == "Partenaire")
        {
            var titulaireId = _selections.GetValueOrDefault(Key(def.TypeExpose, "Titulaire"));
            if (titulaireId.HasValue)
            {
                var titulaire = _allStudents.FirstOrDefault(e => e.Id == titulaireId.Value);
                if (titulaire is not null)
                    filtered = filtered.Where(e => e.Genre == titulaire.Genre && e.Id != titulaire.Id);
            }
        }

        var list = filtered
            .Where(e => !selectedIds.Contains(e.Id) || currentSelection == e.Id)
            .ToList();

        var groups = new List<EleveOptionGroup>();
        var priority = list.Where(e => _priorityIds.Contains(e.Id)).ToList();
        var others = list.Where(e => !_priorityIds.Contains(e.Id)).ToList();
        if (priority.Count > 0) groups.Add(new EleveOptionGroup("Élèves prioritaires", priority));
        if (others.Count > 0) groups.Add(new EleveOptionGroup("Autres élèves éligibles", others));
        return groups;
    }

    [RelayCommand]
    private void SelectSlot(string slot) => ActiveSlot = slot;

    [RelayCommand]
    private async Task SaveAsync()
    {
        var payloads = _selections
            .Where(kvp => kvp.Value.HasValue)
            .Select(kvp =>
            {
                var parts = kvp.Key.Split('|');
                return new AffectationRequest
                {
                    IdProgramme = _programmeId,
                    IdEleve = kvp.Value!.Value,
                    TypeExpose = parts[0],
                    Role = parts.Length > 1 ? parts[1] : "Titulaire"
                };
            })
            .ToList();

        if (payloads.Count == 0)
        {
            DialogHelper.ShowError("Aucune affectation à enregistrer.");
            return;
        }

        IsSaving = true;
        try
        {
            foreach (var request in payloads)
                await _affectationService.AssignerAsync(request);

            DialogHelper.ShowInfo("Affectations enregistrées avec succès !");
            _selections.Clear();
            await LoadAsync();
        }
        catch (Exception ex)
        {
            DialogHelper.ShowError(ex.Message);
        }
        finally
        {
            IsSaving = false;
        }
    }
}

public partial class SlotAssignmentViewModel : ObservableObject
{
    public string SelectionKey { get; init; } = string.Empty;
    public Action<int?>? SelectionChanged { get; init; }

    [ObservableProperty] private string _label = string.Empty;
    [ObservableProperty] private string _rule = string.Empty;
    [ObservableProperty] private string _typeExpose = string.Empty;
    [ObservableProperty] private string _role = "Titulaire";
    [ObservableProperty] private int? _selectedEleveId;
    [ObservableProperty] private List<EleveOptionGroup> _availableStudents = new();
    [ObservableProperty] private List<Eleve> _flatStudents = new();

    partial void OnSelectedEleveIdChanged(int? value) => SelectionChanged?.Invoke(value);
}

public record EleveOptionGroup(string Header, List<Eleve> Eleves);
