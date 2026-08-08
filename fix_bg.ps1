
$files = @(
  'src\screens\GameScreen.tsx',
  'src\screens\OnlineGameScreen.tsx',
  'src\screens\OnlineLobbyScreen.tsx',
  'src\screens\RoomLobbyScreen.tsx',
  'src\screens\SettingsScreen.tsx',
  'src\screens\TournamentGameScreen.tsx',
  'src\screens\TournamentScreen.tsx'
)

foreach ($file in $files) {
  $content = Get-Content $file -Raw
  if (-not ($content -match 'const BG = {')) {
    $content = $content -replace 'export default function', "const BG = { football: require('../../assets/images/football_bg.jpg'), cinema: require('../../assets/images/cinema_bg.jpg'), music: require('../../assets/images/music_bg.jpg') };

export default function"
  }
  
  $content = $content -replace "require\('\.\./\.\./assets/images/football_bg\.jpg'\)", "(BG[(route.params?.categoryId || 'football') as keyof typeof BG] || BG.football)"
  
  Set-Content $file $content
}

