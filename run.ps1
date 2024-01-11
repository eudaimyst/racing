Set-Location client
Start-Process powershell {npm run start}
Set-Location ..\server
Start-Process powershell {npm run start}