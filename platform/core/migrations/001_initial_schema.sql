-- PlantOS Initial Schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Asset Domain
CREATE TABLE IF NOT EXISTS plantos_equipment (
    id UUID PRIMARY KEY,
    tag VARCHAR(255) UNIQUE NOT NULL,
    business_code VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '[]',
    properties JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
);

-- Index for capability searching (GIN index for JSONB)
CREATE INDEX idx_equipment_capabilities ON plantos_equipment USING GIN (capabilities);
CREATE INDEX idx_equipment_tag ON plantos_equipment (tag);


-- MES Domain
CREATE TABLE IF NOT EXISTS plantos_batches (
    id UUID PRIMARY KEY,
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    recipe_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    planned_quantity NUMERIC(15,4) NOT NULL,
    actual_quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_batches_status ON plantos_batches (status);
CREATE INDEX idx_batches_recipe ON plantos_batches (recipe_id);
