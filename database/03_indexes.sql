CREATE INDEX idx_customers_page_no     ON customers (measurement_page_no);
CREATE INDEX idx_customers_full_name   ON customers (full_name);
CREATE INDEX idx_customers_phone       ON customers (phone_number);
CREATE INDEX idx_customers_storage     ON customers (storage_number);
CREATE INDEX idx_customers_deleted     ON customers (is_deleted);

CREATE INDEX idx_images_customer       ON customer_images (customer_id);
CREATE INDEX idx_images_captured       ON customer_images (captured_at DESC);

CREATE INDEX idx_users_active          ON users (is_active);
CREATE INDEX idx_users_role            ON users (role);

CREATE INDEX idx_audit_user            ON audit_log (user_id);
CREATE INDEX idx_audit_action          ON audit_log (action);
CREATE INDEX idx_audit_created         ON audit_log (created_at DESC);

CREATE INDEX idx_backup_status         ON backup_log (status);
CREATE INDEX idx_backup_started        ON backup_log (started_at DESC);

COMMIT;