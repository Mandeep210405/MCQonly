# 🤝 Contributing to InternHub

Thank you for contributing to the InternHub project! This guide will help you understand how to contribute effectively.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Code Review](#code-review)
- [Reporting Issues](#reporting-issues)

---

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/intern_management_sttl.git
   ```
3. **Follow the SETUP_GUIDE.md**
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 🔄 Development Workflow

### Before Starting Work

1. Ensure your code is up to date:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Install dependencies:

   ```bash
   # Backend
   cd chatbot_service
   pip install -r requirements.txt

   # Frontend
   cd ../frontend
   npm install
   ```

3. Start all services:

   ```bash
   # Terminal 1 - Docker
   docker-compose up -d

   # Terminal 2 - Backend
   cd chatbot_service
   $env:PORT=8001; python app.py

   # Terminal 3 - Frontend
   cd frontend
   npm run dev
   ```

### Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/feature-name
   # or
   git checkout -b fix/bug-name
   # or
   git checkout -b docs/documentation-update
   ```

2. **Make your changes** in the appropriate directory:
   - Frontend changes: `frontend/`
   - Backend changes: `chatbot_service/`
   - Database changes: `schema.sql`
   - Documentation: Root level `.md` files

3. **Test your changes locally**:
   - Frontend: Browser testing
   - Backend: API testing
   - Database: Query testing

4. **Commit your changes**:
   ```bash
   git commit -m "feat: add new feature description"
   ```

---

## 📝 Code Standards

### Frontend (Next.js/React)

```javascript
// ✅ Good
- Use functional components with hooks
- Use descriptive variable names
- Add comments for complex logic
- Follow Next.js conventions
- Use TypeScript where possible

// ❌ Avoid
- Class components
- Single-letter variables
- Deeply nested code
- Hard-coded values
- Console.log in production code
```

**Example:**

```javascript
// Good
export default function UserCard({ userId, userName }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Fetch user data
  };

  return <div>{userName}</div>;
}
```

### Backend (FastAPI/Python)

```python
# ✅ Good
- Use type hints
- Follow PEP 8 style guide
- Use descriptive function names
- Add docstrings
- Handle exceptions properly

# ❌ Avoid
- Magic numbers
- Global variables
- Overly complex functions
- Print statements
- Missing error handling
```

**Example:**

```python
# Good
async def get_interns(department_id: str) -> List[InternSchema]:
    """
    Retrieve interns for a specific department.

    Args:
        department_id: UUID of the department

    Returns:
        List of interns in the department

    Raises:
        ValueError: If department_id is invalid
    """
    if not department_id:
        raise ValueError("Department ID is required")

    interns = await db.query(Intern).filter(
        Intern.department_id == department_id
    ).all()

    return interns
```

### Database

```sql
-- ✅ Good
- Use meaningful names for columns
- Add comments for complex logic
- Use appropriate data types
- Include constraints

-- ❌ Avoid
- Single-letter column names
- Mixed naming conventions (camelCase vs snake_case)
- Missing NOT NULL constraints
- Storing passwords in plain text
```

---

## 🔀 Branch Naming

Use the following format for branch names:

```
<type>/<description>

Types:
- feature/  : New feature
- fix/      : Bug fix
- docs/     : Documentation
- refactor/ : Code refactoring
- test/     : Tests
- chore/    : Build, CI/CD, etc

Examples:
- feature/add-chatbot-widget
- fix/auth-token-expiry
- docs/update-api-docs
- refactor/database-queries
- test/add-user-tests
```

---

## 💬 Commit Messages

Follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `style`: Formatting
- `chore`: Build, dependencies

### Examples

```
feat(chatbot): add SQL query generation endpoint

- Implement Vanna integration for natural language to SQL
- Add validation for generated queries
- Add error handling for failed queries

Closes #123
```

```
fix(auth): resolve token expiration issue

The JWT token was not being refreshed properly when nearly expired.
Now we check token expiry time and refresh before making requests.

Fixes #456
```

```
docs: update API documentation

- Add examples for chatbot endpoints
- Document environment variables
- Add troubleshooting section
```

---

## 🔀 Pull Request Process

### 1. Before Creating PR

```bash
# Update with latest changes
git fetch origin
git rebase origin/main

# Run tests
npm test           # Frontend
pytest             # Backend

# Check code quality
npm run lint       # Frontend
flake8 .          # Backend

# Build to check for errors
npm run build      # Frontend
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

On GitHub:

1. Click "New Pull Request"
2. Select your branch
3. Fill in the PR template:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Breaking change

## Testing

- [ ] Unit tests added
- [ ] Manual testing completed
- [ ] No regressions found

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated

## Related Issues

Fixes #123
Related to #456
```

### 4. Code Review

- Respond to reviewer comments
- Request re-review after making changes
- Be respectful and constructive

### 5. Merge

Once approved:

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Merge your PR
git merge feature/your-feature-name

# Push to main
git push origin main
```

---

## 🧪 Testing

### Frontend Tests

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- UserCard.test.js
```

### Backend Tests

```bash
# Run all tests
pytest

# Run specific test
pytest tests/test_app.py::test_health

# Run with coverage
pytest --cov=.
```

### Manual Testing

1. **Frontend**:
   - Test in multiple browsers
   - Test on mobile devices
   - Check console for errors

2. **Backend**:
   - Test with invalid inputs
   - Test with missing data
   - Check response times

3. **Integration**:
   - Test full user workflows
   - Check API requests in network tab
   - Verify database updates

---

## 👀 Code Review

### For Reviewers

- Be constructive and helpful
- Ask questions instead of making demands
- Praise good code
- Suggest improvements

### For Authors

- Don't take feedback personally
- Ask for clarification if needed
- Implement changes promptly
- Thank reviewers

### Review Checklist

- [ ] Code follows guidelines
- [ ] No obvious bugs
- [ ] Functions are well-documented
- [ ] Error handling is appropriate
- [ ] Performance is acceptable
- [ ] Tests are included
- [ ] No breaking changes

---

## 🐛 Reporting Issues

### Creating an Issue

Use the issue template:

```markdown
## Description

Clear description of the issue

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: Windows/macOS/Linux
- Browser: Chrome/Firefox/Safari
- Node version: 18.x
- Python version: 3.10.x

## Screenshots

If applicable, add screenshots

## Additional Context

Any other context
```

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Docs improvement
- `good first issue`: Good for newcomers
- `help wanted`: Need assistance
- `question`: Question from user

---

## 📚 Project Structure

```
intern_management_sttl/
├── chatbot_service/     # Backend (FastAPI)
├── frontend/           # Frontend (Next.js)
├── schema.sql         # Database schema
├── docker-compose.yml # Docker configuration
├── README.md          # Main documentation
├── SETUP_GUIDE.md     # Setup instructions
├── QUICKSTART.md      # Quick start guide
└── CONTRIBUTING.md    # This file
```

---

## 🚫 What NOT to Do

❌ **Don't**:

- Commit to main branch directly
- Push `.env` files or secrets
- Ignore linting errors
- Write untested code
- Make huge commits (split into logical chunks)
- Merge without review
- Rewrite git history of published commits
- Ignore code review comments

---

## ✨ Tips for Good Contributions

1. **Start small** - Fix a bug or add a small feature first
2. **Read the code** - Understand the codebase before changing
3. **Ask questions** - If unsure, ask in issues or PR comments
4. **Write tests** - Every feature should have tests
5. **Document changes** - Update docs when changing functionality
6. **Keep commits clean** - One logical change per commit
7. **Be responsive** - Respond quickly to feedback

---

## 🏆 Recognition

Contributors are recognized in:

- Commit history
- CONTRIBUTORS.md file
- Release notes
- Monthly team updates

---

## 📞 Questions?

- **Discord**: #dev-help channel
- **Email**: dev-team@company.com
- **Issues**: Create a GitHub issue
- **Discussion**: GitHub Discussions tab

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Happy contributing! 🎉**
