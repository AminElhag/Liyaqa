-- Fix: Add COMPLETED to class_bookings status check constraint
-- The Kotlin enum BookingStatus includes COMPLETED but the DB constraint was missing it,
-- causing HTTP 500 when completing a session (BookingService.completeBookingsForSession).

ALTER TABLE class_bookings DROP CONSTRAINT IF EXISTS class_bookings_status_check;
ALTER TABLE class_bookings ADD CONSTRAINT class_bookings_status_check
    CHECK (status IN ('CONFIRMED','WAITLISTED','CHECKED_IN','NO_SHOW','COMPLETED','CANCELLED'));
