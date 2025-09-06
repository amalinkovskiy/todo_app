# PostgreSQL Test Database Management Script for Podman

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "setup")]
    [string]$Action
)

$CONTAINER_NAME = "postgres-test"
$DB_NAME = "todo_test"
$DB_USER = "testuser"
$DB_PASSWORD = "testpass"
$DB_PORT = "5433"

function Start-Database {
    Write-Host "Starting PostgreSQL test database..." -ForegroundColor Green
    
    # Check if container exists
    $exists = podman ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}"
    
    if ($exists -eq $CONTAINER_NAME) {
        # Container exists, start it
        podman start $CONTAINER_NAME
        Write-Host "PostgreSQL container started." -ForegroundColor Green
    } else {
        # Container doesn't exist, create and start it
        Write-Host "Creating new PostgreSQL container..." -ForegroundColor Yellow
        podman run --name $CONTAINER_NAME `
            -e POSTGRES_DB=$DB_NAME `
            -e POSTGRES_USER=$DB_USER `
            -e POSTGRES_PASSWORD=$DB_PASSWORD `
            -p ${DB_PORT}:5432 `
            -d postgres:15
        Write-Host "PostgreSQL container created and started." -ForegroundColor Green
    }
    
    Write-Host "Connection string: postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" -ForegroundColor Cyan
}

function Stop-Database {
    Write-Host "Stopping PostgreSQL test database..." -ForegroundColor Yellow
    podman stop $CONTAINER_NAME
    Write-Host "PostgreSQL container stopped." -ForegroundColor Green
}

function Restart-Database {
    Write-Host "Restarting PostgreSQL test database..." -ForegroundColor Yellow
    podman restart $CONTAINER_NAME
    Write-Host "PostgreSQL container restarted." -ForegroundColor Green
}

function Get-DatabaseStatus {
    Write-Host "PostgreSQL Test Database Status:" -ForegroundColor Cyan
    podman ps -a --filter "name=$CONTAINER_NAME"
}

function Get-DatabaseLogs {
    Write-Host "PostgreSQL Test Database Logs:" -ForegroundColor Cyan
    podman logs $CONTAINER_NAME
}

function Setup-Database {
    Write-Host "Setting up PostgreSQL test environment..." -ForegroundColor Green
    
    # Start Podman machine if needed
    $machineStatus = podman machine list --format "{{.Running}}"
    if ($machineStatus -ne "true") {
        Write-Host "Starting Podman machine..." -ForegroundColor Yellow
        podman machine start
    }
    
    # Start database
    Start-Database
    
    # Wait for database to be ready
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "Database setup complete!" -ForegroundColor Green
    Write-Host "You can now run: npm run test:api" -ForegroundColor Cyan
}

switch ($Action) {
    "start" { Start-Database }
    "stop" { Stop-Database }
    "restart" { Restart-Database }
    "status" { Get-DatabaseStatus }
    "logs" { Get-DatabaseLogs }
    "setup" { Setup-Database }
}
