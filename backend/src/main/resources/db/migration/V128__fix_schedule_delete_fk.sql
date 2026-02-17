-- Add FK on class_sessions.schedule_id with ON DELETE SET NULL.
-- Allows deleting class_schedules; sessions survive with schedule_id = NULL.
ALTER TABLE class_sessions ADD CONSTRAINT fk_class_sessions_schedule
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id) ON DELETE SET NULL;
