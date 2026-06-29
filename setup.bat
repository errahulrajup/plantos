@echo off
echo ====================================================
echo PlantOS Enterprise Platform - v0.1.0-alpha Setup
echo ====================================================

echo [1/3] Installing Platform dependencies...
cd platform/core
call npm install
cd ../studio
call npm install
cd ../operator
call npm install
cd ../..

echo [2/3] Running Architecture Fitness Tests...
node ../test-architecture.js
if %errorlevel% neq 0 exit /b %errorlevel%

echo [3/3] Compiling Reference Packages...
node ../validate-demo-plant.js
if %errorlevel% neq 0 exit /b %errorlevel%

echo ====================================================
echo SUCCESS: PlantOS 0.1.0-alpha is ready for execution.
echo ====================================================
