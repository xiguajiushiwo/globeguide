CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE "Place" (
  "id" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "countryCode" VARCHAR(2) NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "timeZone" TEXT NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "dataRegion" TEXT NOT NULL DEFAULT 'global',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "location" geography(Point, 4326),
  CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaceName" (
  "id" UUID NOT NULL,
  "placeId" UUID NOT NULL,
  "locale" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "isPreferred" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "PlaceName_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaceRelation" (
  "id" UUID NOT NULL,
  "parentId" UUID NOT NULL,
  "childId" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  CONSTRAINT "PlaceRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Source" (
  "id" UUID NOT NULL,
  "placeId" UUID,
  "label" TEXT NOT NULL,
  "url" TEXT,
  "sourceType" TEXT NOT NULL,
  "license" TEXT,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FactVersion" (
  "id" UUID NOT NULL,
  "placeId" UUID NOT NULL,
  "sourceId" UUID,
  "key" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FactVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlaceName_placeId_locale_value_key" ON "PlaceName" ("placeId", "locale", "value");
CREATE UNIQUE INDEX "PlaceRelation_parentId_childId_kind_key" ON "PlaceRelation" ("parentId", "childId", "kind");
CREATE INDEX "PlaceName_locale_value_idx" ON "PlaceName" ("locale", "value");
CREATE INDEX "Place_countryCode_kind_idx" ON "Place" ("countryCode", "kind");
CREATE INDEX "Place_updatedAt_id_idx" ON "Place" ("updatedAt", "id");
CREATE INDEX "FactVersion_placeId_key_status_idx" ON "FactVersion" ("placeId", "key", "status");
CREATE INDEX "Place_location_gist" ON "Place" USING GIST ("location");

ALTER TABLE "PlaceName" ADD CONSTRAINT "PlaceName_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceRelation" ADD CONSTRAINT "PlaceRelation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceRelation" ADD CONSTRAINT "PlaceRelation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Source" ADD CONSTRAINT "Source_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FactVersion" ADD CONSTRAINT "FactVersion_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FactVersion" ADD CONSTRAINT "FactVersion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
