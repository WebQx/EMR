# Clean Emojis Script - Replace all emojis with professional text in index.html

$filePath = "c:\Users\na210\OneDrive\Documents\GitHub\webqx\index.html"

# Read the file content
$content = Get-Content $filePath -Raw

# Define emoji replacements (emoji -> professional text)
$replacements = @{
    '👥' = 'PT'
    '👨‍⚕️' = 'MD'
    '🎥' = 'VIDEO'
    '📅' = 'CAL'
    '🧪' = 'LAB'
    '📊' = 'DATA'
    '💊' = 'RX'
    '🌍' = 'GLOBAL'
    '📱' = 'MOBILE'
    '🤖' = 'AI'
    '🎯' = 'TARGET'
    '🚀' = 'LAUNCH'
    '✅' = 'SUCCESS'
    '❌' = 'ERROR'
    '⚠️' = 'WARN'
    '🔍' = 'SEARCH'
    '📋' = 'LIST'
    '🏥' = 'HOSP'
    '📹' = 'VIDEO'
    '🎤' = 'MIC'
    '📄' = 'DOC'
    '📦' = 'PKG'
    '🔧' = 'TOOL'
    '📝' = 'NOTE'
    '👤' = 'USER'
}

# Apply replacements
foreach ($emoji in $replacements.Keys) {
    $replacement = $replacements[$emoji]
    $content = $content -replace [regex]::Escape($emoji), $replacement
}

# Write back to file
Set-Content $filePath $content -Encoding UTF8

Write-Host "SUCCESS: All emojis replaced with professional text in index.html" -ForegroundColor Green
