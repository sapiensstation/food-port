import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const VENDORS = [
  { name: "Burger Barn", slug: "burger-barn", cuisine: "American", color: "#E63946", booth: 1 },
  { name: "Pizza Palace", slug: "pizza-palace", cuisine: "Italian", color: "#457B9D", booth: 2 },
  { name: "Taco Fiesta", slug: "taco-fiesta", cuisine: "Mexican", color: "#F4A261", booth: 3 },
  { name: "Wok & Roll", slug: "wok-and-roll", cuisine: "Chinese", color: "#E9C46A", booth: 4 },
  { name: "Juice Junction", slug: "juice-junction", cuisine: "Drinks", color: "#2A9D8F", booth: 5 },
  { name: "Spice Garden", slug: "spice-garden", cuisine: "Indian", color: "#E76F51", booth: 6 },
  { name: "Sushi Stop", slug: "sushi-stop", cuisine: "Japanese", color: "#264653", booth: 7 },
  { name: "Falafel House", slug: "falafel-house", cuisine: "Middle Eastern", color: "#6A994E", booth: 8 },
  { name: "Dessert Den", slug: "dessert-den", cuisine: "Desserts", color: "#9B5DE5", booth: 9 },
  { name: "BBQ Boss", slug: "bbq-boss", cuisine: "BBQ", color: "#CB4335", booth: 10 },
];

const MENU_TEMPLATES: Record<string, { categories: { name: string; items: { name: string; desc: string; price: number; tags: string[]; prepTime: number }[] }[] }> = {
  "burger-barn": {
    categories: [
      { name: "Burgers", items: [
        { name: "Classic Smash Burger", desc: "Double smash patty, American cheese, pickles, special sauce", price: 12.99, tags: [], prepTime: 10 },
        { name: "BBQ Bacon Burger", desc: "Beef patty, crispy bacon, BBQ sauce, onion rings", price: 14.99, tags: [], prepTime: 12 },
        { name: "Mushroom Swiss", desc: "Beef patty, sautéed mushrooms, Swiss cheese, garlic aioli", price: 13.99, tags: [], prepTime: 11 },
        { name: "Veggie Burger", desc: "Black bean patty, avocado, sprouts, chipotle mayo", price: 11.99, tags: ["vegan"], prepTime: 8 },
      ]},
      { name: "Sides", items: [
        { name: "Loaded Fries", desc: "Crispy fries with cheese sauce, bacon bits, jalapeños", price: 5.99, tags: [], prepTime: 6 },
        { name: "Onion Rings", desc: "Beer-battered thick-cut onion rings", price: 4.99, tags: [], prepTime: 7 },
      ]},
      { name: "Drinks", items: [
        { name: "Fountain Drink", desc: "Coke, Sprite, or Lemonade", price: 2.99, tags: [], prepTime: 2 },
        { name: "Milkshake", desc: "Vanilla, chocolate, or strawberry, 16oz", price: 5.99, tags: [], prepTime: 5 },
      ]},
    ],
  },
  "pizza-palace": {
    categories: [
      { name: "Pizzas", items: [
        { name: "Margherita", desc: "San Marzano tomato, fresh mozzarella, basil", price: 14.99, tags: ["vegetarian"], prepTime: 15 },
        { name: "Pepperoni Supreme", desc: "Triple pepperoni, mozzarella, oregano", price: 16.99, tags: [], prepTime: 15 },
        { name: "BBQ Chicken", desc: "BBQ sauce, grilled chicken, red onion, cilantro", price: 17.99, tags: [], prepTime: 16 },
        { name: "Veggie Medley", desc: "Bell peppers, mushrooms, olives, artichokes", price: 15.99, tags: ["vegan"], prepTime: 14 },
      ]},
      { name: "Pasta", items: [
        { name: "Spaghetti Bolognese", desc: "Slow-cooked beef ragu, Parmesan, fresh pasta", price: 13.99, tags: [], prepTime: 12 },
        { name: "Penne Arrabbiata", desc: "Spicy tomato, garlic, chilli, basil", price: 12.99, tags: ["vegan", "spicy"], prepTime: 10 },
      ]},
    ],
  },
  "taco-fiesta": {
    categories: [
      { name: "Tacos", items: [
        { name: "Carne Asada Taco", desc: "Grilled beef, pico de gallo, guac, lime", price: 4.50, tags: [], prepTime: 7 },
        { name: "Al Pastor Taco", desc: "Marinated pork, pineapple, cilantro", price: 4.50, tags: [], prepTime: 7 },
        { name: "Fish Taco", desc: "Beer-battered cod, slaw, chipotle crema", price: 5.00, tags: [], prepTime: 8 },
        { name: "Veggie Taco", desc: "Roasted peppers, black beans, cheese, salsa", price: 3.99, tags: ["vegetarian"], prepTime: 6 },
      ]},
      { name: "Bowls", items: [
        { name: "Burrito Bowl", desc: "Rice, beans, choice of protein, all the toppings", price: 10.99, tags: [], prepTime: 8 },
        { name: "Nachos Grande", desc: "Chips, cheese, jalapeños, guac, sour cream", price: 9.99, tags: ["vegetarian"], prepTime: 7 },
      ]},
    ],
  },
  "wok-and-roll": {
    categories: [
      { name: "Noodles", items: [
        { name: "Pad Thai", desc: "Rice noodles, shrimp, egg, bean sprouts, peanuts", price: 13.99, tags: [], prepTime: 10 },
        { name: "Lo Mein", desc: "Egg noodles, mixed vegetables, choice of protein", price: 12.99, tags: [], prepTime: 9 },
        { name: "Spicy Dan Dan Noodles", desc: "Sesame paste, chilli oil, pork mince", price: 13.99, tags: ["spicy"], prepTime: 10 },
      ]},
      { name: "Rice Dishes", items: [
        { name: "Fried Rice", desc: "Jasmine rice, egg, vegetables, soy sauce", price: 10.99, tags: [], prepTime: 8 },
        { name: "General Tso Chicken", desc: "Crispy chicken, sweet-spicy sauce, steamed rice", price: 14.99, tags: ["spicy"], prepTime: 12 },
      ]},
      { name: "Dim Sum", items: [
        { name: "Pork Dumplings (6pc)", desc: "Steamed pork and cabbage gyoza", price: 7.99, tags: [], prepTime: 8 },
        { name: "Spring Rolls (3pc)", desc: "Crispy veggie spring rolls, sweet chilli dip", price: 5.99, tags: ["vegan"], prepTime: 6 },
      ]},
    ],
  },
  "juice-junction": {
    categories: [
      { name: "Smoothies", items: [
        { name: "Mango Tango", desc: "Mango, pineapple, coconut milk, lime", price: 7.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
        { name: "Berry Blast", desc: "Mixed berries, banana, oat milk", price: 7.99, tags: ["vegan"], prepTime: 3 },
        { name: "Green Machine", desc: "Spinach, kale, apple, ginger, cucumber", price: 8.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
      ]},
      { name: "Fresh Juices", items: [
        { name: "Orange Squeeze", desc: "100% fresh squeezed oranges, 16oz", price: 5.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
        { name: "Watermelon Mint", desc: "Fresh watermelon, mint, hint of lime", price: 5.99, tags: ["vegan", "gluten_free"], prepTime: 3 },
      ]},
      { name: "Coffee & Tea", items: [
        { name: "Iced Latte", desc: "Double espresso, oat milk, vanilla, ice", price: 5.49, tags: [], prepTime: 3 },
        { name: "Thai Iced Tea", desc: "Strong black tea, condensed milk, ice", price: 4.99, tags: [], prepTime: 3 },
      ]},
    ],
  },
  "spice-garden": {
    categories: [
      { name: "Curries", items: [
        { name: "Butter Chicken", desc: "Tender chicken in creamy tomato sauce, basmati rice", price: 14.99, tags: ["gluten_free"], prepTime: 12 },
        { name: "Lamb Rogan Josh", desc: "Slow-cooked lamb, aromatic spices, naan", price: 16.99, tags: [], prepTime: 15 },
        { name: "Paneer Tikka Masala", desc: "Grilled paneer in spiced tomato gravy", price: 13.99, tags: ["vegetarian"], prepTime: 12 },
        { name: "Dal Makhani", desc: "Black lentils, butter, cream, ginger", price: 11.99, tags: ["vegetarian", "gluten_free"], prepTime: 10 },
      ]},
      { name: "Breads", items: [
        { name: "Garlic Naan", desc: "Tandoor-baked, garlic butter, coriander", price: 3.49, tags: [], prepTime: 5 },
        { name: "Paratha", desc: "Whole wheat flaky flatbread", price: 2.99, tags: ["vegetarian"], prepTime: 5 },
      ]},
    ],
  },
  "sushi-stop": {
    categories: [
      { name: "Rolls", items: [
        { name: "Dragon Roll", desc: "Shrimp tempura, cucumber, avocado, eel sauce", price: 14.99, tags: [], prepTime: 10 },
        { name: "Spicy Tuna Roll", desc: "Fresh tuna, spicy mayo, cucumber, sesame", price: 13.99, tags: ["gluten_free", "spicy"], prepTime: 10 },
        { name: "Rainbow Roll", desc: "California roll topped with assorted sashimi", price: 16.99, tags: [], prepTime: 12 },
        { name: "Veggie Roll", desc: "Cucumber, avocado, carrot, cream cheese", price: 9.99, tags: ["vegetarian"], prepTime: 8 },
      ]},
      { name: "Nigiri", items: [
        { name: "Salmon Nigiri (2pc)", desc: "Fresh Atlantic salmon over seasoned rice", price: 6.99, tags: ["gluten_free"], prepTime: 5 },
        { name: "Tuna Nigiri (2pc)", desc: "Premium yellowfin tuna over seasoned rice", price: 7.99, tags: ["gluten_free"], prepTime: 5 },
      ]},
    ],
  },
  "falafel-house": {
    categories: [
      { name: "Wraps", items: [
        { name: "Classic Falafel Wrap", desc: "Crispy falafel, hummus, tabbouleh, pickles, tahini", price: 10.99, tags: ["vegan"], prepTime: 7 },
        { name: "Shawarma Wrap", desc: "Spiced chicken, garlic sauce, sumac onions", price: 12.99, tags: [], prepTime: 8 },
        { name: "Grilled Halloumi Wrap", desc: "Halloumi, roasted veg, harissa, mint yoghurt", price: 11.99, tags: ["vegetarian"], prepTime: 8 },
      ]},
      { name: "Plates", items: [
        { name: "Mezze Plate", desc: "Hummus, baba ganoush, tabbouleh, pita, falafel", price: 13.99, tags: ["vegan"], prepTime: 5 },
        { name: "Grilled Kofta Plate", desc: "Spiced beef kofta skewers, rice, salad, tahini", price: 14.99, tags: [], prepTime: 12 },
      ]},
    ],
  },
  "dessert-den": {
    categories: [
      { name: "Cakes", items: [
        { name: "Chocolate Lava Cake", desc: "Warm molten chocolate, vanilla ice cream", price: 7.99, tags: ["vegetarian"], prepTime: 8 },
        { name: "Cheesecake Slice", desc: "New York style, strawberry compote", price: 6.99, tags: ["vegetarian"], prepTime: 3 },
      ]},
      { name: "Ice Cream", items: [
        { name: "Waffle Cone (2 scoops)", desc: "Choice of 12 flavors, freshly made waffle cone", price: 5.99, tags: ["vegetarian"], prepTime: 3 },
        { name: "Sundae", desc: "3 scoops, hot fudge, whipped cream, cherry", price: 7.99, tags: ["vegetarian"], prepTime: 4 },
        { name: "Mango Sorbet", desc: "Dairy-free mango sorbet, 2 scoops", price: 4.99, tags: ["vegan", "gluten_free"], prepTime: 2 },
      ]},
      { name: "Waffles", items: [
        { name: "Classic Belgian Waffle", desc: "Fresh waffle, maple syrup, whipped cream", price: 8.99, tags: ["vegetarian"], prepTime: 8 },
        { name: "Nutella & Banana Waffle", desc: "Waffle, Nutella, sliced banana, powdered sugar", price: 9.99, tags: ["vegetarian"], prepTime: 9 },
      ]},
    ],
  },
  "bbq-boss": {
    categories: [
      { name: "Meats", items: [
        { name: "Brisket Plate", desc: "12-hour smoked brisket, 2 sides", price: 18.99, tags: ["gluten_free"], prepTime: 5 },
        { name: "Pulled Pork Sandwich", desc: "Slow-smoked pork, coleslaw, brioche bun, pickles", price: 13.99, tags: [], prepTime: 5 },
        { name: "BBQ Ribs Half Rack", desc: "St. Louis style ribs, hickory smoked, house sauce", price: 19.99, tags: ["gluten_free"], prepTime: 7 },
        { name: "Smoked Chicken", desc: "Half chicken, dry rub, 2 sides", price: 15.99, tags: ["gluten_free"], prepTime: 5 },
      ]},
      { name: "Sides", items: [
        { name: "Mac & Cheese", desc: "Creamy four-cheese mac, breadcrumb crust", price: 4.99, tags: ["vegetarian"], prepTime: 3 },
        { name: "Smoked Baked Beans", desc: "Slow-cooked beans, brisket burnt ends", price: 3.99, tags: [], prepTime: 3 },
        { name: "Coleslaw", desc: "Creamy house coleslaw, apple, celery seed", price: 2.99, tags: ["vegetarian", "gluten_free"], prepTime: 2 },
      ]},
    ],
  },
};

async function main() {
  console.log('🌱 Seeding Food Village database...');

  // Food Village config
  await prisma.foodVillage.upsert({
    where: { id: 'fv-main' },
    update: {},
    create: { id: 'fv-main', name: 'The Food Village', tagline: 'Good Food. Great Vibes.', tax_rate: 0.0825 },
  });

  // Tables 1-20
  for (let i = 1; i <= 20; i++) {
    await prisma.table.upsert({
      where: { table_number: i },
      update: {},
      create: { table_number: i, label: `Table ${i}` },
    });
  }
  console.log('✅ Tables created (1-20)');

  // Vendors + menus
  for (const vd of VENDORS) {
    const vendor = await prisma.vendor.upsert({
      where: { slug: vd.slug },
      update: {},
      create: {
        name: vd.name,
        slug: vd.slug,
        cuisine_type: vd.cuisine,
        booth_number: vd.booth,
        booth_color: vd.color,
        avg_prep_time_minutes: 10,
        status: 'online',
        is_accepting_orders: true,
        notification_prefs: { new_order_sound: true, volume: 80 },
      },
    });

    const menuTemplate = MENU_TEMPLATES[vd.slug];
    if (!menuTemplate) continue;

    for (let ci = 0; ci < menuTemplate.categories.length; ci++) {
      const cat = menuTemplate.categories[ci];
      const slug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const category = await prisma.menuCategory.upsert({
        where: { vendor_id_slug: { vendor_id: vendor.id, slug } },
        update: {},
        create: { vendor_id: vendor.id, name: cat.name, slug, sort_order: ci },
      });

      for (let ii = 0; ii < cat.items.length; ii++) {
        const item = cat.items[ii];
        const existing = await prisma.menuItem.findFirst({ where: { vendor_id: vendor.id, name: item.name } });
        if (!existing) {
          await prisma.menuItem.create({
            data: {
              vendor_id: vendor.id,
              category_id: category.id,
              name: item.name,
              description: item.desc,
              price: item.price,
              prep_time_minutes: item.prepTime,
              dietary_tags: item.tags,
              allergens: [],
              sort_order: ii,
            },
          });
        }
      }
    }

    // Create a size modifier group for burger-barn
    if (vd.slug === 'burger-barn') {
      const existing = await prisma.modifierGroup.findFirst({ where: { vendor_id: vendor.id, name: 'Extras' } });
      if (!existing) {
        await prisma.modifierGroup.create({
          data: {
            vendor_id: vendor.id,
            name: 'Extras',
            is_required: false,
            min_selections: 0,
            max_selections: 5,
            modifiers: { create: [
              { name: 'Extra Cheese', price_adjustment: 1.50, sort_order: 0 },
              { name: 'Extra Patty', price_adjustment: 3.00, sort_order: 1 },
              { name: 'Bacon', price_adjustment: 2.00, sort_order: 2 },
              { name: 'Avocado', price_adjustment: 1.75, sort_order: 3 },
              { name: 'No Onions', price_adjustment: 0, sort_order: 4 },
            ]},
          },
        });
      }
    }

    // Create a size modifier for juice-junction
    if (vd.slug === 'juice-junction') {
      const existing = await prisma.modifierGroup.findFirst({ where: { vendor_id: vendor.id, name: 'Size' } });
      if (!existing) {
        await prisma.modifierGroup.create({
          data: {
            vendor_id: vendor.id,
            name: 'Size',
            is_required: true,
            min_selections: 1,
            max_selections: 1,
            modifiers: { create: [
              { name: 'Regular (12oz)', price_adjustment: 0, sort_order: 0 },
              { name: 'Large (16oz)', price_adjustment: 1.50, sort_order: 1 },
              { name: 'XL (20oz)', price_adjustment: 2.50, sort_order: 2 },
            ]},
          },
        });
      }
    }

    console.log(`✅ ${vd.name} seeded`);
  }

  // Staff PIN for Burger Barn kitchen
  const pinHash = await bcrypt.hash('1234', 10);
  const burgerVendor = await prisma.vendor.findUnique({ where: { slug: 'burger-barn' } });
  if (burgerVendor) {
    const existingPin = await prisma.staffPin.findFirst({ where: { vendor_id: burgerVendor.id, label: 'Kitchen Station 1' } });
    if (!existingPin) {
      await prisma.staffPin.create({
        data: { vendor_id: burgerVendor.id, pin_hash: pinHash, label: 'Kitchen Station 1', role: 'vendor_kitchen' },
      });
      console.log('✅ Staff PIN created for Burger Barn (PIN: 1234)');
    }
  }

  // Local dev users — password_hash enables login without Supabase
  const adminPassHash = await bcrypt.hash('admin123', 10);
  const vendorPassHash = await bcrypt.hash('vendor123', 10);

  // Super admin
  await prisma.user.upsert({
    where: { supabase_id: '00000000-0000-0000-0000-000000000001' },
    update: { password_hash: adminPassHash },
    create: {
      supabase_id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@foodvillage.com',
      full_name: 'Super Admin',
      role: 'super_admin',
      password_hash: adminPassHash,
    },
  });
  console.log('✅ Super admin user seeded (admin@foodvillage.com / admin123)');

  // Vendor manager accounts — one per booth
  for (let i = 0; i < VENDORS.length; i++) {
    const vd = VENDORS[i];
    const vendor = await prisma.vendor.findUnique({ where: { slug: vd.slug } });
    if (!vendor) continue;

    // Deterministic supabase_id per booth: 00000000-0000-0000-0001-XXXXXXXXXXXX
    const supabaseId = `00000000-0000-0000-0001-${String(i + 1).padStart(12, '0')}`;
    const email = `booth${vd.booth}@foodvillage.com`;

    await prisma.user.upsert({
      where: { supabase_id: supabaseId },
      update: { password_hash: vendorPassHash, vendor_id: vendor.id },
      create: {
        supabase_id: supabaseId,
        email,
        full_name: `${vd.name} Manager`,
        role: 'vendor_owner',
        vendor_id: vendor.id,
        password_hash: vendorPassHash,
      },
    });
  }
  console.log('✅ Vendor manager accounts seeded (booth1–10@foodvillage.com / vendor123)');

  console.log('\n🎉 Seed complete!');
  console.log('  • 10 vendors with menus');
  console.log('  • 20 tables');
  console.log('  • 1 food village config');
  console.log('  • Super admin: admin@foodvillage.com / admin123');
  console.log('  • Vendor managers: booth1–10@foodvillage.com / vendor123');
  console.log('  • Kitchen PIN (Burger Barn): 1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
