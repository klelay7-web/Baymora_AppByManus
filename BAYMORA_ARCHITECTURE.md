# BAYMORA - Premium Travel Assistant Architecture

## Executive Summary
Baymora is a premium travel planning and concierge service that uses AI to create personalized, verified travel experiences for high-net-worth individuals. The platform combines intelligent journey composition, partner verification, affiliation tracking, and concierge services.

---

## 1. PRODUCT VISION

### Core Value Proposition
- **Discover**: Understand client preferences, destinations, constraints
- **Compose**: Create personalized journeys with verified partners
- **Execute**: Facilitate bookings, concierge, and on-trip support
- **Learn**: Build persistent client memory for lifetime relationships
- **Monetize**: Subscriptions + affiliation + premium services + concierge

### Plan Tiers
1. **Assistant** ($299-999/mo): AI-powered planning, web search, recommendations
2. **Curated** ($999-2999/mo): Verified partner network, exclusive access
3. **Verified** ($2999+/mo): Tested journeys, guaranteed quality, premium partners
4. **Bespoke Verified** (custom): White-glove custom journeys, full concierge

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Tech Stack

**Backend**
- Framework: Express.js + TypeScript
- Database: PostgreSQL (primary relational) + Redis (cache/sessions)
- Vector DB: Pinecone/Qdrant (for knowledge base embeddings)
- File Storage: S3/R2 (PDFs, images)
- Queue: Bull + Redis (plan generation, concierge requests)
- Auth: JWT (signed server-side) + bcrypt passwords
- LLM Provider: OpenAI (primary) + Anthropic Claude (fallback)

**Frontend**
- Framework: React 18 + TypeScript
- Router: React Router 6 (SPA with proper URLs)
- State: React Query + Context API
- UI: Tailwind CSS + Radix UI components
- Forms: React Hook Form + Zod validation
- PDF Generation: React Print + HTML-to-PDF

**DevOps**
- Deployment: Netlify/Vercel
- Monitoring: Sentry + structured logging
- Analytics: Mixpanel + custom events

### 2.2 Multi-Agent IA Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BAYMORA AI GATEWAY                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Intent Engine (Classify request → routing logic)     │  │
│  └──────────────────────────────────────────────────────┘  │
│              ↓                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Orchestrator (Manage flow, state, multi-agent calls) │  │
│  └──────────────────────────────────────────────────────┘  │
│              ↓                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Parallel Agents:                                     │  │
│  │  • Memory Engine (retrieve client context)           │  │
│  │  • Recommendation Engine (query knowledge base)      │  │
│  │  • Verified Knowledge Engine (filter by reliability) │  │
│  │  • Journey Composer (create itineraries)            │  │
│  └──────────────────────────────────────────────────────┘  │
│              ↓                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ QA & Guardrail Engine (validate, verify, filter)    │  │
│  └──────────────────────────────────────────────────────┘  │
│              ↓                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Response Formatter (JSON/PDF/Brief outputs)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
              ↓                    ↓
         LLM Layer         Knowledge Base Layer
    (OpenAI + Claude)    (MongoDB + Vector DB)
```

### 2.3 Engine Specifications

**Intent Engine**
- Classify user requests (destination, dates, party composition, budget)
- Extract entities (location, travelers, pets, special needs)
- Route to appropriate flow (discovery vs. existing plan modification)
- Language: French/English

**Memory Engine**
- Short-term: Current conversation context
- Long-term: Client profile (preferences, past trips, constraints)
- Vector search: Find similar past experiences
- Learn: Extract and store new preferences from conversation

**Recommendation Engine**
- Query knowledge base for venues, services, partners
- Rank by: relevance, reliability status, client preferences, affiliation value
- Filter: budget, dates, pet-friendly, accessibility, etc.
- Fallback: LLM generation if no verified matches

**Verified Knowledge Engine**
- Manage reliability statuses: researched → reviewed → verified → partner → affiliate
- Track venue details: location, cuisine, pet_policy, seasons, pricing, partner_margin
- Provide confidence scores for recommendations
- Update based on concierge feedback and client reviews

**Journey Composer**
- Create structured itineraries: day-by-day, hour-by-hour
- Include: venues, activities, transport, accommodations, services
- Optimize: travel time, group constraints, budget allocation
- Generate PDFs and briefs for concierge/clients

**QA & Guardrail Engine**
- Validate consistency: budget ↔ recommendations, dates ↔ availability
- Detect hallucinations: verify venue existence, pricing accuracy
- Filter inappropriate content: safety, discretion concerns
- Ensure completeness: all party members covered (kids, pets, elderly)

**Concierge & Booking Engine**
- Generate devis requests with partner requirements
- Track booking status and confirmations
- Manage affiliate commissions and revenue
- Create concierge briefs with client preferences, special requests

---

## 3. DATA MODEL

### 3.1 Core Collections

```sql
-- USERS & AUTH
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  plan_tier VARCHAR(50), -- 'assistant', 'curated', 'verified', 'bespoke'
  subscription_status VARCHAR(50), -- 'active', 'trial', 'paused', 'cancelled'
  trial_end_date TIMESTAMP,
  password_hash VARCHAR(255), -- For owner/admin only
  role VARCHAR(50), -- 'user', 'admin', 'owner'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_ip_address INET,
  is_discretion_mode BOOLEAN DEFAULT FALSE,
  pseudonym VARCHAR(255) -- Optional anonymity
);

-- CLIENT PROFILES & MEMORY
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  preferences JSONB, -- Structure: { style, pace, budget_range, cuisine, activities, ... }
  past_trips JSONB[], -- List of previous journeys
  constraints JSONB, -- { pet_friendly, accessibility, dietary, ... }
  extracted_preferences JSONB, -- Learned from conversations
  confidence_scores JSONB, -- { style: 0.95, budget: 0.8, ... }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CONVERSATIONS
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  status VARCHAR(50), -- 'active', 'archived', 'completed'
  language VARCHAR(10), -- 'fr', 'en'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(50), -- 'user', 'assistant'
  content TEXT NOT NULL,
  metadata JSONB, -- { tokens_used, confidence, sources, ... }
  created_at TIMESTAMP DEFAULT NOW()
);

-- JOURNEY PLANS
CREATE TABLE journey_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  title VARCHAR(255),
  destination VARCHAR(255),
  start_date DATE,
  end_date DATE,
  party_composition JSONB, -- { adults, children, pets, elderly, ... }
  budget_usd DECIMAL(12, 2),
  budget_eur DECIMAL(12, 2),
  status VARCHAR(50), -- 'draft', 'generating', 'generated', 'published', 'executing'
  reliability_status VARCHAR(50), -- 'researched', 'reviewed', 'verified', 'bespoke_verified'
  content_json JSONB, -- Full journey structure
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  executed_at TIMESTAMP
);

-- VENUES (Knowledge Base)
CREATE TABLE venues (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(50), -- 'accommodation', 'restaurant', 'activity', 'transport', 'service'
  location POINT, -- PostGIS: latitude, longitude
  city VARCHAR(100),
  country VARCHAR(100),
  description TEXT,
  rating DECIMAL(3,2),
  reviews_count INT,
  price_range VARCHAR(50), -- '$', '$$', '$$$', '$$$$'
  currency VARCHAR(10),
  price_usd DECIMAL(10,2),
  pet_friendly BOOLEAN,
  accessibility_features JSONB,
  opening_hours JSONB,
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  images JSONB[], -- { url, alt, source }
  reliability_status VARCHAR(50), -- 'researched', 'reviewed', 'verified', 'partner', 'affiliate', 'priority_partner'
  partner_details JSONB, -- { contact_person, margin, commission_rate, special_offers }
  affiliate_program JSONB, -- { enabled, link_type, commission_pct, tracking_code }
  season_details JSONB, -- { best_months, busy_months, closures }
  tags JSONB[], -- For search/filter
  vector_embedding VECTOR(1536), -- For embeddings search
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_verified TIMESTAMP
);

-- VENUE REVIEWS
CREATE TABLE venue_reviews (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id),
  user_id UUID REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  experience_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- JOURNEY TEMPLATES (Pre-built packages)
CREATE TABLE journey_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  destination VARCHAR(255),
  duration_days INT,
  description TEXT,
  suggested_party_size INT,
  budget_usd DECIMAL(12,2),
  difficulty_level VARCHAR(50),
  content_json JSONB,
  reliability_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- VERIFIED JOURNEYS (Tested by Baymora team)
CREATE TABLE verified_journeys (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  destination VARCHAR(255),
  duration_days INT,
  description TEXT,
  content_json JSONB,
  reliability_status VARCHAR(50), -- Always 'verified' or 'bespoke_verified'
  tested_by UUID REFERENCES users(id), -- Baymora team member
  test_date DATE,
  photos JSONB[], -- { url, caption }
  partner_feedback JSONB,
  total_cost_usd DECIMAL(12,2),
  commission_earned DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- BESPOKE PROJECTS (Custom commissioned journeys)
CREATE TABLE bespoke_projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  destination VARCHAR(255),
  description TEXT,
  party_composition JSONB,
  budget_usd DECIMAL(12,2),
  special_requirements TEXT,
  assigned_concierge_id UUID REFERENCES users(id),
  status VARCHAR(50), -- 'inquiry', 'proposal', 'active', 'completed', 'archived'
  proposal_content_json JSONB,
  proposal_pdf_url TEXT,
  agreed_cost DECIMAL(12,2),
  payment_status VARCHAR(50), -- 'pending', 'deposit_paid', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- PARTNER DEALS
CREATE TABLE partner_deals (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id),
  title VARCHAR(255),
  description TEXT,
  discount_pct INT,
  commission_rate DECIMAL(5,2),
  valid_from DATE,
  valid_until DATE,
  terms_conditions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONCIERGE REQUESTS
CREATE TABLE concierge_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  journey_plan_id UUID REFERENCES journey_plans(id),
  title VARCHAR(255),
  description TEXT,
  access_code VARCHAR(32) UNIQUE, -- Secure token for concierge access
  status VARCHAR(50), -- 'pending', 'quoted', 'approved', 'completed', 'cancelled'
  brief_content JSONB, -- Generated brief for concierge
  devis_sent_to JSONB[], -- List of concierge companies contacted
  selected_concierge_id UUID,
  total_cost_estimated DECIMAL(12,2),
  total_cost_actual DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- RECOMMENDATION RECORDS (Analytics)
CREATE TABLE recommendation_records (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  venue_id UUID REFERENCES venues(id),
  recommendation_source VARCHAR(50), -- 'ai', 'template', 'concierge'
  status VARCHAR(50), -- 'shown', 'clicked', 'booked', 'reviewed'
  affiliate_link_clicked BOOLEAN DEFAULT FALSE,
  booking_confirmed BOOLEAN DEFAULT FALSE,
  commission_earned DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(255), -- 'login', 'plan_created', 'payment_received', 'admin_unlock', etc
  resource_type VARCHAR(50), -- 'user', 'plan', 'payment', 'venue'
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ADMIN USERS (Owner access only)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50), -- 'admin', 'owner'
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  last_login_ip INET
);

-- SESSION TOKENS
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  admin_id UUID REFERENCES admin_users(id),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- PLAN GENERATION JOBS (for queue)
CREATE TABLE plan_generation_jobs (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES journey_plans(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(50), -- 'queued', 'processing', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Zod Schemas (TypeScript Validation)

```typescript
// See: shared/api.ts

export const ClientProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  preferences: z.record(z.any()).optional(),
  constraints: z.record(z.any()).optional(),
});

export const JourneyPlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  destination: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budgetUsd: z.number().positive(),
  partyComposition: z.object({
    adults: z.number().min(0),
    children: z.number().min(0),
    pets: z.number().min(0),
    elderly: z.number().min(0),
  }),
  status: z.enum(['draft', 'generating', 'generated', 'published']),
});

export const VenueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: z.enum(['accommodation', 'restaurant', 'activity', 'transport', 'service']),
  city: z.string(),
  country: z.string(),
  reliability: z.enum(['researched', 'reviewed', 'verified', 'partner', 'affiliate']),
  petFriendly: z.boolean(),
  priceUsd: z.number().optional(),
});
```

---

## 4. API ENDPOINTS

### 4.1 Authentication

```
POST   /api/auth/owner-login       # Owner/Admin login
GET    /api/auth/verify            # Verify current session
POST   /api/auth/logout            # Logout
POST   /api/auth/owner/grant-access # Owner grants complementary access
```

### 4.2 Chat & Plans

```
POST   /api/chat/start             # Start new conversation
POST   /api/chat/message           # Send message
GET    /api/chat/conversations     # List conversations
GET    /api/chat/conversations/:id # Get conversation (auth required)
POST   /api/plans/generate         # Trigger plan generation (async)
GET    /api/plans/:id              # Get plan details
GET    /api/plans/:id/pdf          # Download PDF
```

### 4.3 Client Profile

```
GET    /api/profile                # Get client profile
PATCH  /api/profile                # Update profile
GET    /api/profile/preferences    # Get learned preferences
```

### 4.4 Knowledge Base

```
GET    /api/venues/search          # Search venues
GET    /api/venues/:id             # Get venue details
GET    /api/templates              # List journey templates
GET    /api/partners               # List partner info
```

### 4.5 Admin/Owner

```
GET    /api/admin/users            # List users
GET    /api/admin/audit-logs       # View audit logs
POST   /api/admin/grant-plan       # Owner grants plan to user
POST   /api/admin/users/create-admin # Owner creates admin user
GET    /api/admin/dashboard        # Admin dashboard data
```

### 4.6 Concierge

```
POST   /api/concierge/request      # Submit concierge request
GET    /api/concierge/briefs/:accessCode # Concierge retrieves brief
POST   /api/concierge/quote        # Concierge submits quote
```

---

## 5. SECURITY FRAMEWORK

### 5.1 Authentication & Authorization

**Owner/Admin**
- Email + bcrypt password
- JWT token (signed server-side, 24h expiration)
- Separate admin_users table
- Rate limiting: 5 login attempts / 15 minutes
- Audit log all admin actions

**Client Users**
- Session-based or optional email verification
- JWT token for API calls
- Complementary access granted by owner (audit-logged)

**Concierge Access**
- Secure access_code (32-char random token)
- One-time or time-limited access
- Audit log all concierge access

### 5.2 Removed Dangers

- ❌ Remove hardcoded ADMIN_CODE
- ❌ Remove public unlock-code endpoint
- ❌ Remove unvalidated origin_url for Stripe
- ❌ Remove fire-and-forget generation without queue
- ❌ Remove unprotected /conversations endpoint
- ❌ Validate all inputs with Zod
- ❌ Verify Stripe webhook signatures

### 5.3 Environment Variables

```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
ADMIN_EMAIL=admin@baymora.com
ADMIN_PASSWORD_HASH=... # Pre-hashed
JWT_SECRET=... # Min 32 chars
JWT_EXPIRATION_HOURS=24

# LLM
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
PINECONE_API_KEY=...

# Payment
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PUBLIC_KEY=...

# Storage
AWS_S3_BUCKET=...
AWS_S3_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Features
FEATURE_VECTOR_SEARCH=true
FEATURE_AFFILIATION_TRACKING=true
FEATURE_CONCIERGE_AUTO_REQUEST=true

# Logging
SENTRY_DSN=...
```

---

## 6. IMPLEMENTATION PRIORITY

### Phase 1: Security Foundation (P0 - Week 1)
- [x] Define architecture
- [ ] Secure authentication (bcrypt + JWT)
- [ ] Remove hardcoded secrets
- [ ] Environment variable setup
- [ ] Database schema with Zod validation
- [ ] Rate limiting middleware
- [ ] Audit logging

### Phase 2: Core Product (P1 - Week 2-3)
- [ ] Chat interface with Intent Engine
- [ ] Memory Engine (basic)
- [ ] Journey Composer (basic templates)
- [ ] Plan generation with queue system
- [ ] Client dashboard (basic)
- [ ] PDF generation
- [ ] Stripe integration with webhook verification

### Phase 3: Intelligence (P2 - Week 4-5)
- [ ] Recommendation Engine with knowledge base
- [ ] Verified Knowledge Engine with reliability statuses
- [ ] Vector embeddings for venue search
- [ ] Multi-provider LLM fallback
- [ ] QA/Guardrail Engine

### Phase 4: Premium Features (P3 - Week 6+)
- [ ] Admin dashboard with full controls
- [ ] Concierge workflow
- [ ] Bespoke journey composition
- [ ] Affiliation tracking and dashboard
- [ ] Partner management interface
- [ ] Analytics and monitoring

---

## 7. FILE STRUCTURE

```
baymora/
├── server/
│   ├── index.ts                    # Main Express app setup
│   ├── middleware/
│   │   ├── auth.ts                 # JWT verification
│   │   ├── rateLimiting.ts         # Rate limit middleware
│   │   ├── auditLog.ts             # Audit logging
│   ├── routes/
│   │   ├── auth.ts                 # Auth endpoints
│   │   ├── chat.ts                 # Chat endpoints
│   │   ├── plans.ts                # Plan CRUD
│   │   ├── profile.ts              # Client profile
│   │   ├── venues.ts               # Knowledge base
│   │   ├── admin.ts                # Admin endpoints
│   │   ├── concierge.ts            # Concierge endpoints
│   ├── services/
│   │   ├── auth.ts                 # Auth business logic
│   │   ├── ai/
│   │   │   ├── orchestrator.ts      # AI routing
│   │   │   ├── intents.ts           # Intent classification
│   │   │   ├── memory.ts            # Memory engine
│   │   │   ├── recommendations.ts   # Recommendation engine
│   │   │   ├── composer.ts          # Journey composer
│   │   │   ├── qa.ts                # QA & guardrails
│   │   │   ├── llm/
│   │   │   │   ├── openai.ts        # OpenAI wrapper
│   │   │   │   ├── anthropic.ts     # Anthropic wrapper
│   │   │   │   ├── fallback.ts      # Multi-provider fallback
│   │   ├── database.ts              # ORM setup
│   │   ├── payment.ts               # Stripe handling
│   │   ├── pdf.ts                   # PDF generation
│   │   ├── queue.ts                 # Bull queue setup
│   │   ├── storage.ts               # S3 upload
│   ├── workers/
│   │   ├── planGeneration.ts        # Plan generation worker
│   │   ├── conciergeNotifier.ts     # Concierge notifications
│   ├── config/
│   │   ├── database.ts              # DB connection config
│   │   ├── logger.ts                # Structured logging
│   │   ├── prompts.ts               # AI system prompts
│   ├── types/
│   │   ├── index.ts                 # Global types
│
├── client/
│   ├── pages/
│   │   ├── Index.tsx                # Home page
│   │   ├── Chat.tsx                 # Chat interface
│   │   ├── Dashboard.tsx             # Client dashboard
│   │   ├── AdminDashboard.tsx       # Admin console
│   │   ├── JourneyDetail.tsx        # View single journey
│   │   ├── Concierge.tsx            # Concierge portal
│   │
│   ├── components/
│   │   ├── ChatInterface.tsx        # Main chat component
│   │   ├── JourneyBuilder.tsx       # Journey creation flow
│   │   ├── PlanPreview.tsx          # Plan preview UI
│   │   ├── ProfileForm.tsx          # Client profile editor
│   │   ├── VenueCard.tsx            # Venue recommendation card
│   │   ├── ConciergeForm.tsx        # Concierge request form
│   │   ├── AdminControls.tsx        # Admin tools
│   │
│   ├── lib/
│   │   ├── api.ts                   # API client utilities
│   │   ├── auth.ts                  # Client auth helpers
│   │   ├── query.ts                 # React Query hooks
│   │
│   ├── hooks/
│   │   ├── useChat.ts               # Chat hook
│   │   ├── useProfile.ts            # Profile hook
│   │   ├── usePlan.ts               # Plan hook
│   │   ├── useAdmin.ts              # Admin hook
│
├── shared/
│   ├── api.ts                       # Shared types & validation schemas
│   ├── types.ts                     # Shared TypeScript types
│
├── docs/
│   ├── BAYMORA_ARCHITECTURE.md      # This file
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   ├── MONITORING.md

├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── vite.config.server.ts
```

---

## 8. TESTING STRATEGY

- **Unit Tests**: Business logic (AI engines, payment logic)
- **Integration Tests**: API endpoints, database queries
- **E2E Tests**: Full user flows (signup → chat → plan generation → checkout)
- **Security Tests**: Auth flows, rate limiting, SQL injection prevention
- **Load Tests**: Plan generation under load, concurrent chat sessions

---

## 9. MONITORING & OBSERVABILITY

- **Structured Logging**: JSON logs with context (user_id, request_id, duration)
- **Error Tracking**: Sentry for exceptions
- **Performance Metrics**: API response times, LLM token usage, queue depth
- **Analytics**: Conversion funnel, feature usage, revenue tracking
- **Alerts**: Critical errors, payment failures, high queue depth

---

## 10. DEPLOYMENT CHECKLIST

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL/TLS certificates installed
- [ ] CORS configured for production domain
- [ ] Rate limits configured
- [ ] Stripe webhook configured
- [ ] Error monitoring (Sentry) active
- [ ] Backup strategy tested
- [ ] Load tests passed
- [ ] Security audit passed
