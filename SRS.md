# Software Requirements Specification (SMS)

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional, non-functional, technical, security, and operational requirements for a full-stack personal productivity web application that enables users to save, organize, customize, and manage website collections, sticky notes, and workspace personalization across devices.

The platform acts as a hybrid of:

- Bookmark dashboard
- Personalized homepage/start page
- Productivity workspace
- Digital organization system

### 1.2 Product Vision

The application will provide users with a highly customizable, local-first, cloud-synced dashboard where they can:

- Save websites in customizable grid containers
- Organize websites into categories
- Use advanced sticky notes
- Personalize themes and wallpapers
- Sync data across devices
- Access data offline
- Share selected boards
- Manage multiple accounts quickly
- Import/export and control personal data

### 1.3 Target Audience

- Personal users
- Productivity-focused users
- Students and professionals
- Medium-scale SaaS deployment for future growth

---

# 2. Overall Description

## 2.1 Product Perspective

This product is a Progressive Web App (PWA) built with:

### Frontend:

- Next.js
- TypeScript
- Tailwind CSS
- Service Workers
- IndexedDB (local-first storage)

### Backend:

- Express.js
- PostgreSQL
- OAuth authentication providers
- Cloud sync APIs

### Browser Extension:

- Quick-save websites directly from browser
- Auto-fetch metadata

---

## 2.2 Core Features Overview

1. Website collection dashboard
2. Multi-category management
3. Sticky notes system
4. Theme & wallpaper customization
5. Offline-first sync architecture
6. Account management
7. Import/export tools
8. Admin analytics dashboard
9. Shared boards
10. Private categories

---

# 3. User Roles

## 3.1 Standard User

Can:

- Register/login via OAuth
- Save and manage websites
- Create/edit categories
- Customize dashboard
- Use sticky notes
- Import/export data
- Share boards
- Manage privacy settings
- Delete account
- Download full data archive

## 3.2 Admin

Can:

- View user analytics
- Monitor usage patterns
- Manage platform metrics
- Access future operational controls
- Manage abuse/security logs

---

# 4. Functional Requirements

# 4.1 Authentication & Account System

## 4.1.1 Login Methods

The system shall support:

- Google OAuth
- GitHub OAuth
- Additional OAuth providers (extensible)

## 4.1.2 Account Switching

The system shall:

- Support fast account switching without repeated login
- Allow multiple saved sessions
- Maintain separate encrypted local profiles

## 4.1.3 Session Management

- Secure session tokens
- Refresh tokens
- Session expiration
- Manual logout from all devices
- Password reset support where applicable

---

# 4.2 Local-First Offline Storage

## 4.2.1 Requirements

The system shall:

- Save all changes locally first using IndexedDB
- Sync changes to cloud when authenticated
- Queue offline changes
- Resolve sync conflicts
- Prioritize user-selected conflict resolution

## 4.2.2 Sync Logic

- Last modified timestamps
- Version history
- Merge/overwrite/manual choice
- Device consistency

---

# 4.3 Category Management

Users shall be able to:

- Create unlimited categories
- Rename categories
- Reorder categories via drag-and-drop
- Customize category icon
- Customize category wallpaper/background
- Set category privacy (private/shared)
- Export individual category as JSON
- Delete categories

---

# 4.4 Website Card Management

Each website card shall support:

- URL
- Auto-fetched metadata
- Title
- Description
- Thumbnail/favicon
- Custom icon
- Custom color
- Tags
- Notes
- Favorite/pin
- Search indexing

## 4.4.1 Actions

Users shall:

- Drag/drop within category
- Drag/drop across categories
- Edit metadata manually
- Open links
- Bulk move/delete

---

# 4.4.2 Tagging System

## Freeform Tags

The system shall support a fully unrestricted tagging system across websites, sticky notes, and categories where:

- Users can create unlimited custom text tags
- No predefined taxonomy is required
- Tags are fully user-defined
- Tags may include personal naming conventions
- Tags support search, filtering, and grouping
- Tags can be assigned, edited, merged, or deleted at any time
- Tags shall not be restricted by category type
- Tags should support autocomplete from existing user-created tags
- Optional color-label customization for tags

## Tag Scope

Tags shall be usable across:

- Website cards
- Sticky notes
- Categories
- Shared boards (subject to permission)

---

# 4.5 Sticky Notes System

## 4.5.1 Scope

Sticky notes shall exist in:

- Global dashboard
- Category-specific sections

## 4.5.2 Sticky Note Types

Support:

- Text notes
- Rich media (images/GIFs)
- Checklists
- To-do lists
- Reminders
- Embedded links

## 4.5.3 Sticky Note Customization

- Color
- Size
- Layout position
- Tags
- Search
- Filters

---

# 4.6 Personalization System

## 4.6.1 Themes

- Default system theme sync
- Manual light mode
- Manual dark mode
- Custom accent color

## 4.6.2 Wallpapers

- Global wallpaper
- Category-specific wallpaper
- User-uploaded images
- GIF support
- Looping video backgrounds

---

# 4.7 Import / Export System

## 4.7.1 Export

Users shall export:

- Full account data (JSON)
- Individual categories (JSON)
- Sticky notes
- Settings

## 4.7.2 Import

System shall:

- Parse JSON
- Detect duplicates
- Offer conflict resolver:
  - Merge
  - Replace
  - Skip
  - Manual select

---

# 4.8 Shared Boards

Users shall:

- Share categories/boards
- Generate shareable links
- Set permissions:
  - View only
  - Collaborative edit

- Revoke sharing access

---

# 4.9 Browser Extension

The extension shall:

- Save current website instantly
- Select destination category
- Auto-fetch metadata
- Quick note support
- Sync with web app

---

# 4.10 Admin Dashboard

Admin panel shall include a comprehensive analytics and operational intelligence system with both real-time and historical insights.

## 4.10.1 Core Analytics Dashboard

Admin panel shall include:

- Total registered users
- Daily active users (DAU)
- Weekly active users (WAU)
- Monthly active users (MAU)
- New user registrations
- User retention metrics
- Churn indicators
- Session counts
- Active sessions by device type
- Average session duration
- Geographic usage trends (privacy-compliant aggregated data)
- Sync success/failure rates
- Offline usage frequency
- Import/export frequency
- Browser extension adoption metrics
- Shared board usage
- Private category adoption
- Sticky note engagement metrics
- Feature adoption trends
- Search frequency and search success metrics

## 4.10.2 Product Usage Analytics

The system shall track:

- Categories created per user
- Average websites saved per user
- Card interaction frequency
- Tag usage patterns
- Reminder completion rates
- Wallpaper/theme preference trends
- Drag-and-drop interaction frequency
- Cross-category move actions
- Most-used dashboard sections
- Storage consumption trends

## 4.10.3 Technical & Infrastructure Analytics

The admin dashboard shall monitor:

- API response times
- Database query performance
- Background sync queue health
- Sync conflict frequency
- Failed sync causes
- Error rates by feature/module
- Browser compatibility issues
- Extension sync health
- Media storage consumption
- PWA install rates
- Cache efficiency
- Uptime statistics
- Security incidents

## 4.10.4 Security & Abuse Monitoring

The system shall include:

- Failed login attempts
- Suspicious activity detection
- Session hijack indicators
- OAuth provider anomalies
- Rate-limit violations
- Spam/shared board abuse detection
- Account deletion trends
- Data export abuse monitoring

## 4.10.5 Reporting & Visualization

Admin dashboard shall provide:

- Graphs and trend charts
- Cohort analysis
- Funnel analysis
- Exportable CSV/JSON reports
- Custom date-range filters
- Category-specific insights
- Feature comparison reports
- User segmentation
- Audit logs

## 4.10.6 Admin Controls

Admins shall be able to:

- Filter analytics by date range
- Filter by user cohort
- View anonymized behavior patterns
- Trigger alerts for abnormal failures
- Monitor product health KPIs
- Configure future analytics modules

## 4.10.7 Analytics Stack Requirements

The system should prioritize:

- Self-hosted PostHog or equivalent free analytics stack
- PostgreSQL analytics views
- Event-driven architecture
- Privacy-respecting telemetry
- GDPR-style export/delete compatibility

---

# 5. Non-Functional Requirements

## 5.1 Performance

- Dashboard load under 2 seconds (cached)
- Sync response under 5 seconds standard
- Offline actions under 200ms perceived latency

## 5.2 Scalability

- Support medium SaaS user base
- Modular microservice migration path
- PostgreSQL optimization

## 5.3 Reliability

- 99.9% uptime target
- Automatic local backup
- Sync recovery
- Crash-safe state restoration

## 5.4 Security

- OAuth token encryption
- HTTPS only
- Secure cookies
- CSRF protection
- XSS protection
- SQL injection prevention
- Session revocation
- Data deletion compliance

## 5.5 Accessibility

- Keyboard navigation
- Responsive UI
- Mobile-first support
- Screen reader compatibility

---

# 5.6 Cost & Free/Open-Source Technology Requirements

## 5.6.1 Core Principle

The entire MVP technology stack shall prioritize 100% free-to-use, open-source, or free-tier sustainable technologies with zero mandatory paid infrastructure during development and early deployment.

## 5.6.2 Approved Stack Requirements

### Frontend (Free)

- Next.js (open source)
- TypeScript (open source)
- Tailwind CSS (open source)
- ShadCN UI (open source)
- Zustand (open source; preferred over Redux for lower complexity)
- dnd-kit (open source)
- Dexie.js for IndexedDB (open source)
- Workbox for PWA/service workers (open source)

### Backend (Free)

- Express.js (open source)
- PostgreSQL (open source)
- Prisma ORM (open source)
- Passport.js or Auth.js (free OAuth integration)
- Zod validation (open source)

### Storage & Media (Free-first)

- Local IndexedDB for offline-first primary storage
- Cloudinary free tier OR Supabase Storage free tier OR self-hosted object storage for MVP
- User-selectable migration path for future paid scaling

### Hosting (Free-first)

- Vercel free tier (frontend)
- Railway/Render/Supabase free tier (backend/database where feasible)
- Self-hosting compatibility required to avoid vendor lock-in

### Analytics (Free)

- PostHog open source/self-hosted preferred
- Plausible self-hosted optional
- Basic internal analytics dashboard

### Browser Extension

- Manifest V3
- Chromium-first deployment
- Free Chrome Web Store deployment path

## 5.6.3 Vendor Lock-In Prevention

The system architecture shall:

- Avoid proprietary lock-in where possible
- Support data portability
- Support self-hosting migration
- Maintain JSON-first import/export compatibility
- Keep authentication provider abstraction layer

## 5.6.4 Paid Dependency Restrictions

The MVP shall not require:

- Mandatory paid APIs
- Proprietary paid SDKs
- Closed-source sync engines
- Paid database engines
- Paid authentication systems

---

# 6. System Architecture

## 6.1 Frontend Architecture

- Next.js PWA
- App Router
- Zustand/Redux state management
- IndexedDB local storage
- Service Worker caching

## 6.2 Backend Architecture

- Express.js REST API
- OAuth services
- Sync engine
- PostgreSQL relational storage
- File/media upload service

## 6.3 Sync Engine

Responsibilities:

- Local queue
- Background sync
- Conflict detection
- Version reconciliation

---

# 7. Suggested Database Schema

## Core Tables

### Users

- user_id
- oauth_provider
- profile_data
- settings

### Categories

- category_id
- user_id
- name
- icon
- wallpaper
- privacy
- order_index

### Websites

- website_id
- category_id
- url
- metadata
- tags
- notes
- pinned

### StickyNotes

- note_id
- user_id
- category_id (nullable)
- type
- content
- reminder_data

### Sessions

- session_id
- user_id
- device_info

### SharedBoards

- share_id
- category_id
- permission_type

---

# 8. API Requirements

## Core APIs

- Auth API
- User settings API
- Category CRUD API
- Website CRUD API
- Sticky notes API
- Import/export API
- Sync API
- Analytics API
- Sharing API

---

# 9. Data Privacy & User Rights

Users must be able to:

- Delete account permanently
- Download all personal data
- Export categories
- Control sharing permissions
- Manage sessions/devices

---

# 10. Future Scope

## Planned Enhancements

- AI auto-categorization
- Smart recommendations
- Duplicate cleanup automation
- Team collaboration suite
- Marketplace themes
- Cross-platform native apps

---

# 11. Risks & Considerations

## Technical Risks

- Sync conflicts complexity
- Media-heavy wallpaper performance
- Browser storage limitations
- Cross-device consistency

## Product Risks

- Over-customization complexity
- Privacy concerns for shared boards
- Admin overreach without role boundaries

---

# 12. Success Metrics

- Daily active users
- Average saved websites/user
- Sync reliability rate
- Retention rate
- Sticky note engagement
- Import/export success rate
- Extension adoption

---

# 13. Conclusion

This platform is designed as a comprehensive personal productivity ecosystem combining bookmarking, organization, customization, and local-first resilience. By integrating dashboard utility, advanced personalization, and SaaS scalability, it aims to function as both a personal workspace and expandable productivity platform.
