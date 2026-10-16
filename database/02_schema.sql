CREATE TABLE customers (
    customer_id         NUMBER GENERATED ALWAYS AS IDENTITY
                        (START WITH 1 INCREMENT BY 1 NOCACHE),
    measurement_page_no VARCHAR2(20)  NOT NULL,
    full_name           VARCHAR2(150) NOT NULL,
    phone_number        VARCHAR2(20)  NOT NULL,
    storage_number      VARCHAR2(30)  NOT NULL,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by          VARCHAR2(50),
    updated_by          VARCHAR2(50),
    is_deleted          NUMBER(1)     DEFAULT 0 NOT NULL,
    CONSTRAINT pk_customers PRIMARY KEY (customer_id),
    CONSTRAINT chk_customers_deleted CHECK (is_deleted IN (0, 1))
);

CREATE TABLE customer_images (
    image_id       NUMBER GENERATED ALWAYS AS IDENTITY
                   (START WITH 1 INCREMENT BY 1 NOCACHE),
    customer_id    NUMBER        NOT NULL,
    file_path      VARCHAR2(500) NOT NULL,
    file_name      VARCHAR2(200) NOT NULL,
    captured_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    file_size      NUMBER(12)    NOT NULL,
    sha256_hash    VARCHAR2(64)  NOT NULL,
    is_primary     NUMBER(1)     DEFAULT 1 NOT NULL,
    notes          VARCHAR2(500),
    CONSTRAINT pk_customer_images PRIMARY KEY (image_id),
    CONSTRAINT fk_images_customer FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id) ON DELETE CASCADE,
    CONSTRAINT chk_images_size CHECK (file_size > 0),
    CONSTRAINT chk_images_primary CHECK (is_primary IN (0, 1))
);

CREATE TABLE users (
    user_id         NUMBER GENERATED ALWAYS AS IDENTITY
                    (START WITH 1 INCREMENT BY 1 NOCACHE),
    username        VARCHAR2(50)  NOT NULL,
    password_hash   VARCHAR2(255) NOT NULL,
    full_name       VARCHAR2(150),
    role            VARCHAR2(20)  NOT NULL,
    is_active       NUMBER(1)     DEFAULT 1 NOT NULL,
    failed_attempts NUMBER(3)     DEFAULT 0 NOT NULL,
    locked_until    TIMESTAMP,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login      TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    CONSTRAINT chk_users_active CHECK (is_active IN (0, 1))
);

CREATE TABLE audit_log (
    log_id       NUMBER GENERATED ALWAYS AS IDENTITY
                 (START WITH 1 INCREMENT BY 1 NOCACHE),
    user_id      NUMBER,
    username     VARCHAR2(50),
    action       VARCHAR2(50)  NOT NULL,
    entity_type  VARCHAR2(50),
    entity_id    VARCHAR2(50),
    details      VARCHAR2(2000),
    ip_address   VARCHAR2(50),
    result       VARCHAR2(20)  NOT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_audit_log PRIMARY KEY (log_id),
    CONSTRAINT chk_audit_result CHECK (result IN ('SUCCESS', 'FAILURE', 'WARNING'))
);

CREATE TABLE backup_log (
    backup_id      NUMBER GENERATED ALWAYS AS IDENTITY
                   (START WITH 1 INCREMENT BY 1 NOCACHE),
    backup_type    VARCHAR2(20)  NOT NULL,
    file_path      VARCHAR2(500) NOT NULL,
    file_size      NUMBER(15),
    status         VARCHAR2(20)  NOT NULL,
    verification   VARCHAR2(20),
    sha256_hash    VARCHAR2(64),
    started_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at   TIMESTAMP,
    notes          VARCHAR2(1000),
    CONSTRAINT pk_backup_log PRIMARY KEY (backup_id),
    CONSTRAINT chk_backup_type CHECK (backup_type IN ('MANUAL', 'DAILY', 'AUTO')),
    CONSTRAINT chk_backup_status CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
    CONSTRAINT chk_backup_verify CHECK (verification IN ('OK', 'CORRUPTED', 'PENDING'))
);

CREATE TABLE schema_version (
    version_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version      VARCHAR2(20)  NOT NULL,
    applied_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description  VARCHAR2(500)
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial schema');

COMMIT;