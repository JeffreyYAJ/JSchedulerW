# JW Scheduler — Desktop (WPF)

Version C# / WPF de l'application **Ordonnanceur**, convertie depuis la stack Electron + React.

## Stack

- **.NET 8** — WPF (Windows uniquement)
- **Entity Framework Core 8** — SQLite
- **CommunityToolkit.Mvvm** — MVVM
- **Microsoft.Extensions.DependencyInjection** — injection de dépendances

## Prérequis

- Windows 10/11
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Visual Studio 2022 (workload « Développement .NET desktop ») ou VS Code + CLI

## Lancer en développement

```powershell
cd JWScheduler.Desktop
dotnet restore
dotnet run --project JWScheduler.Desktop
```

## Publier (exécutable Windows)

```powershell
cd JWScheduler.Desktop
dotnet publish JWScheduler.Desktop -c Release -r win-x64 --self-contained false
```

L'exécutable se trouve dans :
`JWScheduler.Desktop\bin\Release\net8.0-windows\win-x64\publish\`

## Base de données

SQLite stockée dans :
```
%LOCALAPPDATA%\JWScheduler\database.db
```

Le schéma est compatible avec l'application Electron d'origine (`Eleves`, `Programmes`, `Affectations`).

## Structure du projet

```
JWScheduler.Desktop/
├── Data/           AppDbContext, initialisation SQLite
├── Models/         Eleve, Programme, Affectation
├── Services/       Logique métier (affectations, génération auto)
├── ViewModels/     MVVM — navigation + pages
├── Views/          Interfaces XAML
└── Assets/         Logo application
```

## Fonctionnalités

| Page | Description |
|------|-------------|
| **Dashboard** | Effectif, alertes prioritaires, prochaines semaines |
| **Élèves** | CRUD élèves (nom, genre H/F, date dernier exposé) |
| **Programmes** | Création de semaines, génération auto (8 semaines) |
| **Ordonnancement** | Affectation Lecture / Sketchs / Discours avec règles de genre |

## Règles métier (identiques à l'app JS)

- Lecture et Discours : réservés aux hommes (H)
- Sketchs : binômes du même genre (H/H ou F/F), max 2 personnes
- Discours vs Sketch 3 : selon le flag `contient_discours` du programme
- Élèves prioritaires : pas d'exposé depuis 3 mois
