import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Branch,
  Category,
  Product,
  Profile,
  Order,
  Sale,
  StockLog,
  NotificationLog,
  UserRole,
  Language,
  OrderStatus,
  PrescriptionStatus,
  StockTransfer,
  Shift
} from '../types';
import {
  initialBranches,
  initialCategories,
  initialProfiles,
  generateInitialProducts,
  initialOrders,
  initialSales,
  initialStockLogs,
  initialNotificationLogs,
  initialShifts
} from '../data/mockData';
import { translations } from '../lib/translations';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface PharmacyContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  
  // Auth & Roles
  currentUser: Profile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchUserRole: (role: UserRole, branchId?: string, specificUserId?: string) => void;
  allProfiles: Profile[];
  addProfile: (profile: Omit<Profile, 'id' | 'created_at'>) => void;
  deleteStaffProfile: (profileId: string) => void;
  
  // Shifts
  shifts: Shift[];
  activeShift: Shift | null;
  openShift: (openingCash: number, notes?: string) => Shift;
  closeShift: (shiftId: string, closingCash: number, notes?: string) => void;
  getShiftSummary: (shiftId: string) => {
    totalSales: number;
    cashSales: number;
    cardSales: number;
    salesCount: number;
    expectedCash: number;
  };
  
  // Branches
  branches: Branch[];
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  
  // Categories & Products
  categories: Category[];
  products: Product[];
  branchProducts: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, changeQty: number, reason: StockLog['reason']) => void;
  transferStock: (transfer: Omit<StockTransfer, 'id' | 'transfer_no' | 'created_at'>) => boolean;
  
  // Storefront & Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  hasRestrictedItems: boolean;
  
  // Orders
  orders: Order[];
  scopedOrders: Order[];
  branchOrders: Order[];
  placeOnlineOrder: (orderData: {
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    city: string;
    notes?: string;
    branch_id: string;
    prescriptionFile?: { name: string; url: string } | null;
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  reviewPrescription: (orderId: string, status: PrescriptionStatus, reason?: string) => void;
  
  // Fast POS
  sales: Sale[];
  scopedSales: Sale[];
  branchSales: Sale[];
  processPosSale: (saleData: {
    items: { product: Product; quantity: number; unit_price: number }[];
    subtotal: number;
    discount: number;
    total: number;
    payment_method: 'cash' | 'card';
    tendered_amount?: number;
    change_amount?: number;
    customer_name?: string;
    customer_phone?: string;
  }) => Sale;
  
  // Logs & Notifications
  stockLogs: StockLog[];
  notifications: NotificationLog[];
  recentToast: { message: string; channel?: 'whatsapp' | 'sms' | 'system' } | null;
  clearToast: () => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('pharma_lang') as Language) || 'en';
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('pharma_branches');
    return saved ? JSON.parse(saved) : initialBranches;
  });

  const [currentBranch, setCurrentBranch] = useState<Branch>(branches[0] || initialBranches[0]);

  const [allProfiles, setAllProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('pharma_profiles');
    return saved ? JSON.parse(saved) : initialProfiles;
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<Profile>(initialProfiles[0]);

  const [categories] = useState<Category[]>(initialCategories);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pharma_products');
    return saved ? JSON.parse(saved) : generateInitialProducts();
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pharma_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('pharma_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('pharma_shifts');
    return saved ? JSON.parse(saved) : initialShifts;
  });

  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem('pharma_stock_logs');
    return saved ? JSON.parse(saved) : initialStockLogs;
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('pharma_notifications');
    return saved ? JSON.parse(saved) : initialNotificationLogs;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pharma_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentToast, setRecentToast] = useState<{ message: string; channel?: 'whatsapp' | 'sms' | 'system' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pharma_lang', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('pharma_branches', JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem('pharma_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pharma_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pharma_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('pharma_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('pharma_stock_logs', JSON.stringify(stockLogs));
  }, [stockLogs]);

  useEffect(() => {
    localStorage.setItem('pharma_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('pharma_cart', JSON.stringify(cart));
  }, [cart]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key] || String(key);
  };

  const showToast = (message: string, channel: 'whatsapp' | 'sms' | 'system' = 'system') => {
    setRecentToast({ message, channel });
    setTimeout(() => {
      setRecentToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const clearToast = () => setRecentToast(null);

  // Switch Role helper
  const switchUserRole = (role: UserRole, branchId?: string, specificUserId?: string) => {
    setCurrentRoleState(role);
    if (specificUserId) {
      const specific = allProfiles.find(p => p.id === specificUserId);
      if (specific) {
        setCurrentUser(specific);
        if (specific.branch_id) {
          const foundBranch = branches.find(b => b.id === specific.branch_id);
          if (foundBranch) setCurrentBranch(foundBranch);
        }
        return;
      }
    }

    if (role === 'admin') {
      const adminUser = allProfiles.find(p => p.role === 'admin') || initialProfiles[0];
      setCurrentUser(adminUser);
    } else if (role === 'cashier') {
      const targetBranchId = branchId || currentBranch.id;
      const cashierUser = allProfiles.find(p => p.role === 'cashier' && p.branch_id === targetBranchId) || 
                          allProfiles.find(p => p.role === 'cashier') || initialProfiles[1];
      setCurrentUser(cashierUser);
      if (cashierUser.branch_id) {
        const foundBranch = branches.find(b => b.id === cashierUser.branch_id);
        if (foundBranch) setCurrentBranch(foundBranch);
      }
    } else if (role === 'driver') {
      const driverUser = allProfiles.find(p => p.role === 'driver') || initialProfiles[3];
      setCurrentUser(driverUser);
    } else {
      const customerUser = allProfiles.find(p => p.role === 'customer') || initialProfiles[5];
      setCurrentUser(customerUser);
    }
  };

  const setCurrentRole = (role: UserRole) => {
    switchUserRole(role);
  };

  const addProfile = (profileData: Omit<Profile, 'id' | 'created_at'>) => {
    const newProfile: Profile = {
      ...profileData,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setAllProfiles(prev => [...prev, newProfile]);
    localStorage.setItem('pharma_profiles', JSON.stringify([...allProfiles, newProfile]));
    showToast(`Staff member ${newProfile.full_name} added to ${branches.find(b => b.id === newProfile.branch_id)?.name || 'General'}`);
  };

  const deleteStaffProfile = (profileId: string) => {
    const profile = allProfiles.find(p => p.id === profileId);
    if (!profile) return;
    if (profile.role === 'admin') {
      showToast('Cannot remove administrator accounts', 'system');
      return;
    }
    if (currentRole === 'cashier' && profile.branch_id !== currentBranch.id) {
      showToast('Permission denied: Can only remove staff from your own branch', 'system');
      return;
    }
    const updated = allProfiles.filter(p => p.id !== profileId);
    setAllProfiles(updated);
    localStorage.setItem('pharma_profiles', JSON.stringify(updated));
    showToast(`Staff member ${profile.full_name} removed.`);
  };

  // Branch CRUD
  const addBranch = (branchData: Omit<Branch, 'id'>) => {
    const newId = `br-${Date.now().toString(36)}`;
    const newBranch: Branch = { ...branchData, id: newId };
    setBranches(prev => [...prev, newBranch]);
    // Seed new branch products from first branch
    const baseProducts = products.filter(p => p.branch_id === branches[0].id);
    const clonedProducts = baseProducts.map((bp, idx) => ({
      ...bp,
      id: `prod-${newId}-${idx + 1}`,
      branch_id: newId,
      stock_qty: 15,
      batch_number: `BCH-${newId.slice(0, 4).toUpperCase()}-2026`
    }));
    setProducts(prev => [...prev, ...clonedProducts]);
    showToast(`Branch "${newBranch.name}" created with independent inventory!`);
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (currentBranch.id === id) {
      setCurrentBranch(prev => ({ ...prev, ...updates }));
    }
    showToast('Branch details updated successfully');
  };

  // Branch-scoped products
  const branchProducts = products.filter(p => p.branch_id === currentBranch.id);

  // Add Product
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${prodData.branch_id}-${Date.now().toString(36)}`
    };
    setProducts(prev => [newProd, ...prev]);

    // Record Stock Log
    const newLog: StockLog = {
      id: `log-${Date.now()}`,
      product_id: newProd.id,
      product_name: newProd.name,
      branch_id: newProd.branch_id,
      branch_name: branches.find(b => b.id === newProd.branch_id)?.name,
      change_qty: newProd.stock_qty,
      previous_qty: 0,
      new_qty: newProd.stock_qty,
      reason: 'restock',
      changed_by: currentUser.full_name,
      created_at: new Date().toISOString()
    };
    setStockLogs(prev => [newLog, ...prev]);
    showToast(`Product "${newProd.name}" added to inventory.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        if (updates.stock_qty !== undefined && updates.stock_qty !== p.stock_qty) {
          const delta = updates.stock_qty - p.stock_qty;
          const newLog: StockLog = {
            id: `log-${Date.now()}`,
            product_id: p.id,
            product_name: p.name,
            branch_id: p.branch_id,
            branch_name: branches.find(b => b.id === p.branch_id)?.name,
            change_qty: delta,
            previous_qty: p.stock_qty,
            new_qty: updates.stock_qty,
            reason: 'manual_adjustment',
            changed_by: currentUser.full_name,
            created_at: new Date().toISOString()
          };
          setStockLogs(l => [newLog, ...l]);
        }
        return { ...p, ...updates };
      }
      return p;
    }));
    showToast('Product updated successfully');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast(`Product "${prod.name}" removed from branch catalog`);
  };

  const adjustStock = (productId: string, changeQty: number, reason: StockLog['reason']) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newQty = Math.max(0, p.stock_qty + changeQty);
        const log: StockLog = {
          id: `log-${Date.now()}`,
          product_id: p.id,
          product_name: p.name,
          branch_id: p.branch_id,
          branch_name: branches.find(b => b.id === p.branch_id)?.name,
          change_qty: changeQty,
          previous_qty: p.stock_qty,
          new_qty: newQty,
          reason,
          changed_by: currentUser.full_name,
          created_at: new Date().toISOString()
        };
        setStockLogs(l => [log, ...l]);
        return { ...p, stock_qty: newQty };
      }
      return p;
    }));
  };

  // Stock Transfer between branches
  const transferStock = (transferData: Omit<StockTransfer, 'id' | 'transfer_no' | 'created_at'>): boolean => {
    const { from_branch_id, to_branch_id, barcode, quantity } = transferData;
    const sourceProd = products.find(p => p.branch_id === from_branch_id && p.barcode === barcode);
    if (!sourceProd || sourceProd.stock_qty < quantity) {
      showToast('Transfer failed: insufficient stock at source branch!', 'system');
      return false;
    }

    const destProd = products.find(p => p.branch_id === to_branch_id && p.barcode === barcode);
    
    // Deduct from source
    adjustStock(sourceProd.id, -quantity, 'transfer_out');

    // Add to dest
    if (destProd) {
      adjustStock(destProd.id, quantity, 'transfer_in');
    } else {
      // Create clone in destination branch
      const cloned: Omit<Product, 'id'> = {
        ...sourceProd,
        branch_id: to_branch_id,
        stock_qty: quantity,
        batch_number: sourceProd.batch_number
      };
      addProduct(cloned);
    }

    const fromName = branches.find(b => b.id === from_branch_id)?.name;
    const toName = branches.find(b => b.id === to_branch_id)?.name;
    showToast(`Transferred ${quantity} units of ${sourceProd.name} from ${fromName} to ${toName}`, 'system');
    return true;
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const hasRestrictedItems = cart.some(item => item.product.requires_prescription);

  // Send WhatsApp/SMS simulated notification
  const sendNotification = (order: Order, message: string, channel: 'whatsapp' | 'sms' = 'whatsapp') => {
    const notif: NotificationLog = {
      id: `notif-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      channel,
      recipient_phone: order.customer_phone,
      message,
      sent_at: new Date().toISOString(),
      status: 'delivered'
    };
    setNotifications(prev => [notif, ...prev]);
    showToast(`[${channel.toUpperCase()} Sent to ${order.customer_phone}]: ${message}`, channel);
  };

  // Online Store Order placement
  const placeOnlineOrder = ({
    customer_name,
    customer_phone,
    delivery_address,
    city,
    notes,
    branch_id,
    prescriptionFile
  }: {
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    city: string;
    notes?: string;
    branch_id: string;
    prescriptionFile?: { name: string; url: string } | null;
  }): Order => {
    const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderId = `ord-${Date.now()}`;
    const subtotal = cartSubtotal;
    const delivery_fee = 15.00;
    const total = subtotal + delivery_fee;

    const orderItems = cart.map(item => ({
      id: `item-${Date.now()}-${item.product.id}`,
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      product_name_ar: item.product.name_ar,
      quantity: item.quantity,
      unit_price: item.product.price,
      subtotal: item.product.price * item.quantity,
      requires_prescription: item.product.requires_prescription
    }));

    const newOrder: Order = {
      id: orderId,
      order_number: orderNum,
      customer_id: currentUser.role === 'customer' ? currentUser.id : null,
      customer_name,
      customer_phone,
      branch_id,
      driver_id: null,
      status: 'pending',
      subtotal,
      delivery_fee,
      total,
      delivery_address,
      city,
      payment_method: 'cod',
      notes,
      requires_prescription: hasRestrictedItems,
      prescription: hasRestrictedItems && prescriptionFile ? {
        id: `rx-${Date.now()}`,
        order_id: orderId,
        file_url: prescriptionFile.url,
        file_name: prescriptionFile.name,
        status: 'pending',
        created_at: new Date().toISOString()
      } : null,
      items: orderItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Deduct stock from the chosen branch
    cart.forEach(item => {
      // Deduct from the specific branch fulfilling the order
      const branchProd = products.find(p => p.branch_id === branch_id && p.barcode === item.product.barcode) || item.product;
      adjustStock(branchProd.id, -item.quantity, 'online_order');
    });

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // Send WhatsApp confirmation
    const msg = `PharmaChain: Order #${orderNum} received! Total COD: ${total.toFixed(2)} EGP. Our pharmacist is reviewing your items.`;
    sendNotification(newOrder, msg, 'whatsapp');

    return newOrder;
  };

  // Update order status
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    let targetOrder: Order | undefined;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        targetOrder = { ...o, status: newStatus, updated_at: new Date().toISOString() };
        return targetOrder;
      }
      return o;
    }));

    if (targetOrder) {
      const order = targetOrder as Order;
      let msg = '';
      if (newStatus === 'confirmed') {
        msg = `PharmaChain: Order #${order.order_number} is CONFIRMED & packed by ${branches.find(b => b.id === order.branch_id)?.name}. Preparing for dispatch!`;
      } else if (newStatus === 'out_for_delivery') {
        const driverName = allProfiles.find(p => p.id === order.driver_id)?.full_name || 'Assigned Rider';
        msg = `PharmaChain: Order #${order.order_number} is OUT FOR DELIVERY with ${driverName}. Please prepare ${order.total.toFixed(2)} EGP Cash on Delivery.`;
      } else if (newStatus === 'delivered') {
        msg = `PharmaChain: Order #${order.order_number} has been DELIVERED! Thank you for trusting PharmaChain. Stay healthy!`;
      } else if (newStatus === 'cancelled') {
        msg = `PharmaChain: Order #${order.order_number} was cancelled. For inquiries please call our branch hotline.`;
      }

      if (msg) {
        sendNotification(order, msg, 'whatsapp');
        sendNotification(order, `SMS: ${msg}`, 'sms');
      }
    }
  };

  // Assign driver to order
  const assignDriver = (orderId: string, driverId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, driver_id: driverId, status: o.status === 'pending' ? 'confirmed' : o.status };
        const driver = allProfiles.find(p => p.id === driverId);
        showToast(`Order ${o.order_number} assigned to driver ${driver?.full_name}`);
        return updated;
      }
      return o;
    }));
  };

  // Review prescription
  const reviewPrescription = (orderId: string, status: PrescriptionStatus, reason?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId && o.prescription) {
        const updatedRx = {
          ...o.prescription,
          status,
          rejection_reason: reason,
          reviewed_by: currentUser.id
        };
        const updatedOrder = {
          ...o,
          prescription: updatedRx,
          status: status === 'approved' ? ('confirmed' as OrderStatus) : o.status
        };

        const msg = status === 'approved'
          ? `PharmaChain: Prescription for order #${o.order_number} was APPROVED by our licensed pharmacist. Order is being packed!`
          : `PharmaChain Notice: Prescription for order #${o.order_number} was rejected. Reason: ${reason || 'Prescription expired or illegible'}.`;
        
        sendNotification(updatedOrder, msg, 'whatsapp');
        return updatedOrder;
      }
      return o;
    }));
  };

  // Active shift: open shift for current user or current cashier at this branch
  const activeShift = shifts.find(
    s => s.status === 'open' && s.cashier_id === currentUser.id && s.branch_id === currentBranch.id
  ) || shifts.find(
    s => s.status === 'open' && s.branch_id === currentBranch.id && currentRole === 'cashier'
  ) || null;

  const openShift = (openingCash: number, notes?: string): Shift => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      branch_id: currentBranch.id,
      cashier_id: currentUser.id,
      cashier_name: currentUser.full_name,
      opened_at: new Date().toISOString(),
      closed_at: null,
      opening_cash_balance: Number(openingCash) || 0,
      closing_cash_balance: null,
      status: 'open',
      notes: notes || `Shift started by ${currentUser.full_name}`,
      created_at: new Date().toISOString()
    };
    setShifts(prev => [newShift, ...prev]);
    showToast(`Shift started with ${Number(openingCash).toFixed(2)} EGP opening cash`);
    return newShift;
  };

  const closeShift = (shiftId: string, closingCash: number, notes?: string) => {
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          status: 'closed' as const,
          closing_cash_balance: Number(closingCash) || 0,
          closed_at: new Date().toISOString(),
          notes: notes ? (s.notes ? `${s.notes} | ${notes}` : notes) : s.notes
        };
      }
      return s;
    }));
    showToast(`Shift closed. Final cash balance: ${Number(closingCash).toFixed(2)} EGP`);
  };

  const getShiftSummary = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    const shiftSalesList = sales.filter(s => s.shift_id === shiftId);
    const totalSales = shiftSalesList.reduce((acc, s) => acc + s.total, 0);
    const cashSales = shiftSalesList.filter(s => s.payment_method === 'cash').reduce((acc, s) => acc + s.total, 0);
    const cardSales = shiftSalesList.filter(s => s.payment_method === 'card').reduce((acc, s) => acc + s.total, 0);
    const openingCash = shift ? shift.opening_cash_balance : 0;
    const expectedCash = openingCash + cashSales;
    return {
      totalSales,
      cashSales,
      cardSales,
      salesCount: shiftSalesList.length,
      expectedCash
    };
  };

  // Fast POS Sale
  const processPosSale = ({
    items,
    subtotal,
    discount,
    total,
    payment_method,
    tendered_amount,
    change_amount,
    customer_name,
    customer_phone
  }: {
    items: { product: Product; quantity: number; unit_price: number }[];
    subtotal: number;
    discount: number;
    total: number;
    payment_method: 'cash' | 'card';
    tendered_amount?: number;
    change_amount?: number;
    customer_name?: string;
    customer_phone?: string;
  }): Sale => {
    const receipt_no = `POS-${currentBranch.id.slice(3, 5).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const saleId = `sale-${Date.now()}`;

    const saleItems = items.map(it => ({
      product_id: it.product.id,
      barcode: it.product.barcode,
      name: it.product.name,
      name_ar: it.product.name_ar,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total: it.quantity * it.unit_price
    }));

    const newSale: Sale = {
      id: saleId,
      receipt_no,
      branch_id: currentBranch.id,
      cashier_id: currentUser.id,
      cashier_name: currentUser.full_name,
      shift_id: activeShift?.id || null,
      items: saleItems,
      subtotal,
      discount,
      total,
      payment_method,
      tendered_amount,
      change_amount,
      customer_name: customer_name || 'Walk-in Customer',
      customer_phone,
      created_at: new Date().toISOString()
    };

    // Deduct stock automatically and log
    items.forEach(it => {
      adjustStock(it.product.id, -it.quantity, 'pos_sale');
    });

    setSales(prev => [newSale, ...prev]);
    showToast(`POS Sale complete: ${receipt_no} (${total.toFixed(2)} EGP)`);

    return newSale;
  };

  // Role-scoped data filters
  // Cashier: scoped to their branch
  const scopedOrders = currentRole === 'admin'
    ? orders
    : currentRole === 'driver'
      ? orders.filter(o => o.driver_id === currentUser.id)
      : currentRole === 'cashier' || currentRole === 'manager'
        ? orders.filter(o => o.branch_id === currentBranch.id)
        : orders.filter(o => o.customer_id === currentUser.id || o.customer_phone === currentUser.phone);

  const scopedSales = currentRole === 'admin'
    ? sales
    : sales.filter(s => s.branch_id === currentBranch.id);

  const branchOrders = orders.filter(o => o.branch_id === currentBranch.id);
  const branchSales = sales.filter(s => s.branch_id === currentBranch.id);

  return (
    <PharmacyContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        currentRole,
        setCurrentRole,
        switchUserRole,
        allProfiles,
        addProfile,
        deleteStaffProfile,
        shifts,
        activeShift,
        openShift,
        closeShift,
        getShiftSummary,
        branches,
        currentBranch,
        setCurrentBranch,
        addBranch,
        updateBranch,
        categories,
        products,
        branchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        transferStock,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartSubtotal,
        hasRestrictedItems,
        orders,
        scopedOrders,
        branchOrders,
        placeOnlineOrder,
        updateOrderStatus,
        assignDriver,
        reviewPrescription,
        sales,
        scopedSales,
        branchSales,
        processPosSale,
        stockLogs,
        notifications,
        recentToast,
        clearToast
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
