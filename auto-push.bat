@echo off
echo.
echo ========================================
echo    LinkJoy Vault - Auto Push Script
echo ========================================
echo.

echo Adding all files...
git add .

echo.
echo Committing changes...
git commit -m "Auto commit: %date% %time%"

echo.
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo    Push completed successfully!
echo ========================================
echo.
pause 