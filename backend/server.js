require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

const app = express();
const port = 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';


if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

app.use(cors());
app.use(express.json());
// Serve storage for pdfs and images
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Database Connection
const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'pdf_shop',
};

let pool;

async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        // Test connection
        await pool.query('SELECT 1');
        console.log("Connected to MySQL");
        
        // Ensure discount columns exist
        try {
            await pool.query(`
                ALTER TABLE products 
                ADD COLUMN discount_percent INT DEFAULT 0,
                ADD COLUMN is_discount_active BOOLEAN DEFAULT FALSE
            `);
            console.log("Added discount columns to products table.");
        } catch (err) {
            // Ignore error if columns already exist (Duplicate column name)
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.error("Error adding columns (might already exist):", err.message);
            }
        }

        // Ensure users table has reset columns
        try {
             await pool.query(`
                ALTER TABLE users 
                ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
                ADD COLUMN reset_token_expires BIGINT DEFAULT NULL
            `);
             console.log("Added reset columns to users table.");
        } catch (err) {
             if (err.code !== 'ER_DUP_FIELDNAME') {
                 // console.error("Error adding user columns:", err.message);
             }
        }

    } catch (err) {
        console.error("Error connecting to MySQL:", err);
        setTimeout(initDB, 5000); // Retry
    }
}
initDB();

// --- Multer Storage ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'storage');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Prevent dupes or overwrites by appending timestamp
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // We treat no token as guest (user_id = null) for some routes, or error for others
    // For now, let's attach user if valid, otherwise leave null
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) req.user = user;
            next();
        });
    } else {
        next();
    }
}

// --- Endpoints ---

app.get('/api/config', (req, res) => {
    res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// --- Rate Limiter for Password Reset ---
const resetRequestLog = new Map(); // Key: email, Value: timestamp

function checkResetRateLimit(email) {
    const now = Date.now();
    const lastRequest = resetRequestLog.get(email);
    const LIMIT_MS = 60 * 1000; // 60 seconds

    if (lastRequest && (now - lastRequest < LIMIT_MS)) {
        return false; // Rate limited
    }
    resetRequestLog.set(email, now);
    return true; // Allowed
}

// REQUEST PASSWORD RESET
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // 1. Rate Check
    if (!checkResetRateLimit(email)) {
        return res.status(429).json({ error: 'Please wait 60 seconds before requesting another reset link.' });
    }

    try {
        // 2. Check user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Security: Don't reveal user existence? 
            // For this project, we can just say "If email exists, sent." or return success.
            return res.json({ success: true, message: 'If that email exists, we sent a link.' }); 
        }
        const user = users[0];

        // 3. Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        // 4. Save to DB
        await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id]);

        // 5. Send Email
        const resetLink = `${process.env.DOMAIN}/reset-password?token=${token}`; // Assuming frontend is port 3000
        
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com', // Must be verified sender
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link to reset: ${resetLink}`,
            html: `
                <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #1a202c; margin-top: 0; text-align: center;">Reset Your Password</h2>
                    <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to choose a new one.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetLink}" style="background-color: #97050E; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Reset Password</a>
                    </div>
                    <p style="color: #718096; font-size: 14px; text-align: center;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #edf2f7;">
                        <p style="color: #a0aec0; font-size: 12px; word-break: break-all;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${resetLink}" style="color: #97050E;">${resetLink}</a>
                        </p>
                    </div>
                </div>
            `,
        };

        if (process.env.SENDGRID_API_KEY) {
            await sgMail.send(msg);
            console.log(`Reset email sent to ${email}`);
        } else {
            console.log('SENDGRID_API_KEY missing. Printing link:', resetLink);
        }

        res.json({ success: true, message: 'Reset link sent.' });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// RESET PASSWORD
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    try {
        // 1. Find user by token and check expiry
        const [users] = await pool.query(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?', 
            [token, Date.now()]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        const user = users[0];

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update User (Clear token)
        await pool.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', 
            [hashedPassword, user.id]
        );

        res.json({ success: true, message: 'Password reset successfully. You can now login.' });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// AUTH
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hashedPassword]);
        res.json({ success: true, userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

// Login Rate Limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { error: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

app.post('/api/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role || 'user' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// PRODUCTS
app.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        // Build filtering
        let filterQuery = " WHERE status = 'active'";
        let params = [];
        
        if (search) {
            filterQuery += " AND title LIKE ?";
            params.push(`%${search}%`);
        }

        // Get total count
        const [countResult] = await pool.query(`SELECT COUNT(*) as count FROM products${filterQuery}`, params);
        const total = countResult[0].count;

        // Get paginated data
        params.push(limit);
        params.push(offset);
        const [rows] = await pool.query(`SELECT id, title, description, price, image_url, discount_percent, is_discount_active FROM products${filterQuery} ORDER BY id DESC LIMIT ? OFFSET ?`, params);

        res.json({
            products: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id, title, description, price, image_url, status, discount_percent, is_discount_active FROM products WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN ONLY ROUTES
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// Update upload to handle fields
const uploadFields = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]);

app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        console.error("Error fetching admin products:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', authenticateToken, isAdmin, uploadFields, async (req, res) => {
    try {
        const { title, description, price, status, discount_percent, is_discount_active } = req.body;
        const files = req.files;

        if (!files || !files.pdf) return res.status(400).json({ error: 'PDF file is required' });
        if (!title || !price) return res.status(400).json({ error: 'Title and Price are required' });

        const pdfFilename = files.pdf[0].filename;
        const imageFilename = files.image ? files.image[0].filename : null;
        const productStatus = status || 'active';
        
        const discPercent = discount_percent || 0;
        const isDiscActive = is_discount_active === 'true' || is_discount_active === true ? 1 : 0;

        const [result] = await pool.query(
            'INSERT INTO products (title, description, price, filename, image_url, status, discount_percent, is_discount_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, price, pdfFilename, imageFilename, productStatus, discPercent, isDiscActive]
        );
        res.json({ success: true, productId: result.insertId, message: 'Product created successfully' });

    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', authenticateToken, isAdmin, uploadFields, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, status, discount_percent, is_discount_active } = req.body;
        const files = req.files; // might be empty

        // 1. Get existing product to keep filenames if not updated
        const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });
        
        let pdfFilename = existing[0].filename;
        let imageFilename = existing[0].image_url;

        if (files && files.pdf) {
            pdfFilename = files.pdf[0].filename;
            // Optionally delete old file
        }
        if (files && files.image) {
            imageFilename = files.image[0].filename;
        }
        
        const discPercent = discount_percent !== undefined ? discount_percent : existing[0].discount_percent;
        // Check for 'true' string or boolean true, handle "false" string logic if sent from FormData
        let isDiscActive = existing[0].is_discount_active;
        if (is_discount_active !== undefined) {
             isDiscActive = is_discount_active === 'true' || is_discount_active === true || is_discount_active === 1 ? 1 : 0;
        }

        await pool.query(
            'UPDATE products SET title = ?, description = ?, price = ?, filename = ?, image_url = ?, status = ?, discount_percent = ?, is_discount_active = ? WHERE id = ?',
            [title, description, price, pdfFilename, imageFilename, status || existing[0].status, discPercent, isDiscActive, id]
        );

        res.json({ success: true, message: 'Product updated successfully' });

    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Optionally delete files from storage
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/products/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/products/:id/download', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT filename, title FROM products WHERE id = ?', [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        
        const product = rows[0];
        if (!product.filename) return res.status(404).json({ error: 'No file attached to this product' });
        
        const filePath = path.join(__dirname, 'storage', product.filename);
        
        if (fs.existsSync(filePath)) {
            // Set Content-Disposition to force download with original filename if possible, or just product title
            // Note: res.download sets Content-Disposition automatically
            res.download(filePath, product.filename); 
        } else {
            res.status(404).json({ error: 'File not found on server' });
        }
    } catch (err) {
        console.error("Error downloading product:", err);
        res.status(500).json({ error: err.message });
    }
});

// ORDERS
app.get('/api/orders', authenticateToken, async (req, res) => {
    const userId = req.user ? req.user.userId : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [orders] = await pool.query(
            `SELECT * FROM orders WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC`,
            [userId]
        );
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// PAYMENT
app.post('/api/create-payment-intent', authenticateToken, async (req, res) => {
    const { items } = req.body; // Expecting [{ id: 1, quantity: 1 }]
    const userId = req.user ? req.user.userId : null;

    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    
    try {
        // Calculate Total Price Server-Side
        let totalAmount = 0;
        const dbItems = [];

        for (const item of items) {
           const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [item.id]);
           if (rows.length > 0) {
               let price = Number(rows[0].price);
               // Apply discount if active
               if (rows[0].is_discount_active && rows[0].discount_percent > 0) {
                   price = price * (100 - rows[0].discount_percent) / 100;
               }
               totalAmount += price;
               
               // Store the calculated price in the item for record keeping if needed
               // but we just push the full product row for now
               dbItems.push({ ...rows[0], final_price: price });
           }
        }

        const amountInSatang = Math.round(totalAmount * 100);

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInSatang,
            currency: 'thb',
            payment_method_types: ['card', 'promptpay'],
            metadata: { 
                userId: userId ? userId.toString() : 'guest',
                itemCount: items.length.toString() 
            }
        });

        // Create Order in DB
        const [result] = await pool.query(
            'INSERT INTO orders (stripe_payment_intent_id, user_id, status, total_amount, items, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [paymentIntent.id, userId, 'pending', totalAmount, JSON.stringify(items)]
        );

        res.send({
            clientSecret: paymentIntent.client_secret,
            orderId: result.insertId
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// VERIFY
app.post('/api/verify-payment', async (req, res) => {
    const { paymentIntentId } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            await pool.query('UPDATE orders SET status = "completed" WHERE stripe_payment_intent_id = ?', [paymentIntentId]);
            
            // Return order details (summary)
            const [rows] = await pool.query(
                `SELECT id, total_amount, items FROM orders WHERE stripe_payment_intent_id = ?`, 
                 [paymentIntentId]
            );
            
            if (rows.length > 0) {
                 res.json({ success: true, order: rows[0] });
            } else {
                 res.status(404).json({ error: 'Order not found' });
            }
        } else {
            res.json({ success: false, status: paymentIntent.status });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DOWNLOAD
app.get('/api/download/:orderId', authenticateToken, async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user ? req.user.userId : null;

    try {
        const [rows] = await pool.query(
            `SELECT items, status FROM orders WHERE id = ?`,
            [orderId]
        );

        if (rows.length === 0 || rows[0].status !== 'completed') {
            return res.status(403).send("Access denied.");
        }

        const items = rows[0].items; 
        let parsedItems = items;
        if (typeof items === 'string') parsedItems = JSON.parse(items);

        if (!parsedItems || parsedItems.length === 0) return res.status(404).send("No items.");

        const firstItemId = parsedItems[0].id; 
        
        const [products] = await pool.query('SELECT filename FROM products WHERE id = ?', [firstItemId]);
        if (products.length === 0) return res.status(404).send("Product file not found.");

        const filename = products[0].filename;
        const filePath = path.join(__dirname, 'storage', filename);

        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send("File not found on server.");
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// ADMIN STATS
app.get('/api/admin/dashboard-stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        // 1. Counts
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
        const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');

        // 2. Revenue & Sales (Grouped by Day - Last 30 Days)
        const [revenueData] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(total_amount) as revenue, COUNT(*) as sales
            FROM orders 
            WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY date 
            ORDER BY date ASC
        `);

        // 3. Top Sellers (Extract from JSON items is hard in simple SQL, so we fetch all completed orders and process in JS)
        // Note: For large scale, this should be a normalized table 'order_items'.
        const [orders] = await pool.query("SELECT items FROM orders WHERE status = 'completed'");
        const productSales = {};

        orders.forEach(order => {
             const items = order.items; // JSON column is auto-parsed by mysql2 usually, or need JSON.parse
             // mysql2 with JSON column returns object if configured? check. Assuming it returns object or string.
             let parsedItems = items;
             if (typeof items === 'string') parsedItems = JSON.parse(items);
             
             if (Array.isArray(parsedItems)) {
                 parsedItems.forEach(item => {
                     // item: { id, title, quantity, ... }
                     // Note: the JSON saved in create-payment-intent might be full product or just id/quant. 
                     // In create-payment-intent, we pushed: dbItems.push({ ...rows[0], final_price: price }); and saved that.
                     // So it should have title.
                     if (!productSales[item.title]) productSales[item.title] = 0;
                     productSales[item.title] += 1; // Count occurences (or quantity if we tracked it)
                 });
             }
        });

        // Convert to array and sort
        const topSellers = Object.entries(productSales)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 4. Recent Transactions
        const [recentTransactions] = await pool.query(`
            SELECT o.id, u.email, o.total_amount, o.created_at, o.status 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC LIMIT 5
        `);

        // 5. User Registrations Trend (Last 6 Months)
        const [userTrend] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `);

        res.json({
            counts: {
                users: userCount[0].count,
                products: productCount[0].count,
                orders: orderCount[0].count
            },
            revenueChart: revenueData,
            topSellers,
            recentTransactions,
            userTrend
        });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// USER MANAGEMENT
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CHANGE PASSWORD
app.post('/api/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields required' });

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
         res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
