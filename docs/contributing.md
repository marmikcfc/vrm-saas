# Contributing to VRM Platform

We welcome contributions to the VRM Platform! This guide will help you get started with contributing code, documentation, and other improvements.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/vrm-platform.git
   cd vrm-platform
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/original-org/vrm-platform.git
   ```

4. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

5. **Set up environment:**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   # Configure your environment variables
   ```

6. **Start development servers:**
   ```bash
   npm run dev:full
   ```

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, focused commits

3. **Keep your branch updated:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(agents): add voice selection for agents
fix(auth): resolve login redirect issue
docs(api): update authentication documentation
test(calls): add unit tests for call processing
```

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type definitions
- Avoid `any` types when possible
- Use interfaces for object shapes

```typescript
// Good
interface Agent {
  id: string;
  name: string;
  voice: VoiceType;
  createdAt: Date;
}

// Avoid
const agent: any = { ... };
```

### React Components

- Use functional components with hooks
- Implement proper prop types
- Use meaningful component names
- Keep components focused and small

```tsx
// Good
interface AgentCardProps {
  agent: Agent;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <Card>
      <h3>{agent.name}</h3>
      <Button onClick={() => onEdit(agent.id)}>Edit</Button>
      <Button onClick={() => onDelete(agent.id)}>Delete</Button>
    </Card>
  );
}
```

### API Development

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement comprehensive error handling
- Add request validation

```javascript
// Good
router.post('/agents', authenticateToken, agentValidation, async (req, res, next) => {
  try {
    const agent = await agentService.create(req.body, req.user.id);
    res.status(201).json(agent);
  } catch (error) {
    next(error);
  }
});
```

### Database

- Use migrations for schema changes
- Include proper indexes
- Implement Row Level Security (RLS)
- Add meaningful comments

```sql
-- Good
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for user queries
CREATE INDEX idx_agents_user_id ON agents(user_id);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can manage own agents"
  ON agents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

### Styling

- Use Tailwind CSS classes
- Follow design system patterns
- Implement responsive design
- Use semantic HTML

```tsx
// Good
<Card className="hover:shadow-lg transition-shadow">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <Badge variant="success">{status}</Badge>
  </div>
  <p className="text-gray-600 text-sm">{description}</p>
</Card>
```

## Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Custom hooks
- API endpoints
- Database operations

```javascript
// Example unit test
describe('calculateDuration', () => {
  it('should calculate duration correctly', () => {
    const start = '2024-01-01T10:00:00Z';
    const end = '2024-01-01T10:05:30Z';
    
    expect(calculateDuration(start, end)).toBe('5:30');
  });
  
  it('should handle in-progress calls', () => {
    const start = '2024-01-01T10:00:00Z';
    
    expect(calculateDuration(start, null)).toBe('In Progress');
  });
});
```

### Integration Tests

Test API endpoints with real database interactions:

```javascript
describe('POST /api/v1/agents', () => {
  it('should create a new agent', async () => {
    const agentData = {
      name: 'Test Agent',
      identity: 'Test identity',
      voice: 'sarah'
    };
    
    const response = await request(app)
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send(agentData)
      .expect(201);
    
    expect(response.body.name).toBe(agentData.name);
  });
});
```

### E2E Tests

Use Playwright or Cypress for end-to-end testing:

```javascript
test('user can create and test an agent', async ({ page }) => {
  await page.goto('/agents');
  await page.click('[data-testid="create-agent"]');
  
  await page.fill('[data-testid="agent-name"]', 'Test Agent');
  await page.fill('[data-testid="agent-identity"]', 'Test identity');
  await page.click('[data-testid="save-agent"]');
  
  await expect(page.locator('[data-testid="agent-card"]')).toContainText('Test Agent');
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex logic
- Include usage examples
- Keep comments up to date

```typescript
/**
 * Calculates the duration between two timestamps
 * @param startTime - ISO timestamp when call started
 * @param endTime - ISO timestamp when call ended (null for in-progress)
 * @returns Formatted duration string (e.g., "2:45") or "In Progress"
 */
export function calculateDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return 'In Progress';
  
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

### API Documentation

Update API documentation when adding or modifying endpoints:

```javascript
/**
 * @swagger
 * /api/v1/agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAgentRequest'
 *     responses:
 *       201:
 *         description: Agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agent'
 */
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass:**
   ```bash
   npm test
   npm run test:e2e
   ```

2. **Run linting:**
   ```bash
   npm run lint
   npm run lint:fix
   ```

3. **Check TypeScript:**
   ```bash
   npm run type-check
   ```

4. **Update documentation** if needed

### PR Template

Use this template for your pull requests:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in staging environment
4. **Approval** from code owners
5. **Merge** to main branch

## Issue Guidelines

### Bug Reports

Use this template for bug reports:

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96]
- Version: [e.g., 1.0.0]

## Additional Context
Screenshots, logs, etc.
```

### Feature Requests

Use this template for feature requests:

```markdown
## Feature Description
Clear description of the proposed feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered.

## Additional Context
Mockups, examples, etc.
```

## Development Tools

### Recommended VS Code Extensions

- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- GitLens

### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Getting Help

- **Documentation:** Check existing docs first
- **Discussions:** Use GitHub Discussions for questions
- **Discord:** Join our community Discord
- **Issues:** Create an issue for bugs or feature requests

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor highlights

Thank you for contributing to the VRM Platform! 🎉