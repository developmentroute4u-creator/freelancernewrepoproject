# Platform Architecture

## Core Philosophy

This is an **Execution Governance Platform**, not a marketplace. The platform enforces:

1. **Skill Verification** - All freelancers must pass skill tests to receive badges
2. **Scope Ownership** - Platform defines and locks scope (when paid)
3. **Accountability** - Platform enforces scope and resolves disputes (when paid)

## System Design

### User Roles & Permissions

#### Freelancer
- Create profile with education and portfolio
- Generate and take skill tests
- Submit test work (ZIP or GitHub)
- View matched projects
- Work on assigned projects

#### Client
- Create company profile
- Discover freelancers (filtered by badge, experience, location, field)
- Answer intent questions
- Review platform-generated scope
- Choose scope mode (Platform/Own)
- Choose accountability mode (Basic/Accountability)
- Create and manage projects
- Raise escalations (Accountability mode only)

#### Admin
- Review test submissions
- Award badges (LOW/MEDIUM/HIGH)
- Override badges (with reason)
- Resolve escalations (final decision)
- Close projects
- View all audit logs

### Data Models

#### User
- Base authentication
- Role-based access control
- Active/inactive status

#### Freelancer
- Personal details
- Education (field + inner fields)
- Portfolio URLs
- Badge information (immutable)
- Expected comfort range (internal only)

#### Client
- Company information
- Team details
- Type of freelancer needed

#### Test & TestSubmission
- AI-generated tests (Gemini)
- Test levels (LOW/MEDIUM/HIGH)
- Submission formats (ZIP/GitHub/Live/Demo)

#### Badge
- Immutable by default
- Admin can override
- Score, feedback, strengths, improvement areas

#### Scope
- Generated from intent answers + field + PDF frameworks
- Deliverables, inclusions, exclusions
- Revision limits, completion criteria
- Locked after confirmation

#### Project
- Links client, freelancer, scope
- State machine (DRAFT → ACTIVE → IN_REVIEW → COMPLETED/CLOSED)
- Accountability mode (BASIC/ACCOUNTABILITY)
- Can enter DISPUTED state

#### Escalation
- Only for ACCOUNTABILITY mode projects
- Types: SCOPE_VIOLATION, QUALITY_ISSUE, DELAY, OTHER
- Admin resolution: REWORK, REPLACEMENT, REFUND, CLOSURE

#### AuditLog
- Immutable logs of all actions
- User, entity, action, metadata
- IP address, user agent

## State Machines

### Project States
- **DRAFT**: Initial state, scope not locked
- **ACTIVE**: Work in progress
- **IN_REVIEW**: Submitted for review
- **COMPLETED**: Client approved
- **DISPUTED**: Escalation raised (Accountability mode only)
- **CLOSED**: Admin closed or dispute resolved

### State Transitions
- Enforced by role and conditions
- All transitions logged
- Admin has override authority

## Business Model

### Revenue Sources
1. **Scope License Fee** - Client pays for platform-defined scope
2. **Accountability Fee** - Client pays for dispute resolution
3. **Scope Upgrade Fee** - Client pays for scope changes

### No Monetization From
- Freelancers (never charged)
- Bidding/visibility
- Subscriptions
- Commissions

## Key Features

### Skill Test System
1. Freelancer selects test level
2. Gemini generates test based on field + inner fields + level
3. Freelancer submits work (ZIP or GitHub required)
4. Admin reviews and awards badge
5. Badge is immutable (unless admin overrides)

### Scope Ownership
1. Client answers intent questions
2. Platform generates scope using:
   - Field and inner fields
   - Intent answers
   - PDF scope frameworks (internal)
3. Client previews scope
4. Client chooses:
   - **Platform Scope (Paid)**: Locked, enforceable
   - **Own Scope (Free)**: Platform not responsible
5. Scope locked after confirmation
6. Changes require new scope + fee

### Accountability System
1. **Basic Mode (Free)**:
   - Platform connects only
   - No intervention
   - No escalations

2. **Accountability Mode (Paid)**:
   - Platform enforces scope
   - Resolves disputes
   - Final decisions on rework/replacement/refund/closure

### Admin Authority
- All decisions are final and binding
- Can override badges
- Can close projects
- Can resolve escalations
- Full audit trail

## Security & Compliance

### Authentication
- JWT-based tokens
- Password hashing (bcrypt)
- Role-based access control

### Authorization
- Route-level RBAC
- Resource-level checks
- Admin override capability

### Audit Logging
- All actions logged
- Immutable logs
- Full traceability
- IP and user agent tracking

## API Design

### RESTful Structure
- `/api/auth` - Authentication
- `/api/freelancers` - Freelancer operations
- `/api/clients` - Client operations
- `/api/tests` - Test management
- `/api/scopes` - Scope generation and management
- `/api/projects` - Project lifecycle
- `/api/escalations` - Dispute management
- `/api/admin` - Admin operations
- `/api/audit` - Audit log access

### Error Handling
- Consistent error format
- Proper HTTP status codes
- Validation errors
- Authentication errors
- Authorization errors

## Frontend Architecture

### Next.js App Router
- Server and client components
- Route-based organization
- TypeScript throughout

### UI Components
- ShadCN UI components
- Tailwind CSS styling
- Responsive design
- Form validation (React Hook Form + Zod)

### State Management
- React hooks for local state
- API calls via Axios
- Token-based authentication
- LocalStorage for session

## AI Integration

### Google Gemini API
- **Skill Test Generation**: Creates tests based on field, inner fields, and level
- **Scope Drafting**: Generates scope from intent answers (assistance only, not authority)

### Fallback Behavior
- If Gemini API fails, uses default templates
- Ensures platform always functions
- Logs API errors for monitoring

## Scalability Considerations

### Database
- MongoDB with proper indexing
- ObjectId references
- Efficient queries

### API
- Express.js with middleware
- Error handling
- Request validation

### Frontend
- Next.js optimization
- Code splitting
- Image optimization ready

## Future Enhancements

1. File upload system (S3-compatible)
2. Real-time notifications
3. PDF scope framework management UI
4. Advanced analytics
5. Payment integration
6. Email notifications
7. Project templates
8. Multi-language support
