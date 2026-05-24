# Graph Report - C:\Users\DrSmoke\Downloads\TechMapCongo  (2026-05-24)

## Corpus Check
- Corpus is ~31,562 words - fits in a single context window. You may not need a graph.

## Summary
- 653 nodes · 1287 edges · 38 communities (35 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.81)
- Token cost: 36,038 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Filters and Hero UI|Filters and Hero UI]]
- [[_COMMUNITY_shadcnui Core Components|shadcn/ui Core Components]]
- [[_COMMUNITY_Layout and Sidebar|Layout and Sidebar]]
- [[_COMMUNITY_Profile and Onboarding Data|Profile and Onboarding Data]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Theme and Dark Mode|Theme and Dark Mode]]
- [[_COMMUNITY_Architecture Documentation|Architecture Documentation]]
- [[_COMMUNITY_Button and Field Primitives|Button and Field Primitives]]
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_App Routing and Layout|App Routing and Layout]]
- [[_COMMUNITY_shadcnui Config|shadcn/ui Config]]
- [[_COMMUNITY_Menubar Component|Menubar Component]]
- [[_COMMUNITY_Context Menu Component|Context Menu Component]]
- [[_COMMUNITY_Alert Dialog Component|Alert Dialog Component]]
- [[_COMMUNITY_Graphify Corpus Metadata|Graphify Corpus Metadata]]
- [[_COMMUNITY_Charts and Data Viz|Charts and Data Viz]]
- [[_COMMUNITY_Form Components|Form Components]]
- [[_COMMUNITY_Dialog Component|Dialog Component]]
- [[_COMMUNITY_Drawer Component|Drawer Component]]
- [[_COMMUNITY_Pagination Component|Pagination Component]]
- [[_COMMUNITY_Input Group Component|Input Group Component]]
- [[_COMMUNITY_Breadcrumb Component|Breadcrumb Component]]
- [[_COMMUNITY_Empty State Component|Empty State Component]]
- [[_COMMUNITY_Popover Component|Popover Component]]
- [[_COMMUNITY_About Page Stats|About Page Stats]]
- [[_COMMUNITY_TypeScript Path Aliases|TypeScript Path Aliases]]
- [[_COMMUNITY_Toggle Components|Toggle Components]]
- [[_COMMUNITY_Tabs Component|Tabs Component]]
- [[_COMMUNITY_Alert Component|Alert Component]]
- [[_COMMUNITY_GitHub Sync Edge Function|GitHub Sync Edge Function]]
- [[_COMMUNITY_Native Select Component|Native Select Component]]
- [[_COMMUNITY_Hover Card Component|Hover Card Component]]
- [[_COMMUNITY_Bolt Config Template|Bolt Config Template]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 269 edges
2. `useAuthStore` - 27 edges
3. `dependencies` - 24 edges
4. `compilerOptions` - 22 edges
5. `Button()` - 21 edges
6. `compilerOptions` - 18 edges
7. `Input()` - 12 edges
8. `Profile` - 11 edges
9. `Badge()` - 10 edges
10. `Skeleton()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  src/lib/utils.ts → package.json
- `Vite Logo SVG` --conceptually_related_to--> `Vite`  [EXTRACTED]
  public/vite.svg → CLAUDE.md
- `App()` --calls--> `useAuthStore`  [EXTRACTED]
  src/App.tsx → src/store/auth-store.ts
- `Toaster()` --calls--> `useTheme()`  [INFERRED]
  src/components/ui/sonner.tsx → src/components/theme-provider.tsx
- `HeroSection()` --calls--> `useAuthStore`  [EXTRACTED]
  src/components/hero/hero-section.tsx → src/store/auth-store.ts

## Hyperedges (group relationships)
- **TechMap Congo Data Flow Pipeline** — claude_md_supabase_db, claude_md_profile_service, claude_md_use_filtered_profiles, claude_md_filter_store, claude_md_auth_store [EXTRACTED 1.00]
- **Zustand Global State Stores** — claude_md_filter_store, claude_md_auth_store, claude_md_zustand [EXTRACTED 1.00]
- **Interactive Map Rendering Stack** — claude_md_congo_map, claude_md_leaflet, claude_md_react_leaflet [EXTRACTED 0.95]

## Communities (38 total, 3 thin omitted)

### Community 0 - "Filters and Hero UI"
Cohesion: 0.07
Nodes (49): FilterPanel(), ROLE_ICONS, HeroSection(), HeroSectionProps, useFilteredProfiles(), UseFilteredProfilesOptions, UseFilteredProfilesResult, NAV_LINKS (+41 more)

### Community 1 - "shadcn/ui Core Components"
Cohesion: 0.07
Nodes (38): cn(), AccordionContent(), AccordionItem(), AccordionTrigger(), AvatarBadge(), AvatarGroup(), AvatarGroupCount(), Card() (+30 more)

### Community 2 - "Layout and Sidebar"
Cohesion: 0.06
Nodes (39): useIsMobile(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle() (+31 more)

### Community 3 - "Profile and Onboarding Data"
Cohesion: 0.09
Nodes (32): CONGO_CITIES, getCityCoordinates(), updateProfile(), OnboardingStepper(), TECH_CATEGORIES, TechChip(), AdminPage(), AuthCallbackPage() (+24 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.05
Nodes (41): dependencies, class-variance-authority, clsx, date-fns, @hookform/resolvers, leaflet, lucide-react, next-themes (+33 more)

### Community 5 - "Theme and Dark Mode"
Cohesion: 0.06
Nodes (25): ModeToggle(), ResolvedTheme, Theme, THEME_VALUES, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState (+17 more)

### Community 6 - "Architecture Documentation"
Cohesion: 0.07
Nodes (31): admin_invitations table, App.tsx, auth-store.ts, lib/cities.ts, congo-map.tsx, lib/constants.ts, filter-store.ts, Leaflet (+23 more)

### Community 7 - "Button and Field Primitives"
Cohesion: 0.08
Nodes (28): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Field(), FieldContent(), FieldDescription(), FieldError() (+20 more)

### Community 8 - "TypeScript App Config"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 9 - "TypeScript Node Config"
Cohesion: 0.1
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 10 - "App Routing and Layout"
Cohesion: 0.12
Nodes (15): AppLayout(), Navbar(), AboutPage, AdminPage, App(), AuthCallbackPage, ContributorsPage, LoginPage (+7 more)

### Community 11 - "shadcn/ui Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, registries, rsc (+9 more)

### Community 12 - "Menubar Component"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 13 - "Context Menu Component"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 14 - "Alert Dialog Component"
Cohesion: 0.15
Nodes (9): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogMedia(), AlertDialogOverlay() (+1 more)

### Community 15 - "Graphify Corpus Metadata"
Cohesion: 0.15
Nodes (12): files, code, document, image, paper, video, graphifyignore_patterns, needs_graph (+4 more)

### Community 16 - "Charts and Data Viz"
Cohesion: 0.18
Nodes (10): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), INITIAL_DIMENSION, THEMES (+2 more)

### Community 17 - "Form Components"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 18 - "Dialog Component"
Cohesion: 0.18
Nodes (6): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 19 - "Drawer Component"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 20 - "Pagination Component"
Cohesion: 0.22
Nodes (8): buttonVariants, Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 21 - "Input Group Component"
Cohesion: 0.28
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea()

### Community 22 - "Breadcrumb Component"
Cohesion: 0.25
Nodes (6): BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

### Community 23 - "Empty State Component"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 24 - "Popover Component"
Cohesion: 0.25
Nodes (4): PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle()

### Community 25 - "About Page Stats"
Cohesion: 0.25
Nodes (5): CITIES, GROWTH_DATA, maxGrowth, ROLE_DISTRIBUTION, TOP_TECHS

### Community 26 - "TypeScript Path Aliases"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, files, @/*, references

### Community 27 - "Toggle Components"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 28 - "Tabs Component"
Cohesion: 0.4
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 29 - "Alert Component"
Cohesion: 0.5
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 30 - "GitHub Sync Edge Function"
Cohesion: 0.4
Nodes (4): corsHeaders, filteredRepos, GitHubRepo, supabase

## Knowledge Gaps
- **180 isolated node(s):** `code`, `document`, `paper`, `image`, `video` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `shadcn/ui Core Components` to `Filters and Hero UI`, `Layout and Sidebar`, `Profile and Onboarding Data`, `Package Dependencies`, `Theme and Dark Mode`, `Button and Field Primitives`, `App Routing and Layout`, `Menubar Component`, `Context Menu Component`, `Alert Dialog Component`, `Charts and Data Viz`, `Form Components`, `Dialog Component`, `Drawer Component`, `Pagination Component`, `Input Group Component`, `Breadcrumb Component`, `Empty State Component`, `Popover Component`, `Toggle Components`, `Tabs Component`, `Alert Component`, `Native Select Component`, `Hover Card Component`?**
  _High betweenness centrality (0.486) - this node is a cross-community bridge._
- **Why does `clsx` connect `Package Dependencies` to `shadcn/ui Core Components`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `code`, `document`, `paper` to the rest of the system?**
  _186 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Filters and Hero UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `shadcn/ui Core Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Layout and Sidebar` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Profile and Onboarding Data` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._