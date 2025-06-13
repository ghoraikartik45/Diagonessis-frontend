import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Paper,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
  styled,
  keyframes,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Slide,
  Fade,
} from '@mui/material';

import { GridLegacy as Grid } from '@mui/material';

import {
  Send,
  Add,
  ChatBubbleOutline,
  PersonOutline,
  SmartToyOutlined,
  DeleteOutline,
  Menu,
  ChevronLeft,
  LogoutOutlined,
  Close,
} from '@mui/icons-material';

// Import API service and types
import { apiService } from '../services/apiService';
import type { User, MessageData as APIMessageData } from '../types/api';

// --- Local Interfaces ---
interface MessageData {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: MessageData[];
  lastMessage: Date;
  messageCount: number;
}

// --- Keyframes for Typing Indicator ---
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
`;

const TypingIndicator = styled('div')({
  display: 'flex',
  '& div': {
    width: '8px',
    height: '8px',
    backgroundColor: '#9CA3AF',
    borderRadius: '50%',
    margin: '0 2px',
    animation: `${bounce} 1.4s infinite ease-in-out both`,
  },
  '& div:nth-of-type(1)': { animationDelay: '-0.32s' },
  '& div:nth-of-type(2)': { animationDelay: '-0.16s' },
});

// Enhanced floating action button for mobile
const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(10),
  right: theme.spacing(2),
  zIndex: theme.zIndex.speedDial,
  background: 'linear-gradient(45deg, #2563EB 30%, #3B82F6 90%)',
  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #1D4ED8 30%, #2563EB 90%)',
    transform: 'scale(1.05)',
  },
  transition: 'all 0.3s ease',
}));

// --- Main Chat Component ---
const ChatApp: React.FC = () => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // --- State Management ---
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chats, activeChat]);

  // Auto-focus input on desktop
  useEffect(() => {
    if (isLargeScreen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeChat, isLargeScreen]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-create new chat for new users
  useEffect(() => {
    if (isNewUser && chats.length === 0 && !loading) {
      createNewChat();
      setIsNewUser(false);
    }
  }, [isNewUser, chats.length, loading]);

  // --- API Integration Functions ---
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        window.location.href = '/';
        return;
      }

      // Load user profile
      const userProfile = await apiService.getUserProfile();
      if (!userProfile?.data?.name || !userProfile?.data?.age || !userProfile?.data?.profession || !userProfile?.data?.address) {
        window.location.href = '/user-info';
        return;
      }
      setUser(userProfile.data);

      // Load chats
      const chatsData = await loadChats();
      
      // Check if this is a new user (no chats)
      if (chatsData.length === 0) {
        setIsNewUser(true);
      }
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      const response = await apiService.getChats();
      const formattedChats: Chat[] = response.data.chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: [],
        lastMessage: new Date(chat.updatedAt),
        messageCount: chat.messageCount,
      }));

      setChats(formattedChats);

      // Set active chat to first chat if none selected
      if (!activeChat && formattedChats.length > 0) {
        setActiveChat(formattedChats[0].id);
        await loadMessages(formattedChats[0].id);
      }

      return formattedChats;
    } catch (error: any) {
      console.error('Error loading chats:', error);
      setError(error.response?.data?.message || 'Failed to load chats');
      return [];
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await apiService.getMessages({ chatId });
      console.log('Loaded messages for chat:', chatId, response.data);

      const formattedMessages: MessageData[] = response.data.messages.map((msg: APIMessageData) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.createdAt),
      }));

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: formattedMessages }
          : chat
      ));
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setError(error.response?.data?.message || 'Failed to load messages');
    }
  };

  // --- Handlers ---
  const handleSidebarToggle = () => {
    if (isLargeScreen) {
      setSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await apiService.createChat({ title: 'New Chat' });
      const newChat: Chat = {
        id: response.data.id,
        title: response.data.title,
        messages: [],
        lastMessage: new Date(response.data.createdAt),
        messageCount: 0,
      };

      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat.id);
      
      // Close mobile sidebar and focus input
      if (!isLargeScreen) {
        setMobileSidebarOpen(false);
      }
      
      // Focus input after a short delay to ensure component is ready
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Error creating chat:', error);
      setError(error.response?.data?.message || 'Failed to create chat');
    }
  };

  const confirmDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const deleteChat = async () => {
    if (!chatToDelete) return;

    try {
      await apiService.deleteChat(chatToDelete);

      const updatedChats = chats.filter(chat => chat.id !== chatToDelete);
      setChats(updatedChats);

      if (activeChat === chatToDelete) {
        if (updatedChats.length > 0) {
          setActiveChat(updatedChats[0].id);
          await loadMessages(updatedChats[0].id);
        } else {
          setActiveChat('');
          // Auto-create new chat if no chats remain
          setTimeout(() => createNewChat(), 500);
        }
      }
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      setError(error.response?.data?.message || 'Failed to delete chat');
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;

    try {
      setIsTyping(true);

      const response = await apiService.sendMessage({
        chatId: activeChat,
        message: message.trim(),
      });

      console.log('Sent message:', response.data);

      const userMessage: MessageData = {
        id: response.data.userMessage.id,
        text: response.data.userMessage.content,
        isUser: true,
        timestamp: new Date(response.data.userMessage.createdAt),
      };

      const aiMessage: MessageData = {
        id: response.data.aiMessage.id,
        text: response.data.aiMessage.content,
        isUser: false,
        timestamp: new Date(response.data.aiMessage.createdAt),
      };

      setChats(prev => prev.map(chat =>
        chat.id === activeChat
          ? {
            ...chat,
            messages: [...chat.messages, userMessage, aiMessage],
            title: chat.messages.length === 0 ? message.slice(0, 30) + (message.length > 30 ? '...' : '') : chat.title,
            lastMessage: new Date(),
            messageCount: chat.messageCount + 2,
          }
          : chat
      ));

      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChatSelect = async (chatId: string) => {
    setActiveChat(chatId);
    if (!isLargeScreen) setMobileSidebarOpen(false);

    // Load messages if not already loaded
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.messages.length === 0 && chat.messageCount > 0) {
      await loadMessages(chatId);
    }
  };
  console.log(isMediumScreen);
  
  const handleLogout = async () => {
    try {
      await apiService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      window.location.href = '/';
    }
  };

  const getCurrentChat = () => chats.find(chat => chat.id === activeChat);
  const currentMessages = getCurrentChat()?.messages || [];

  // --- Render Loading State ---
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  // --- Sidebar & Drawer Configuration ---
  const drawerWidth = isSmallScreen ? '100vw' : 280;
  const collapsedDrawerWidth = 80;

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'space-between', p: '16px !important' }}>
        {!isSidebarCollapsed && (
          <Typography variant="h5" fontWeight={600} color="grey.800">
            DiagnoseAI
          </Typography>
        )}
        <IconButton 
          onClick={handleSidebarToggle} 
          sx={{ 
            display: { xs: isSmallScreen ? 'inline-flex' : 'none', lg: 'inline-flex' } 
          }}
        >
          {isSmallScreen ? (
            <Close sx={{ transition: 'transform 0.3s' }} />
          ) : (
            <ChevronLeft sx={{ 
              transition: 'transform 0.3s', 
              transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' 
            }} />
          )}
        </IconButton>
      </Toolbar>

      <Box sx={{ p: 2 }}>
        <Button
          onClick={createNewChat}
          variant="contained"
          fullWidth
          startIcon={<Add />}
          sx={{
            bgcolor: '#2563EB', 
            '&:hover': { bgcolor: '#1D4ED8', transform: 'translateY(-1px)' },
            py: 1.5, 
            borderRadius: '12px', 
            textTransform: 'none', 
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
            transition: 'all 0.3s ease',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
          }}
        >
          {!isSidebarCollapsed && 'New Chat'}
        </Button>
      </Box>

      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
        {chats.map((chat, index) => (
          <Slide direction="right" in={true} timeout={300 + index * 100} key={chat.id}>
            <ListItem
              disablePadding
              sx={{
                my: 0.5,
                '& .delete-icon': { opacity: 0 },
                '&:hover .delete-icon': { opacity: 1 },
              }}
            >
              <ListItemButton
                selected={activeChat === chat.id}
                onClick={() => handleChatSelect(chat.id)}
                sx={{
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': { 
                    bgcolor: '#DBEAFE', 
                    '&:hover': { bgcolor: '#BFDBFE' },
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)',
                  },
                  '&.Mui-selected .MuiTypography-root, &.Mui-selected .MuiSvgIcon-root': { 
                    color: '#2563EB' 
                  },
                  '&:hover': {
                    bgcolor: '#F3F4F6',
                    transform: 'translateX(4px)',
                  },
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  px: isSidebarCollapsed ? 2 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <ChatBubbleOutline />
                </ListItemIcon>
                {!isSidebarCollapsed && (
                  <ListItemText
                    primary={chat.title}
                    secondary={`${chat.messageCount} messages`}
                    primaryTypographyProps={{ fontWeight: 500, noWrap: true }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                )}
              </ListItemButton>
              {!isSidebarCollapsed && (
                <IconButton
                  size="medium"
                  onClick={(e) => confirmDeleteChat(chat.id, e)}
                  className="delete-icon"
                  sx={{
                    position: 'absolute', 
                    right: 8,
                    '&:hover': { 
                      bgcolor: '#FEE2E2',
                      transform: 'scale(1.1)',
                    },
                    color: '#EF4444',
                    transition: 'all 0.2s ease',
                    ml: 2,
                  }}
                >
                  <DeleteOutline fontSize="medium" />
                </IconButton>
              )}
            </ListItem>
          </Slide>
        ))}
      </List>

      {/* User Profile Section */}
      {user && !isSidebarCollapsed && (
        <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: '#2563EB',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
              }}>
                {user.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="grey.600" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleLogout} 
              size="small" 
              color="error"
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: '#FEE2E2',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <LogoutOutlined fontSize="medium" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#F9FAFB' }}>
      {/* --- Sidebar --- */}
      <Drawer
        variant={isLargeScreen ? "permanent" : "temporary"}
        open={isLargeScreen || isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        sx={{
          width: isLargeScreen ? (isSidebarCollapsed ? collapsedDrawerWidth : drawerWidth) : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isLargeScreen ? (isSidebarCollapsed ? collapsedDrawerWidth : drawerWidth) : drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #E5E7EB',
            bgcolor: 'white',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* --- Main Content --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Mobile Header */}
        <AppBar 
          position="static" 
          sx={{ 
            display: { lg: 'none' }, 
            bgcolor: 'white', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            borderBottom: '1px solid #E5E7EB' 
          }}
        >
          <Toolbar>
            <IconButton 
              edge="start" 
              color="default" 
              onClick={() => setMobileSidebarOpen(true)} 
              sx={{ mr: 1 }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" color="grey.800" fontWeight={600}>
              DiagnoseAI
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Message Area */}
        <Box sx={{ 
          flexGrow: 1, 
          p: { xs: 1, sm: 2, md: 3 },
          overflowY: 'auto',
        }}>
          {currentMessages.length === 0 ? (
            <Fade in={true} timeout={800}>
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                height="100%" 
                textAlign="center"
                px={2}
              >
                <Avatar sx={{ 
                  width: { xs: 56, md: 72 }, 
                  height: { xs: 56, md: 72 }, 
                  bgcolor: '#DBEAFE', 
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(37, 99, 235, 0.1)',
                }}>
                  <SmartToyOutlined sx={{ 
                    fontSize: { xs: 32, md: 48 }, 
                    color: '#2563EB' 
                  }} />
                </Avatar>
                <Typography 
                  variant={isSmallScreen ? "h5" : "h4"} 
                  fontWeight={700} 
                  color="grey.800" 
                  mb={2}
                >
                  Welcome to DiagnoseAI
                </Typography>
                <Typography 
                  color="grey.600" 
                  variant={isSmallScreen ? "body2" : "body1"}
                  maxWidth="400px"
                >
                  Start a conversation and I'll help you with medical questions, 
                  health concerns, or general wellness guidance.
                </Typography>
              </Box>
            </Fade>
          ) : (
            <Grid container direction="column" spacing={2} sx={{ maxWidth: '4xl', mx: 'auto' }}>
              {currentMessages.map((msg, index) => (
                <Slide direction="up" in={true} timeout={300 + index * 100} key={msg.id}>
                  <Grid item alignSelf={msg.isUser ? 'flex-end' : 'flex-start'}>
                    <Box 
                      display="flex" 
                      gap={1.5} 
                      flexDirection={msg.isUser ? 'row-reverse' : 'row'} 
                      alignItems="flex-start" 
                      maxWidth={isSmallScreen ? "95%" : "80%"}
                    >
                      <Avatar sx={{ 
                        bgcolor: msg.isUser ? '#2563EB' : '#E5E7EB', 
                        color: msg.isUser ? 'white' : '#4B5563',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}>
                        {msg.isUser ? (
                          <PersonOutline sx={{ fontSize: '1.2rem' }} />
                        ) : (
                          <SmartToyOutlined sx={{ fontSize: '1.2rem' }} />
                        )}
                      </Avatar>
                      <Paper
                        elevation={0}
                        sx={{
                          px: { xs: 1.5, sm: 2 }, 
                          py: { xs: 1, sm: 1.5 },
                          borderRadius: '16px',
                          bgcolor: msg.isUser ? '#2563EB' : 'white',
                          color: msg.isUser ? 'white' : 'grey.800',
                          border: msg.isUser ? 'none' : '1px solid #E5E7EB',
                          boxShadow: msg.isUser 
                            ? '0 4px 16px rgba(37, 99, 235, 0.2)' 
                            : '0 2px 8px rgba(0,0,0,0.05)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: msg.isUser 
                              ? '0 6px 20px rgba(37, 99, 235, 0.3)' 
                              : '0 4px 12px rgba(0,0,0,0.1)',
                          }
                        }}
                      >
                        <Typography 
                          component="div" 
                          sx={{ 
                            lineHeight: 1.4,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                          }}
                        >
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </Typography>

                        <Typography 
                          variant="caption" 
                          display="block" 
                          sx={{ 
                            mt: 1, 
                            textAlign: 'right', 
                            opacity: 0.7,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          }}
                        >
                          {msg.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                </Slide>
              ))}
              {isTyping && (
                <Fade in={true}>
                  <Grid item alignSelf="flex-start">
                    <Box display="flex" gap={1.5} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: '#E5E7EB' }}>
                        <SmartToyOutlined sx={{ color: '#4B5563' }} />
                      </Avatar>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          borderRadius: '16px', 
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }}
                      >
                        <TypingIndicator>
                          <div></div><div></div><div></div>
                        </TypingIndicator>
                      </Paper>
                    </Box>
                  </Grid>
                </Fade>
              )}
              <div ref={messagesEndRef} />
            </Grid>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ 
          p: { xs: 1.5, sm: 2, md: 3 }, 
          bgcolor: 'white', 
          borderTop: '1px solid #E5E7EB',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        }}>
          <Box 
            display="flex" 
            alignItems="flex-end" 
            gap={1.5} 
            maxWidth="4xl" 
            mx="auto"
          >
            <TextField
              inputRef={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              multiline 
              maxRows={isSmallScreen ? 3 : 5} 
              disabled={isTyping} 
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  '&.Mui-focused fieldset': { 
                    borderColor: '#2563EB',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3B82F6',
                  },
                  transition: 'all 0.3s ease',
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!message.trim() || isTyping}
              sx={{
                width: { xs: 48, sm: 56 }, 
                height: { xs: 48, sm: 56 },
                bgcolor: '#2563EB', 
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2)',
                '&:hover': { 
                  bgcolor: '#1D4ED8',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)',
                },
                '&.Mui-disabled': { 
                  bgcolor: '#93C5FD',
                  color: 'white',
                  opacity: 0.7,
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Send sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Floating Action Button for Mobile New Chat */}
      {!isLargeScreen && chats.length > 0 && (
        <Fade in={!isMobileSidebarOpen}>
          <StyledFab
            onClick={createNewChat}
            size={isSmallScreen ? "medium" : "large"}
            aria-label="new chat"
          >
            <Add />
          </StyledFab>
        </Fade>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Delete Chat
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="inherit"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={deleteChat} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3)',
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatApp;