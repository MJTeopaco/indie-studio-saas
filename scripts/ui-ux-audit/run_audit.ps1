$SkillScript = "e:\PROGRAMMING\Thesis\Project\indie-studio-saas\.agents\skills\ui-ux-pro-max\scripts\search.py"
$OutDir = "e:\PROGRAMMING\Thesis\Project\indie-studio-saas\scripts\ui-ux-audit\raw"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "Running 1. Master Design System..."
python $SkillScript "AI SaaS project studio management tech dashboard" --design-system -f markdown -p "Vaultera Labs" | Out-File -FilePath "$OutDir\01_design_system.md" -Encoding utf8

Write-Host "Running 2. Domain: Style..."
python $SkillScript "modern saas dark mode glassmorphism dashboard" --domain style -n 5 | Out-File -FilePath "$OutDir\02_style.md" -Encoding utf8

Write-Host "Running 3. Domain: Color..."
python $SkillScript "saas tech dark midnight slates vibrant accents" --domain color -n 5 | Out-File -FilePath "$OutDir\03_color.md" -Encoding utf8

Write-Host "Running 4. Domain: Typography..."
python $SkillScript "tech modern sleek professional sans" --domain typography -n 5 | Out-File -FilePath "$OutDir\04_typography.md" -Encoding utf8

Write-Host "Running 5. Domain: UX..."
python $SkillScript "dashboard modal kanban drag drop cpa gantt animation" --domain ux -n 8 | Out-File -FilePath "$OutDir\05_ux.md" -Encoding utf8

Write-Host "Running 6. Domain: Chart..."
python $SkillScript "sprint velocity timeline task comparison status" --domain chart -n 5 | Out-File -FilePath "$OutDir\06_chart.md" -Encoding utf8

Write-Host "Running 7. Domain: Landing..."
python $SkillScript "saas studio hero features interactive demo" --domain landing -n 5 | Out-File -FilePath "$OutDir\07_landing.md" -Encoding utf8

Write-Host "Running 8. Domain: Icons..."
python $SkillScript "lucide phosphor tech dashboard action" --domain icons -n 5 | Out-File -FilePath "$OutDir\08_icons.md" -Encoding utf8

Write-Host "All audit queries completed and saved to $OutDir as UTF-8."
