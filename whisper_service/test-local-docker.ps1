# Quick script to test Docker container locally before Azure deployment
# Run this from the whisper_service directory

Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t onscene-whisper:test .

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nStarting container..." -ForegroundColor Green
    docker run -p 5000:5000 `
        -e ENVIRONMENT=development `
        -e MAX_FILE_SIZE_MB=25 `
        onscene-whisper:test
    
    Write-Host "`nTest the service at: http://localhost:5000/health" -ForegroundColor Cyan
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}
