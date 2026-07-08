using System.Windows;

namespace JWScheduler.Desktop.Helpers;

public static class DialogHelper
{
    public static void ShowError(string message) =>
        MessageBox.Show(message, "JW Scheduler", MessageBoxButton.OK, MessageBoxImage.Error);

    public static void ShowInfo(string message) =>
        MessageBox.Show(message, "JW Scheduler", MessageBoxButton.OK, MessageBoxImage.Information);

    public static bool Confirm(string message) =>
        MessageBox.Show(message, "JW Scheduler", MessageBoxButton.YesNo, MessageBoxImage.Question) == MessageBoxResult.Yes;
}
