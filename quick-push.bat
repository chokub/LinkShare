@echo off
echo Auto pushing to GitHub...
git add .
git commit -m "Quick update: %date% %time%"
git push
echo Done! 