using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using JWScheduler.Desktop.Services;
using JWScheduler.Desktop.ViewModels.Pages;

namespace JWScheduler.Desktop.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly DashboardViewModel _dashboard;
    private readonly StudentsViewModel _students;
    private readonly ProgrammesViewModel _programmes;
    private readonly Func<ScheduleViewModel> _scheduleFactory;

    [ObservableProperty]
    private ObservableObject? _currentPage;

    [ObservableProperty]
    private string _currentPageKey = "dashboard";

    public MainViewModel(
        DashboardViewModel dashboard,
        StudentsViewModel students,
        ProgrammesViewModel programmes,
        Func<ScheduleViewModel> scheduleFactory)
    {
        _dashboard = dashboard;
        _students = students;
        _programmes = programmes;
        _scheduleFactory = scheduleFactory;

        _dashboard.NavigateToProgrammes = NavigateProgrammes;
        _dashboard.NavigateToSchedule = NavigateSchedule;
        _programmes.OpenSchedule = NavigateSchedule;

        CurrentPage = _dashboard;
    }

    [RelayCommand]
    private void NavigateDashboard()
    {
        CurrentPageKey = "dashboard";
        CurrentPage = _dashboard;
        _ = _dashboard.LoadAsync();
    }

    [RelayCommand]
    private void NavigateStudents()
    {
        CurrentPageKey = "students";
        CurrentPage = _students;
        _ = _students.LoadAsync();
    }

    [RelayCommand]
    public void NavigateProgrammes()
    {
        CurrentPageKey = "programmes";
        CurrentPage = _programmes;
        _ = _programmes.LoadAsync();
    }

    public void NavigateSchedule(int programmeId)
    {
        var schedule = _scheduleFactory();
        schedule.Initialize(programmeId);
        CurrentPageKey = "schedule";
        CurrentPage = schedule;
        _ = schedule.LoadAsync();
    }
}
