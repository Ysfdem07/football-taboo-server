# Stop the script if any command fails
$ErrorActionPreference = "Stop"

$workspaceDir = "C:\Users\ysfde\OneDrive\Desktop\AntiGravity App\FootballTaboo"
$buildDir = "C:\ft_build"

Write-Host "1. Cleaning up old build directory if exists..."
if (Test-Path $buildDir) {
    Remove-Item -Path $buildDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "2. Creating build directories..."
New-Item -Path $buildDir -ItemType Directory -Force
New-Item -Path "$buildDir\assets" -ItemType Directory -Force
New-Item -Path "$buildDir\src" -ItemType Directory -Force

Write-Host "3. Copying source files..."
Copy-Item -Path "$workspaceDir\App.tsx" -Destination $buildDir
Copy-Item -Path "$workspaceDir\app.json" -Destination $buildDir
Copy-Item -Path "$workspaceDir\eas.json" -Destination $buildDir
Copy-Item -Path "$workspaceDir\google-services.json" -Destination $buildDir
Copy-Item -Path "$workspaceDir\index.ts" -Destination $buildDir
Copy-Item -Path "$workspaceDir\metro.config.js" -Destination $buildDir
Copy-Item -Path "$workspaceDir\package.json" -Destination $buildDir
Copy-Item -Path "$workspaceDir\package-lock.json" -Destination $buildDir
Copy-Item -Path "$workspaceDir\tsconfig.json" -Destination $buildDir

Write-Host "Copying assets folder..."
Copy-Item -Path "$workspaceDir\assets\*" -Destination "$buildDir\assets" -Recurse

Write-Host "Copying src folder..."
Copy-Item -Path "$workspaceDir\src\*" -Destination "$buildDir\src" -Recurse

Write-Host "4. Running npm install in short path..."
Set-Location -Path $buildDir
npm install

Write-Host "5. Running expo prebuild in short path..."
npx expo prebuild --platform android --clean

Write-Host "6. Compiling Android app using Gradle..."
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'
$env:ANDROID_HOME = 'C:\Users\ysfde\AppData\Local\Android\Sdk'
$env:Path = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot\bin;C:\Users\ysfde\AppData\Local\Android\Sdk\platform-tools;C:\Users\ysfde\AppData\Local\Android\Sdk\emulator;' + $env:Path

Set-Location -Path "$buildDir\android"
.\gradlew assembleRelease

Write-Host "7. Copying generated APK back to workspace..."
if (Test-Path "$buildDir\android\app\build\outputs\apk\release\app-release.apk") {
    Copy-Item -Path "$buildDir\android\app\build\outputs\apk\release\app-release.apk" -Destination "$workspaceDir\app-release.apk" -Force
    Write-Host "SUCCESS: APK successfully compiled and copied to $workspaceDir\app-release.apk"
} else {
    Write-Error "ERROR: Compiled APK not found in build directory!"
}
