CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(20) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  date_submitted TIMESTAMP NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  category VARCHAR(50) NOT NULL,
  attachment_path VARCHAR(255),
  attachment_filename VARCHAR(255),
  related_item_id VARCHAR(50),
  
  CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

-- Create index for better query performance
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_date ON support_tickets(date_submitted DESC); 