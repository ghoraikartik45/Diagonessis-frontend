// types/api.ts

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  profession?: string;
  address?: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  chatCount?: number;
  messageCount?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// --- Chat Models ---
export interface CreateChatRequest {
  title?: string;
}

export interface CreateChatResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
  };
}

export interface ChatData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    id: string;
    content: string;
    role: string;
    timestamp: string;
  };
  messageCount: number;
}

export interface GetChatsResponse {
  success: boolean;
  message: string;
  data: {
    chats: ChatData[];
    total: number;
  };
}

export interface UpdateChatRequest {
  title: string;
}

export interface UpdateChatResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    updatedAt: string;
  };
}

export interface DeleteChatResponse {
  success: boolean;
  message: string;
}

// --- Message Models ---
export interface SendMessageRequest {
  chatId: string;
  message: string;
}

export interface MessageResponse {
  id: string;
  content: string;
  role: string;
  createdAt: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    userMessage: MessageResponse;
    aiMessage: MessageResponse;
  };
}

export interface GetMessagesRequest {
  chatId: string;
  page?: number;
  limit?: number;
}

export interface MessageData {
  id: string;
  content: string;
  role: string;
  createdAt: string;
}

export interface GetMessagesResponse {
  success: boolean;
  message: string;
  data: {
    messages: MessageData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// --- User Profile Models ---
export interface GetUserProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UpdateUserProfileRequest {
  name?: string;
  avatar?: string;
  age?: number;
  profession?: string;
  address?: string;
}

export interface UpdateUserProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

// --- OTP Models ---
export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  otpId: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  otpId: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  
  verificationToken: string;

}

export interface SignupRequest {
  email: string;
  password: string;
  verificationToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
  newPassword: string;
  verificationToken: string;
}

// --- Generic API Response ---
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}