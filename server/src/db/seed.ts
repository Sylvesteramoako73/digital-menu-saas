import bcrypt from "bcryptjs";
import { pool } from "./pool";

const DEMO_PASSWORD_ROUNDS = 10;

interface SeedItem {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  is_available?: boolean;
}

interface SeedCategory {
  name: string;
  description: string;
  items: SeedItem[];
}

interface SeedVendor {
  business_name: string;
  slug: string;
  logo_url: string;
  location: string;
  hours: string;
  prep_time: string;
  email: string;
  password: string;
  categories: SeedCategory[];
}

const VENDORS: SeedVendor[] = [
  {
    business_name: "Welly Foods",
    slug: "welly-foods",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=welly-foods",
    location: "Osu, Accra",
    hours: "9:00 AM - 9:00 PM",
    prep_time: "20-30 min",
    email: "vendor@wellyfoods.com",
    password: "welly123",
    categories: [
      {
        name: "Starters",
        description: "Small bites to begin your meal",
        items: [
          { name: "Spring Rolls", description: "Crispy vegetable spring rolls with sweet chili dip", price: 18, image_url: "https://placehold.co/400x400/292524/f59e0b?text=Spring+Rolls" },
          { name: "Chicken Wings", description: "Grilled wings tossed in spicy pepper sauce", price: 35, image_url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400" },
        ],
      },
      {
        name: "Mains",
        description: "Hearty Ghanaian classics",
        items: [
          { name: "Jollof Rice & Chicken", description: "Smoky party jollof with grilled chicken and salad", price: 45, original_price: 55, image_url: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400" },
          { name: "Banku & Tilapia", description: "Fermented corn dough with grilled tilapia and pepper sauce", price: 55, image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400" },
          { name: "Waakye Special", description: "Rice and beans with gari, spaghetti, egg and beef stew", price: 40, image_url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400" },
        ],
      },
      {
        name: "Drinks",
        description: "Cold and refreshing",
        items: [
          { name: "Sobolo", description: "Hibiscus drink with ginger and pineapple", price: 12, image_url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },
        ],
      },
    ],
  },
  {
    business_name: "Accra Bites",
    slug: "accra-bites",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=accra-bites",
    location: "East Legon, Accra",
    hours: "10:00 AM - 10:00 PM",
    prep_time: "15-25 min",
    email: "vendor@accrabites.com",
    password: "accra123",
    categories: [
      {
        name: "Street Food",
        description: "Quick favorites on the go",
        items: [
          { name: "Kelewele", description: "Spiced fried plantain with roasted peanuts", price: 15, image_url: "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=400" },
          { name: "Meat Pie", description: "Flaky pastry filled with seasoned minced beef", price: 10, image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
          { name: "Grilled Corn", description: "Charcoal grilled corn with a hint of chili butter", price: 8, image_url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400", is_available: false },
        ],
      },
      {
        name: "Combo Meals",
        description: "Filling plates for the full experience",
        items: [
          { name: "Fried Rice & Chicken", description: "Vegetable fried rice with crispy fried chicken", price: 38, image_url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" },
        ],
      },
    ],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const vendor of VENDORS) {
      await client.query("DELETE FROM vendors WHERE slug = $1", [vendor.slug]);

      const vendorResult = await client.query(
        `INSERT INTO vendors (business_name, slug, logo_url, location, hours, prep_time)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [vendor.business_name, vendor.slug, vendor.logo_url, vendor.location, vendor.hours, vendor.prep_time]
      );
      const vendorId = vendorResult.rows[0].id;

      const passwordHash = bcrypt.hashSync(vendor.password, DEMO_PASSWORD_ROUNDS);
      await client.query(
        `INSERT INTO vendor_auth (vendor_id, email, password_hash) VALUES ($1, $2, $3)`,
        [vendorId, vendor.email, passwordHash]
      );

      for (let i = 0; i < vendor.categories.length; i++) {
        const category = vendor.categories[i];
        const categoryResult = await client.query(
          `INSERT INTO categories (vendor_id, name, description, order_index)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [vendorId, category.name, category.description, i]
        );
        const categoryId = categoryResult.rows[0].id;

        for (const item of category.items) {
          await client.query(
            `INSERT INTO menu_items (category_id, name, description, price, original_price, image_url, is_available)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              categoryId,
              item.name,
              item.description,
              item.price,
              item.original_price ?? null,
              item.image_url,
              item.is_available ?? true,
            ]
          );
        }
      }

      console.log(`Seeded ${vendor.business_name} (/${vendor.slug}) — login: ${vendor.email} / ${vendor.password}`);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => {
    console.log("Seed complete.");
    return pool.end();
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    return pool.end().finally(() => process.exit(1));
  });
