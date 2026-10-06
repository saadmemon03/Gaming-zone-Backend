# API integration tests

These tests call a running API and use an admin account. Configure them with a
dedicated, non-production test environment before running:

```powershell
$env:API_BASE_URL = "http://localhost:5000"
$env:TEST_ADMIN_EMAIL = "admin@example.test"
$env:TEST_ADMIN_PASSWORD = "your-test-password"
npm run test:integration
```

The booking test creates a booking and deletes it after a successful creation.
Do not point these tests at production or a shared environment.
