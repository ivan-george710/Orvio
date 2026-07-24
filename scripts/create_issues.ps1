# Ensure GitHub CLI is available
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI (gh) is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Ensure you're authenticated
$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "You are not logged into GitHub." -ForegroundColor Yellow
    Write-Host "Run: gh auth login"
    exit 1
}

$issues = @(
    @{
        Title="US-01: View User Profile"
        Labels="feature,frontend,backend"
        Body=@"
## User Story

As a user,
I want to view my profile,
so that I can verify my account information.

## Acceptance Criteria

- [ ] Profile page loads successfully
- [ ] User details are displayed
- [ ] Only the logged-in user can access their profile
"@
    },
    @{
        Title="US-02: Update Profile"
        Labels="feature,frontend,backend"
        Body=@"
## User Story

As a user,
I want to update my profile,
so that my information stays current.

## Acceptance Criteria

- [ ] User can edit profile
- [ ] Validation is performed
- [ ] Changes are saved successfully
"@
    },
    @{
        Title="US-03: Browse Events"
        Labels="feature,frontend"
        Body=@"
## User Story

As a participant,
I want to browse events,
so that I can discover events.

## Acceptance Criteria

- [ ] Events are displayed
- [ ] Empty state shown if none exist
- [ ] Pagination works
"@
    }
)

foreach ($issue in $issues) {
    Write-Host "Creating $($issue.Title)..."

    gh issue create `
        --title $issue.Title `
        --label $issue.Labels `
        --body $issue.Body
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green