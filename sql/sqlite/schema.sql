CREATE TABLE IF NOT EXISTS eztags (
    id INTEGER NOT NULL,
    parent_id INTEGER NOT NULL DEFAULT 0,
    main_tag_id INTEGER NOT NULL DEFAULT 0,
    keyword TEXT NOT NULL DEFAULT '',
    depth INTEGER NOT NULL DEFAULT 1,
    path_string TEXT NOT NULL DEFAULT '',
    modified INTEGER NOT NULL DEFAULT 0,
    remote_id TEXT NOT NULL DEFAULT '',
    main_language_id INTEGER NOT NULL DEFAULT 0,
    language_mask INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ( id )
);

CREATE INDEX IF NOT EXISTS idx_eztags_keyword ON eztags ( keyword );
CREATE INDEX IF NOT EXISTS idx_eztags_keyword_id ON eztags ( keyword, id );
CREATE UNIQUE INDEX IF NOT EXISTS idx_eztags_remote_id ON eztags ( remote_id );

CREATE TABLE IF NOT EXISTS eztags_attribute_link (
    id INTEGER NOT NULL,
    keyword_id INTEGER NOT NULL DEFAULT 0,
    objectattribute_id INTEGER NOT NULL DEFAULT 0,
    objectattribute_version INTEGER NOT NULL DEFAULT 0,
    object_id INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ( id )
);

CREATE INDEX IF NOT EXISTS idx_eztags_attr_link_keyword_id ON eztags_attribute_link ( keyword_id );
CREATE INDEX IF NOT EXISTS idx_eztags_attr_link_kid_oaid_oav ON eztags_attribute_link ( keyword_id, objectattribute_id, objectattribute_version );
CREATE INDEX IF NOT EXISTS idx_eztags_attr_link_kid_oid ON eztags_attribute_link ( keyword_id, object_id );
CREATE INDEX IF NOT EXISTS idx_eztags_attr_link_oaid_oav ON eztags_attribute_link ( objectattribute_id, objectattribute_version );

CREATE TABLE IF NOT EXISTS eztags_keyword (
    keyword_id INTEGER NOT NULL DEFAULT 0,
    language_id INTEGER NOT NULL DEFAULT 0,
    keyword TEXT NOT NULL DEFAULT '',
    locale TEXT NOT NULL DEFAULT '',
    status INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ( keyword_id, locale )
);
