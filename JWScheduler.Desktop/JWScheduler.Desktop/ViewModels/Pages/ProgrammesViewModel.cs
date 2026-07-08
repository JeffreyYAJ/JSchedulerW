using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using JWScheduler.Desktop.Helpers;
using JWScheduler.Desktop.Models;
using JWScheduler.Desktop.Services;

namespace JWScheduler.Desktop.ViewModels.Pages;

public partial class ProgrammesViewModel : ObservableObject
{
    private readonly ProgrammeService _programmeService;

    public Action<int>? OpenSchedule { get; set; }

    public ObservableCollection<Programme> Programmes { get; } = new();

    [ObservableProperty] private bool _isLoading;
    [ObservableProperty] private bool _isCreateDialogOpen;
    [ObservableProperty] private bool _isSubmitting;
    [ObservableProperty] private DateTime? _dateDebut = DateTime.Today;
    [ObservableProperty] private DateTime? _dateFin = DateTime.Today.AddDays(6);
    [ObservableProperty] private bool _contientDiscours;

    public ProgrammesViewModel(ProgrammeService programmeService) =>
        _programmeService = programmeService;

    public async Task LoadAsync()
    {
        IsLoading = true;
        try
        {
            var data = await _programmeService.GetAllAsync();
            Programmes.Clear();
            foreach (var p in data)
                Programmes.Add(p);
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

    [RelayCommand]
    private void OpenCreateDialog()
    {
        DateDebut = DateTime.Today;
        DateFin = DateTime.Today.AddDays(6);
        ContientDiscours = false;
        IsCreateDialogOpen = true;
    }

    [RelayCommand]
    private void CloseCreateDialog() => IsCreateDialogOpen = false;

    [RelayCommand]
    private async Task CreateProgrammeAsync()
    {
        if (DateDebut is null || DateFin is null)
        {
            DialogHelper.ShowError("Les dates de début et de fin sont requises.");
            return;
        }

        IsSubmitting = true;
        try
        {
            await _programmeService.CreateAsync(DateDebut.Value, DateFin.Value, ContientDiscours);
            IsCreateDialogOpen = false;
            await LoadAsync();
        }
        catch (Exception ex)
        {
            DialogHelper.ShowError(ex.Message);
        }
        finally
        {
            IsSubmitting = false;
        }
    }

    [RelayCommand]
    private async Task GenererSemainesAsync()
    {
        if (!DialogHelper.Confirm("Générer 8 semaines automatiquement à partir d'aujourd'hui ?"))
            return;

        try
        {
            var count = await _programmeService.GenererSemainesAsync(DateTime.Today, 8);
            DialogHelper.ShowInfo($"{count} semaines générées avec succès !");
            await LoadAsync();
        }
        catch (Exception ex)
        {
            DialogHelper.ShowError(ex.Message);
        }
    }

    [RelayCommand]
    private void OpenProgramme(Programme programme) => OpenSchedule?.Invoke(programme.Id);
}
