using System.Windows;
using JWScheduler.Desktop.Data;
using JWScheduler.Desktop.Services;
using JWScheduler.Desktop.ViewModels;
using JWScheduler.Desktop.ViewModels.Pages;
using Microsoft.Extensions.DependencyInjection;

namespace JWScheduler.Desktop;

public partial class App : Application
{
    public static IServiceProvider Services { get; private set; } = null!;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        var services = new ServiceCollection();

        services.AddSingleton<AppDbContext>();
        services.AddSingleton<EleveService>();
        services.AddSingleton<AffectationService>();
        services.AddSingleton<ProgrammeService>();

        services.AddSingleton<DashboardViewModel>();
        services.AddSingleton<StudentsViewModel>();
        services.AddSingleton<ProgrammesViewModel>();
        services.AddTransient<ScheduleViewModel>();
        services.AddSingleton<MainViewModel>(sp => new MainViewModel(
            sp.GetRequiredService<DashboardViewModel>(),
            sp.GetRequiredService<StudentsViewModel>(),
            sp.GetRequiredService<ProgrammesViewModel>(),
            () => sp.GetRequiredService<ScheduleViewModel>()));
        services.AddSingleton<MainWindow>();

        Services = services.BuildServiceProvider();

        using var db = Services.GetRequiredService<AppDbContext>();
        DatabaseInitializer.EnsureCreated(db);

        var mainWindow = Services.GetRequiredService<MainWindow>();
        mainWindow.DataContext = Services.GetRequiredService<MainViewModel>();
        mainWindow.Show();

        var mainVm = Services.GetRequiredService<MainViewModel>();
        if (mainVm.CurrentPage is DashboardViewModel dashboard)
            _ = dashboard.LoadAsync();
    }
}
