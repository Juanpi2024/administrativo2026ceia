
$path = "c:\Users\ALUMNO\administrativo2026\src\App.jsx"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Regex to fix any variation of the encoding artifact in that specific comment
$content = $content -replace "\{/\* PIE DE P.*?GINA FIJO \*/\}", "{/* PIE DE PÁGINA FIJO */}"

Set-Content -Path $path -Value $content -Encoding UTF8
