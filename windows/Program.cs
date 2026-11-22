using System.Diagnostics;

var root = AppContext.BaseDirectory;
var gamePage = Path.Combine(root, "game", "index.html");
if (!File.Exists(gamePage)) return;

var profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Soupostat", "EdgeProfile");
Directory.CreateDirectory(profile);
var gameUrl = new Uri(gamePage).AbsoluteUri;

var edge = FindEdge();
if (edge is not null)
{
    Process.Start(new ProcessStartInfo
    {
        FileName = edge,
        UseShellExecute = false,
        ArgumentList = { $"--app={gameUrl}", $"--user-data-dir={profile}", "--no-first-run" }
    });
}
else
{
    Process.Start(new ProcessStartInfo(gameUrl) { UseShellExecute = true });
}

static string? FindEdge()
{
    var candidates = new[]
    {
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft", "Edge", "Application", "msedge.exe")
    };
    return candidates.FirstOrDefault(File.Exists);
}
