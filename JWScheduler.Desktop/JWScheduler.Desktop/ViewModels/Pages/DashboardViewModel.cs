using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using JWScheduler.Desktop.Helpers;
using JWScheduler.Desktop.Models;
using JWScheduler.Desktop.Services;

namespace JWScheduler.Desktop.ViewModels.Pages;

public partial class DashboardViewModel : ObservableObject
{
    private readonly EleveService _eleveService;
    private readonly ProgrammeService _programmeService;

    public Action? NavigateToProgrammes { get; set; }
    public Action<int>? NavigateToSchedule { get; set; }

    [ObservableProperty] private bool _isLoading;
    [ObservableProperty] private int _totalEleves;
    [ObservableProperty] private int _alertesCount;

    public ObservableCollection<Eleve> PriorityStudents { get; } = new();
    public ObservableCollection<Programme> UpcomingWeeks { get; } = new();

    public DashboardViewModel(EleveService eleveService, ProgrammeService programmeService)
    {
        _eleveService = eleveService;
        _programmeService = programmeService;
    }

    public async Task LoadAsync()
    {
        IsLoading = true;
        try
        {
            var all = await _eleveService.GetAllAsync();
            var prioritaires = await _eleveService.GetPrioritairesAsync();
            var programmes = await _programmeService.GetAllAsync();

            TotalEleves = all.Count;
            AlertesCount = prioritaires.Count;

            PriorityStudents.Clear();
            foreach (var e in prioritaires.Take(5))
                PriorityStudents.Add(e);

            UpcomingWeeks.Clear();
            foreach (var p in programmes
                         .Where(p => p.DateDebutSemaine.Date >= DateTime.Today)
                         .OrderBy(p => p.DateDebutSemaine)
                         .Take(3))
                UpcomingWeeks.Add(p);
        }
        catch (Exception ex)
        {
            DialogHelper.ShowError($"Erreur lors du chargement : {ex.Message}");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void GoToProgrammes() => NavigateToProgrammes?.Invoke();

    [RelayCommand]
    private void OpenSchedule(Programme programme) => NavigateToSchedule?.Invoke(programme.Id);
}
