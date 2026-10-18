# Testing (always apply)
- Backend: JUnit 5 + AssertJ. Unit-test services; @WebMvcTest for controllers;
  Testcontainers Postgres for repository/integration tests.
- Never call real Gemini or Fact Check APIs in tests — mock the interfaces or use WireMock.
- Frontend: Vitest + Testing Library; query by role/label, not by CSS class.
- Every bug fix gets a test that would have caught it.