-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  buying_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_received DECIMAL(10,2) NOT NULL,
  change_given DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for POS authentication
CREATE TABLE IF NOT EXISTS public.pos_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default users (Sir Mariko and employee)
INSERT INTO public.pos_users (username, password_hash, role) VALUES
('Sir Mariko', 'tina001', 'owner'),
('employee', 'sales25', 'employee')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, category, buying_price, selling_price, stock) VALUES
('Coca Cola', 'Beverages', 0.80, 1.50, 50),
('Bread', 'Bakery', 1.20, 2.00, 30),
('Milk', 'Dairy', 2.50, 3.50, 25),
('Chips', 'Snacks', 1.00, 2.50, 40),
('Water Bottle', 'Beverages', 0.30, 1.00, 100)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (though we'll use simple auth for this POS system)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_users ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we're handling auth in the app)
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Allow all operations on pos_users" ON public.pos_users FOR ALL USING (true);
