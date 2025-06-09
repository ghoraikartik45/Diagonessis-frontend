import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';
import type {
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  CreateChatRequest,
  CreateChatResponse,
  GetChatsResponse,
  UpdateChatRequest,
  UpdateChatResponse,
  DeleteChatResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  GetUserProfileResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  SignupRequest,
  ForgotPasswordRequest,
  ApiResponse,
  User,
  AuthTokens
} from '../types/api';


class ApiService {
  private api: AxiosInstance;
  private baseURL = 'https://diagonessis-backend.onrender.com/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken({ refreshToken });
              this.setToken(response.data.token);
              this.setRefreshToken(response.data.refreshToken);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // --- Token Management ---
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // --- Auth Utilities ---
  saveTokens(tokens: AuthTokens, user?: User): void {
    this.setToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  // --- OTP APIs ---
  async sendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    const response = await this.api.post('/auth/send-otp', data);
    console.log(response.data);
    
    return response.data;
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await this.api.post('/auth/verify-otp', data);
    console.log(response.data);
    
    return response.data;
  }

  // --- Authentication APIs ---
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/signin', data);
    if (response.data.success) {
        console.log(response.data);
      this.saveTokens({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken
      }, response.data.user);
    }
    return response.data;
  }

  async register(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/signup', data);
    if (response.data.success) {
      this.saveTokens({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken
      }, response.data.user);
    }
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    const response = await this.api.post('/auth/forgot-password', data);
    return response.data;
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/refresh-token', data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // --- Chat APIs ---
  async createChat(data: CreateChatRequest = {}): Promise<CreateChatResponse> {
    const response = await this.api.post('/chats/create', data);
    return response.data;
  }

  async getChats(): Promise<GetChatsResponse> {
    const response = await this.api.post('/chats/list', {});
    return response.data;
  }

  async updateChat(chatId: string, data: UpdateChatRequest): Promise<UpdateChatResponse> {
    const response = await this.api.post('/chats/update', { chatId, ...data });
    return response.data;
  }

  async deleteChat(chatId: string): Promise<DeleteChatResponse> {
    const response = await this.api.post('/chats/delete', { chatId });
    return response.data;
  }

  // --- Message APIs ---
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await this.api.post('/messages/send', data);
    return response.data;
  }

  async getMessages(data: GetMessagesRequest): Promise<GetMessagesResponse> {
    const response = await this.api.post('/messages/list', data);
    return response.data;
  }

  // --- User Profile APIs ---
  async getUserProfile(): Promise<GetUserProfileResponse> {
    const response = await this.api.post('/user/profile', {});
    return response.data;
  }

  async updateUserProfile(data: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    const response = await this.api.post('/user/update', data);
    return response.data;
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default ApiService;