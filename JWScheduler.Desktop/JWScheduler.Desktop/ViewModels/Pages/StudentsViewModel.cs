using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using JWScheduler.Desktop.Helpers;
using JWScheduler.Desktop.Models;
using JWScheduler.Desktop.Services;

namespace JWScheduler.Desktop.ViewModels.Pages;

public partial class StudentsViewModel : ObservableObject
{
    private readonly EleveService _eleveService;

    public ObservableCollection<Eleve> Students { get; } = new();

    [ObservableProperty] private bool _isLoading;
    [ObservableProperty] private bool _isAddDialogOpen;
    [ObservableProperty] private Eleve? _studentToDelete;
    [ObservableProperty] private string _newNom = string.Empty;
    [ObservableProperty] private string _newGenre = string.Empty;
    [ObservableProperty] private DateTime? _newDateDernierExpose;

    public StudentsViewModel(EleveService eleveService) => _eleveService = eleveService;

    public async Task LoadAsync()
    {
        IsLoading = true;
        try
        {
            var data = await _eleveService.GetAllAsync();
            Students.Clear();
            foreach (var s in data)
                Students.Add(s);
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
    private void OpenAddDialog()
    {
        NewNom = string.Empty;
        NewGenre = string.Empty;
        NewDateDernierExpose = null;
        IsAddDialogOpen = true;
    }

    [RelayCommand]
    private void CloseAddDialog() => IsAddDialogOpen = false;

    [RelayCommand]
    private async Task AddStudentAsync()
    {
        try
        {
            await _eleveService.AddAsync(NewNom, NewGenre, NewDateDernierExpose);
            IsAddDialogOpen = false;
            await LoadAsync();
        }
        catch (Exception ex)
        {
            DialogHelper.ShowError(ex.Message);
        }
    }

    [RelayCommand]
    private void RequestDelete(Eleve eleve) => StudentToDelete = eleve;

    [RelayCommand]
    private void CancelDelete() => StudentToDelete = null;

    [RelayCommand]
    private async Task ConfirmDeleteAsync()
    {
        if (StudentToDelete is null) return;
        try
        {
            await _eleveService.DeleteAsync(StudentToDelete.Id);
            StudentToDelete = null;
            await LoadAsync();
        }
        catch (Exception ex)
        {
            DialogHelper.ShowError(ex.Message);
        }
    }
}
