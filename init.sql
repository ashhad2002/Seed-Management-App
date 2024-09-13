CREATE TABLE SeedData (
    id SERIAL PRIMARY KEY,
    qr_code VARCHAR(255) NOT NULL,
    seed_id VARCHAR(255) NOT NULL,
    description TEXT,
    germinated BOOLEAN NOT NULL,
    vigorous BOOLEAN NOT NULL,
    small BOOLEAN NOT NULL,
    abnormal BOOLEAN NOT NULL,
    usable BOOLEAN NOT NULL,
    group_size INTEGER,
    day_number INTEGER,
    date_scanned DATE DEFAULT CURRENT_DATE,
    time_scanned TIME DEFAULT CURRENT_TIME,
    has_pictures BOOLEAN NOT NULL
);

CREATE TABLE SeedPictures (
    id SERIAL PRIMARY KEY,
    seed_data_id INTEGER NOT NULL,
    picture BYTEA NOT NULL,
    FOREIGN KEY (seed_data_id) REFERENCES SeedData(id) ON DELETE CASCADE
);