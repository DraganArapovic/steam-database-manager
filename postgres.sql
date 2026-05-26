-- ============================================================
--  PostgreSQL  –  Steam v2.0 setup
--  Run as: postgres (superuser)
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE USER steam_admin WITH PASSWORD 'admin_pass';
CREATE USER steam_guest WITH PASSWORD 'guest_pass';

GRANT ALL PRIVILEGES ON DATABASE steamdb TO steam_admin;

-- ── Schema ───────────────────────────────────────────────────
CREATE TABLE platform (
    platform_id  INT         NOT NULL,
    name         VARCHAR(32) NOT NULL,
    CONSTRAINT pk_platform      PRIMARY KEY (platform_id),
    CONSTRAINT uq_platform_name UNIQUE (name)
);

CREATE TABLE genre (
    genre_id  INT         NOT NULL,
    name      VARCHAR(64) NOT NULL,
    CONSTRAINT pk_genre      PRIMARY KEY (genre_id),
    CONSTRAINT uq_genre_name UNIQUE (name)
);

CREATE TABLE developer (
    developer_id  INT          NOT NULL,
    name          VARCHAR(128) NOT NULL,
    country_code  CHAR(2),
    founded_year  SMALLINT,
    CONSTRAINT pk_developer PRIMARY KEY (developer_id)
);

CREATE TABLE publisher (
    publisher_id  INT          NOT NULL,
    name          VARCHAR(128) NOT NULL,
    country_code  CHAR(2),
    CONSTRAINT pk_publisher PRIMARY KEY (publisher_id)
);

CREATE TABLE game (
    game_id          INT            NOT NULL,
    title            VARCHAR(255)   NOT NULL,
    description      TEXT,
    release_date     DATE,
    base_price       DECIMAL(6,2)   NOT NULL,
    is_early_access  BOOLEAN        NOT NULL DEFAULT FALSE,
    age_rating       SMALLINT,
    developer_id     INT            NOT NULL,
    publisher_id     INT            NOT NULL,
    CONSTRAINT pk_game           PRIMARY KEY (game_id),
    CONSTRAINT fk_game_developer FOREIGN KEY (developer_id) REFERENCES developer(developer_id),
    CONSTRAINT fk_game_publisher FOREIGN KEY (publisher_id) REFERENCES publisher(publisher_id)
);

CREATE TABLE game_genre (
    game_id   INT NOT NULL,
    genre_id  INT NOT NULL,
    CONSTRAINT pk_game_genre PRIMARY KEY (game_id, genre_id),
    CONSTRAINT fk_gg_game    FOREIGN KEY (game_id)  REFERENCES game(game_id),
    CONSTRAINT fk_gg_genre   FOREIGN KEY (genre_id) REFERENCES genre(genre_id)
);

CREATE TABLE game_platform (
    game_id     INT NOT NULL,
    platform_id INT NOT NULL,
    CONSTRAINT pk_game_platform PRIMARY KEY (game_id, platform_id),
    CONSTRAINT fk_gp_game       FOREIGN KEY (game_id)     REFERENCES game(game_id),
    CONSTRAINT fk_gp_platform   FOREIGN KEY (platform_id) REFERENCES platform(platform_id)
);

CREATE TABLE app_user (
    user_id         INT            NOT NULL,
    username        VARCHAR(32)    NOT NULL,
    email           VARCHAR(255)   NOT NULL,
    password_hash   CHAR(64)       NOT NULL,
    display_name    VARCHAR(64)    NOT NULL,
    country_code    CHAR(2),
    wallet_balance  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    is_banned       BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP      NOT NULL,
    CONSTRAINT pk_user          PRIMARY KEY (user_id),
    CONSTRAINT uq_user_username UNIQUE (username),
    CONSTRAINT uq_user_email    UNIQUE (email)
);

CREATE TABLE friend (
    requester_id  INT        NOT NULL,
    addressee_id  INT        NOT NULL,
    status        VARCHAR(8) NOT NULL,
    created_at    TIMESTAMP  NOT NULL,
    CONSTRAINT pk_friend           PRIMARY KEY (requester_id, addressee_id),
    CONSTRAINT fk_friend_requester FOREIGN KEY (requester_id) REFERENCES app_user(user_id),
    CONSTRAINT fk_friend_addressee FOREIGN KEY (addressee_id) REFERENCES app_user(user_id),
    CONSTRAINT ck_friend_no_self   CHECK (requester_id <> addressee_id),
    CONSTRAINT ck_friend_status    CHECK (status IN ('pending','accepted','blocked'))
);

CREATE TABLE library_entry (
    user_id           INT       NOT NULL,
    game_id           INT       NOT NULL,
    acquired_at       TIMESTAMP NOT NULL,
    playtime_minutes  INT       NOT NULL DEFAULT 0,
    last_played_at    TIMESTAMP,
    is_hidden         BOOLEAN   NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_library_entry PRIMARY KEY (user_id, game_id),
    CONSTRAINT fk_le_user       FOREIGN KEY (user_id) REFERENCES app_user(user_id),
    CONSTRAINT fk_le_game       FOREIGN KEY (game_id) REFERENCES game(game_id)
);

-- ── View ─────────────────────────────────────────────────────
-- Shows each game with its developer, publisher, price, and
-- a comma-separated list of genres.
CREATE OR REPLACE VIEW v_game_overview AS
SELECT
    g.game_id,
    g.title,
    g.base_price,
    g.release_date,
    g.is_early_access,
    d.name  AS developer,
    p.name  AS publisher,
    STRING_AGG(ge.name, ', ' ORDER BY ge.name) AS genres
FROM game g
JOIN developer  d  ON d.developer_id = g.developer_id
JOIN publisher  p  ON p.publisher_id = g.publisher_id
LEFT JOIN game_genre    gg ON gg.game_id  = g.game_id
LEFT JOIN genre         ge ON ge.genre_id = gg.genre_id
GROUP BY g.game_id, g.title, g.base_price, g.release_date,
         g.is_early_access, d.name, p.name;

-- ── Sample data ──────────────────────────────────────────────
INSERT INTO platform VALUES (1,'Windows'),(2,'Linux'),(3,'macOS'),(4,'PlayStation 5'),(5,'Xbox Series X');

INSERT INTO genre VALUES (1,'Action'),(2,'Adventure'),(3,'RPG'),(4,'Strategy'),(5,'Puzzle');

INSERT INTO developer VALUES
    (1,'Valve Corporation',       'US', 1996),
    (2,'CD Projekt Red',          'PL', 1994),
    (3,'Larian Studios',          'BE', 1996),
    (4,'Subset Games',            'US', 2011),
    (5,'Mojang Studios',          'SE', 2009);

INSERT INTO publisher VALUES
    (1,'Valve Corporation',       'US'),
    (2,'CD Projekt',              'PL'),
    (3,'Larian Studios',          'BE'),
    (4,'Subset Games',            'US'),
    (5,'Mojang Studios',          'SE');

INSERT INTO game VALUES
    (1,'Half-Life: Alyx',        'VR flagship shooter',         '2020-03-23', 59.99, FALSE, 18, 1, 1),
    (2,'The Witcher 3',          'Open-world fantasy RPG',      '2015-05-19', 39.99, FALSE, 18, 2, 2),
    (3,'Baldur''s Gate 3',       'Turn-based D&D RPG',          '2023-08-03', 59.99, FALSE, 18, 3, 3),
    (4,'FTL: Faster Than Light', 'Spaceship roguelike',         '2012-09-14',  9.99, FALSE, 12, 4, 4),
    (5,'Minecraft',              'Sandbox survival / creative', '2011-11-18', 26.95, FALSE,  7, 5, 5);

INSERT INTO game_genre VALUES
    (1,1),(2,2),(2,3),(3,2),(3,3),(4,4),(4,1),(5,2);

INSERT INTO game_platform VALUES
    (1,1),(2,1),(2,2),(2,3),(3,1),(3,2),(4,1),(5,1),(5,2),(5,3);

INSERT INTO app_user VALUES
    (1,'alice',   'alice@example.com',   REPEAT('a',64), 'Alice',   'US', 50.00, FALSE, NOW()),
    (2,'bob',     'bob@example.com',     REPEAT('b',64), 'Bob',     'GB', 20.00, FALSE, NOW()),
    (3,'charlie', 'charlie@example.com', REPEAT('c',64), 'Charlie', 'DE',  0.00, FALSE, NOW()),
    (4,'diana',   'diana@example.com',   REPEAT('d',64), 'Diana',   'BA', 10.00, FALSE, NOW()),
    (5,'eve',     'eve@example.com',     REPEAT('e',64), 'Eve',     'FR',  5.00, TRUE,  NOW());

INSERT INTO library_entry VALUES
    (1,1,NOW()-INTERVAL '30 days',120, NOW()-INTERVAL '1 day', FALSE),
    (1,3,NOW()-INTERVAL '10 days',300, NOW(),                  FALSE),
    (2,2,NOW()-INTERVAL '60 days',500, NOW()-INTERVAL '5 days',FALSE),
    (3,4,NOW()-INTERVAL '90 days', 45, NULL,                   FALSE),
    (4,5,NOW()-INTERVAL '20 days',200, NOW()-INTERVAL '3 days',FALSE);

-- ── Guest permissions ─────────────────────────────────────────
GRANT CONNECT ON DATABASE steamdb TO steam_guest;
GRANT USAGE   ON SCHEMA public   TO steam_guest;
GRANT SELECT  ON ALL TABLES IN SCHEMA public TO steam_guest;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO steam_guest;

-- Admin gets full schema-level rights
GRANT USAGE, CREATE ON SCHEMA public TO steam_admin;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO steam_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO steam_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES    TO steam_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO steam_admin;