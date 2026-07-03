const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

export interface ISpecification {
  name: string;
  value: string;
}

export interface ITieredPrices {
  tier_1: number;
  tier_2: number;
  tier_3: number;
}

export interface IProduct {
  _id: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  specifications: ISpecification[];
  datasheetUrl?: string;
  basePrice: number;
  tieredPrices: ITieredPrices;
  stock: number;
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface IQuoteItem {
  product: IProduct | string;
  requestedQuantity: number;
  offeredPrice?: number;
}

export interface IQuote {
  _id: string;
  quoteNumber: string;
  customer?: any;
  guestDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  items: IQuoteItem[];
  notes?: string;
  status: 'pending' | 'responded' | 'accepted' | 'rejected';
  token?: string;
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

// Reusable fetch client with auth token headers
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('conex_token') : null;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || 'Something went wrong with the API call.');
  }

  return responseData;
}

export const api = {
  // Products API
  async getProducts(params?: { search?: string; category?: string }): Promise<{ status: string; results: number; data: { products: IProduct[] } }> {
    let url = '/products';
    const queryParts: string[] = [];
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    
    if (queryParts.length > 0) {
      url += `?${queryParts.join('&')}`;
    }
    
    return request(url, { method: 'GET' });
  },

  async getProductBySlug(slug: string): Promise<{ status: string; data: { product: IProduct } }> {
    return request(`/products/${slug}`, { method: 'GET' });
  },

  // Leads API
  async createLead(leadData: {
    name: string;
    company: string;
    email: string;
    mobile: string;
    address: string;
    productId: string;
    autoSignup: boolean;
  }): Promise<{
    status: string;
    message: string;
    data: {
      lead: any;
      autoSignup: { userId: string; temporaryPassword: string; token: string } | null;
    };
  }> {
    return request('/auth/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },

  // Quotes API
  async createQuote(quoteData: {
    items: { product: string; requestedQuantity: number }[];
    notes?: string;
    guestDetails?: { name: string; email: string; phone: string };
  }): Promise<{ status: string; data: { quoteRequest: IQuote } }> {
    return request('/quotes', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  },

  async getMyQuotes(): Promise<{ status: string; results: number; data: { quotes: IQuote[] } }> {
    return request('/quotes/my', { method: 'GET' });
  },

  async getQuoteByToken(token: string): Promise<{ status: string; data: { quote: IQuote } }> {
    return request(`/quotes/token/${token}`, { method: 'GET' });
  },

  async linkQuote(quoteNumber: string, token: string): Promise<{ status: string; message: string; data: { quote: IQuote } }> {
    return request('/quotes/link', {
      method: 'POST',
      body: JSON.stringify({ quoteNumber, token }),
    });
  },

  async updateQuoteStatus(quoteId: string, status: 'accepted' | 'rejected', guestToken?: string): Promise<{ status: string; data: { quote: IQuote } }> {
    return request(`/quotes/${quoteId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, token: guestToken }),
    });
  },

  // Auth & Profile APIs
  async login(credentials: { email: string; password?: string }): Promise<{ status: string; token: string; data: { user: any } }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async signup(details: { name: string; email: string; password?: string; phone?: string; companyName?: string; gstin?: string }): Promise<{ status: string; token: string; data: { user: any } }> {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(details),
    });
  },

  async getMe(): Promise<{ status: string; data: { user: any } }> {
    return request('/auth/me', { method: 'GET' });
  },

  async updateProfile(details: { name?: string; phone?: string; companyName?: string; gstin?: string }): Promise<{ status: string; data: { user: any } }> {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(details),
    });
  },

  async addAddress(address: { street: string; city: string; state: string; postalCode: string; country?: string; isDefault?: boolean }): Promise<{ status: string; data: { user: any } }> {
    return request('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  },

  async updateAddress(index: number, address: { street?: string; city?: string; state?: string; postalCode?: string; country?: string; isDefault?: boolean }): Promise<{ status: string; data: { user: any } }> {
    return request(`/auth/addresses/${index}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });
  },

  async deleteAddress(index: number): Promise<{ status: string; data: { user: any } }> {
    return request(`/auth/addresses/${index}`, {
      method: 'DELETE',
    });
  },

  // Admin APIs
  async getAllQuotes(): Promise<{ status: string; results: number; data: { quotes: IQuote[] } }> {
    return request('/quotes', { method: 'GET' });
  },

  async respondToQuote(quoteId: string, responseData: { offeredPrices: Record<string, number>; adminFeedback?: string }): Promise<{ status: string; data: { quote: IQuote } }> {
    return request(`/quotes/${quoteId}/respond`, {
      method: 'PUT',
      body: JSON.stringify(responseData),
    });
  },

  async createProduct(productData: any): Promise<{ status: string; data: { product: IProduct } }> {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id: string, productData: any): Promise<{ status: string; data: { product: IProduct } }> {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id: string): Promise<{ status: string }> {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  }
};
