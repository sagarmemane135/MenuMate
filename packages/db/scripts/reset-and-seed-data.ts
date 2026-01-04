/**
 * Reset and seed realistic data for analytics demonstration
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

const email = process.argv[2] || "sagar1@test.com";

async function resetAndSeed() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log(`\n🔄 Resetting data for: ${email}\n`);

    // Get user and restaurant
    const [user] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (!user) {
      console.error("❌ User not found");
      process.exit(1);
    }

    const [restaurant] = await sql`
      SELECT id, name FROM restaurants WHERE owner_id = ${user.id}
    `;
    if (!restaurant) {
      console.error("❌ Restaurant not found");
      process.exit(1);
    }

    console.log(`✅ Found restaurant: ${restaurant.name} (${restaurant.id})`);

    // 1. Delete existing data
    console.log("\n🗑️  Deleting existing data...");
    
    await sql`DELETE FROM orders WHERE restaurant_id = ${restaurant.id}`;
    console.log("  ✓ Orders deleted");
    
    await sql`DELETE FROM table_sessions WHERE restaurant_id = ${restaurant.id}`;
    console.log("  ✓ Sessions deleted");
    
    await sql`DELETE FROM menu_items WHERE restaurant_id = ${restaurant.id}`;
    console.log("  ✓ Menu items deleted");
    
    await sql`DELETE FROM categories WHERE restaurant_id = ${restaurant.id}`;
    console.log("  ✓ Categories deleted");

    // 2. Create Categories
    console.log("\n📁 Creating categories...");
    const categories = [
      { name: "Starters", sortOrder: 1 },
      { name: "Main Course", sortOrder: 2 },
      { name: "Desserts", sortOrder: 3 },
      { name: "Beverages", sortOrder: 4 },
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const [created] = await sql`
        INSERT INTO categories (restaurant_id, name, sort_order)
        VALUES (${restaurant.id}, ${cat.name}, ${cat.sortOrder})
        RETURNING id, name
      `;
      createdCategories.push(created);
      console.log(`  ✓ ${created.name}`);
    }

    // 3. Create Menu Items
    console.log("\n🍽️  Creating menu items...");
    const menuItems = [
      // Starters
      { categoryId: createdCategories[0].id, name: "Spring Rolls", price: "120", sortOrder: 1 },
      { categoryId: createdCategories[0].id, name: "Chicken Wings", price: "180", sortOrder: 2 },
      { categoryId: createdCategories[0].id, name: "Paneer Tikka", price: "160", sortOrder: 3 },
      { categoryId: createdCategories[0].id, name: "Veg Manchurian", price: "140", sortOrder: 4 },
      
      // Main Course
      { categoryId: createdCategories[1].id, name: "Butter Chicken", price: "280", sortOrder: 1 },
      { categoryId: createdCategories[1].id, name: "Dal Makhani", price: "200", sortOrder: 2 },
      { categoryId: createdCategories[1].id, name: "Biryani", price: "250", sortOrder: 3 },
      { categoryId: createdCategories[1].id, name: "Hakka Noodles", price: "180", sortOrder: 4 },
      { categoryId: createdCategories[1].id, name: "Fried Rice", price: "160", sortOrder: 5 },
      { categoryId: createdCategories[1].id, name: "Paneer Butter Masala", price: "240", sortOrder: 6 },
      
      // Desserts
      { categoryId: createdCategories[2].id, name: "Gulab Jamun", price: "80", sortOrder: 1 },
      { categoryId: createdCategories[2].id, name: "Ice Cream", price: "100", sortOrder: 2 },
      { categoryId: createdCategories[2].id, name: "Brownie", price: "120", sortOrder: 3 },
      
      // Beverages
      { categoryId: createdCategories[3].id, name: "Soft Drink", price: "40", sortOrder: 1 },
      { categoryId: createdCategories[3].id, name: "Fresh Juice", price: "80", sortOrder: 2 },
      { categoryId: createdCategories[3].id, name: "Lassi", price: "60", sortOrder: 3 },
    ];

    const createdItems = [];
    for (const item of menuItems) {
      const [created] = await sql`
        INSERT INTO menu_items (restaurant_id, category_id, name, price, sort_order, is_available)
        VALUES (${restaurant.id}, ${item.categoryId}, ${item.name}, ${item.price}, ${item.sortOrder}, true)
        RETURNING id, name, price
      `;
      createdItems.push(created);
      console.log(`  ✓ ${created.name} - ₹${created.price}`);
    }

    // 4. Create realistic orders spread over last 30 days + current month
    console.log("\n📦 Creating orders (last 30 days + current month)...");
    
    const now = new Date();
    let totalOrders = 0;
    let totalRevenue = 0;

    // Generate orders for last 30 days
    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      
      // Skip if this date is in the current month (we'll fill current month separately)
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        continue;
      }
      
      // Vary orders per day (more on weekends)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const ordersToday = isWeekend ? Math.floor(Math.random() * 8) + 8 : Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < ordersToday; i++) {
        // Random hour during restaurant hours (11 AM - 11 PM)
        const hour = Math.floor(Math.random() * 12) + 11;
        const minute = Math.floor(Math.random() * 60);
        const orderTime = new Date(date);
        orderTime.setHours(hour, minute, 0, 0);
        
        // Random items (2-5 items per order)
        const numItems = Math.floor(Math.random() * 4) + 2;
        const orderItems = [];
        let orderTotal = 0;
        
        // Pick random items
        const selectedItems = [];
        for (let j = 0; j < numItems; j++) {
          const randomItem = createdItems[Math.floor(Math.random() * createdItems.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          const price = parseFloat(randomItem.price);
          
          orderItems.push({
            itemId: randomItem.id,
            name: randomItem.name,
            quantity,
            price,
          });
          
          orderTotal += quantity * price;
        }
        
        // Create session with realistic payment method mix (60% online, 40% counter)
        const tableNumber = Math.floor(Math.random() * 15) + 1;
        const paymentMethod = Math.random() > 0.4 ? 'online' : 'counter';
        const [session] = await sql`
          INSERT INTO table_sessions (
            restaurant_id, table_number, session_token, status, 
            total_amount, payment_method, payment_status, started_at
          )
          VALUES (
            ${restaurant.id}, ${tableNumber}, 
            ${`session_${Date.now()}_${Math.random()}`}, 
            'closed', ${orderTotal}, ${paymentMethod}, 'completed', ${orderTime}
          )
          RETURNING id
        `;
        
        // Create order
        await sql`
          INSERT INTO orders (
            restaurant_id, session_id, customer_name, customer_phone,
            table_number, items, total_amount, status, is_paid, 
            payment_status, created_at
          )
          VALUES (
            ${restaurant.id}, ${session.id}, 
            ${`Customer ${Math.floor(Math.random() * 100)}`},
            ${`98765${Math.floor(Math.random() * 90000) + 10000}`},
            ${tableNumber}, ${JSON.stringify(orderItems)}, 
            ${orderTotal}, 'served', true, 'completed', ${orderTime}
          )
        `;
        
        totalOrders++;
        totalRevenue += orderTotal;
      }
    }

    // Fill current month with complete data (from day 1 to today)
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();
    
    for (let day = 1; day <= today; day++) {
      const date = new Date(currentYear, currentMonth, day);
      
      // Vary orders per day (more on weekends)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const ordersToday = isWeekend ? Math.floor(Math.random() * 8) + 8 : Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < ordersToday; i++) {
        // Random hour during restaurant hours (11 AM - 11 PM)
        const hour = Math.floor(Math.random() * 12) + 11;
        const minute = Math.floor(Math.random() * 60);
        const orderTime = new Date(date);
        orderTime.setHours(hour, minute, 0, 0);
        
        // Random items (2-5 items per order)
        const numItems = Math.floor(Math.random() * 4) + 2;
        const orderItems = [];
        let orderTotal = 0;
        
        // Pick random items
        for (let j = 0; j < numItems; j++) {
          const randomItem = createdItems[Math.floor(Math.random() * createdItems.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          const price = parseFloat(randomItem.price);
          
          orderItems.push({
            itemId: randomItem.id,
            name: randomItem.name,
            quantity,
            price,
          });
          
          orderTotal += quantity * price;
        }
        
        // Create session with realistic payment method mix (60% online, 40% counter)
        const tableNumber = Math.floor(Math.random() * 15) + 1;
        const paymentMethod = Math.random() > 0.4 ? 'online' : 'counter';
        const [session] = await sql`
          INSERT INTO table_sessions (
            restaurant_id, table_number, session_token, status, 
            total_amount, payment_method, payment_status, started_at
          )
          VALUES (
            ${restaurant.id}, ${tableNumber}, 
            ${`session_${Date.now()}_${Math.random()}`}, 
            'closed', ${orderTotal}, ${paymentMethod}, 'completed', ${orderTime}
          )
          RETURNING id
        `;
        
        // Create order
        await sql`
          INSERT INTO orders (
            restaurant_id, session_id, customer_name, customer_phone,
            table_number, items, total_amount, status, is_paid, 
            payment_status, created_at
          )
          VALUES (
            ${restaurant.id}, ${session.id}, 
            ${`Customer ${Math.floor(Math.random() * 100)}`},
            ${`98765${Math.floor(Math.random() * 90000) + 10000}`},
            ${tableNumber}, ${JSON.stringify(orderItems)}, 
            ${orderTotal}, 'served', true, 'completed', ${orderTime}
          )
        `;
        
        totalOrders++;
        totalRevenue += orderTotal;
      }
    }

    console.log(`  ✓ Created ${totalOrders} orders`);
    console.log(`  ✓ Total Revenue: ₹${totalRevenue.toFixed(2)}`);

    // 5. Create some active sessions for dashboard
    console.log("\n👥 Creating active sessions...");
    const activeTables = [3, 7, 12];
    for (const table of activeTables) {
      await sql`
        INSERT INTO table_sessions (
          restaurant_id, table_number, session_token, status,
          total_amount, payment_method, payment_status, started_at
        )
        VALUES (
          ${restaurant.id}, ${table},
          ${`session_${Date.now()}_${table}`},
          'active', 0, 'pending', 'pending', NOW()
        )
      `;
    }
    console.log(`  ✓ Created ${activeTables.length} active sessions`);
    
    // 6. Create pending counter payment requests (for demo)
    console.log("\n💰 Creating pending counter payments...");
    const counterPaymentTables = [5, 8, 11];
    for (const table of counterPaymentTables) {
      const counterTotal = Math.floor(Math.random() * 500) + 200;
      await sql`
        INSERT INTO table_sessions (
          restaurant_id, table_number, session_token, status,
          total_amount, payment_method, payment_status, started_at
        )
        VALUES (
          ${restaurant.id}, ${table},
          ${`session_${Date.now()}_counter_${table}`},
          'active', ${counterTotal}, 'counter', 'pending', NOW()
        )
      `;
    }
    console.log(`  ✓ Created ${counterPaymentTables.length} pending counter payments`);

    console.log("\n✅ Data reset and seeded successfully!");
    console.log("\n📊 Your analytics dashboards are now ready with realistic data!");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetAndSeed();

