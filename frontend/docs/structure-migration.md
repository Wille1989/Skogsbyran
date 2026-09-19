# Frontend structure migration

Structure-only migration: 127 source files moved, including 11 filename changes. Application logic, CSS content, API contracts and routes are unchanged. The document component export and its consumer were renamed from `Form` to `DocumentUploadForm` as requested.

All 141 files in the requested target tree are present. The existing contact API, added after that tree was drafted, is preserved at `src/modules/contact/api/api.ts` to retain contact form functionality.

## Created directories

- `src/modules/about/pages/`
- `src/modules/activity/api/`
- `src/modules/activity/components/`
- `src/modules/activity/helpers/`
- `src/modules/activity/hooks/`
- `src/modules/activity/types/`
- `src/modules/admin/components/`
- `src/modules/admin/fixtures/`
- `src/modules/admin/pages/`
- `src/modules/analytics/api/`
- `src/modules/analytics/hooks/`
- `src/modules/analytics/types/`
- `src/modules/auth/api/`
- `src/modules/auth/components/`
- `src/modules/auth/config/`
- `src/modules/auth/hooks/`
- `src/modules/auth/pages/`
- `src/modules/auth/types/`
- `src/modules/contact/api/`
- `src/modules/contact/components/`
- `src/modules/contact/context/`
- `src/modules/document/api/`
- `src/modules/document/components/`
- `src/modules/document/helpers/`
- `src/modules/document/hooks/`
- `src/modules/document/types/`
- `src/modules/image/api/`
- `src/modules/image/components/`
- `src/modules/image/helpers/`
- `src/modules/image/hooks/`
- `src/modules/image/state/`
- `src/modules/image/types/`
- `src/modules/location/api/`
- `src/modules/location/components/`
- `src/modules/location/map/api/`
- `src/modules/location/map/components/`
- `src/modules/location/map/helpers/`
- `src/modules/location/map/hooks/`
- `src/modules/location/map/types/`
- `src/modules/location/types/`
- `src/modules/property/api/`
- `src/modules/property/components/`
- `src/modules/property/details/api/`
- `src/modules/property/details/components/`
- `src/modules/property/details/helpers/`
- `src/modules/property/details/hooks/`
- `src/modules/property/details/types/`
- `src/modules/property/helpers/`
- `src/modules/property/hooks/`
- `src/modules/property/pages/`
- `src/modules/property/services/`
- `src/modules/property/types/`
- `src/shared/api/`
- `src/shared/components/`
- `src/shared/config/`

## Files moved

Paths below are relative to `frontend/src`. The former column records historical locations.

| Former location (historical) | Current location |
| --- | --- |
| `modules/about/presentation/AboutPage.css` | `modules/about/pages/AboutPage.css` |
| `modules/about/presentation/AboutPage.tsx` | `modules/about/pages/AboutPage.tsx` |
| `modules/activity/data/api.ts` | `modules/activity/api/api.ts` |
| `modules/activity/data/queries.ts` | `modules/activity/hooks/queries.ts` |
| `modules/activity/data/types.ts` | `modules/activity/types/types.ts` |
| `modules/activity/presentation/RecentActivity.tsx` | `modules/activity/components/RecentActivity.tsx` |
| `modules/activity/presentation/relativeTime.ts` | `modules/activity/helpers/relativeTime.ts` |
| `modules/admin/data/overviewFixtures.ts` | `modules/admin/fixtures/overviewFixtures.ts` |
| `modules/admin/presentation/AdminLayout.css` | `modules/admin/components/AdminLayout.css` |
| `modules/admin/presentation/AdminLayout.tsx` | `modules/admin/components/AdminLayout.tsx` |
| `modules/admin/presentation/OverviewPage.tsx` | `modules/admin/pages/OverviewPage.tsx` |
| `modules/admin/presentation/PropertiesPage.tsx` | `modules/admin/pages/PropertiesPage.tsx` |
| `modules/admin/presentation/PropertyForm.tsx` | `modules/property/components/PropertyForm.tsx` |
| `modules/analytics/data/api.ts` | `modules/analytics/api/api.ts` |
| `modules/analytics/data/queries.ts` | `modules/analytics/hooks/queries.ts` |
| `modules/analytics/data/types.ts` | `modules/analytics/types/types.ts` |
| `modules/auth/data/adminAccess.ts` | `modules/auth/config/adminAccess.ts` |
| `modules/auth/data/auth.hooks.ts` | `modules/auth/hooks/auth.hooks.ts` |
| `modules/auth/data/authService.ts` | `modules/auth/api/authService.ts` |
| `modules/auth/data/userTypes.ts` | `modules/auth/types/userTypes.ts` |
| `modules/auth/presentation/Form.css` | `modules/auth/pages/AuthPage.css` |
| `modules/auth/presentation/Form.tsx` | `modules/auth/pages/AuthPage.tsx` |
| `modules/auth/presentation/Middleware.tsx` | `modules/auth/components/AdminRoute.tsx` |
| `modules/contact/data/api.ts` | `modules/contact/api/api.ts` |
| `modules/contact/presentation/ContactContext.ts` | `modules/contact/context/ContactContext.ts` |
| `modules/contact/presentation/ContactForm.tsx` | `modules/contact/components/ContactForm.tsx` |
| `modules/contact/presentation/ContactPanel.css` | `modules/contact/components/ContactPanel.css` |
| `modules/contact/presentation/ContactPanel.tsx` | `modules/contact/components/ContactPanel.tsx` |
| `modules/document/api.ts` | `modules/document/api/api.ts` |
| `modules/document/DocumentItem.tsx` | `modules/document/components/DocumentItem.tsx` |
| `modules/document/documentPresentation.ts` | `modules/document/helpers/documentPresentation.ts` |
| `modules/document/Documents.css` | `modules/document/components/Documents.css` |
| `modules/document/Documents.tsx` | `modules/document/components/Documents.tsx` |
| `modules/document/EditableDocuments.css` | `modules/document/components/EditableDocuments.css` |
| `modules/document/EditableDocuments.tsx` | `modules/document/components/EditableDocuments.tsx` |
| `modules/document/Form.css` | `modules/document/components/DocumentUploadForm.css` |
| `modules/document/Form.tsx` | `modules/document/components/DocumentUploadForm.tsx` |
| `modules/document/mutations.ts` | `modules/document/hooks/mutations.ts` |
| `modules/document/PendingDocuments.css` | `modules/document/components/PendingDocuments.css` |
| `modules/document/PendingDocuments.tsx` | `modules/document/components/PendingDocuments.tsx` |
| `modules/document/types.ts` | `modules/document/types/types.ts` |
| `modules/image/data/api.ts` | `modules/image/api/api.ts` |
| `modules/image/data/calculateIndex.ts` | `modules/image/helpers/calculateIndex.ts` |
| `modules/image/data/drawImage.ts` | `modules/image/helpers/drawImage.ts` |
| `modules/image/data/imageReducer.ts` | `modules/image/state/imageReducer.ts` |
| `modules/image/data/mutations.ts` | `modules/image/hooks/mutations.ts` |
| `modules/image/data/types.ts` | `modules/image/types/types.ts` |
| `modules/image/data/useFileDropContainer.ts` | `modules/image/hooks/useFileDropContainer.ts` |
| `modules/image/data/useImageFiles.ts` | `modules/image/hooks/useImageFiles.ts` |
| `modules/image/presentation/FileDropContainer.css` | `modules/image/components/ImageDropZone.css` |
| `modules/image/presentation/FileDropContainer.tsx` | `modules/image/components/ImageDropZone.tsx` |
| `modules/image/presentation/Form.css` | `modules/image/components/ImageForm.css` |
| `modules/image/presentation/Form.tsx` | `modules/image/components/ImageForm.tsx` |
| `modules/image/presentation/ImageEditDialog.css` | `modules/image/components/ImageEditDialog.css` |
| `modules/image/presentation/ImageEditDialog.tsx` | `modules/image/components/ImageEditDialog.tsx` |
| `modules/image/presentation/ImageItem.tsx` | `modules/image/components/ImageItem.tsx` |
| `modules/image/presentation/Images.tsx` | `modules/image/components/Images.tsx` |
| `modules/image/presentation/ImageViewer.css` | `modules/image/components/ImageViewer.css` |
| `modules/image/presentation/ImageViewer.tsx` | `modules/image/components/ImageViewer.tsx` |
| `modules/image/presentation/PreviewCanvas.css` | `modules/image/components/PreviewCanvas.css` |
| `modules/image/presentation/PreviewCanvas.tsx` | `modules/image/components/PreviewCanvas.tsx` |
| `modules/location/api.ts` | `modules/location/api/api.ts` |
| `modules/location/LocationEditor.css` | `modules/location/components/LocationEditor.css` |
| `modules/location/LocationEditor.tsx` | `modules/location/components/LocationEditor.tsx` |
| `modules/location/map/data/api.ts` | `modules/location/map/api/api.ts` |
| `modules/location/map/data/areaDraft.ts` | `modules/location/map/helpers/areaDraft.ts` |
| `modules/location/map/data/areaMath.ts` | `modules/location/map/helpers/areaMath.ts` |
| `modules/location/map/data/locationFromAddress.ts` | `modules/location/map/helpers/locationFromAddress.ts` |
| `modules/location/map/data/mapPresentation.ts` | `modules/location/map/helpers/mapPresentation.ts` |
| `modules/location/map/data/mutations.ts` | `modules/location/map/hooks/mutations.ts` |
| `modules/location/map/data/queries.ts` | `modules/location/map/hooks/queries.ts` |
| `modules/location/map/data/types.ts` | `modules/location/map/types/types.ts` |
| `modules/location/map/data/usePropertyMap.ts` | `modules/location/map/hooks/usePropertyMap.ts` |
| `modules/location/map/data/validatePropertyMap.ts` | `modules/location/map/helpers/validatePropertyMap.ts` |
| `modules/location/map/domain/map.ts` | `modules/location/map/helpers/map.ts` |
| `modules/location/map/features/drawing.ts` | `modules/location/map/helpers/drawing.ts` |
| `modules/location/map/features/poi.ts` | `modules/location/map/helpers/poi.ts` |
| `modules/location/map/features/useMapHandle.ts` | `modules/location/map/hooks/useMapHandle.ts` |
| `modules/location/map/features/usePolygonEditing.ts` | `modules/location/map/hooks/usePolygonEditing.ts` |
| `modules/location/map/features/view.ts` | `modules/location/map/helpers/view.ts` |
| `modules/location/map/presentation/EditableAreas.tsx` | `modules/location/map/components/EditableAreas.tsx` |
| `modules/location/map/presentation/map.css` | `modules/location/map/components/map.css` |
| `modules/location/map/presentation/MapAddressSearch.tsx` | `modules/location/map/components/MapAddressSearch.tsx` |
| `modules/location/map/presentation/MapControls.tsx` | `modules/location/map/components/MapControls.tsx` |
| `modules/location/map/presentation/MapHandle.tsx` | `modules/location/map/components/MapHandle.tsx` |
| `modules/location/map/presentation/MapOverlays.tsx` | `modules/location/map/components/MapOverlays.tsx` |
| `modules/location/map/presentation/PropertyAreaEditor.tsx` | `modules/location/map/components/PropertyAreaEditor.tsx` |
| `modules/location/map/presentation/PropertyAreaMap.tsx` | `modules/location/map/components/PropertyAreaMap.tsx` |
| `modules/location/map/presentation/PropertyMapEditor.tsx` | `modules/location/map/components/PropertyMapEditor.tsx` |
| `modules/location/map/presentation/PropertyMapView.tsx` | `modules/location/map/components/PropertyMapView.tsx` |
| `modules/location/types.ts` | `modules/location/types/types.ts` |
| `modules/property/data/api.ts` | `modules/property/api/api.ts` |
| `modules/property/data/editDrafts.ts` | `modules/property/helpers/editDrafts.ts` |
| `modules/property/data/editMutations.ts` | `modules/property/hooks/editMutations.ts` |
| `modules/property/data/mutations.ts` | `modules/property/hooks/mutations.ts` |
| `modules/property/data/queries.ts` | `modules/property/hooks/queries.ts` |
| `modules/property/data/queryKeys.ts` | `modules/property/api/queryKeys.ts` |
| `modules/property/data/saveProgress.ts` | `modules/property/services/saveProgress.ts` |
| `modules/property/data/types.ts` | `modules/property/types/types.ts` |
| `modules/property/details/api.ts` | `modules/property/details/api/api.ts` |
| `modules/property/details/Form.css` | `modules/property/details/components/DetailsForm.css` |
| `modules/property/details/Form.tsx` | `modules/property/details/components/DetailsForm.tsx` |
| `modules/property/details/mutations.ts` | `modules/property/details/hooks/mutations.ts` |
| `modules/property/details/publication.ts` | `modules/property/details/helpers/publication.ts` |
| `modules/property/details/PublicationFields.css` | `modules/property/details/components/PublicationFields.css` |
| `modules/property/details/PublicationFields.tsx` | `modules/property/details/components/PublicationFields.tsx` |
| `modules/property/details/types.ts` | `modules/property/details/types/types.ts` |
| `modules/property/presentation/CreatePage.tsx` | `modules/property/pages/CreatePage.tsx` |
| `modules/property/presentation/EditPage.tsx` | `modules/property/pages/EditPage.tsx` |
| `modules/property/presentation/IndexPage.css` | `modules/property/pages/IndexPage.css` |
| `modules/property/presentation/IndexPage.tsx` | `modules/property/pages/IndexPage.tsx` |
| `modules/property/presentation/PropertyCard.css` | `modules/property/components/PropertyCard.css` |
| `modules/property/presentation/PropertyCard.tsx` | `modules/property/components/PropertyCard.tsx` |
| `modules/property/presentation/PropertyDetail.css` | `modules/property/pages/PropertyDetail.css` |
| `modules/property/presentation/propertyListing.ts` | `modules/property/helpers/propertyListing.ts` |
| `modules/property/presentation/ShowPage.css` | `modules/property/pages/ShowPage.css` |
| `modules/property/presentation/ShowPage.tsx` | `modules/property/pages/ShowPage.tsx` |
| `shared/data/apiFetch.ts` | `shared/api/apiFetch.ts` |
| `shared/data/baseURL.ts` | `shared/config/baseURL.ts` |
| `shared/presentation/Footer.css` | `shared/components/Footer.css` |
| `shared/presentation/Footer.tsx` | `shared/components/Footer.tsx` |
| `shared/presentation/Layout.css` | `shared/components/Layout.css` |
| `shared/presentation/Layout.tsx` | `shared/components/Layout.tsx` |
| `shared/presentation/LoadingSpinner.css` | `shared/components/LoadingSpinner.css` |
| `shared/presentation/LoadingSpinner.tsx` | `shared/components/LoadingSpinner.tsx` |
| `shared/presentation/Navbar.css` | `shared/components/Navbar.css` |
| `shared/presentation/Navbar.tsx` | `shared/components/Navbar.tsx` |

## Filename changes

- `modules/auth/presentation/Form.css` → `modules/auth/pages/AuthPage.css`
- `modules/auth/presentation/Form.tsx` → `modules/auth/pages/AuthPage.tsx`
- `modules/auth/presentation/Middleware.tsx` → `modules/auth/components/AdminRoute.tsx`
- `modules/document/Form.css` → `modules/document/components/DocumentUploadForm.css`
- `modules/document/Form.tsx` → `modules/document/components/DocumentUploadForm.tsx`
- `modules/image/presentation/FileDropContainer.css` → `modules/image/components/ImageDropZone.css`
- `modules/image/presentation/FileDropContainer.tsx` → `modules/image/components/ImageDropZone.tsx`
- `modules/image/presentation/Form.css` → `modules/image/components/ImageForm.css`
- `modules/image/presentation/Form.tsx` → `modules/image/components/ImageForm.tsx`
- `modules/property/details/Form.css` → `modules/property/details/components/DetailsForm.css`
- `modules/property/details/Form.tsx` → `modules/property/details/components/DetailsForm.tsx`

## Deleted files

- `src/modules/image/presentation/ImageItem.css` — empty and unused CSS.
- `src/modules/image/presentation/Images.css` — empty and unused CSS.
- `tsconfig.tests.json` — obsolete TypeScript test configuration.

## Configuration and documentation

- `tsconfig.app.json`: include is now `["src"]`; compiler options remain unchanged.
- `../Agent.Skogsbyran.md`: added the responsibility-based directory convention.
- `src/modules/location/map/sitemap.xml`: updated paths and grouped all 35 map source files under api, components, helpers, hooks, types, adapters and providers; all integration paths resolve.
- `docs/property-map.md` and `docs/save-progress.md`: updated source paths without rewriting historical verification claims.
- `sitemap.xml`: inspected; its Map inventory link remains correct and its developer-index purpose is unchanged.
- `docs/crud-verification.md`: inspected; no affected source paths required changes.
- `tests/propertyMap.test.mjs`: updated eight module loading paths; test logic unchanged.

## Verification

- `npm run lint`: passed before and after the migration.
- `npm run build`: passed. The initial sandbox run was blocked by filesystem access in esbuild; the approved rerun succeeded.
- `node --test tests/propertyMap.test.mjs pwa/pwa.test.mjs`: 15 passed, 0 failed.
- `git diff --check`: passed.
- Full source tree compared against the requested tree: all 141 expected files present, plus the preserved contact API.
- Content comparison of all 141 non-inventory source files: identical except import paths and the explicitly authorized document component rename.
- XML inventories parse; all Map inventory file links exist.
- No replaced data, presentation, features or domain source directories remain; no imports point to the former locations.
- Historical paths remain only as the former-location records in this report. The historical mention of `tsconfig.tests.json` in `docs/save-progress.md` is preserved.
- No browser interaction or live backend checks were performed for this structure-only migration.
