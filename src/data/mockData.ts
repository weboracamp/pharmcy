import { Branch, Category, Product, Profile, Order, Sale, StockLog, NotificationLog, Shift } from '../types';

export const initialBranches: Branch[] = [
  {
    id: 'br-downtown',
    name: 'Downtown Central Branch',
    name_ar: 'فرع وسط البلد الرئيسي',
    address: '14 Al Tahrir Square, Downtown',
    address_ar: '١٤ ميدان التحرير، وسط البلد',
    phone: '+20 2 2578 9901',
    city: 'Cairo',
    is_active: true,
    opening_hours: '24 Hours / 7 Days',
  },
  {
    id: 'br-north',
    name: 'North Health District Branch',
    name_ar: 'فرع حي النزهة الطبي',
    address: '88 El Nozha St, Heliopolis',
    address_ar: '٨٨ شارع النزهة، مصر الجديدة',
    phone: '+20 2 2634 1180',
    city: 'Cairo',
    is_active: true,
    opening_hours: '8:00 AM - 2:00 AM',
  },
  {
    id: 'br-westside',
    name: 'Westside Medical Hub Branch',
    name_ar: 'فرع الشيخ زايد والمهندسين',
    address: '22 Geziret El Arab, Mohandessin',
    address_ar: '٢٢ جزيرة العرب، المهندسين',
    phone: '+20 2 3749 4422',
    city: 'Giza',
    is_active: true,
    opening_hours: '8:00 AM - 12:00 AM',
  },
];

export const initialCategories: Category[] = [
  { id: 'cat-antibiotics', name: 'Antibiotics & Anti-infectives', name_ar: 'مضادات حيوية ومكافحة العدوى', slug: 'antibiotics', icon: 'Pill' },
  { id: 'cat-pain', name: 'Pain Relief & Fever', name_ar: 'مسكنات الألم وخافضات الحرارة', slug: 'pain-relief', icon: 'Zap' },
  { id: 'cat-chronic', name: 'Chronic Care & Cardiology', name_ar: 'أمراض مزمنة والقلب والضغط', slug: 'chronic-care', icon: 'HeartPulse' },
  { id: 'cat-respiratory', name: 'Respiratory & Allergy', name_ar: 'الجهاز التنفسي والحساسية', slug: 'respiratory', icon: 'Wind' },
  { id: 'cat-digestive', name: 'Digestive & Stomach Care', name_ar: 'صحة الجهاز الهضمي والمعدة', slug: 'digestive', icon: 'ShieldCheck' },
  { id: 'cat-vitamins', name: 'Vitamins & Daily Wellness', name_ar: 'فيتامينات ومكملات غذائية', slug: 'vitamins', icon: 'Sparkles' },
];

export const initialProfiles: Profile[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@pharmachain.com',
    full_name: 'Dr. Kareem Mansour (Chief Pharmacist / Owner)',
    role: 'admin',
    branch_id: null,
    phone: '+20 100 555 1200',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-cashier-downtown',
    email: 'mona.cashier@pharmachain.com',
    full_name: 'Pharm. Mona Adel (Senior Cashier)',
    role: 'cashier',
    branch_id: 'br-downtown',
    phone: '+20 102 334 8811',
    avatar_url: 'https://images.unsplash.com/photo-1594824813627-d4632598379f?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-02-01T09:00:00Z',
  },
  {
    id: 'usr-cashier-downtown-2',
    email: 'hany.cashier@pharmachain.com',
    full_name: 'Pharm. Hany Sameh (Evening Cashier)',
    role: 'cashier',
    branch_id: 'br-downtown',
    phone: '+20 105 771 9922',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    id: 'usr-cashier-north',
    email: 'youssef.cashier@pharmachain.com',
    full_name: 'Pharm. Youssef Nabil',
    role: 'cashier',
    branch_id: 'br-north',
    phone: '+20 101 889 0044',
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'usr-cashier-westside',
    email: 'salma.cashier@pharmachain.com',
    full_name: 'Pharm. Salma Fouad',
    role: 'cashier',
    branch_id: 'br-westside',
    phone: '+20 109 223 1188',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-02-20T09:00:00Z',
  },
  {
    id: 'usr-driver-ahmed',
    email: 'ahmed.driver@pharmachain.com',
    full_name: 'Ahmed Hassan (Express Rider #4)',
    role: 'driver',
    branch_id: 'br-downtown',
    phone: '+20 111 776 4390',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'usr-driver-tarek',
    email: 'tarek.driver@pharmachain.com',
    full_name: 'Tarek Mahmoud (Express Rider #8)',
    role: 'driver',
    branch_id: 'br-north',
    phone: '+20 114 990 2233',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-03-05T10:00:00Z',
  },
  {
    id: 'usr-customer-sarah',
    email: 'sarah.k@gmail.com',
    full_name: 'Sarah Khaled',
    role: 'customer',
    branch_id: null,
    phone: '+20 109 444 8877',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-03-10T11:00:00Z',
  },
];

// Medications catalog master definitions replicated across branches with independent stock
interface ProductTemplate {
  name: string;
  name_ar: string;
  category_id: string;
  barcode: string;
  price: number;
  cost_price: number;
  min_stock_alert: number;
  requires_prescription: boolean;
  image_url: string;
  description: string;
  description_ar: string;
  supplier: string;
  dosage: string;
}

const productTemplates: ProductTemplate[] = [
  {
    name: 'Augmentin 1000mg (Amoxicillin / Clavulanate)',
    name_ar: 'أوجمنتين ١ جم (مضاد حيوي واسع المجال)',
    category_id: 'cat-antibiotics',
    barcode: '622100100121',
    price: 135.00,
    cost_price: 102.00,
    min_stock_alert: 15,
    requires_prescription: true,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    description: 'High potency broad-spectrum antibacterial for respiratory, ear, throat, and soft tissue bacterial infections. Must be taken with food.',
    description_ar: 'مضاد حيوي واسع المجال لعلاج التهابات الجهاز التنفسي والجيوب الأنفية والمسالك البولية. يتطلب وصفة طبية.',
    supplier: 'GlaxoSmithKline (GSK)',
    dosage: '1 tablet every 12 hours after meals'
  },
  {
    name: 'Panadol Extra with Optizorb (500mg/65mg)',
    name_ar: 'بنادول إكسترا مع تقنية أوبتيزورب',
    category_id: 'cat-pain',
    barcode: '622100100138',
    price: 45.00,
    cost_price: 32.50,
    min_stock_alert: 25,
    requires_prescription: false,
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
    description: 'Paracetamol + Caffeine dual action for fast relief from tough headaches, migraine, toothache, and fever. Gentle on stomach.',
    description_ar: 'باراسيتامول مع كافيين لسرعة التسكين من الصداع الحاد وآلام الأسنان والحمى. لطيف على المعدة.',
    supplier: 'Haleon Consumer Health',
    dosage: '1 to 2 tablets up to 4 times daily'
  },
  {
    name: 'Concor 5mg (Bisoprolol Fumarate)',
    name_ar: 'كونكور ٥ مجم (لعلاج ضغط الدم والقلب)',
    category_id: 'cat-chronic',
    barcode: '622100100145',
    price: 78.50,
    cost_price: 58.00,
    min_stock_alert: 12,
    requires_prescription: true,
    image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
    description: 'Cardio-selective beta-blocker indicated for hypertension, angina pectoris, and stable chronic heart failure under medical supervision.',
    description_ar: 'دواء لتنظيم ضربات القلب وعلاج ارتفاع ضغط الدم والذبحة الصدرية. يستلزم متابعة طبية ووصفة معتمدة.',
    supplier: 'Merck KGaA',
    dosage: '1 tablet once daily in the morning'
  },
  {
    name: 'Zyrtec 10mg (Cetirizine Dihydrochloride)',
    name_ar: 'زيرتك ١٠ مجم (مضاد حساسية)',
    category_id: 'cat-respiratory',
    barcode: '622100100152',
    price: 52.00,
    cost_price: 38.00,
    min_stock_alert: 18,
    requires_prescription: false,
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
    description: 'Fast non-drowsy 24-hour relief of seasonal allergic rhinitis, runny nose, sneezing, itchy eyes, and skin urticaria (hives).',
    description_ar: 'مضاد للهستامين فعال لمدة ٢٤ ساعة لعلاج حساسية الأنف، العطس، حكة العين، والطفح الجلدي.',
    supplier: 'UCB Pharma',
    dosage: '1 tablet daily at bedtime'
  },
  {
    name: 'Nexium 40mg (Esomeprazole Magnesium)',
    name_ar: 'نيكسيوم ٤٠ مجم (حموضة وقرحة المعدة)',
    category_id: 'cat-digestive',
    barcode: '622100100169',
    price: 185.00,
    cost_price: 145.00,
    min_stock_alert: 10,
    requires_prescription: true,
    image_url: 'https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=500&auto=format&fit=crop&q=80',
    description: 'Proton pump inhibitor (PPI) reducing stomach acid production. Treats GERD, reflux esophagitis, and gastric ulcers.',
    description_ar: 'مثبط لمضخة البروتون للوقاية وعلاج ارتجاع المريء وقرحة المعدة والحموضة الشديدة.',
    supplier: 'AstraZeneca',
    dosage: '1 tablet daily on empty stomach 30 mins before breakfast'
  },
  {
    name: 'C-Retard 500mg Sustained Release Vitamin C',
    name_ar: 'سي ريتارد ٥٠٠ مجم (فيتامين ج ممتد المفعول)',
    category_id: 'cat-vitamins',
    barcode: '622100100176',
    price: 32.00,
    cost_price: 22.00,
    min_stock_alert: 30,
    requires_prescription: false,
    image_url: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=80',
    description: 'Immune booster capsules with controlled 12-hour sustained release. Promotes collagen synthesis, skin health, and viral defense.',
    description_ar: 'كبسولات فيتامين سي ممتدة المفعول لدعم المناعة ومقاومة نزلات البرد ونضارة البشرة.',
    supplier: 'Hikma Pharmaceuticals',
    dosage: '1 capsule daily after breakfast'
  },
  {
    name: 'Lipitor 20mg (Atorvastatin Calcium)',
    name_ar: 'ليبيتور ٢٠ مجم (مخفض الكوليسترول والدهون)',
    category_id: 'cat-chronic',
    barcode: '622100100183',
    price: 160.00,
    cost_price: 120.00,
    min_stock_alert: 10,
    requires_prescription: true,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    description: 'HMG-CoA reductase inhibitor (statin) used to lower LDL cholesterol, triglycerides, and prevent cardiovascular arterial disease.',
    description_ar: 'علاج لخفض نسبة الكوليسترول الضار والدهون الثلاثية في الدم والوقاية من جلطات القلب.',
    supplier: 'Pfizer Inc.',
    dosage: '1 tablet once daily in the evening'
  },
  {
    name: 'Voltaren Emulgel 1% 100g (Diclofenac Diethylamine)',
    name_ar: 'فولتارين إيمولجل ١٠٠ جم (مسكن موضعي للآلام)',
    category_id: 'cat-pain',
    barcode: '622100100190',
    price: 75.00,
    cost_price: 54.00,
    min_stock_alert: 15,
    requires_prescription: false,
    image_url: 'https://images.unsplash.com/photo-1583912267670-6575ad4736f8?w=500&auto=format&fit=crop&q=80',
    description: 'Targeted topical anti-inflammatory gel for muscle sprains, joint pain, backache, and sports injuries.',
    description_ar: 'جل موضعي مسكن للآلام ومضاد للالتهاب لعلاج آلام المفاصل والظهر والكدمات الرياضية.',
    supplier: 'Novartis Pharma',
    dosage: 'Apply gently 3-4 times daily over affected area'
  },
  {
    name: 'Ventolin Inhaler 100mcg (Salbutamol Sulfate)',
    name_ar: 'بخاخ فين yourتولين ١٠٠ ميكروجرام (موسع للشعب الهوائية)',
    category_id: 'cat-respiratory',
    barcode: '622100100206',
    price: 68.00,
    cost_price: 51.00,
    min_stock_alert: 8,
    requires_prescription: true,
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
    description: 'Fast-acting bronchodilator for relief of acute asthma attacks, wheezing, shortness of breath, and exercise-induced bronchospasm.',
    description_ar: 'بخاخ إسعافي موسع للشعب الهوائية سريع المفعول لعلاج أزمات الربو وضيق التنفس الحاد.',
    supplier: 'GlaxoSmithKline (GSK)',
    dosage: '1-2 puffs as directed during acute shortness of breath'
  },
  {
    name: 'Centrum with Lutein Multivitamins (30 Tablets)',
    name_ar: 'سنتروم مع لوتين (مكمل غذائي متكامل ٣٠ قرص)',
    category_id: 'cat-vitamins',
    barcode: '622100100213',
    price: 210.00,
    cost_price: 165.00,
    min_stock_alert: 12,
    requires_prescription: false,
    image_url: 'https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=500&auto=format&fit=crop&q=80',
    description: 'Complete daily nutritional formulation with 24 essential vitamins and minerals plus lutein for cellular energy and ocular health.',
    description_ar: 'تركيبة متكاملة من الفيتامينات والمعادن ومضادات الأكسدة لتعزيز النشاط اليومي وصحة العين.',
    supplier: 'Pfizer Consumer Healthcare',
    dosage: '1 tablet daily with food and plenty of water'
  }
];

// Generate independent inventory per branch
export const generateInitialProducts = (): Product[] => {
  const products: Product[] = [];

  initialBranches.forEach((branch, bIndex) => {
    productTemplates.forEach((template, tIndex) => {
      // Create variations in stock, batch, and expiry per branch
      let stockQty = 18;
      let expiry = '2027-08-30';
      
      if (bIndex === 0) {
        // Downtown has largest stock, some low stock items
        stockQty = tIndex === 2 ? 4 : tIndex === 6 ? 6 : 28 + (tIndex * 4);
        expiry = tIndex === 1 ? '2026-10-10' : '2027-11-20'; // tIndex 1 expiring soon (< 30 days from local time 2026-09-15)
      } else if (bIndex === 1) {
        // North branch
        stockQty = tIndex === 4 ? 3 : 16 + (tIndex * 3);
        expiry = tIndex === 0 ? '2026-10-02' : '2028-01-15'; // tIndex 0 expiring in ~17 days
      } else {
        // Westside branch
        stockQty = tIndex === 8 ? 2 : 12 + (tIndex * 2);
        expiry = '2027-06-25';
      }

      products.push({
        id: `prod-${branch.id}-${tIndex + 1}`,
        branch_id: branch.id,
        name: template.name,
        name_ar: template.name_ar,
        category_id: template.category_id,
        barcode: template.barcode,
        price: template.price,
        cost_price: template.cost_price,
        stock_qty: stockQty,
        min_stock_alert: template.min_stock_alert,
        expiry_date: expiry,
        batch_number: `BCH-${branch.id.slice(3, 6).toUpperCase()}-${202600 + tIndex}`,
        requires_prescription: template.requires_prescription,
        image_url: template.image_url,
        description: template.description,
        description_ar: template.description_ar,
        supplier: template.supplier,
        dosage: template.dosage
      });
    });
  });

  return products;
};

export const initialOrders: Order[] = [
  {
    id: 'ord-9012',
    order_number: 'ORD-9012',
    customer_id: 'usr-customer-sarah',
    customer_name: 'Sarah Khaled',
    customer_phone: '+20 109 444 8877',
    branch_id: 'br-downtown',
    driver_id: 'usr-driver-ahmed',
    status: 'out_for_delivery',
    subtotal: 180.00,
    delivery_fee: 15.00,
    total: 195.00,
    delivery_address: 'Building 14, Garden City, Apt 4B',
    city: 'Cairo',
    payment_method: 'cod',
    notes: 'Please ring the intercom or call before coming up.',
    requires_prescription: true,
    prescription: {
      id: 'rx-101',
      order_id: 'ord-9012',
      file_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
      file_name: 'Dr_Hassan_Rx_Cardiology_Sarah.jpg',
      status: 'approved',
      reviewed_by: 'usr-admin-1',
      created_at: '2026-09-15T10:15:00Z'
    },
    items: [
      {
        id: 'item-1',
        order_id: 'ord-9012',
        product_id: 'prod-br-downtown-1',
        product_name: 'Augmentin 1000mg (Amoxicillin / Clavulanate)',
        product_name_ar: 'أوجمنتين ١ جم (مضاد حيوي واسع المجال)',
        quantity: 1,
        unit_price: 135.00,
        subtotal: 135.00,
        requires_prescription: true
      },
      {
        id: 'item-2',
        order_id: 'ord-9012',
        product_id: 'prod-br-downtown-2',
        product_name: 'Panadol Extra with Optizorb (500mg/65mg)',
        product_name_ar: 'بنادول إكسترا مع تقنية أوبتيزورب',
        quantity: 1,
        unit_price: 45.00,
        subtotal: 45.00,
        requires_prescription: false
      }
    ],
    created_at: '2026-09-15T10:30:00Z',
    updated_at: '2026-09-15T11:45:00Z'
  },
  {
    id: 'ord-9013',
    order_number: 'ORD-9013',
    customer_id: null,
    customer_name: 'Mostafa Kamal',
    customer_phone: '+20 122 890 3311',
    branch_id: 'br-north',
    driver_id: null,
    status: 'pending',
    subtotal: 242.00,
    delivery_fee: 15.00,
    total: 257.00,
    delivery_address: '12 Abbas El Akkad St, Nasr City, Floor 3',
    city: 'Cairo',
    payment_method: 'cod',
    notes: 'Urgent allergy medicine needed.',
    requires_prescription: false,
    prescription: null,
    items: [
      {
        id: 'item-3',
        order_id: 'ord-9013',
        product_id: 'prod-br-north-4',
        product_name: 'Zyrtec 10mg (Cetirizine Dihydrochloride)',
        product_name_ar: 'زيرتك ١٠ مجم (مضاد حساسية)',
        quantity: 2,
        unit_price: 52.00,
        subtotal: 104.00,
        requires_prescription: false
      },
      {
        id: 'item-4',
        order_id: 'ord-9013',
        product_id: 'prod-br-north-7',
        product_name: 'Lipitor 20mg (Atorvastatin Calcium)',
        product_name_ar: 'ليبيتور ٢٠ مجم (مخفض الكوليسترول والدهون)',
        quantity: 1,
        unit_price: 160.00,
        subtotal: 160.00,
        requires_prescription: true
      }
    ],
    created_at: '2026-09-15T11:50:00Z',
    updated_at: '2026-09-15T11:50:00Z'
  }
];

export const initialShifts: Shift[] = [
  {
    id: 'shift-1',
    branch_id: 'br-downtown',
    cashier_id: 'usr-cashier-downtown',
    cashier_name: 'Pharm. Mona Adel',
    opened_at: '2026-09-15T08:00:00Z',
    closed_at: null,
    opening_cash_balance: 500.00,
    closing_cash_balance: null,
    status: 'open',
    notes: 'Morning shift drawer opening',
    created_at: '2026-09-15T08:00:00Z'
  },
  {
    id: 'shift-2',
    branch_id: 'br-north',
    cashier_id: 'usr-cashier-north',
    cashier_name: 'Pharm. Youssef Nabil',
    opened_at: '2026-09-14T08:30:00Z',
    closed_at: '2026-09-14T17:00:00Z',
    opening_cash_balance: 350.00,
    closing_cash_balance: 1480.00,
    status: 'closed',
    notes: 'Balanced evening close',
    created_at: '2026-09-14T08:30:00Z'
  },
  {
    id: 'shift-3',
    branch_id: 'br-downtown',
    cashier_id: 'usr-cashier-downtown-2',
    cashier_name: 'Pharm. Hany Sameh',
    opened_at: '2026-09-14T16:00:00Z',
    closed_at: '2026-09-14T23:55:00Z',
    opening_cash_balance: 400.00,
    closing_cash_balance: 2150.00,
    status: 'closed',
    notes: 'Night shift handed over smoothly',
    created_at: '2026-09-14T16:00:00Z'
  }
];

export const initialSales: Sale[] = [
  {
    id: 'sale-1001',
    receipt_no: 'POS-DT-20260915-001',
    branch_id: 'br-downtown',
    cashier_id: 'usr-cashier-downtown',
    cashier_name: 'Pharm. Mona Adel',
    shift_id: 'shift-1',
    items: [
      {
        product_id: 'prod-br-downtown-2',
        barcode: '622100100138',
        name: 'Panadol Extra with Optizorb (500mg/65mg)',
        name_ar: 'بنادول إكسترا مع تقنية أوبتيزورب',
        quantity: 2,
        unit_price: 45.00,
        total: 90.00
      },
      {
        product_id: 'prod-br-downtown-6',
        barcode: '622100100176',
        name: 'C-Retard 500mg Sustained Release Vitamin C',
        name_ar: 'سي ريتارد ٥٠٠ مجم (فيتامين ج ممتد المفعول)',
        quantity: 1,
        unit_price: 32.00,
        total: 32.00
      }
    ],
    subtotal: 122.00,
    discount: 0.00,
    total: 122.00,
    payment_method: 'cash',
    tendered_amount: 150.00,
    change_amount: 28.00,
    customer_name: 'Walk-in Customer',
    customer_phone: '',
    created_at: '2026-09-15T09:12:00Z'
  },
  {
    id: 'sale-1002',
    receipt_no: 'POS-DT-20260915-002',
    branch_id: 'br-downtown',
    cashier_id: 'usr-cashier-downtown',
    cashier_name: 'Pharm. Mona Adel',
    shift_id: 'shift-1',
    items: [
      {
        product_id: 'prod-br-downtown-8',
        barcode: '622100100190',
        name: 'Voltaren Emulgel 1% 100g',
        name_ar: 'فولتارين إيمولجل ١٠٠ جم',
        quantity: 1,
        unit_price: 75.00,
        total: 75.00
      }
    ],
    subtotal: 75.00,
    discount: 5.00,
    total: 70.00,
    payment_method: 'card',
    customer_name: 'Amr Ezzat',
    customer_phone: '+20 100 222 3344',
    created_at: '2026-09-15T10:45:00Z'
  }
];

export const initialStockLogs: StockLog[] = [
  {
    id: 'log-1',
    product_id: 'prod-br-downtown-2',
    product_name: 'Panadol Extra with Optizorb',
    branch_id: 'br-downtown',
    branch_name: 'Downtown Central Branch',
    change_qty: -2,
    previous_qty: 30,
    new_qty: 28,
    reason: 'pos_sale',
    changed_by: 'Pharm. Mona Adel',
    created_at: '2026-09-15T09:12:00Z'
  },
  {
    id: 'log-2',
    product_id: 'prod-br-downtown-6',
    product_name: 'C-Retard 500mg Sustained Release Vitamin C',
    branch_id: 'br-downtown',
    branch_name: 'Downtown Central Branch',
    change_qty: -1,
    previous_qty: 35,
    new_qty: 34,
    reason: 'pos_sale',
    changed_by: 'Pharm. Mona Adel',
    created_at: '2026-09-15T09:12:00Z'
  }
];

export const initialNotificationLogs: NotificationLog[] = [
  {
    id: 'notif-1',
    order_id: 'ord-9012',
    order_number: 'ORD-9012',
    channel: 'whatsapp',
    recipient_phone: '+20 109 444 8877',
    message: 'Hello Sarah! Your PharmaChain order #ORD-9012 has been confirmed by our pharmacist. Rider Ahmed Hassan is on the way!',
    sent_at: '2026-09-15T11:45:00Z',
    status: 'delivered'
  },
  {
    id: 'notif-2',
    order_id: 'ord-9012',
    order_number: 'ORD-9012',
    channel: 'sms',
    recipient_phone: '+20 109 444 8877',
    message: 'PharmaChain: Order #ORD-9012 is OUT FOR DELIVERY. Total COD amount: 195.00 EGP. Rider phone: +201117764390.',
    sent_at: '2026-09-15T11:46:00Z',
    status: 'delivered'
  }
];
