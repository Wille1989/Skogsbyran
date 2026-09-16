# Property publication and schedules

`is_visible` remains the publication flag. `listing_status` remains the current sales status.
`publish_at`, `scheduled_listing_status` and `scheduled_status_at` are nullable schedule fields on `properties`.

The create/details APIs use `publishAt`, `scheduledListingStatus` and `scheduledStatusAt` in the existing details payload. Dates are explicit UTC ISO timestamps (`YYYY-MM-DDTHH:mm:ss.sssZ`). The form converts browser-local date/time to UTC; Laravel is configured for UTC. Send both status schedule fields together, or null for both to cancel. Publishing immediately cancels only the publication schedule.

`php artisan properties:apply-schedules` processes due changes transactionally. Laravel schedules it every minute. Repeated runs are safe and publication activities are emitted only on real visibility transitions.

For local development, the repository's `dev.cmd` (also called by `start.cmd`) starts `php artisan schedule:work` in the background. Alternatively run `php artisan schedule:work` in a terminal. The scheduler process must remain running for automatic execution.

On a deployed server configure the standard Laravel minute cron entry from the backend directory:

```text
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

Deployments must run the new migration before using the updated API. No existing property's visibility is changed by the migration.
