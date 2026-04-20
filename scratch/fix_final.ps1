
$path = "c:\Users\ALUMNO\administrativo2026\src\App.jsx"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Fix the redundant closing tags
$content = $content.Replace(")}      )}", ")}")

# Fix the encoding artifact in the comment
# We'll use a regex to find the line and replace it, or just a string replace if we know the exact artifact
# Based on previous output, it's "PIE DE PÃ GINA FIJO" or "PIE DE Pǟ?GINA FIJO" or "PIE DE P?GINA FIJO"
# I'll just look for the comment start and end on that line
$content = $content.Replace("{/* PIE DE PÃ GINA FIJO */}", "{/* PIE DE PÁGINA FIJO */}")
$content = $content.Replace("{/* PIE DE P?GINA FIJO */}", "{/* PIE DE PÁGINA FIJO */}")

Set-Content -Path $path -Value $content -Encoding UTF8
