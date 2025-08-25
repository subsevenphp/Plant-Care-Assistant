-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "password" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileImage" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notificationPrefs" JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": false}',
    "refreshToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "wateringInterval" INTEGER NOT NULL,
    "lastWatered" TIMESTAMP(3),
    "nextWateringDue" TIMESTAMP(3),
    "lightRequirement" TEXT,
    "soilType" TEXT,
    "fertilizingInterval" INTEGER,
    "lastFertilized" TIMESTAMP(3),
    "healthStatus" TEXT NOT NULL DEFAULT 'healthy',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "careNotes" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plantId" TEXT NOT NULL,

    CONSTRAINT "care_events_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "plants_userId_idx" ON "plants"("userId");

-- CreateIndex
CREATE INDEX "plants_nextWateringDue_idx" ON "plants"("nextWateringDue");

-- CreateIndex
CREATE INDEX "plants_healthStatus_idx" ON "plants"("healthStatus");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "care_events_plantId_idx" ON "care_events"("plantId");

-- CreateIndex
CREATE INDEX "care_events_scheduledDate_idx" ON "care_events"("scheduledDate");

-- CreateIndex
CREATE INDEX "care_events_type_idx" ON "care_events"("type");

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_events" ADD CONSTRAINT "care_events_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert sample data (optional)
-- INSERT INTO "users" ("id", "email", "username", "password", "firstName", "lastName", "createdAt", "updatedAt") 
-- VALUES 
--     (gen_random_uuid()::text, 'demo@plantcare.com', 'demo_user', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwuWDhUDo.K0BZm', 'Demo', 'User', NOW(), NOW());

-- Create function to automatically update next_watering_due
CREATE OR REPLACE FUNCTION update_next_watering_due()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_watered IS NOT NULL AND NEW.watering_interval IS NOT NULL THEN
        NEW.next_watering_due := NEW.last_watered + INTERVAL '1 day' * NEW.watering_interval;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate next watering due date
CREATE TRIGGER trigger_update_next_watering_due
    BEFORE INSERT OR UPDATE ON "plants"
    FOR EACH ROW
    EXECUTE FUNCTION update_next_watering_due();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "sessions" WHERE "expires" < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get plants due for watering
CREATE OR REPLACE FUNCTION get_plants_due_for_watering(user_id_param TEXT DEFAULT NULL)
RETURNS TABLE(
    plant_id TEXT,
    plant_name TEXT,
    user_id TEXT,
    user_email TEXT,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as plant_id,
        p.name as plant_name,
        p."userId" as user_id,
        u.email as user_email,
        EXTRACT(DAY FROM (NOW() - p.next_watering_due))::INTEGER as days_overdue
    FROM plants p
    JOIN users u ON p."userId" = u.id
    WHERE 
        p.is_active = true 
        AND p.next_watering_due <= NOW()
        AND (user_id_param IS NULL OR p."userId" = user_id_param)
    ORDER BY p.next_watering_due ASC;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE "users" IS 'User accounts for the Plant Care Assistant application';
COMMENT ON TABLE "plants" IS 'Plants owned and managed by users';
COMMENT ON TABLE "sessions" IS 'User authentication sessions';
COMMENT ON TABLE "care_events" IS 'Plant care activities and reminders';

COMMENT ON COLUMN "plants"."wateringInterval" IS 'Number of days between watering cycles';
COMMENT ON COLUMN "plants"."healthStatus" IS 'Current health status: healthy, warning, critical';
COMMENT ON COLUMN "plants"."lightRequirement" IS 'Light requirement level: low, medium, high';
COMMENT ON COLUMN "users"."notificationPrefs" IS 'JSON object containing notification preferences';

-- Grant necessary permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;