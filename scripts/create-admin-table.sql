-- Run this on your RDS postgres database (e.g. via psql or AWS Query Editor)
-- Creates admin schema and tbl_admin for login

CREATE SCHEMA IF NOT EXISTS admin;

CREATE TABLE IF NOT EXISTS admin.tbl_admin (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255),
    emailid VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    status_enum_id INT NOT NULL DEFAULT 1,
    user_type_enum_id INT NOT NULL DEFAULT 4,
    createdon_date TIMESTAMPTZ DEFAULT NOW(),
    updatedon_date TIMESTAMPTZ,
    createdby_login_user_id INT,
    updated_login_user_id INT,
    admin_auth_token TEXT[] DEFAULT '{}',
    user_auth_token TEXT[] DEFAULT '{}'
);

-- Create index for login lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_admin_emailid ON admin.tbl_admin (LOWER(TRIM(emailid)));

-- Insert default admin (password: admin@123) — run once
INSERT INTO admin.tbl_admin (user_name, emailid, password, mobile, status_enum_id, user_type_enum_id, createdon_date)
SELECT 'Admin', 'admin@gmail.com', 'admin@123', '9999999999', 1, 4, NOW()
WHERE NOT EXISTS (SELECT 1 FROM admin.tbl_admin WHERE LOWER(TRIM(emailid)) = 'admin@gmail.com');
