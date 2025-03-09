-- Create user shipping addresses table
CREATE TABLE IF NOT EXISTS user_shipping_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_shipping_addresses_user_id ON user_shipping_addresses(user_id);

-- Set is_default to false for all other addresses when a new default is set
CREATE OR REPLACE FUNCTION update_default_shipping_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE user_shipping_addresses
        SET is_default = FALSE
        WHERE user_id = NEW.user_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default address management
CREATE OR REPLACE TRIGGER set_default_shipping_address
BEFORE INSERT OR UPDATE ON user_shipping_addresses
FOR EACH ROW
EXECUTE FUNCTION update_default_shipping_address(); 